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
  useRef,
  useEffect
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
import type { ServiceProject } from "./projectWorkflow";

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
  liveProject?: ServiceProject;
  liveAreaId?: string;
  liveWall?: "NORTH" | "SOUTH" | "EAST" | "WEST";

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
    onCircuitPathsChange,
    liveProject,
    liveAreaId,
    liveWall
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
    setSelectedDevice,
    workspaceScope
  } = useSimulator();


  // ==========================================================
  // LOCAL WORKSPACE STATE
  // ==========================================================

  const [
    wires,
    setWires
  ] = useState<Wire[]>(() => {
    try { return JSON.parse(localStorage.getItem(`rws-visual-wires:${workspaceScope}`) || "[]") as Wire[]; }
    catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(`rws-visual-wires:${workspaceScope}`, JSON.stringify(wires)); } catch { /* storage unavailable */ }
  }, [workspaceScope, wires]);

  // Device mounting metadata is stored per wall workspace.
  const [mountingHeights, setMountingHeights] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(`rws-device-heights:${workspaceScope}`) || "{}"); }
    catch { return {}; }
  });
  const [nailedDevices, setNailedDevices] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(`rws-nailed-devices:${workspaceScope}`) || "{}"); }
    catch { return {}; }
  });
  useEffect(() => {
    try {
      localStorage.setItem(`rws-device-heights:${workspaceScope}`, JSON.stringify(mountingHeights));
      localStorage.setItem(`rws-nailed-devices:${workspaceScope}`, JSON.stringify(nailedDevices));
    } catch { /* storage unavailable */ }
  }, [workspaceScope, mountingHeights, nailedDevices]);


  const [
    wireMode,
    setWireMode
  ] = useState(false);


  const [studSpacing, setStudSpacing] = useState(16);
  const [snapToStuds, setSnapToStuds] = useState(true);

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
        snapToStuds && ["outlet", "gfci", "switch-single", "switch-three-way", "dimmer"].includes(definition.symbol) ? Math.round((dropX + 6) / (studSpacing * 8)) * (studSpacing * 8) - 6 : dropX,

      y:
        dropY,

      tripped:
        false

    };


    setDevices(prev => [
      ...prev,
      device
    ]);


    // If this was created while a panel was selected,
    // keep that panel selected.
    //
    // We deliberately do NOT automatically select the new
    // device because doing so would make the panel disappear
    // from the active-panel selector logic.

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
  // ASSIGN PANEL OWNERSHIP
  // ==========================================================
  //
  // This is the important part for preventing:
  //
  // 100A circuit appearing in 200A panel
  //
  // and
  //
  // 200A circuit appearing in 100A panel.
  //
  // ==========================================================

  function assignPanelOwnership(
    deviceId: string,
    panelId: string
  ) {

    setDevices(prev =>
      prev.map(device => {

        if (
          device.id !== deviceId
        ) {
          return device;
        }


        // Never assign a panel to another panel.
        if (
          isPanel(device)
        ) {
          return device;
        }


        return {

          ...device,

          panelId

        };

      })
    );

  }


  // ==========================================================
  // ASSIGN PANEL OWNERSHIP TO CONNECTED CIRCUIT
  // ==========================================================

  function assignCircuitOwnership(
    startDeviceId: string,
    panelId: string
  ) {

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
        visited.has(currentId)
      ) {
        continue;
      }


      visited.add(
        currentId
      );


      const currentDevice =
        devices.find(
          device =>
            device.id === currentId
        );


      if (!currentDevice) {
        continue;
      }


      // ------------------------------------------------------
      // Do not absorb another panel.
      // ------------------------------------------------------

      if (
        isPanel(currentDevice) &&
        currentDevice.id !== panelId
      ) {

        continue;

      }


      if (
        !isPanel(currentDevice)
      ) {

        ownedDeviceIds.add(
          currentDevice.id
        );

      }


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


    if (
      ownedDeviceIds.size === 0
    ) {
      return;
    }


    setDevices(prev =>
      prev.map(device => {

        if (
          !ownedDeviceIds.has(
            device.id
          )
        ) {

          return device;

        }


        return {

          ...device,

          panelId

        };

      })
    );

  }


  // Reserved for the upcoming circuit ownership integration.
  void assignCircuitOwnership;

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
    //
    // This lets the user select:
    //
    // 100A Panel
    //     ↓
    // Wire
    //     ↓
    // Existing circuit
    //
    // and explicitly move that circuit to the 100A panel.
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
    // UPDATE CONNECTED DEVICES
    // ========================================================

    setDevices(prev =>
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

      })
    );


    // ========================================================
    // PANEL OWNERSHIP
    // ========================================================

    if (
      connectionPanelId
    ) {

      // ----------------------------------------------------
      // Assign the directly connected device.
      // ----------------------------------------------------

      if (
        !isPanel(toDevice)
      ) {

        assignPanelOwnership(
          toDevice.id,
          connectionPanelId
        );

      }


      if (
        !isPanel(fromDevice)
      ) {

        assignPanelOwnership(
          fromDevice.id,
          connectionPanelId
        );

      }

    }


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

    if (!wireMode && !nailedDevices[id]) {

      setDragging(id);

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
                snapToStuds && ["outlet", "gfci", "switch-single", "switch-three-way", "dimmer"].includes(device.symbol)
                  ? Math.round((e.clientX - rect.left - 69) / (studSpacing * 8)) * (studSpacing * 8) - 6
                  : e.clientX - rect.left - 75,

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
        // If this device belongs to a different panel,
        // do NOT display it in this panel's circuit tree.
        // ----------------------------------------------------

        if (
          connected.panelId &&
          connected.panelId !== device.id
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
        {selectedDevice && (
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",border:"1px solid #7a9aab",borderRadius:6,background:"#f5f8fa",color:"#172b36",fontSize:12}}>
            <strong>{selectedDevice.name || selectedDevice.type}</strong>
            <label>Height (in)
              <input aria-label="Device mounting height in inches" type="number" min="0" max="120" step="1"
                value={mountingHeights[selectedDevice.id] ?? (/switch/i.test(selectedDevice.type) ? 48 : /light/i.test(selectedDevice.type) ? 84 : 12)}
                onChange={e=>setMountingHeights(prev=>({...prev,[selectedDevice.id]:Math.max(0,Math.min(120,Number(e.target.value)||0))}))}
                style={{width:58,marginLeft:4}} />
            </label>
            <span>{nailedDevices[selectedDevice.id] ? "🔨 Fastened" : "Not fastened"}</span>
          </div>
        )}

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


        <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
          Studs
          <select value={studSpacing} onChange={e => setStudSpacing(Number(e.target.value))}>
            <option value={12}>12" O.C.</option>
            <option value={16}>16" O.C.</option>
            <option value={19.2}>19.2" O.C.</option>
            <option value={24}>24" O.C.</option>
          </select>
        </label>

        <label style={{display:"flex",alignItems:"center",gap:5,fontSize:12}}><input type="checkbox" checked={snapToStuds} onChange={e=>setSnapToStuds(e.target.checked)}/>Snap boxes to studs</label>

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

            position: "relative",
            backgroundImage: "linear-gradient(90deg,transparent 0px,transparent 5px,#bd8d57 5px,#bd8d57 21px,#80552d 22px,#80552d 24px,transparent 24px),linear-gradient(0deg,transparent 0px,transparent 1150px,#ae7b45 1150px,#ae7b45 1180px,transparent 1180px)",
            backgroundSize: `${studSpacing * 8}px 1200px,2000px 1200px`,
            backgroundRepeat: "repeat-x,no-repeat",
            backgroundColor: "#d6d2c8"
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

          {/* Mounting height and hammer/crowbar controls appear beside the selected device. */}
          {devices.map(device => {
            if (selectedDevice?.id !== device.id) return null;
            const defaultHeight = /switch/i.test(device.type) ? 48 : /light/i.test(device.type) ? 84 : 12;
            const height = mountingHeights[device.id] ?? defaultHeight;
            const nailed = !!nailedDevices[device.id];
            return <div key={`mount-tools-${device.id}`} style={{position:"absolute",left:device.x+145,top:device.y-10,zIndex:40,display:"flex",gap:5,alignItems:"center",background:"rgba(255,255,255,.96)",border:"1px solid #287b99",borderRadius:7,padding:"4px 6px",boxShadow:"0 2px 8px #0004"}}>
              <span style={{fontSize:11,color:"#17394a",whiteSpace:"nowrap"}}>{height}" AFF</span>
              <button type="button" title={nailed?"Already fastened":"Nail device to stud"} aria-label="Nail device to stud" disabled={nailed}
                onClick={e=>{e.stopPropagation();setNailedDevices(prev=>({...prev,[device.id]:true}));}}
                style={{border:"1px solid #8a6b36",borderRadius:5,padding:"4px 7px",background:nailed?"#ddd":"#fff0c9",cursor:nailed?"default":"pointer"}}>🔨</button>
              <button type="button" title={nailed?"Remove fastener and release device":"Device is not fastened"} aria-label="Remove device with crowbar" disabled={!nailed}
                onClick={e=>{e.stopPropagation();setNailedDevices(prev=>({...prev,[device.id]:false}));}}
                style={{border:"1px solid #53768a",borderRadius:5,padding:"4px 7px",background:nailed?"#d8f0ff":"#eee",cursor:nailed?"pointer":"default"}}>🪛</button>
            </div>;
          })}

          {/* Live home-run conductor overlay: reflects saved right-sidebar terminations.
              Drawn independently of user-authored workspace wires. */}
          {liveProject && liveAreaId && liveWall && (
            <svg width="2000" height="1200" viewBox="0 0 2000 1200"
              aria-label="Live room home-run terminations"
              style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:20,overflow:"visible"}}>
              {(liveProject.endToEndCircuits ?? [])
                .filter(c => c.areaId === liveAreaId && c.wall === liveWall)
                .map(c => {
                  const device = devices.find(d => d.id === c.receptacleId);
                  const isReceptacle = !!device && /receptacle/i.test(device.type);
                  if (!device) return null;
                  const cx = device.x + 75;
                  const boxTop = device.y + 20;
                  const cableX = cx - 15;
                  const entryY = Math.max(0, boxTop - 24);
                  const ends = [
                    {key:"hot",terminal:c.roomHot,color:"#171c23",outline:"#c8d4dc",sourceX:cableX-6},
                    {key:"neutral",terminal:c.roomNeutral,color:"#f7f9fb",outline:"#526678",sourceX:cableX},
                    {key:"ground",terminal:c.roomGround,color:"#bd7842",outline:"#5d361f",sourceX:cableX+6}
                  ];
                  const target = (terminal:string) => terminal === "brass"
                    ? {x:cx+55,y:device.y+55}
                    : terminal === "silver" ? {x:cx-55,y:device.y+55}
                    : {x:cx-42,y:device.y+105};
                  return <g key={`${c.slot}:${c.receptacleId}`}>
                    <path d={`M ${cableX} 0 L ${cableX} ${entryY}`}
                      stroke="#727e83" strokeWidth="20" fill="none" />
                    <path d={`M ${cableX} 0 L ${cableX} ${entryY}`}
                      stroke="#f2f0e8" strokeWidth="15" fill="none" />
                    <text x={cableX+14} y={Math.max(16,entryY-35)} fontSize="13"
                      fontWeight="bold" fill="#1b3949" stroke="#e9f0f3" strokeWidth="3"
                      paintOrder="stroke">HR #{c.slot} · 14/2 NM-B</text>
                    {ends.filter(w=>isReceptacle && w.terminal).map(w=>{
                      const t=target(w.terminal!);
                      const d=`M ${w.sourceX} ${entryY} C ${w.sourceX} ${entryY+32}, ${t.x} ${t.y-35}, ${t.x} ${t.y}`;
                      return <g key={w.key}>
                        <path d={d} fill="none" stroke={w.outline} strokeWidth="9" strokeLinecap="round"/>
                        <path d={d} fill="none" stroke={w.color} strokeWidth="6" strokeLinecap="round"/>
                        <circle cx={t.x} cy={t.y} r="8" fill={w.color} stroke={w.outline} strokeWidth="2"/>
                      </g>;
                    })}
                  </g>;
                })}
            </svg>
          )}

        </div>

      </div>

    </div>

  );

});


export default Workspace;