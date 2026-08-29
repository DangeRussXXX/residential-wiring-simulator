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

  addDevice: (
    name: string,
    x?: number,
    y?: number
  ) => void;

  updateDevice: (
    device: ElectricalDevice
  ) => void;

  getConnections: (
  ) => Connection[];

};


type WorkspaceProps = {

  onSelectDevice?: (
    device: ElectricalDevice | null
  ) => void;

  onCircuitPathsChange?: (
    paths: string[][]
  ) => void;

};


// ============================================================
// TERMINAL TYPE NORMALIZATION
// ============================================================
//
// Component catalog terminals use uppercase types such as:
//
// LINE
// LOAD
// NEUTRAL
// GROUND
// HOT
// CONTROL
//
// ElectricalDevice / DeviceTerminal uses:
//
// hot
// neutral
// ground
// load
// traveler
// control
//
// Keep this conversion in one place.
// ============================================================

function normalizeTerminalType(
  type: string
):
  "hot" |
  "neutral" |
  "ground" |
  "load" |
  "traveler" |
  "control" {

  switch (type) {

    case "LINE":
    case "HOT":
    case "hot":
      return "hot";

    case "NEUTRAL":
    case "neutral":
      return "neutral";

    case "GROUND":
    case "ground":
      return "ground";

    case "LOAD":
    case "load":
      return "load";

    case "TRAVELER":
    case "traveler":
      return "traveler";

    case "CONTROL":
    case "control":
      return "control";

    default:
      return "load";

  }

}


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

      console.warn(
        `Component not found in catalog: ${name}`
      );

      return;

    }


    // ========================================================
    // CREATE DEVICE TERMINALS
    // ========================================================
    //
    // Explicitly type the result as ElectricalDevice["terminals"]
    // so TypeScript does not widen the normalized terminal
    // type to generic "string".
    //
    // ComponentTerminalDefinition provides:
    //
    // label
    // type
    // x
    // y
    //
    // DeviceTerminal requires:
    //
    // name
    // label
    // type
    // x
    // y
    //
    // Therefore label is used as the terminal name.
    // ========================================================

    const terminals: ElectricalDevice["terminals"] =
      definition.terminals.map(
        terminal => ({

          id:
            `${terminal.id}-${crypto.randomUUID()}`,

          name:
            terminal.label,

          label:
            terminal.label,

          type:
            normalizeTerminalType(
              terminal.type
            ),

          x:
            terminal.x,

          y:
            terminal.y

        })
      );


    // ========================================================
    // PANEL OWNERSHIP
    // ========================================================

    const panelId =
      getSelectedPanelId();


    // ========================================================
    // CREATE ELECTRICAL DEVICE
    // ========================================================

    const device: ElectricalDevice = {

      id:
        crypto.randomUUID(),

      name:
        definition.name,

      symbol:
        definition.symbol,

      type:
        definition.type,

      connectedDevices:
        [],

      calculatedLoad:
        0,

      calculatedAmps:
        0,

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

      panelId,

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


    // ========================================================
    // ADD DEVICE
    // ========================================================

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


    // ========================================================
    // PANEL CALCULATIONS
    // ========================================================

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
  // ASSIGN PANEL OWNERSHIP
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


      // ======================================================
      // NEVER ABSORB ANOTHER PANEL
      // ======================================================

      if (
        isPanel(currentDevice) &&
        currentDevice.id !== panelId
      ) {

        continue;

      }


      // ======================================================
      // PANELS THEMSELVES DO NOT RECEIVE panelId
      // ======================================================

      if (
        !isPanel(currentDevice)
      ) {

        ownedDeviceIds.add(
          currentDevice.id
        );

      }


      // ======================================================
      // CONTINUE THROUGH CONNECTED DEVICES
      // ======================================================

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


    // ========================================================
    // FIRST TERMINAL
    // ========================================================

    if (!selectedTerminal) {

      setSelectedTerminal({

        deviceId,

        terminalId

      });

      return;

    }


    // ========================================================
    // SAME TERMINAL
    // ========================================================

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
    // DUPLICATE CONNECTION CHECK
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
    // FROM PANEL
    // --------------------------------------------------------

    if (
      isPanel(fromDevice)
    ) {

      connectionPanelId =
        fromDevice.id;

    }


    // --------------------------------------------------------
    // TO PANEL
    // --------------------------------------------------------

    else if (
      isPanel(toDevice)
    ) {

      connectionPanelId =
        toDevice.id;

    }


    // --------------------------------------------------------
    // EXISTING FROM DEVICE OWNERSHIP
    // --------------------------------------------------------

    else if (
      fromDevice.panelId
    ) {

      connectionPanelId =
        fromDevice.panelId;

    }


    // --------------------------------------------------------
    // EXISTING TO DEVICE OWNERSHIP
    // --------------------------------------------------------

    else if (
      toDevice.panelId
    ) {

      connectionPanelId =
        toDevice.panelId;

    }


    // --------------------------------------------------------
    // CURRENTLY SELECTED PANEL
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
    // UPDATE DEVICES + OWNERSHIP
    // ========================================================

    setDevices(prev => {

      // ------------------------------------------------------
      // CREATE UPDATED CONNECTION GRAPH
      // ------------------------------------------------------

      const updatedDevices =
        prev.map(device => {

          // --------------------------------------------------
          // FIRST ENDPOINT
          // --------------------------------------------------

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


          // --------------------------------------------------
          // SECOND ENDPOINT
          // --------------------------------------------------

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


      // ======================================================
      // NO PANEL
      // ======================================================

      if (
        !connectionPanelId
      ) {

        return updatedDevices;

      }


      // ======================================================
      // DETERMINE OWNERSHIP STARTS
      // ======================================================

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


      // ======================================================
      // FIND OWNED DEVICES
      // ======================================================

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


      // ======================================================
      // APPLY PANEL OWNERSHIP
      // ======================================================

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


    // ========================================================
    // CLEAR TERMINAL SELECTION
    // ========================================================

    setSelectedTerminal(
      null
    );

  }


  // ==========================================================
  // DEVICE DRAGGING
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

          : device

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
  // ==========================================================

  function getCircuitPaths(
    device: ElectricalDevice,
    deviceList: ElectricalDevice[],
    path: string[] = [device.name],
    visited = new Set<string>()
  ): string[][] {

    if (
      visited.has(
        device.id
      )
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
        // NEVER TRAVERSE INTO ANOTHER PANEL
        // ----------------------------------------------------

        if (
          isPanel(connected) &&
          connected.id !== device.id
        ) {

          return;

        }


        // ----------------------------------------------------
        // ONLY DISPLAY DEVICES FROM THIS PANEL
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
        // DO NOT COUNT ANOTHER PANEL
        // ----------------------------------------------------

        if (
          isPanel(connected)
        ) {

          return total;

        }


        // ----------------------------------------------------
        // DO NOT COUNT ANOTHER PANEL'S DEVICE
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