// Residential Wiring Simulator v2.6
// Main simulator workspace
//
// Handles:
// - device placement
// - terminal wiring
// - visual wires
// - electrical connections
// - circuit topology
// - panel ownership
// - breaker ownership
// - simulator context integration

import {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef
} from "react";

import type {
  DragEvent,
  MouseEvent
} from "react";

import {
  useSimulator
} from "./SimulatorContext";

import {
  componentCatalog
} from "../electrical/componentCatalog";

import Device from "../components/Device";

import type {
  ElectricalDevice,
  Voltage,
  BreakerPoles
} from "../electrical/types";

import type {
  Wire
} from "../electrical/wireModel";

import type {
  Connection
} from "../electrical/connections";


// ============================================================
// TYPES
// ============================================================

export type WorkspaceHandle = {

  addDevice:
    (
      name: string,
      x?: number,
      y?: number
    ) => void;

  updateDevice:
    (
      device: ElectricalDevice
    ) => void;

  getConnections:
    (
    ) => Connection[];

};


type WorkspaceProps = {

  onSelectDevice?:
    (
      device: ElectricalDevice | null
    ) => void;

  onCircuitPathsChange?:
    (
      paths: string[][]
    ) => void;

};


// ============================================================
// WORKSPACE
// ============================================================

const Workspace = forwardRef<
  WorkspaceHandle,
  WorkspaceProps
>(
function Workspace(
  {
    onSelectDevice,
    onCircuitPathsChange
  },
  ref
) {

  // ==========================================================
  // GLOBAL SIMULATOR STATE
  // ==========================================================

  const {
    devices,
    setDevices,
    connections,
    setConnections,
    selectedDevice,
    setSelectedDevice
  } = useSimulator();


  // ==========================================================
  // LOCAL WORKSPACE STATE
  // ==========================================================

  const [
    wires,
    setWires
  ] = useState<Wire[]>([]);


  const [
    wireMode,
    setWireMode
  ] = useState(false);


  const [
    wireColor,
    setWireColor
  ] = useState("black");


  const [
    selectedTerminal,
    setSelectedTerminal
  ] = useState<{
    deviceId: string;
    terminalId: string;
  } | null>(null);


  const [
    dragging,
    setDragging
  ] = useState<string | null>(null);


  const svgRef =
    useRef<SVGSVGElement | null>(null);


  // ==========================================================
  // PANEL HELPERS
  // ==========================================================

  function isPanel(
    device: ElectricalDevice | null | undefined
  ): boolean {

    return !!device && (
      device.type === "Breaker Panel" ||
      device.type === "Sub Panel"
    );

  }


  // ==========================================================
  // CURRENTLY SELECTED PANEL
  //
  // IMPORTANT:
  // There is NO DEFAULT PANEL.
  //
  // If the selected device is a panel, new devices inherit
  // that panel's ID.
  // ==========================================================

  function getSelectedPanelId(): string | undefined {

    if (
      selectedDevice &&
      isPanel(selectedDevice)
    ) {

      return selectedDevice.id;

    }

    return undefined;

  }


  // ==========================================================
  // CREATE DEVICE FROM COMPONENT CATALOG
  // ==========================================================

  function createDevice(
    name: string,
    dropX: number = 150,
    dropY: number = 120
  ) {

    const definition =
      componentCatalog.find(
        component =>
          component.name === name
      );


    if (!definition) {
      return;
    }


    const terminals =
      definition.terminals.map(
        terminal => ({
          ...terminal,
          id:
            `${terminal.id}-${crypto.randomUUID()}`
        })
      );


    // --------------------------------------------------------
    // IMPORTANT:
    // If a panel is selected, the newly created circuit/device
    // belongs to that panel.
    //
    // If NO panel is selected, panelId stays undefined.
    // --------------------------------------------------------

    const panelId =
      getSelectedPanelId();


    const device: ElectricalDevice = {

      id:
        crypto.randomUUID(),

      name:
        definition.name,

      symbol:
        definition.symbol,

      type:
        definition.type,

      connectedDevices: [],

      calculatedLoad: 0,

      calculatedAmps: 0,

      amperage:
        definition.electrical?.amps,

      poles:
        definition.electrical?.poles as BreakerPoles,

      breakerSize:
        definition.electrical?.amps,

      mainBreaker:
        isPanel({
          id: "",
          name: "",
          symbol: "",
          type: definition.type,
          x: 0,
          y: 0,
          terminals: []
        })
          ? definition.electrical?.amps
          : undefined,

      // ------------------------------------------------------
      // PANEL OWNERSHIP
      // ------------------------------------------------------

      panelId,

      // ------------------------------------------------------
      // No breaker is assigned until a breaker is actually
      // associated with this circuit.
      // ------------------------------------------------------

      breakerId:
        undefined,

      terminals,

      load: {
        watts:
          definition.electrical?.watts ?? 0
      },

      voltage:
        (
          definition.electrical?.voltage ?? 120
        ) as Voltage,

      x:
        dropX,

      y:
        dropY,

      tripped:
        false

    };


    setDevices(prev => [
      ...prev,
      device
    ]);

  }


  // ==========================================================
  // UPDATE DEVICE
  // ==========================================================

  function updateDevice(
    updatedDevice: ElectricalDevice
  ) {

    setDevices(prev =>
      prev.map(device =>
        device.id === updatedDevice.id
          ? updatedDevice
          : device
      )
    );


    setSelectedDevice(
      updatedDevice
    );


    onSelectDevice?.(
      updatedDevice
    );

  }


  // ==========================================================
  // EXPOSE WORKSPACE API
  // ==========================================================

  useImperativeHandle(
    ref,
    () => ({

      addDevice:
        createDevice,

      updateDevice:
        updateDevice,

      getConnections:
        () => connections

    })
  );


  // ==========================================================
  // SELECT DEVICE
  // ==========================================================

  function selectDevice(
    id: string
  ) {

    let device =
      devices.find(
        item =>
          item.id === id
      ) || null;


    if (!device) {
      return;
    }


    // --------------------------------------------------------
    // Panels calculate only THEIR OWN circuits.
    // --------------------------------------------------------

    if (
      isPanel(device)
    ) {

      const paths =
        getCircuitPaths(
          device,
          devices
        );


      onCircuitPathsChange?.(
        paths
      );


      const load =
        calculateLoad(
          device,
          devices
        );


      device = {

        ...device,

        calculatedLoad:
          load,

        calculatedAmps:
          load /
          (
            device.voltage ?? 120
          )

      };


      setDevices(prev =>
        prev.map(item =>
          item.id === device?.id
            ? device!
            : item
        )
      );

    }


    setSelectedDevice(
      device
    );


    onSelectDevice?.(
      device
    );

  }


  // ==========================================================
  // ASSIGN PANEL OWNERSHIP TO CONNECTED CIRCUIT
  // ==========================================================
  //
  // Traverses the connected-device graph.
  //
  // Rules:
  //
  // 1. Start at the supplied device.
  //
  // 2. Every reachable non-panel device belongs to panelId.
  //
  // 3. Another panel is never absorbed.
  //
  // 4. Traversal stops at another panel.
  //
  // ==========================================================

  function assignCircuitOwnership(
    deviceList: ElectricalDevice[],
    startDeviceId: string,
    panelId: string
  ): Set<string> {

    const visited =
      new Set<string>();


    const queue: string[] = [
      startDeviceId
    ];


    const ownedDeviceIds =
      new Set<string>();


    while (
      queue.length > 0
    ) {

      const currentId =
        queue.shift()!;


      if (
        visited.has(
          currentId
        )
      ) {

        continue;

      }


      visited.add(
        currentId
      );


      const currentDevice =
        deviceList.find(
          device =>
            device.id === currentId
        );


      if (!currentDevice) {

        continue;

      }


      // ------------------------------------------------------
      // Never absorb another panel.
      // ------------------------------------------------------

      if (
        isPanel(currentDevice) &&
        currentDevice.id !== panelId
      ) {

        continue;

      }


      // ------------------------------------------------------
      // Panels themselves do not receive panelId.
      // ------------------------------------------------------

      if (
        !isPanel(currentDevice)
      ) {

        ownedDeviceIds.add(
          currentDevice.id
        );

      }


      // ------------------------------------------------------
      // Continue through connected devices.
      // ------------------------------------------------------

      (
        currentDevice.connectedDevices ?? []
      ).forEach(
        connectedId => {

          if (
            !visited.has(
              connectedId
            )
          ) {

            queue.push(
              connectedId
            );

          }

        }
      );

    }


    return ownedDeviceIds;

  }


  // ==========================================================
  // TERMINAL WIRING
  // ==========================================================

  function terminalClick(
    deviceId: string,
    terminalId: string
  ) {

    if (!wireMode) {
      return;
    }


    if (!selectedTerminal) {

      setSelectedTerminal({
        deviceId,
        terminalId
      });

      return;

    }


    // --------------------------------------------------------
    // Same terminal clicked twice
    // --------------------------------------------------------

    if (
      selectedTerminal.deviceId ===
        deviceId &&
      selectedTerminal.terminalId ===
        terminalId
    ) {

      setSelectedTerminal(
        null
      );

      return;

    }


    // ========================================================
    // PREVENT DUPLICATE CONNECTIONS
    // ========================================================

    const duplicateExists =
      connections.some(
        connection => (

          (
            connection.from.deviceId ===
              selectedTerminal.deviceId &&

            connection.from.terminalId ===
              selectedTerminal.terminalId &&

            connection.to.deviceId ===
              deviceId &&

            connection.to.terminalId ===
              terminalId
          )

          ||

          (
            connection.from.deviceId ===
              deviceId &&

            connection.from.terminalId ===
              terminalId &&

            connection.to.deviceId ===
              selectedTerminal.deviceId &&

            connection.to.terminalId ===
              selectedTerminal.terminalId
          )

        )
      );


    if (
      duplicateExists
    ) {

      console.warn(
        "Connection already exists"
      );


      setSelectedTerminal(
        null
      );

      return;

    }


    // ========================================================
    // GET DEVICES
    // ========================================================

    const fromDevice =
      devices.find(
        device =>
          device.id ===
          selectedTerminal.deviceId
      );


    const toDevice =
      devices.find(
        device =>
          device.id ===
          deviceId
      );


    if (
      !fromDevice ||
      !toDevice
    ) {

      setSelectedTerminal(
        null
      );

      return;

    }


    // ========================================================
    // DETERMINE PANEL OWNERSHIP
    // ========================================================

    let connectionPanelId:
      string | undefined =
        undefined;


    // --------------------------------------------------------
    // Case 1:
    //
    // Directly connecting FROM a panel.
    // --------------------------------------------------------

    if (
      isPanel(fromDevice)
    ) {

      connectionPanelId =
        fromDevice.id;

    }


    // --------------------------------------------------------
    // Case 2:
    //
    // Directly connecting TO a panel.
    // --------------------------------------------------------

    else if (
      isPanel(toDevice)
    ) {

      connectionPanelId =
        toDevice.id;

    }


    // --------------------------------------------------------
    // Case 3:
    //
    // Existing circuit already belongs to a panel.
    // --------------------------------------------------------

    else if (
      fromDevice.panelId
    ) {

      connectionPanelId =
        fromDevice.panelId;

    }


    else if (
      toDevice.panelId
    ) {

      connectionPanelId =
        toDevice.panelId;

    }


    // --------------------------------------------------------
    // Case 4:
    //
    // A panel is currently selected.
    // --------------------------------------------------------

    else {

      connectionPanelId =
        getSelectedPanelId();

    }


    // ========================================================
    // CREATE VISUAL WIRE
    // ========================================================

    const wire: Wire = {

      id:
        crypto.randomUUID(),

      from: {

        deviceId:
          selectedTerminal.deviceId,

        terminalId:
          selectedTerminal.terminalId

      },

      to: {

        deviceId,

        terminalId

      },

      gauge:
        "#14",

      cableType:
        "14/2 NM-B",

      installation:
        "NM-B",

      color:
        wireColor.toUpperCase() as Wire["color"],

      length:
        0,

      energized:
        false,

      current:
        0,

      voltage:
        120

    };


    // ========================================================
    // CREATE ELECTRICAL CONNECTION
    // ========================================================

    const connection: Connection = {

      id:
        crypto.randomUUID(),

      from: {

        deviceId:
          selectedTerminal.deviceId,

        terminalId:
          selectedTerminal.terminalId

      },

      to: {

        deviceId,

        terminalId

      },

      cable:
        "14/2 NM-B",

      wire: {

        gauge:
          "#14",

        conductors:
          2,

        cableType:
          "14/2 NM-B",

        length:
          0,

        ampacity:
          15,

        color:
          "BLACK"

      },

      installationMethod:
        "NM-B",

      status:
        "CONNECTED",

      energized:
        false

    };


    // ========================================================
    // SAVE VISUAL WIRE
    // ========================================================

    setWires(prev => [

      ...prev,

      wire

    ]);


    // ========================================================
    // SAVE ELECTRICAL CONNECTION
    // ========================================================

    setConnections(prev => [

      ...prev,

      connection

    ]);


    // ========================================================
    // UPDATE CONNECTED DEVICES + PANEL OWNERSHIP
    //
    // IMPORTANT:
    //
    // We perform both operations in the same setDevices()
    // transaction so ownership sees the NEW connection graph.
    // ========================================================

    setDevices(prev => {

      // ------------------------------------------------------
      // First create the new connected-device graph.
      // ------------------------------------------------------

      const updatedDevices =
        prev.map(device => {

          // -----------------------------------------------
          // First endpoint
          // -----------------------------------------------

          if (
            device.id ===
            selectedTerminal.deviceId
          ) {

            return {

              ...device,

              connectedDevices: [

                ...new Set([

                  ...(device.connectedDevices ?? []),

                  deviceId

                ])

              ]

            };

          }


          // -----------------------------------------------
          // Second endpoint
          // -----------------------------------------------

          if (
            device.id ===
            deviceId
          ) {

            return {

              ...device,

              connectedDevices: [

                ...new Set([

                  ...(device.connectedDevices ?? []),

                  selectedTerminal.deviceId

                ])

              ]

            };

          }


          return device;

        });


      // ------------------------------------------------------
      // If there is no panel, preserve the devices exactly
      // as updated above.
      // ------------------------------------------------------

      if (
        !connectionPanelId
      ) {

        return updatedDevices;

      }


      // ------------------------------------------------------
      // Determine which side should be used as the traversal
      // starting point.
      //
      // If one side is the panel, traverse from the other side.
      // Otherwise traverse from both sides.
      // ------------------------------------------------------

      const ownershipStarts: string[] = [];


      if (
        !isPanel(fromDevice)
      ) {

        ownershipStarts.push(
          fromDevice.id
        );

      }


      if (
        !isPanel(toDevice)
      ) {

        ownershipStarts.push(
          toDevice.id
        );

      }


      // ------------------------------------------------------
      // Find all devices reachable from the new connection.
      // ------------------------------------------------------

      const ownedDeviceIds =
        new Set<string>();


      ownershipStarts.forEach(
        startId => {

          const ids =
            assignCircuitOwnership(
              updatedDevices,
              startId,
              connectionPanelId!
            );


          ids.forEach(
            id => {

              ownedDeviceIds.add(
                id
              );

            }
          );

        }
      );


      // ------------------------------------------------------
      // Apply panel ownership.
      // ------------------------------------------------------

      return updatedDevices.map(
        device => {

          if (
            !ownedDeviceIds.has(
              device.id
            )
          ) {

            return device;

          }


          return {

            ...device,

            panelId:
              connectionPanelId

          };

        }
      );

    });


    // --------------------------------------------------------
    // Clear terminal selection.
    // --------------------------------------------------------

    setSelectedTerminal(
      null
    );

  }


  // ==========================================================
  // DRAGGING
  // ==========================================================

  function startDrag(
    id: string
  ) {

    if (!wireMode) {

      setDragging(
        id
      );

    }

  }


  function moveBoard(
    e: MouseEvent<HTMLDivElement>
  ) {

    if (!dragging) {
      return;
    }


    const rect =
      e.currentTarget.getBoundingClientRect();


    setDevices(prev =>
      prev.map(device =>

        device.id === dragging

          ? {

              ...device,

              x:
                e.clientX -
                rect.left -
                75,

              y:
                e.clientY -
                rect.top -
                45

            }

          :

            device

      )
    );

  }


  // ==========================================================
  // CLEAR WORKSPACE
  // ==========================================================

  function clearWorkspace() {

    setDevices([]);

    setWires([]);

    setConnections([]);

    setSelectedTerminal(null);

    setSelectedDevice(null);

    onCircuitPathsChange?.(
      []
    );

  }


  // ==========================================================
  // FIND CIRCUIT PATHS
  //
  // ONLY returns devices belonging to this panel.
  // ==========================================================

  function getCircuitPaths(
    device: ElectricalDevice,
    deviceList: ElectricalDevice[],
    path: string[] = [device.name],
    visited = new Set<string>()
  ): string[][] {

    if (
      visited.has(device.id)
    ) {

      return [];

    }


    const nextVisited =
      new Set(visited);


    nextVisited.add(
      device.id
    );


    let paths: string[][] = [];


    (
      device.connectedDevices ?? []
    ).forEach(
      id => {

        const connected =
          deviceList.find(
            item =>
              item.id === id
          );


        if (!connected) {
          return;
        }


        if (
          nextVisited.has(
            connected.id
          )
        ) {

          return;

        }


        // ----------------------------------------------------
        // Never traverse into another panel.
        // ----------------------------------------------------

        if (
          isPanel(connected) &&
          connected.id !== device.id
        ) {

          return;

        }


        // ----------------------------------------------------
        // Only display devices belonging to THIS panel.
        //
        // IMPORTANT:
        //
        // connected.panelId must be compared against the
        // actual panel ID, not against device.id.
        // ----------------------------------------------------

        if (
          !isPanel(device) &&
          connected.panelId &&
          device.panelId &&
          connected.panelId !== device.panelId
        ) {

          return;

        }


        const newPath = [

          ...path,

          connected.name

        ];


        paths.push(
          newPath
        );


        paths.push(
          ...getCircuitPaths(
            connected,
            deviceList,
            newPath,
            nextVisited
          )
        );

      }
    );


    return paths;

  }


  // ==========================================================
  // CALCULATE PANEL LOAD
  //
  // ONLY counts loads assigned to this panel.
  // ==========================================================

  function calculateLoad(
    device: ElectricalDevice,
    deviceList: ElectricalDevice[],
    visited = new Set<string>()
  ): number {

    if (
      visited.has(
        device.id
      )
    ) {

      return 0;

    }


    visited.add(
      device.id
    );


    return (
      device.connectedDevices ?? []
    ).reduce(
      (
        total,
        id
      ) => {

        const connected =
          deviceList.find(
            item =>
              item.id === id
          );


        if (!connected) {
          return total;
        }


        // ----------------------------------------------------
        // Do not count another panel.
        // ----------------------------------------------------

        if (
          isPanel(connected)
        ) {

          return total;

        }


        // ----------------------------------------------------
        // Do not count devices belonging to another panel.
        // ----------------------------------------------------

        if (
          connected.panelId &&
          connected.panelId !== device.id
        ) {

          return total;

        }


        return (

          total +

          (
            connected.load?.watts ??
            0
          ) +

          calculateLoad(
            connected,
            deviceList,
            visited
          )

        );

      },
      0
    );

  }


  // ==========================================================
  // FIND TERMINAL POSITION
  // ==========================================================

  function getTerminalPosition(
    deviceId: string,
    terminalId: string
  ) {

    const device =
      devices.find(
        item =>
          item.id === deviceId
      );


    const terminal =
      device?.terminals.find(
        item =>
          item.id === terminalId
      );


    if (
      !device ||
      !terminal
    ) {

      return null;

    }


    return {

      x:
        device.x +
        terminal.x,

      y:
        device.y +
        terminal.y

    };

  }


  // ==========================================================
  // COMPONENT LIBRARY DRAG/DROP
  // ==========================================================

  function allowDrop(
    e: DragEvent<HTMLDivElement>
  ) {

    e.preventDefault();

  }


  function dropComponent(
    e: DragEvent<HTMLDivElement>
  ) {

    e.preventDefault();


    const componentName =
      e.dataTransfer.getData(
        "componentType"
      );


    if (
      !componentName
    ) {

      return;

    }


    const rect =
      e.currentTarget.getBoundingClientRect();


    const x =
      e.clientX -
      rect.left;


    const y =
      e.clientY -
      rect.top;


    createDevice(
      componentName,
      x,
      y
    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div>

      {/* =====================================================
          WORKSPACE TOOLBAR
          ===================================================== */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "10px"
        }}
      >

        <button
          onClick={() =>
            setWireMode(
              !wireMode
            )
          }
        >

          {
            wireMode
              ? "Exit Wire"
              : "Wire Tool"
          }

        </button>


        <select
          value={
            wireColor
          }
          onChange={e =>
            setWireColor(
              e.target.value
            )
          }
        >

          <option value="black">
            Hot
          </option>

          <option value="red">
            Load
          </option>

          <option value="white">
            Neutral
          </option>

          <option value="green">
            Ground
          </option>

        </select>


        <button
          onClick={
            clearWorkspace
          }
        >
          Clear
        </button>

      </div>


      {/* =====================================================
          TRAINING BOARD
          ===================================================== */}

      <div

        className="training-board"

        onDragOver={
          allowDrop
        }

        onDrop={
          dropComponent
        }

        onMouseDown={e => {

          const target =
            e.target as HTMLElement;


          if (
            target.closest(
              ".device-component"
            )
          ) {

            return;

          }


          setSelectedDevice(
            null
          );


          onSelectDevice?.(
            null
          );


          setSelectedTerminal(
            null
          );

        }}

        onMouseMove={
          moveBoard
        }

        onMouseUp={() =>
          setDragging(
            null
          )
        }

        style={{

          width:
            "100%",

          height:
            "calc(100vh - 170px)",

          minHeight:
            "700px",

          overflow:
            "auto",

          background:
            "#d7dbe0",

          border:
            "2px solid #555",

          borderRadius:
            "8px",

          position:
            "relative"

        }}

      >

        <div

          style={{

            width:
              "2000px",

            height:
              "1200px",

            position:
              "relative"

          }}

        >

          {/* =================================================
              SVG WIRES
              ================================================= */}

          <svg

            ref={
              svgRef
            }

            style={{

              position:
                "absolute",

              left:
                0,

              top:
                0,

              width:
                "2000px",

              height:
                "1200px",

              pointerEvents:
                "none"

            }}

          >

            {
              wires.map(
                wire => {

                  const start =
                    getTerminalPosition(
                      wire.from.deviceId,
                      wire.from.terminalId
                    );


                  const end =
                    getTerminalPosition(
                      wire.to.deviceId,
                      wire.to.terminalId
                    );


                  if (
                    !start ||
                    !end
                  ) {

                    return null;

                  }


                  return (

                    <line

                      key={
                        wire.id
                      }

                      x1={
                        start.x
                      }

                      y1={
                        start.y
                      }

                      x2={
                        end.x
                      }

                      y2={
                        end.y
                      }

                      stroke={
                        wire.color
                      }

                      strokeWidth={
                        "5"
                      }

                    />

                  );

                }
              )
            }

          </svg>


          {/* =================================================
              DEVICES
              ================================================= */}

          {
            devices.map(
              device => (

                <Device

                  key={
                    device.id
                  }

                  data-device-id={
                    device.id
                  }

                  device={
                    device
                  }

                  wireMode={
                    wireMode
                  }

                  selectedTerminal={

                    selectedTerminal

                      ? `${selectedTerminal.deviceId}-${selectedTerminal.terminalId}`

                      : null

                  }

                  selected={

                    selectedDevice?.id ===
                    device.id

                  }

                  onSelect={
                    selectDevice
                  }

                  onTerminalClick={
                    terminalClick
                  }

                  onStartDrag={
                    startDrag
                  }

                />

              )
            )
          }

        </div>

      </div>

    </div>

  );

});


export default Workspace;