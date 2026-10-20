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
import { createPortal } from "react-dom";
import CableWiringPanel, { PANEL_SOURCE_ID, cableKinds, type CableKind, type CableRecord } from "./CableWiringPanel";

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

  addBox: (boxType: string, x?: number, y?: number) => void;

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
  onProjectChange?: (next:ServiceProject)=>void;
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
    onProjectChange,
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

  // Update 84A: boxes are independent wall fixtures; no device or wire state is modified.
  type WallBox = { id: string; kind: string; gangs: number; x: number; y: number };
  const [wallBoxes, setWallBoxes] = useState<WallBox[]>(() => {
    try { return JSON.parse(localStorage.getItem(`rws-empty-boxes:${workspaceScope}`) || "[]") as WallBox[]; }
    catch { return []; }
  });
  // Box membership is separate from electrical device records. Terminals and IDs stay intact.
  type BoxMount = { boxId: string; gang: number };
  const [boxMounts, setBoxMounts] = useState<Record<string, BoxMount>>(() => {
    try { return JSON.parse(localStorage.getItem(`rws-box-mounts:${workspaceScope}`) || "{}"); }
    catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem(`rws-box-mounts:${workspaceScope}`, JSON.stringify(boxMounts)); } catch { /* storage disabled */ }
  }, [boxMounts, workspaceScope]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [movingBoxId, setMovingBoxId] = useState<string | null>(null);
  useEffect(() => {
    try { localStorage.setItem(`rws-empty-boxes:${workspaceScope}`, JSON.stringify(wallBoxes)); } catch { /* storage disabled */ }
  }, [wallBoxes, workspaceScope]);
  useEffect(() => {
    try { setWallBoxes(JSON.parse(localStorage.getItem(`rws-empty-boxes:${workspaceScope}`) || "[]")); }
    catch { setWallBoxes([]); }
    setSelectedBoxId(null);
    try { setBoxMounts(JSON.parse(localStorage.getItem(`rws-box-mounts:${workspaceScope}`) || "{}")); }
    catch { setBoxMounts({}); }
  }, [workspaceScope]);
  const installEmptyBox = (kind: string, x = 240, y = 300) => {
    const gangs = Math.max(1, Math.min(6, Number(kind.match(/(\d+)-gang/i)?.[1] || 1)));
    setWallBoxes(prev => [...prev, { id: `box-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, kind, gangs, x, y }]);
  };
  const boxWidth = (gangs: number) => 58 + (gangs - 1) * 52;
  const selectedWallBox = wallBoxes.find(box => box.id === selectedBoxId);
  const boxHeightInches = (y: number) => Math.round(Math.max(0, Math.min(120, (1105 - y) / 8)) * 10) / 10;


  // Shared front/rear selection for the wall device and panel wiring editor.
  // Keep this state in Workspace so both views receive the same value.
  const [wiringFaces, setWiringFaces] = useState<Record<string, "front" | "rear">>({});
  const [inspectedCableEnd, setInspectedCableEnd] = useState<"from" | "to">("to");
  const updateWiringFace = (deviceId: string, face: "front" | "rear") => {
    setWiringFaces(previous => ({ ...previous, [deviceId]: face }));
  };

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


  void liveProject; // legacy records remain stored but no longer draw pre-connected wires
  const heightToY = (height:number) => 1150 - height * 8 - 45;
  const [cables,setCables] = useState<CableRecord[]>(()=>{
    try {return JSON.parse(localStorage.getItem(`rws-cables-v1:${workspaceScope}`)||"[]");}catch{return [];}
  });
  const [cableSource,setCableSource]=useState<string|null>(null);
  const [cableType,setCableType]=useState<CableKind>("14/2 NM-B");
  const [homeRunBreaker,setHomeRunBreaker]=useState(1);
  const [selectedCableId,setSelectedCableId]=useState<string|null>(null);
  const [blueprintMode,setBlueprintMode]=useState(false);
  useEffect(()=>{
    try {
      const legacy: CableRecord[]=JSON.parse(localStorage.getItem(`rws-cables-v1:${workspaceScope}`)||"[]");
      const shared=liveProject?.wallCables?.filter(c=>c.areaId===liveAreaId&&c.wall===liveWall)??[];
      setCables(shared.length?shared:legacy);
    }catch{setCables([]);}
    setCableSource(null);setSelectedCableId(null);setWireMode(false);
  },[workspaceScope]);
  useEffect(()=>{
    try {localStorage.setItem(`rws-cables-v1:${workspaceScope}`,JSON.stringify(cables));}catch{}
  },[workspaceScope,cables]);
  // The project is the canonical source shared with the distribution panel.
  // Synchronize external project edits into this wall without writing them back.
  useEffect(()=>{
    if(!liveProject?.wallCables || !liveAreaId || !liveWall)return;
    const shared=liveProject.wallCables.filter(c=>c.areaId===liveAreaId&&c.wall===liveWall);
    setCables(previous=>{
      if(JSON.stringify(previous)===JSON.stringify(shared))return previous;
      return shared;
    });
  },[liveProject?.wallCables,liveAreaId,liveWall]);
  // One-time migration of existing per-wall cable records into the project so the
  // distribution panel can see them without recreating any user connections.
  useEffect(()=>{
    if(!liveProject||!onProjectChange||!liveAreaId||!liveWall)return;
    const existing=liveProject.wallCables?.some(c=>c.areaId===liveAreaId&&c.wall===liveWall);
    if(existing)return;
    try {
      const old:CableRecord[]=JSON.parse(localStorage.getItem(`rws-cables-v1:${workspaceScope}`)||"[]");
      if(!old.length)return;
      const withNames=old.map(c=>{
        const from=devices.find(d=>d.id===c.from),to=devices.find(d=>d.id===c.to);
        return {...c,areaId:liveAreaId,wall:liveWall,
          fromName:c.fromName??from?.name??"Panel P1",toName:c.toName??to?.name,
          fromSymbol:c.fromSymbol??from?.symbol,toSymbol:c.toSymbol??to?.symbol,
          breakerSlot:c.breakerSlot??(c.from===PANEL_SOURCE_ID?1:undefined)};
      });
      onProjectChange({...liveProject,wallCables:[...(liveProject.wallCables??[]),...withNames]});
    }catch{}
  // Only migrate when opening a wall; never replace data during normal editing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[workspaceScope]);
  const saveCables=(next:CableRecord[])=>{
    setCables(next);
    if(liveProject && onProjectChange && liveAreaId && liveWall){
      const other=(liveProject.wallCables??[]).filter(c=>!(c.areaId===liveAreaId&&c.wall===liveWall));
      onProjectChange({...liveProject,wallCables:[...other,...next.map(c=>({...c,areaId:liveAreaId,wall:liveWall}))]});
    }
  };
  const startCable=(id:string)=>{
    setCableSource(id);setSelectedCableId(null);setWireMode(true);
    setSelectedDevice(devices.find(d=>d.id===id)||null);
  };
  const finishCable=(id:string)=>{
    if(!cableSource || cableSource===id)return;
    const fromDevice=devices.find(d=>d.id===cableSource),toDevice=devices.find(d=>d.id===id);
    const cable:CableRecord={id:crypto.randomUUID(),from:cableSource,to:id,type:cableType,
      fromName:fromDevice?.name??"Panel P1",toName:toDevice?.name,fromSymbol:fromDevice?.symbol,toSymbol:toDevice?.symbol,
      areaId:liveAreaId,wall:liveWall,breakerSlot:cableSource===PANEL_SOURCE_ID?homeRunBreaker:undefined,
      ends:{from:{},to:{}}};
    saveCables([...cables,cable]);
    setSelectedCableId(cable.id);setCableSource(null);setWireMode(false);
    setSelectedDevice(devices.find(d=>d.id===id)||null);
  };
  useEffect(()=>{
    if(cableSource || !selectedDevice)return;
    const connected=cables.find(c=>c.to===selectedDevice.id||c.from===selectedDevice.id);
    if(connected)setSelectedCableId(connected.id);
  },[selectedDevice?.id,cables,cableSource]);
  const selectedCable=cables.find(c=>c.id===selectedCableId);
  // Update 68: bounded, wall-local editing history. Save before destructive edits.
  type WallSnapshot = { devices: ElectricalDevice[]; cables: CableRecord[]; connections: Connection[]; wires: Wire[]; heights: Record<string,number>; nailed: Record<string,boolean>; studs: Record<string,number>; confirmed: Record<string,boolean> };
  const undoStack = useRef<WallSnapshot[]>([]);
  const redoStack = useRef<WallSnapshot[]>([]);
  const [historyRevision,setHistoryRevision] = useState(0);
  const snapshot = ():WallSnapshot => ({devices:structuredClone(devices),cables:structuredClone(cables),connections:structuredClone(connections),wires:structuredClone(wires),heights:{...mountingHeights},nailed:{...nailedDevices},studs:{...deviceStuds},confirmed:{...heightConfirmed}});
  const checkpoint = () => {undoStack.current.push(snapshot());if(undoStack.current.length>40)undoStack.current.shift();redoStack.current=[];setHistoryRevision(v=>v+1);};
  const restore = (s:WallSnapshot) => {setDevices(s.devices);saveCables(s.cables);setConnections(s.connections);setWires(s.wires);setMountingHeights(s.heights);setNailedDevices(s.nailed);setDeviceStuds(s.studs);setHeightConfirmed(s.confirmed);setSelectedDevice(null);setSelectedCableId(null);setDragging(null);setHistoryRevision(v=>v+1);};
  const undoEdit = () => {const prev=undoStack.current.pop();if(!prev)return;redoStack.current.push(snapshot());restore(prev);};
  const redoEdit = () => {const next=redoStack.current.pop();if(!next)return;undoStack.current.push(snapshot());restore(next);};
  useEffect(()=>{undoStack.current=[];redoStack.current=[];setHistoryRevision(v=>v+1);},[workspaceScope]);
  void historyRevision;

  const [selectedStud, setSelectedStud] = useState<number|null>(null);
  const [deviceStuds,setDeviceStuds] = useState<Record<string,number>>(() => {
    try { return JSON.parse(localStorage.getItem(`rws-device-studs:${workspaceScope}`) || "{}"); } catch {return {};}
  });
  const [heightConfirmed,setHeightConfirmed] = useState<Record<string,boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(`rws-device-height-confirmed:${workspaceScope}`) || "{}"); } catch {return {};}
  });
  useEffect(() => {
    try {
      localStorage.setItem(`rws-device-studs:${workspaceScope}`,JSON.stringify(deviceStuds));
      localStorage.setItem(`rws-device-height-confirmed:${workspaceScope}`,JSON.stringify(heightConfirmed));
    } catch {}
  },[workspaceScope,deviceStuds,heightConfirmed]);
  const [placementMessage,setPlacementMessage] = useState("");
  const [rightPanelTarget,setRightPanelTarget] = useState<HTMLElement|null>(null);
  const [wallControlsOpen,setWallControlsOpen] = useState(true);
  const [deviceInstallationOpen,setDeviceInstallationOpen] = useState(true);
  useEffect(() => {
    const target = document.getElementById("rws-wall-tools-panel-target");
    setRightPanelTarget(target);
    if (!target) return;
    const sync = () => {
      setWallControlsOpen(target.dataset.open !== "false");
      setDeviceInstallationOpen(target.dataset.deviceOpen !== "false");
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(target,{attributes:true,attributeFilter:["data-open","data-device-open","data-revision"]});
    return () => observer.disconnect();
  }, [liveAreaId,liveWall]);
  const nailToStud = (device:ElectricalDevice) => {
    const current = devices.find(d => d.id === device.id) ?? device;
    const stud = Math.max(0, Math.round((current.x + 6) / (studSpacing * 8)));
    if (!heightConfirmed[device.id]) return;
    const pitch = studSpacing * 8;
    const studX = stud * pitch + 13;
    const h = Math.max(0, Math.min(120, (1105 - current.y) / 8));
    checkpoint();
    setDeviceStuds(prev => ({...prev,[device.id]:stud}));
    setMountingHeights(prev => ({...prev,[device.id]:Math.round(h * 10) / 10}));
    setDevices(prev => prev.map(d => d.id === device.id ? {...d,x:studX-6,y:current.y} : d));
    setNailedDevices(prev => ({...prev,[device.id]:true}));
    setDragging(null);
  };
  const [studSpacing, setStudSpacing] = useState(16);
  const [snapToStuds, setSnapToStuds] = useState(true);

  const [
    wireColor
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
    dropY: number = 120,
    mount?: BoxMount
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

      terminals: terminals.map(t=>({...t,name:t.label,type:({LINE:"hot",HOT:"hot",LOAD:"load",NEUTRAL:"neutral",GROUND:"ground",CONTROL:"control"} as const)[t.type]})),

      load: {
        watts:
          definition.electrical?.watts ?? 0
      },

      voltage:
        (
          definition.electrical?.voltage ?? 120
        ) as Voltage,

      x: dropX,

      y:
        dropY,

      tripped:
        false

    };


    setDevices(prev => [...prev, device]);
    if (mount) setBoxMounts(prev => ({...prev, [device.id]: mount}));
    const pitch = studSpacing * 8;
    const stud = Math.round((dropX + 6 - 13) / pitch);
    setDeviceStuds(prev => ({...prev,[device.id]:stud}));
    setSelectedStud(stud);
    setHeightConfirmed(prev => ({...prev,[device.id]:false}));
    setSelectedDevice(device);
    onSelectDevice?.(device);


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

      addBox: installEmptyBox,

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

    if (!dragging || nailedDevices[dragging]) {
      if (dragging && nailedDevices[dragging]) setDragging(null);
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


    const boxType = e.dataTransfer.getData("novaEmptyBox");
    if (boxType) {
      const bounds = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - bounds.left + e.currentTarget.scrollLeft;
      const y = e.clientY - bounds.top + e.currentTarget.scrollTop;
      const pitch = studSpacing * 8;
      const nearest = Math.max(0, Math.round((x - 13) / pitch));
      const studX = nearest * pitch + 13;
      if (Math.abs(x - studX) > 26) {
        setPlacementMessage("Drop the electrical box directly on a stud, just like a device.");
        return;
      }
      const gangs = Math.max(1, Math.min(6, Number(boxType.match(/(\d+)-gang/i)?.[1] || 1)));
      const id = `box-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
      setWallBoxes(prev => [...prev, { id, kind: boxType, gangs, x: studX - 6, y: Math.max(30, Math.min(1100, y)) }]);
      setSelectedBoxId(id);
      setSelectedDevice(null);
      setSelectedStud(nearest);
      setPlacementMessage("");
      return;
    }

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


    const pitch=studSpacing*8;
    const nearest=Math.round((x-13)/pitch);
    const studX=nearest*pitch+13;
    if(Math.abs(x-studX)>26) {
      setPlacementMessage("Drop the component directly on a stud to place it.");
      return;
    }
    setPlacementMessage("");
    createDevice(componentName,studX-6,y);

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div>

      {rightPanelTarget && createPortal(
        <div className="nova-wall-controls" style={{color:"#d9edf5",fontSize:22}}>
          <details open={wallControlsOpen} onToggle={e=>setWallControlsOpen(e.currentTarget.open)} className="nova-panel-section">
            <summary>Wall View &amp; Tools</summary>
            <div id="rws-wall-location-content" />
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
              <button type="button" aria-pressed={!blueprintMode} onClick={()=>setBlueprintMode(false)}>Framed Wall</button>
              <button type="button" aria-pressed={blueprintMode} onClick={()=>setBlueprintMode(true)}>Blueprint Mode</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,paddingTop:8}}>
        <div style={{fontSize:11,color:"#b9dce9"}}>The old terminal-to-terminal Wire Tool has been replaced. Click the single gray dot on a device to start a cable.</div>
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
          </details>
          <details open={deviceInstallationOpen} onToggle={e=>setDeviceInstallationOpen(e.currentTarget.open)} className="nova-panel-section">
            <summary>Device Installation</summary>
            <div className="nova-wall-tools-combined">
            <div style={{display:"flex",flexDirection:"column",gap:8,paddingTop:8}}>
              <div>Selected: {selectedWallBox ? selectedWallBox.kind : selectedDevice ? selectedDevice.name || selectedDevice.type : "Drag a component or box onto a stud"}</div>
              {selectedWallBox && <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",padding:"6px 8px",border:"1px solid #7a9aab",borderRadius:6,background:"#f5f8fa",color:"#172b36",fontSize:12}}>
                <strong>{selectedWallBox.kind}</strong>
                <span>Stud #{Math.max(1,Math.round((selectedWallBox.x+6-13)/(studSpacing*8))+1)}</span>
                <label>Height (in)
                  <input aria-label="Electrical box mounting height in inches" type="number" min="0" max="120" step="0.5"
                    value={boxHeightInches(selectedWallBox.y)}
                    onChange={e=>{const height=Number(e.target.value);if(e.target.value!=="" && Number.isFinite(height) && height>=0 && height<=120) setWallBoxes(prev=>prev.map(b=>b.id===selectedWallBox.id?{...b,y:Math.max(30,Math.min(1100,1105-height*8))}:b));}}
                    style={{width:65,marginLeft:4}} />
                </label>
                <button type="button" onClick={()=>{if(Object.values(boxMounts).some(m=>m.boxId===selectedWallBox.id)){setPlacementMessage("Remove installed devices before deleting this box.");return;}setWallBoxes(prev=>prev.filter(b=>b.id!==selectedWallBox.id));setSelectedBoxId(null);}}>Remove Box</button>
              </div>}
              {placementMessage && <div role="status" style={{color:"#ffd3a3"}}>{placementMessage}</div>}
              {selectedDevice && <div style={{color:"#8fe9ff"}}>Drop stud: {deviceStuds[selectedDevice.id]===undefined?"not assigned":`#${deviceStuds[selectedDevice.id]+1}`} · {nailedDevices[selectedDevice.id]?"Installed":heightConfirmed[selectedDevice.id]?"Ready to hammer":"Enter height to enable hammer"}</div>}
                      <span title="Click a stud on the wall to highlight it before installing a device"
          style={{fontSize:12,color:"#10394e",background:"#d8f5ff",padding:6,borderRadius:4}}>
          {selectedDevice && deviceStuds[selectedDevice.id]!==undefined?`Stud #${deviceStuds[selectedDevice.id]+1} (drop location)`:selectedStud===null?"Drop component onto a stud":`Stud #${selectedStud+1} highlighted`}
        </span>

                      {selectedDevice && (
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",border:"1px solid #7a9aab",borderRadius:6,background:"#f5f8fa",color:"#172b36",fontSize:12}}>
            <strong>{selectedDevice.name || selectedDevice.type}</strong>
            <label>Height (in)
              <input aria-label="Device mounting height in inches" type="number" min="0" max="120" step="1"
                value={mountingHeights[selectedDevice.id] ?? ""} placeholder="Enter height"
                onChange={e=>{
                  const valid=e.target.value.trim()!=="" && Number.isFinite(Number(e.target.value)) && Number(e.target.value)>=0 && Number(e.target.value)<=120;
                  if(!valid) {
                    setHeightConfirmed(prev=>({...prev,[selectedDevice.id]:false}));
                    setMountingHeights(prev=>{const next={...prev};delete next[selectedDevice.id];return next;});
                    return;
                  }
                  const h=Number(e.target.value);
                  setHeightConfirmed(prev=>({...prev,[selectedDevice.id]:true}));
                  const id=selectedDevice.id;
                  setMountingHeights(prev=>({...prev,[id]:h}));
                  setDevices(prev=>prev.map(d=>d.id===id?{...d,y:heightToY(h)}:d));
                }}
                style={{width:58,marginLeft:4}} />
            </label>
            <span>{nailedDevices[selectedDevice.id] ? "🔨 Fastened" : "Not fastened"}</span>
          </div>
        )}

              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button type="button" disabled={!undoStack.current.length} onClick={undoEdit}>↶ Undo</button>
                <button type="button" disabled={!redoStack.current.length} onClick={redoEdit}>↷ Redo</button>
                <span style={{fontSize:12,color:"#b8dbe9"}}>History: up to 40 edits · current wall</span>
              </div>
              {selectedDevice && <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button type="button" title="Install the selected device on the highlighted stud at its chosen height"
                  disabled={!!nailedDevices[selectedDevice.id] || deviceStuds[selectedDevice.id]===undefined || !heightConfirmed[selectedDevice.id]}
                  onClick={()=>nailToStud(selectedDevice)}>🔨 Hammer · Install</button>
                <button type="button" disabled={!nailedDevices[selectedDevice.id]}
                  title="Remove fastener; preserve device and its wiring, then drag it to reposition"
                  onClick={()=>{checkpoint();setNailedDevices(prev=>({...prev,[selectedDevice.id]:false}));setPlacementMessage("Fastener removed. Drag device to another stud, then hammer to install.");}}>🪛 Crowbar · Unnail / Reposition</button>
                <button type="button" title="Permanently delete the selected component and attached wiring"
                                  onClick={e=>{
                  e.stopPropagation();
                  const attached=connections.some(c=>c.from.deviceId===selectedDevice.id||c.to.deviceId===selectedDevice.id)||
                    wires.some(w=>w.from.deviceId===selectedDevice.id||w.to.deviceId===selectedDevice.id);
                  if(!window.confirm(`Remove ${selectedDevice.name||selectedDevice.type} from this wall${attached?" and delete its connected wires":""}?`))return;
                  checkpoint();
                  setDevices(prev=>prev.filter(d=>d.id!==selectedDevice.id));
                  setBoxMounts(prev=>{const next={...prev};delete next[selectedDevice.id];return next;});
                  saveCables(cables.filter(c=>c.from!==selectedDevice.id&&c.to!==selectedDevice.id));
                  setConnections(prev=>prev.filter(c=>c.from.deviceId!==selectedDevice.id&&c.to.deviceId!==selectedDevice.id));
                  setWires(prev=>prev.filter(w=>w.from.deviceId!==selectedDevice.id&&w.to.deviceId!==selectedDevice.id));
                  setMountingHeights(prev=>{const n={...prev};delete n[selectedDevice.id];return n;});
                  setNailedDevices(prev=>{const n={...prev};delete n[selectedDevice.id];return n;});
                  setDeviceStuds(prev=>{const n={...prev};delete n[selectedDevice.id];return n;});
                  setHeightConfirmed(prev=>{const n={...prev};delete n[selectedDevice.id];return n;});
                  setSelectedDevice(null);onSelectDevice?.(null);
                }}

                  >🗑 Delete Component</button>
              </div>}
            </div>
            </div>
          </details>
          <details open className="nova-panel-section">
            <summary style={{cursor:"pointer",fontWeight:700,color:"#8ee7ff"}}>New Wire Tool · Cable Wiring</summary>
            <div style={{paddingTop:8,display:"flex",flexDirection:"column",gap:8}}>
              <div>Click a device's connection dot, or start a home run from Panel P1.</div>
              {!cableSource && <label>Home-run breaker
                <select value={homeRunBreaker} onChange={e=>setHomeRunBreaker(Number(e.target.value))}
                  style={{display:"block",width:"100%",fontSize:18,padding:7}}>
                  {(liveProject?.distributionPanel?.breakers??[]).filter(s=>s.breaker).map(s=><option key={s.slot} value={s.slot}>Breaker #{s.slot} · {s.breaker?.amperage}A</option>)}
                  {!(liveProject?.distributionPanel?.breakers??[]).some(s=>s.breaker)&&<option value={1}>#1 (not installed)</option>}
                </select>
              </label>}
              {!cableSource && <button type="button" onClick={()=>{setCableSource(PANEL_SOURCE_ID);setSelectedCableId(null);setWireMode(true);}}
                style={{padding:8,background:"#145774",color:"white",border:"1px solid #389bc1",borderRadius:5}}>
                + Start Home Run from Panel P1
              </button>}
              {cableSource && <>
                <div style={{color:"#8fe9ff"}}>Starting device: {cableSource===PANEL_SOURCE_ID?"Panel P1":devices.find(d=>d.id===cableSource)?.name}</div>
                <label>Cable type
                  <select aria-label="Cable type" value={cableType} onChange={e=>setCableType(e.target.value as CableKind)}
                    style={{width:"100%",padding:8,background:"#173d50",color:"white"}}>
                    {cableKinds.map(kind=><option key={kind} value={kind}>{kind}</option>)}
                  </select>
                </label>
                <div>Now click the destination device on the wall.</div>
                <button type="button" onClick={()=>{setCableSource(null);setWireMode(false)}}>Cancel cable</button>
              </>}
              {cables.length>0 && <label>Installed cables
                <select aria-label="Choose cable" value={selectedCableId??""} onChange={e=>setSelectedCableId(e.target.value||null)}
                  style={{width:"100%",padding:8,background:"#173d50",color:"white"}}>
                  <option value="">Select cable to wire</option>
                  {cables.map(c=><option key={c.id} value={c.id}>{c.type} · {c.from===PANEL_SOURCE_ID?"Panel P1":devices.find(d=>d.id===c.from)?.name||"Missing"} → {devices.find(d=>d.id===c.to)?.name||"Missing"}</option>)}
                </select>
              </label>}
              {selectedCable && <div style={{display:"flex",flexDirection:"column",gap:6,border:"1px solid #376c85",padding:8,borderRadius:6}}>
                <strong>Reposition / reroute cable endpoints</strong>
                <span style={{fontSize:12}}>Changing an endpoint clears that end’s terminal assignments and cable splices to prevent stale connections.</span>
                {(["from","to"] as const).map(end=><label key={end}>{end==="from"?"Cable start":"Cable destination"}
                  <select value={selectedCable[end]} onChange={e=>{
                    const target=e.target.value;if(target===selectedCable[end]||target===selectedCable[end==="from"?"to":"from"])return;
                    checkpoint();const next:CableRecord={...selectedCable,[end]:target,ends:{...selectedCable.ends,[end]:{}},splices:[]};
                    saveCables(cables.map(c=>c.id===next.id?next:c));
                  }} style={{display:"block",width:"100%",padding:6}}>
                    {end==="from"&&<option value={PANEL_SOURCE_ID}>Panel P1</option>}
                    {devices.map(d=><option key={d.id} value={d.id}>{d.name||d.type}</option>)}
                  </select>
                </label>)}
              </div>}
              {selectedCable && <div style={{padding:"9px 11px",background:"#123d50",border:"1px solid #327d97",borderRadius:6,fontSize:16}}>
                <strong>Selected cable · {selectedCable.type}</strong>
                <div>Panel/start: {Object.values(selectedCable.ends?.from??{}).filter(Boolean).length}/{selectedCable.type.includes("/3")?4:3} conductors assigned</div>
                <div>Device/end: {Object.values(selectedCable.ends?.to??{}).filter(Boolean).length}/{selectedCable.type.includes("/3")?4:3} conductors assigned</div>
                <div style={{color:"#a9d9ea"}}>Connections are saved per cable end and shared with Panel P1.</div>
              </div>}
              {selectedCable && <CableWiringPanel key={selectedCable.id} initialEnd="to" cable={selectedCable} devices={devices}
                sharedView={wiringFaces[selectedCable[inspectedCableEnd]]??"front"} onSharedViewChange={face=>updateWiringFace(selectedCable[inspectedCableEnd],face)} onActiveEndChange={end=>{setInspectedCableEnd(end);const id=selectedCable[end];const target=devices.find(d=>d.id===id);if(target){setSelectedDevice(target);onSelectDevice?.(target);}}}
                allCables={cables} onChangeCables={saveCables}
                onChange={next=>saveCables(cables.map(c=>c.id===next.id?next:c))}
                onRemove={()=>{
                  if(!window.confirm("Remove this cable and its conductor terminations?"))return;
                  checkpoint();saveCables(cables.filter(c=>c.id!==selectedCable.id));setSelectedCableId(null);
                }}/>}
            </div>
            <div id="rws-device-inspector-content" />
          </details>

        </div>,
        rightPanelTarget
      )}

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
          setSelectedBoxId(null);

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

        onMouseMove={e => {
          if (movingBoxId && (e.buttons & 1)) {
            const r=e.currentTarget.getBoundingClientRect();
            const x=Math.max(0,Math.min(2000-70,e.clientX-r.left+e.currentTarget.scrollLeft-25));
            const y=Math.max(30,Math.min(1100,e.clientY-r.top+e.currentTarget.scrollTop-35));
            setWallBoxes(prev=>prev.map(b=>b.id===movingBoxId?{...b,x,y}:b));
            return;
          }
          moveBoard(e);
        }}

        onMouseLeave={() => setMovingBoxId(null)}
        onMouseUp={() => {
          if (movingBoxId) {
            const pitch = studSpacing * 8;
            setWallBoxes(prev=>prev.map(b=>b.id===movingBoxId?{...b,x:Math.max(0,Math.round((b.x+6-13)/pitch)*pitch+13-6)}:b));
          }
          setMovingBoxId(null);
          if (dragging) {
            const moved = devices.find(d => d.id === dragging);
            if (moved) {
              const stud = Math.max(0, Math.round((moved.x + 6) / (studSpacing * 8)));
              setDeviceStuds(prev => ({...prev,[dragging]:stud}));
              setMountingHeights(prev => ({...prev,[dragging]:Math.round(Math.max(0,Math.min(120,(1105-moved.y)/8))*10)/10}));
            }
          }
          setDragging(null);
        }}

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
            backgroundImage: blueprintMode ? "linear-gradient(#376a8d55 1px,transparent 1px),linear-gradient(90deg,#376a8d55 1px,transparent 1px)" : "linear-gradient(90deg,transparent 0px,transparent 5px,#bd8d57 5px,#bd8d57 21px,#80552d 22px,#80552d 24px,transparent 24px),linear-gradient(0deg,transparent 0px,transparent 1150px,#ae7b45 1150px,#ae7b45 1180px,transparent 1180px)",
            backgroundSize: blueprintMode ? "40px 40px,40px 40px" : `${studSpacing * 8}px 1200px,2000px 1200px`,
            backgroundRepeat: "repeat-x,no-repeat",
            backgroundColor: blueprintMode ? "#102c48" : "#d6d2c8"
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


          {/* Physical cables between device boxes; conductor terminations are edited in the right panel. */}
          <svg viewBox="0 0 2000 1200" width="2000" height="1200"
            style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:5}}>
            {cables.map(c=>{
              const a=devices.find(d=>d.id===c.from),b=devices.find(d=>d.id===c.to);
              if((!a&&c.from!==PANEL_SOURCE_ID)||!b)return null;
              // Match the actual CompactWiredDevice drawing (150x126 scaled 1.6)
              // centered in the 250x208 wall preview, inside the 260x228 device.
              // Sorting must agree with the preview so home runs enter the same port.
              const entry=(device:ElectricalDevice)=>{
                const attached=cables.filter(w=>w.from===device.id||w.to===device.id)
                  .sort((a,b)=>Number(b.from===PANEL_SOURCE_ID)-Number(a.from===PANEL_SOURCE_ID));
                const index=Math.max(0,attached.findIndex(w=>w.id===c.id));
                return {x:device.x+130+(23+Math.min(index,2)*23-75)*1.6,
                  y:device.y+114+(17-63)*1.6};
              };
              const start=a?entry(a):{x:26,y:0};
              const end=entry(b);
              const x1=start.x,y1=start.y,x2=end.x,y2=end.y;
              const middle=c.from===PANEL_SOURCE_ID?Math.max(24,y2-115):Math.max(22,Math.min(y1,y2)-90);
              const d=`M ${x1} ${y1} L ${x1} ${middle} L ${x2} ${middle} L ${x2} ${y2}`;
              const homeRun=c.from===PANEL_SOURCE_ID;
              return <g key={c.id}>
                <path d={d} fill="none" stroke={homeRun?"#000000":"#6c7b84"} strokeWidth="17" strokeLinejoin="round"/>
                <path d={d} fill="none" stroke={homeRun?"#191b20":c.type.includes("MC")?"#a5afb7":"#f4f0e6"} strokeWidth="12" strokeLinejoin="round"
                  strokeDasharray={c.type.includes("MC")?"8 3":undefined}/>
              </g>;
            })}
          </svg>
          {/* Select a stud before installation. */}
          {!blueprintMode && Array.from({length:Math.ceil(2000/(studSpacing*8))},(_,index)=>{
            const x=index*studSpacing*8+13;
            return <button key={`stud-${index}`} type="button"
              title={`Stud ${index+1} • ${Math.round(index*studSpacing*10)/10}" from left • click to select`}
              aria-label={`Select stud ${index+1}`}
              onMouseDown={e=>e.stopPropagation()}
              onClick={e=>{e.stopPropagation();setSelectedStud(index);}}
              style={{position:"absolute",left:x-12,top:110,width:25,height:1030,
                border:selectedStud===index?"3px solid #20d8ff":"1px solid transparent",
                background:selectedStud===index?"rgba(17,212,255,.19)":"transparent",
                cursor:"pointer",zIndex:2,padding:0}}/>;
          })}
          {/* Update 84A: independent empty boxes, deliberately not tied to device geometry. */}
          {!blueprintMode && wallBoxes.map(box => (
            <div key={box.id}
              onDragOver={e => { if (e.dataTransfer.types.includes("componentType")) { e.preventDefault(); e.dataTransfer.dropEffect="copy"; } }}
              onDrop={e => {
                e.preventDefault(); e.stopPropagation();
                const name=e.dataTransfer.getData("componentType");
                if (!name) return;
                const definition=componentCatalog.find(c=>c.name===name);
                if (!definition || !["Receptacle", "GFCI Receptacle", "Single Pole Switch", "Three Way Switch", "Dimmer Switch"].includes(definition.name)) {
                  setPlacementMessage("Choose a wall switch or receptacle for this device box."); return;
                }
                const rect=e.currentTarget.getBoundingClientRect();
                const gang=Math.min(box.gangs-1,Math.max(0,Math.floor((e.clientX-rect.left)/rect.width*box.gangs)));
                if (Object.values(boxMounts).some(m=>m.boxId===box.id && m.gang===gang)) {
                  setPlacementMessage(`Gang ${gang+1} is occupied. Drop into an empty position.`); return;
                }
                createDevice(name,box.x+gang*52,box.y,{boxId:box.id,gang});
                setSelectedBoxId(box.id); setMovingBoxId(null); setPlacementMessage("");
              }}
              onMouseDown={e => { e.stopPropagation(); setSelectedDevice(null); setSelectedBoxId(box.id); setMovingBoxId(box.id); }}
              onClick={e => { e.stopPropagation(); setSelectedBoxId(box.id); }}
              title={`${box.kind} • drag a switch or receptacle into an empty gang`}
              style={{ position:"absolute", left:box.x, top:box.y,
                width:boxWidth(box.gangs), height:96, boxSizing:"border-box", zIndex:5,
                border:selectedBoxId===box.id?"3px solid #24ff57":"3px solid #356b87",
                borderRadius:7, background:"#8199a6e8", cursor:"move",
                boxShadow:"inset 0 0 0 5px #b9c8ce, 0 3px 10px #0004", display:"flex", alignItems:"center", padding:7, gap:4 }}>
              {Array.from({length:box.gangs},(_,i)=>{
                const mounted=devices.find(d=>boxMounts[d.id]?.boxId===box.id && boxMounts[d.id]?.gang===i);
                const symbol=mounted?.symbol || "";
                const receptacle=mounted?.name==="Receptacle"||mounted?.name==="GFCI Receptacle";
                return <div key={i} onMouseDown={e=>{
                    if(!mounted)return;
                    e.stopPropagation();setMovingBoxId(null);setSelectedBoxId(box.id);setSelectedDevice(mounted);onSelectDevice?.(mounted);
                  }} title={mounted?`${mounted.name} — gang ${i+1}`:`Empty gang ${i+1} — drop a device here`}
                  style={{flex:1,minWidth:0,height:70,border:mounted&&selectedDevice?.id===mounted.id?"2px solid #39ff14":"1px dashed #405b6a",borderRadius:3,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontSize:10,color:"#183444",background:mounted?"#f0eee6":"#b4c4cb",cursor:mounted?"pointer":"default",pointerEvents:"auto"}}>
                  {mounted?<><svg viewBox="0 0 36 52" width="35" height="50" aria-label={mounted.name}>
                    <rect x="3" y="1" width="30" height="50" rx="4" fill="#f7f5ed" stroke="#667780" strokeWidth="2"/>
                    {receptacle?<>{[15,36].map(y=><g key={y}><rect x="11" y={y-5} width="3" height="9" fill="#303638"/><rect x="22" y={y-5} width="3" height="9" fill="#303638"/><circle cx="18" cy={y+6} r="2" fill="#303638"/></g>)}{mounted?.name==="GFCI Receptacle"&&<rect x="14" y="24" width="8" height="4" fill="#d24c43"/>}</>:<><rect x="13" y="13" width="10" height="26" rx="2" fill="#b8b8b0" stroke="#707f85"/><path d="M15 16 L21 13 L21 29 L15 32 Z" fill="white"/></>}
                  </svg></>:<span>+ {i+1}</span>}
                </div>;
              })}
              <span style={{position:"absolute",bottom:"100%",left:0,whiteSpace:"nowrap",fontSize:12,fontWeight:700,background:"#112b43",color:"white",padding:"2px 5px"}}>{box.kind}</span>
              {selectedBoxId===box.id && <button type="button" title="Remove empty box" onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();if(Object.values(boxMounts).some(m=>m.boxId===box.id)){setPlacementMessage("Remove installed devices before deleting this box.");return;}setWallBoxes(prev=>prev.filter(b=>b.id!==box.id));setSelectedBoxId(null);setMovingBoxId(null);}} style={{position:"absolute",right:-13,top:-15,borderRadius:12,background:"#a31f2c",color:"white",border:"1px solid white",cursor:"pointer"}}>×</button>}
            </div>
          ))}
          {/* =================================================
              DEVICES
              ================================================= */}

          {blueprintMode && <svg viewBox="0 0 2000 1200" width="2000" height="1200" style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:9}}>
            {devices.map(d=>{
              const x=d.x+50,y=d.y+55;
              const isLight=/light/i.test(d.type),isSwitch=/switch|dimmer/i.test(d.type);
              return <g key={d.id} transform={`translate(${x} ${y})`}>
                <circle r="24" fill="#102c48" stroke="#f5fbff" strokeWidth="3"/>
                {isLight?<path d="M -15 -15 L 15 15 M 15 -15 L -15 15" stroke="#fff" strokeWidth="3"/>:
                  <text x="0" y="8" fill="#fff" fontSize="23" textAnchor="middle" fontWeight="bold">{isSwitch?"S":"R"}</text>}
                <text x="0" y="46" fill="#fff" fontSize="22" fontWeight="bold" textAnchor="middle">{d.name}</text>
              </g>;
            })}
          </svg>}
          {
            !blueprintMode && devices.filter(d=>!boxMounts[d.id] || wireMode).map(
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
                  wiringCables={cables.filter(c=>c.from===device.id||c.to===device.id)}
                  allWiringCables={cables}
                  wiringFace={wiringFaces[device.id]??"front"}
                  onWiringFaceChange={face=>updateWiringFace(device.id,face)}
                  onWiringTerminate={(cableId,end,conductor,terminal)=>saveCables(cables.map(c=>c.id===cableId?{...c,ends:{...c.ends,[end]:{...c.ends[end],[conductor]:terminal}}}:c))}

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

                  onStartDrag={startDrag}
                  onCableStart={startCable}
                  onCableDestination={finishCable}
                  cableSource={cableSource===device.id}
                />

              )
            )
          }

          {/* Legacy home-run drawing intentionally retired. Old saved data remains untouched.
              All new visible cables and conductor terminations use the unified cable records. */}

        </div>

      </div>

    </div>

  );

});


export default Workspace;