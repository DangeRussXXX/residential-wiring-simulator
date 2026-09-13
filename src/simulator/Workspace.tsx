// Residential Wiring Simulator
// Main Simulator Workspace
//
// Responsibilities:
//
// - Device placement
// - Terminal wiring
// - Visual wires
// - Electrical connections
// - Circuit topology
// - Panel ownership
// - Simulator context integration
//
// IMPORTANT:
//
// BREAKERS ARE NOT WORKSPACE DEVICES.
//
// There is NO breaker drag/drop logic here.
//
// Breakers belong exclusively to the BreakerPanel system.
//
// Panels ARE workspace devices:
//
//   Breaker Panel
//   Sub Panel
//
// Normal components may still be dragged onto the workspace.

import {
  useState,
  useImperativeHandle,
  forwardRef
} from "react";

import type {
  MouseEvent,
  DragEvent
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

  getConnections: () => Connection[];

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
// TERMINAL NORMALIZATION
// ============================================================

function normalizeTerminalType(
  type: string
):
  | "hot"
  | "neutral"
  | "ground"
  | "load"
  | "traveler"
  | "control" {

  switch (
    type
  ) {

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
// PANEL DETECTION
// ============================================================

function isPanelComponentName(
  value: string
): boolean {

  const normalized =
    value
      .trim()
      .toLowerCase();


  return (

    normalized ===
      "breaker panel" ||

    normalized ===
      "sub panel" ||

    normalized.includes(
      "breaker panel"
    ) ||

    normalized.includes(
      "sub panel"
    )

  );

}


// ============================================================
// BREAKER NAME DETECTION
// ============================================================
//
// This remains ONLY as a safety guard.
//
// It is NOT used for drag/drop anymore.
//
// A breaker simply cannot become a workspace device.
//

function looksLikeBreakerName(
  value: string
): boolean {

  const normalized =
    value
      .trim()
      .toLowerCase();


  if (
    !normalized
  ) {

    return false;

  }


  if (
    isPanelComponentName(
      normalized
    )
  ) {

    return false;

  }


  return (

    normalized ===
      "breaker" ||

    normalized ===
      "circuit breaker" ||

    normalized.includes(
      "circuit breaker"
    ) ||

    normalized.endsWith(
      " breaker"
    ) ||

    normalized.startsWith(
      "breaker "
    )

  );

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
  // SIMULATOR STATE
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
  // LOCAL STATE
  // ==========================================================

  const [
    wires,
    setWires
  ] =
    useState<Wire[]>(
      []
    );


  const [
    wireMode,
    setWireMode
  ] =
    useState(
      false
    );


  const [
    wireColor,
    setWireColor
  ] =
    useState(
      "black"
    );


  const [
    selectedTerminal,
    setSelectedTerminal
  ] =
    useState<{
      deviceId: string;
      terminalId: string;
    } | null>(
      null
    );


  const [
    dragging,
    setDragging
  ] =
    useState<string | null>(
      null
    );


  // ==========================================================
  // PANEL HELPERS
  // ==========================================================

  function isPanel(
    device:
      | ElectricalDevice
      | null
      | undefined
  ): boolean {

    return !!device && (

      device.type ===
        "Breaker Panel" ||

      device.type ===
        "Sub Panel"

    );

  }


  function getSelectedPanelId():
    string | undefined {

    if (
      selectedDevice &&
      isPanel(
        selectedDevice
      )
    ) {

      return selectedDevice.id;

    }


    return undefined;

  }


  // ==========================================================
  // CREATE DEVICE
  // ==========================================================

  function createDevice(
    name: string,
    dropX: number = 150,
    dropY: number = 120
  ): void {

    // --------------------------------------------------------
    // BREAKERS ARE NEVER WORKSPACE DEVICES.
    //
    // Panels remain valid.
    // --------------------------------------------------------

    if (
      looksLikeBreakerName(
        name
      )
    ) {

      console.warn(
        `[Workspace] Breaker "${name}" cannot be created here.`
      );

      return;

    }


    // --------------------------------------------------------
    // FIND CATALOG COMPONENT.
    // --------------------------------------------------------

    const definition =
      componentCatalog.find(
        component =>
          component.name ===
          name
      );


    if (
      !definition
    ) {

      console.warn(
        `[Workspace] Component not found in catalog: ${name}`
      );

      return;

    }


    // --------------------------------------------------------
    // SECOND BREAKER SAFETY CHECK.
    // --------------------------------------------------------

    const definitionType =
      String(
        definition.type ??
          ""
      )
        .trim()
        .toLowerCase();


    if (

      (
        definitionType ===
          "breaker" ||

        definitionType ===
          "circuit breaker"

      ) &&

      !isPanelComponentName(
        definition.name
      )

    ) {

      console.warn(
        `[Workspace] Catalog breaker "${definition.name}" refused.`
      );

      return;

    }


    // ========================================================
    // TERMINALS
    // ========================================================

    const terminals:
      ElectricalDevice["terminals"] =

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
    // DEVICE
    // ========================================================

    const device:
      ElectricalDevice = {

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
        definition.electrical?.poles as
          | BreakerPoles
          | undefined,

      breakerSize:
        definition.electrical?.amps,

      mainBreaker:

        isPanel({
          id:
            "",

          name:
            "",

          symbol:
            "",

          type:
            definition.type,

          x:
            0,

          y:
            0,

          terminals:
            []

        })

          ? definition.electrical?.amps

          : undefined,

      panelId,

      breakerId:
        undefined,

      terminals,

      load: {

        watts:
          definition.electrical?.watts ??
          0

      },

      voltage:
        (
          definition.electrical?.voltage ??
          120
        ) as Voltage,

      x:
        dropX,

      y:
        dropY,

      tripped:
        false

    };


    // ========================================================
    // ADD
    // ========================================================

    setDevices(
      previous => [

        ...previous,

        device

      ]
    );

  }


  // ==========================================================
  // UPDATE DEVICE
  // ==========================================================

  function updateDevice(
    updatedDevice: ElectricalDevice
  ): void {

    setDevices(
      previous =>
        previous.map(
          device =>

            device.id ===
            updatedDevice.id

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
  // IMPERATIVE API
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

    }),

    [
      connections
    ]
  );


  // ==========================================================
  // SELECT DEVICE
  // ==========================================================

  function selectDevice(
    id: string
  ): void {

    let device =
      devices.find(
        item =>
          item.id ===
          id
      ) || null;


    if (
      !device
    ) {

      return;

    }


    // --------------------------------------------------------
    // Panel calculations.
    // --------------------------------------------------------

    if (
      isPanel(
        device
      )
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
            device.voltage ??
            120
          )

      };


      setDevices(
        previous =>
          previous.map(
            item =>

              item.id ===
              device!.id

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
  // PANEL OWNERSHIP
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
          item =>
            item.id ===
            currentId
        );


      if (
        !currentDevice
      ) {

        continue;

      }


      // ------------------------------------------------------
      // Never absorb another panel.
      // ------------------------------------------------------

      if (

        isPanel(
          currentDevice
        ) &&

        currentDevice.id !==
          panelId

      ) {

        continue;

      }


      if (
        !isPanel(
          currentDevice
        )
      ) {

        ownedDeviceIds.add(
          currentDevice.id
        );

      }


      (
        currentDevice.connectedDevices ??
        []
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
  ): void {

    if (
      !wireMode
    ) {

      return;

    }


    // --------------------------------------------------------
    // First terminal.
    // --------------------------------------------------------

    if (
      !selectedTerminal
    ) {

      setSelectedTerminal({

        deviceId,

        terminalId

      });

      return;

    }


    // --------------------------------------------------------
    // Clicking the same terminal cancels selection.
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


    // --------------------------------------------------------
    // Duplicate connection check.
    // --------------------------------------------------------

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
        "[Workspace] Connection already exists."
      );


      setSelectedTerminal(
        null
      );

      return;

    }


    // ========================================================
    // DEVICES
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
    // PANEL OWNERSHIP
    // ========================================================

    let connectionPanelId:
      string | undefined;


    if (
      isPanel(
        fromDevice
      )
    ) {

      connectionPanelId =
        fromDevice.id;

    }

    else if (
      isPanel(
        toDevice
      )
    ) {

      connectionPanelId =
        toDevice.id;

    }

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

    else {

      connectionPanelId =
        getSelectedPanelId();

    }


    // ========================================================
    // VISUAL WIRE
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
        wireColor.toUpperCase() as
          Wire["color"],

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
    // ELECTRICAL CONNECTION
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


    setWires(
      previous => [

        ...previous,

        wire

      ]
    );


    setConnections(
      previous => [

        ...previous,

        connection

      ]
    );


    // ========================================================
    // DEVICE GRAPH
    // ========================================================

    setDevices(
      previous => {

        const updatedDevices =
          previous.map(
            device => {

              if (
                device.id ===
                selectedTerminal.deviceId
              ) {

                return {

                  ...device,

                  connectedDevices: [

                    ...new Set([

                      ...(device.connectedDevices ??
                        []),

                      deviceId

                    ])

                  ]

                };

              }


              if (
                device.id ===
                deviceId
              ) {

                return {

                  ...device,

                  connectedDevices: [

                    ...new Set([

                      ...(device.connectedDevices ??
                        []),

                      selectedTerminal.deviceId

                    ])

                  ]

                };

              }


              return device;

            }
          );


        if (
          !connectionPanelId
        ) {

          return updatedDevices;

        }


        const ownershipStarts:
          string[] = [];


        if (
          !isPanel(
            fromDevice
          )
        ) {

          ownershipStarts.push(
            fromDevice.id
          );

        }


        if (
          !isPanel(
            toDevice
          )
        ) {

          ownershipStarts.push(
            toDevice.id
          );

        }


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

      }
    );


    setSelectedTerminal(
      null
    );

  }


  // ==========================================================
  // DEVICE DRAGGING
  // ==========================================================

  function startDrag(
    id: string
  ): void {

    if (
      wireMode
    ) {

      return;

    }


    setDragging(
      id
    );

  }


  function moveBoard(
    event: MouseEvent<HTMLDivElement>
  ): void {

    if (
      !dragging
    ) {

      return;

    }


    const rect =
      event.currentTarget
        .getBoundingClientRect();


    setDevices(
      previous =>
        previous.map(
          device =>

            device.id ===
            dragging

              ? {

                  ...device,

                  x:
                    event.clientX -
                    rect.left -
                    75,

                  y:
                    event.clientY -
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

  function clearWorkspace(): void {

    setDevices([]);

    setWires([]);

    setConnections([]);

    setSelectedTerminal(
      null
    );

    setSelectedDevice(
      null
    );

    onCircuitPathsChange?.(
      []
    );

  }


  // ==========================================================
  // CIRCUIT PATHS
  // ==========================================================

  function getCircuitPaths(
    device: ElectricalDevice,
    deviceList: ElectricalDevice[],
    path: string[] = [
      device.name
    ],
    visited =
      new Set<string>()
  ): string[][] {

    if (
      visited.has(
        device.id
      )
    ) {

      return [];

    }


    const nextVisited =
      new Set(
        visited
      );


    nextVisited.add(
      device.id
    );


    let paths:
      string[][] = [];


    (
      device.connectedDevices ??
      []
    ).forEach(
      id => {

        const connected =
          deviceList.find(
            item =>
              item.id ===
              id
          );


        if (
          !connected
        ) {

          return;

        }


        if (
          nextVisited.has(
            connected.id
          )
        ) {

          return;

        }


        if (

          isPanel(
            connected
          ) &&

          connected.id !==
            device.id

        ) {

          return;

        }


        if (

          !isPanel(
            device
          ) &&

          connected.panelId &&

          device.panelId &&

          connected.panelId !==
            device.panelId

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
  // PANEL LOAD
  // ==========================================================

  function calculateLoad(
    device: ElectricalDevice,
    deviceList: ElectricalDevice[],
    visited =
      new Set<string>()
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

      device.connectedDevices ??
      []

    ).reduce(
      (
        total,
        id
      ) => {

        const connected =
          deviceList.find(
            item =>
              item.id ===
              id
          );


        if (
          !connected
        ) {

          return total;

        }


        if (
          isPanel(
            connected
          )
        ) {

          return total;

        }


        if (

          connected.panelId &&

          connected.panelId !==
            device.id

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
  // TERMINAL POSITION
  // ==========================================================

  function getTerminalPosition(
    deviceId: string,
    terminalId: string
  ) {

    const device =
      devices.find(
        item =>
          item.id ===
          deviceId
      );


    const terminal =
      device?.terminals.find(
        item =>
          item.id ===
          terminalId
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
  // NORMAL COMPONENT DRAG/DROP
  // ==========================================================
  //
  // Breakers are not handled here.
  //
  // The only components accepted by the workspace are normal
  // catalog components. Panels are normal components too.
  //

  function allowDrop(
    event: DragEvent<HTMLDivElement>
  ): void {

    event.preventDefault();

    event.dataTransfer.dropEffect =
      "copy";

  }


  function dropComponent(
    event: DragEvent<HTMLDivElement>
  ): void {

    event.preventDefault();


    const componentName =
      event.dataTransfer.getData(
        "componentType"
      );


    if (
      !componentName
    ) {

      console.warn(
        "[Workspace] Drop contained no componentType."
      );

      return;

    }


    // --------------------------------------------------------
    // Final safety guard.
    //
    // This is intentionally NOT breaker drag/drop logic.
    // It simply prevents an actual breaker from ever becoming
    // a workspace device.
    // --------------------------------------------------------

    if (
      looksLikeBreakerName(
        componentName
      )
    ) {

      console.warn(
        `[Workspace] Breaker "${componentName}" cannot be created here.`
      );

      return;

    }


    const rect =
      event.currentTarget
        .getBoundingClientRect();


    const x =
      event.clientX -
      rect.left;


    const y =
      event.clientY -
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

      {/* ====================================================
          TOOLBAR
          ==================================================== */}

      <div
        style={{
          display:
            "flex",

          gap:
            "10px",

          marginBottom:
            "10px"
        }}
      >

        <button
          type="button"

          onClick={() =>
            setWireMode(
              current =>
                !current
            )
          }
        >

          {wireMode
            ? "Exit Wire"
            : "Wire Tool"}

        </button>


        <select
          value={
            wireColor
          }

          onChange={
            event =>
              setWireColor(
                event.target.value
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
          type="button"

          onClick={
            clearWorkspace
          }
        >

          Clear

        </button>

      </div>


      {/* ====================================================
          TRAINING BOARD
          ==================================================== */}

      <div

        className="training-board"

        onDragOver={
          allowDrop
        }

        onDrop={
          dropComponent
        }

        onMouseDown={
          event => {

            const target =
              event.target as HTMLElement;


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

          }
        }

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

          {/* ================================================
              WIRES
              ================================================= */}

          <svg

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

            {wires.map(
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
            )}

          </svg>


          {/* ================================================
              DEVICES
              ================================================= */}

          {devices.map(
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
          )}

        </div>

      </div>

    </div>

  );

});


export default Workspace;