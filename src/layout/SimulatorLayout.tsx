import WholeHouseBlueprint from "../simulator/WholeHouseBlueprint";
import WallCircuitInspector from "../simulator/WallCircuitInspector";
import ElectricalServiceWorkspace from "../simulator/ElectricalServiceWorkspace";

// Residential Wiring Simulator v2.5
// Main simulator layout

import {
  useRef,
  useState
} from "react";

import Workspace from "../simulator/Workspace";
import SimulationPanel from "../simulator/SimulationPanel";
import ComponentLibrary from "../components/ComponentLibrary";
import BreakerPanel from "../components/BreakerPanel";
import PropertiesPanel from "../components/PropertiesPanel";
import Toolbar from "../toolbar/Toolbar";

import type {
  WorkspaceHandle
} from "../simulator/Workspace";

import {
  useSimulator
} from "../simulator/SimulatorContext";

import {
  createBreakerPanel,
  installBreaker
} from "../electrical/breakerPanel";

import {
  createBreaker
} from "../electrical/breaker";

import type {
  BreakerPanel as BreakerPanelType
} from "../electrical/breakerPanel";

import type {
  BreakerConfiguration
} from "../components/BreakerPanel";

import type {
  ElectricalDevice
} from "../electrical/types";


import ServiceSetup from "../simulator/ServiceSetup";
import RoomLayout, { type WallSide } from "../simulator/RoomLayout";
import ServiceOverview from "../simulator/ServiceOverview";
import { loadServiceProject, saveServiceProject, clearServiceProject, createServiceProject, type ServiceProject } from "../simulator/projectWorkflow";

export default function SimulatorLayout() {

  const [project, setProject] = useState<ServiceProject | null>(() => loadServiceProject());
  const [showService, setShowService] = useState(true);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [showElectricalService, setShowElectricalService] = useState(false);
  const [activeWall, setActiveWall] = useState<WallSide | null>(null);
  const [configureService, setConfigureService] = useState(false);
  function changeProject(next: ServiceProject) { setProject(next); saveServiceProject(next); }
  function addArea(buildingId: string) {
    const name = window.prompt("Room or area name (e.g. Bedroom 1):");
    if (!name?.trim() || !project) return;
    const area = { id: crypto.randomUUID(), name: name.trim(), buildingId, kind: "ROOM" as const };
    changeProject({ ...project, areas: [...project.areas, area], activeAreaId: area.id });
    setActiveWall(null);
    setWorkspaceScope(`${project.id}:${area.id}:OVERVIEW`);
    setShowBlueprint(false); setShowService(false);
  }
  function addBuilding() {
    const name = window.prompt("Detached building name (e.g. Workshop):");
    if (!name?.trim() || !project) return;
    changeProject({ ...project, buildings: [...project.buildings, { id: crypto.randomUUID(), name: name.trim(), kind: "DETACHED" }] });
  }

  const workspaceRef =
    useRef<WorkspaceHandle>(null);

  const resizing =
    useRef(false);

  const componentResizing =
    useRef(false);


  const {
    devices,
    setDevices,
    connections,
    setConnections,
    selectedDevice,
    setSelectedDevice,
    workspaceScope, setWorkspaceScope, clearWorkspaceScopes
  } = useSimulator();


  const [
    propertiesWidth,
    setPropertiesWidth
  ] = useState(400);


  const [
    componentWidth,
    setComponentWidth
  ] = useState(220);


  const [
    circuitPaths,
    setCircuitPaths
  ] = useState<string[][]>([]);


  const [
    circuitStatus,
    setCircuitStatus
  ] = useState<
    "READY" | "WARNING" | "FAULT"
  >("READY");


  // ---------------------------------
  // FIND ALL PANELS
  // ---------------------------------

  const panelDevices =
    devices.filter(
      device =>
        device.type === "Breaker Panel" ||
        device.type === "Sub Panel"
    );


  // ---------------------------------
  // SELECTED PANEL
  // ---------------------------------

  const selectedPanelDevice =
    selectedDevice &&
    (
      selectedDevice.type === "Breaker Panel" ||
      selectedDevice.type === "Sub Panel"
    )
      ? selectedDevice
      : null;


  /*
   * IMPORTANT:
   *
   * There is intentionally NO fallback here.
   *
   * If the user has not selected a panel,
   * activePanelDevice is null.
   *
   * This prevents the old fake/default
   * 200A panel from appearing.
   */

  const activePanelDevice =
    selectedPanelDevice;


  // ---------------------------------
  // GET PANEL MODEL
  // ---------------------------------

  function getPanelModel(
    device: ElectricalDevice | null
  ): BreakerPanelType | null {

    if (!device) {
      return null;
    }


    /*
     * If the device already owns a panel
     * model, use that exact model.
     *
     * This is what keeps the 100A and 200A
     * panels independent.
     */

    if (device.panel) {
      return device.panel;
    }


    /*
     * Older panel devices may not have a
     * panel model yet.
     *
     * Create one specifically for this
     * device.
     */

    return createBreakerPanel(
      device.id,
      device.name,
      device.mainBreaker ?? 200,
      12
    );

  }


  // ---------------------------------
  // ACTIVE PANEL
  // ---------------------------------

  const activePanel =
    getPanelModel(
      activePanelDevice
    );


  // ---------------------------------
  // UPDATE DEVICE
  // ---------------------------------

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

  }


  // ---------------------------------
  // SAVE PANEL BACK TO DEVICE
  // ---------------------------------

  function updatePanel(
    updatedPanel: BreakerPanelType
  ) {

    if (!activePanelDevice) {
      return;
    }


    const updatedDevice: ElectricalDevice = {

      ...activePanelDevice,

      panel: updatedPanel,

      mainBreaker:
        updatedPanel.mainBreaker

    };


    updateDevice(
      updatedDevice
    );


    setSelectedDevice(
      updatedDevice
    );


    workspaceRef.current?.updateDevice(
      updatedDevice
    );

  }


  // ---------------------------------
  // INSTALL BREAKER
  // ---------------------------------

  function handleInstallBreaker(
    config: BreakerConfiguration
  ) {

    /*
     * Never install a breaker if there
     * is no active panel.
     */

    if (
      !activePanelDevice ||
      !activePanel
    ) {
      return;
    }


    /*
     * Include the panel ID in the breaker ID.
     *
     * This prevents:
     *
     * panel-100 / slot-1
     *
     * and
     *
     * panel-200 / slot-1
     *
     * from becoming the same breaker.
     */

    const breaker =
      createBreaker(

        `breaker-${activePanelDevice.id}-${config.slot}`,

        config.slot,

        config.amperage,

        config.poles,

        config.breakerType

      );


    const updatedPanel =
      installBreaker(

        activePanel,

        breaker

      );


    updatePanel(
      updatedPanel
    );

  }


  // ---------------------------------
  // SELECT PANEL
  // ---------------------------------

  function selectPanel(
    deviceId: string
  ) {

    const device =
      devices.find(
        item =>
          item.id === deviceId
      );


    if (!device) {
      return;
    }


    if (
      device.type !== "Breaker Panel" &&
      device.type !== "Sub Panel"
    ) {
      return;
    }


    setSelectedDevice(
      device
    );


    /*
     * Reset the visual breaker status
     * when changing panels.
     */

    setCircuitStatus(
      "READY"
    );

  }


  // ---------------------------------
  // REFRESH SIMULATION
  // ---------------------------------

  function refreshSimulation() {

    const currentConnections =
      workspaceRef.current?.getConnections()
      ?? [];


    setConnections(
      currentConnections
    );

  }


  // ---------------------------------
  // RESET BREAKER
  // ---------------------------------

  function resetBreaker() {

    setCircuitStatus(
      "READY"
    );

  }


  // ---------------------------------
  // RESIZE RIGHT PANEL
  // ---------------------------------

  function startResize(
    e: React.MouseEvent
  ) {

    e.preventDefault();

    resizing.current =
      true;


    const startX =
      e.clientX;


    const startWidth =
      propertiesWidth;


    const handleMouseMove =
      (event: MouseEvent) => {

        if (
          !resizing.current
        ) {
          return;
        }


        const width =
          startWidth +
          (startX - event.clientX);


        if (
          width >= 260 &&
          width <= 700
        ) {

          setPropertiesWidth(
            width
          );

        }

      };


    const stopResize = () => {

      resizing.current =
        false;


      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );


      window.removeEventListener(
        "mouseup",
        stopResize
      );

    };


    window.addEventListener(
      "mousemove",
      handleMouseMove
    );


    window.addEventListener(
      "mouseup",
      stopResize
    );

  }


  // ---------------------------------
  // RESIZE COMPONENT LIBRARY
  // ---------------------------------

  function startComponentResize(
    e: React.MouseEvent
  ) {

    e.preventDefault();

    componentResizing.current =
      true;


    const startX =
      e.clientX;


    const startWidth =
      componentWidth;


    const handleMouseMove =
      (event: MouseEvent) => {

        if (
          !componentResizing.current
        ) {
          return;
        }


        const width =
          startWidth +
          (
            event.clientX -
            startX
          );


        if (
          width >= 160 &&
          width <= 500
        ) {

          setComponentWidth(
            width
          );

        }

      };


    const stopResize = () => {

      componentResizing.current =
        false;


      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );


      window.removeEventListener(
        "mouseup",
        stopResize
      );

    };


    window.addEventListener(
      "mousemove",
      handleMouseMove
    );


    window.addEventListener(
      "mouseup",
      stopResize
    );

  }


  // ---------------------------------
  // RENDER
  // ---------------------------------

  return (
    <>
    {!project && (configureService ? <ServiceSetup onCreate={next => { changeProject(next); setConfigureService(false); setShowService(true); setWorkspaceScope("SERVICE"); }} /> :
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "#0b1420", display: "grid", placeItems: "center", color: "white" }}>
        <div style={{ maxWidth: 520, padding: 36, border: "1px solid #267e9c", borderRadius: 14, background: "#142332", textAlign: "center" }}>
          <h1 style={{ color: "#65e2fa" }}>⚡ Residential Wiring Simulator</h1>
          <p>Start with your project, then build rooms and framed walls. Service settings can be edited separately.</p>
          <button onClick={() => { changeProject(createServiceProject("My Residential Project", "UNDERGROUND", 200, "SEPARATE")); setShowService(false); }} style={{ padding: 14, width: "100%", background: "#087eaa", marginBottom: 10 }}>Create Project — Default 200A Underground</button>
          <button onClick={() => setConfigureService(true)} style={{ padding: 12, width: "100%" }}>Configure Service First (Optional)</button>
        </div>
      </div>)}
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#202124",
        color: "white",
        overflow: "hidden"
      }}
    >

      <Toolbar
        circuitStatus={
          circuitStatus
        }
        onResetBreaker={
          resetBreaker
        }
      />


      <div
        style={{
          flex: 1,
          display: "flex",
          minHeight: 0,
          overflow: "hidden"
        }}
      >

        {project && <aside style={{ width: 205, flexShrink: 0, background: "#101a25", padding: 10, overflowY: "auto", borderRight: "1px solid #29627b", fontSize: 13 }}>
          <strong style={{ color: "#72dcff" }}>PROJECT EXPLORER</strong>
          <div style={{ margin: "8px 0", overflowWrap: "anywhere" }}>{project.name}</div>
          <button onClick={() => { setShowBlueprint(true); setShowService(false); setShowElectricalService(false); setActiveWall(null); setWorkspaceScope("BLUEPRINT"); }} style={{width:"100%",margin:"6px 0 12px",padding:10,background:showBlueprint?"#087f9f":"#24475a",border:"1px solid #3585a2",color:"white",borderRadius:5,fontWeight:700,textAlign:"left"}}>▦ Whole-House Blueprint</button>
          <div style={{borderTop:"1px solid #2c4553",paddingTop:8,marginBottom:12}}>
            <strong style={{color:"#72dcff"}}>⚡ Electrical Service</strong>
            <button onClick={() => { setShowBlueprint(false); setShowElectricalService(true); setShowService(true); setWorkspaceScope("SERVICE_SETUP"); setActiveWall(null); }} style={{width:"100%",marginTop:7,marginBottom:5,background:showElectricalService?"#146d8d":"#243c4b",textAlign:"left"}}>▸ Service Setup & Simulation</button>
            <button onClick={() => { setShowBlueprint(false); setShowElectricalService(false); setShowService(true); setWorkspaceScope("SERVICE"); setActiveWall(null); }} style={{ width: "100%", marginTop: 7, marginBottom: 5, background: showService&&!showElectricalService ? "#146d8d" : "#243c4b", textAlign:"left" }}>▸ Main Distribution Panel</button>
            <div style={{fontSize:11,color:"#a4c8d8",paddingLeft:6}}>{project.service.route === "UNDERGROUND" ? "Underground" : "Overhead"} · {project.service.amperage}A</div>
            <div style={{fontSize:11,color:"#a4c8d8",paddingLeft:6}}>Distribution main: {project.distributionMain?.installed ? `${project.distributionMain.amperage}A` : "Main lugs"}</div>
          </div>
          {project.buildings.map(building => <div key={building.id} style={{ marginBottom: 12, borderTop: "1px solid #2c4553", paddingTop: 8 }}>
            <strong>{building.kind === "MAIN" ? "🏠" : "🏗"} {building.name}</strong>
            {building.kind === "DETACHED" && <div style={{ color: "#f1b96e", fontSize: 11 }}>Subpanel / feeder: not yet configured</div>}
            {project.areas.filter(area => area.buildingId === building.id).map(area => <button key={area.id} onClick={() => { changeProject({ ...project, activeAreaId: area.id }); setWorkspaceScope(`${project.id}:${area.id}:OVERVIEW`); setActiveWall(null); setShowBlueprint(false); setShowService(false); setShowElectricalService(false); }} style={{ display: "block", width: "100%", marginTop: 5, textAlign: "left", background: !showService && project.activeAreaId === area.id ? "#146d8d" : "#243442" }}>▸ {area.name}</button>)}
            <button onClick={() => addArea(building.id)} style={{ marginTop: 6, width: "100%" }}>+ Add Room / Area</button>
          </div>)}
          <button onClick={addBuilding} style={{ width: "100%" }}>+ Detached Building</button>
          <button onClick={() => { if (window.confirm("Start a new service project? The current project navigation will be replaced.")) { clearServiceProject(); clearWorkspaceScopes(); setProject(null); setActiveWall(null); } }} style={{ width: "100%", marginTop: 24, color: "#ffc3ae" }}>New Service Project</button>
          <p style={{ fontSize: 11, color: "#9caebb" }}>Each wall has its own workspace. Breakers and circuit names are managed under Service & Panel; physical feeder and circuit wiring is coming next.</p>
        </aside>}

        {/* =============================== */}
        {/* COMPONENT LIBRARY */}
        {/* =============================== */}

        <div
          style={{
            display: showService || !activeWall ? "none" : "block",
            width:
              `${componentWidth}px`,

            background:
              "#252526",

            height:
              "100%",

            overflowY:
              "auto",

            flexShrink:
              0
          }}
        >

          <ComponentLibrary
            workspaceRef={
              workspaceRef
            }
          />

        </div>


        {/* =============================== */}
        {/* COMPONENT RESIZE */}
        {/* =============================== */}

        <div
          onMouseDown={
            startComponentResize
          }
          style={{
            display: showService || !activeWall ? "none" : "block",
            width:
              "10px",

            cursor:
              "col-resize",

            background:
              "#444",

            flexShrink:
              0
          }}
        />


        {/* =============================== */}
        {/* WORKSPACE */}
        {/* =============================== */}

        <div
          style={{
            flex: 1,
            padding: "15px",
            background: "#303030",
            overflow: "auto",
            minWidth: 0
          }}
        >

          {project && showBlueprint && <WholeHouseBlueprint project={project} onChange={changeProject} onOpenRoom={areaId=>{changeProject({...project,activeAreaId:areaId});setShowBlueprint(false);setShowService(false);setWorkspaceScope(`${project.id}:${areaId}:OVERVIEW`);setActiveWall(null);}} onOpenPanel={()=>{setShowBlueprint(false);setShowService(true);setShowElectricalService(false);setWorkspaceScope("SERVICE");setActiveWall(null);}} />}
          {project && !showBlueprint && showService && showElectricalService && <ElectricalServiceWorkspace project={project} onChange={changeProject} />}
          {project && !showBlueprint && showService && !showElectricalService && <ServiceOverview project={project} onChange={changeProject} onOpenDestination={(areaId, wall) => { changeProject({...project, activeAreaId: areaId}); setWorkspaceScope(`${project.id}:${areaId}:${wall}`); setActiveWall(wall); setShowService(false); }} />}
          {project && !showBlueprint && !showService && project.activeAreaId && !activeWall && <RoomLayout area={project.areas.find(a => a.id === project.activeAreaId)!} onOpenWall={wall => { setWorkspaceScope(`${project.id}:${project.activeAreaId}:${wall}`); setActiveWall(wall); }} />}
          {project && !showBlueprint && !showService && project.activeAreaId && activeWall && <>
            <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "5px 8px 12px", color: "#90e7ff", fontSize: 13 }}>
              <button onClick={() => setActiveWall(null)}>← Four-Wall Room</button>
              <strong>{project.areas.find(a => a.id === project.activeAreaId)?.name} / {activeWall} Wall</strong>
              <span style={{ color: "#a8bdc9" }}>2×4 studs · 16" O.C.</span>
              {project.circuitAssignments?.flatMap(a => (a.destinations ?? []).filter(d => d.areaId === project.activeAreaId && d.wall === activeWall).map(d => ({...d, slot:a.slot, name:a.name}))).map(d => <span key={`${d.slot}-${d.areaId}-${d.wall}`} style={{border:"1px solid #37778d",padding:"5px 8px",borderRadius:6}}>Circuit #{d.slot}: {d.name || "Unnamed"} · {d.cable} (planned)</span>)}
            </div>
            <Workspace key={workspaceScope} ref={workspaceRef} onSelectDevice={setSelectedDevice} onCircuitPathsChange={setCircuitPaths} />
            <WallCircuitInspector project={project} areaId={project.activeAreaId} wall={activeWall} devices={devices} connections={connections} />

          </>}
          {project && !showBlueprint && !showService && !project.activeAreaId && <div style={{ padding: 24 }}>Add a room from the Project Explorer to begin.</div>}

        </div>


        {/* =============================== */}
        {/* RIGHT PANEL */}
        {/* =============================== */}

        <div
          style={{
            width:
              `${propertiesWidth}px`,

            minWidth:
              "360px",

            display: showService || !activeWall ? "none" : "flex",

            background:
              "#252526",

            flexShrink:
              0
          }}
        >

          {/* RIGHT PANEL RESIZE */}

          <div
            onMouseDown={
              startResize
            }
            style={{
              width:
                "10px",

              cursor:
                "col-resize",

              background:
                "#444"
            }}
          />


          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px"
            }}
          >

            {/* =============================== */}
            {/* UPDATE SIMULATION */}
            {/* =============================== */}

            <button
              onClick={
                refreshSimulation
              }
              style={{
                padding:
                  "12px",

                width:
                  "100%"
              }}
            >
              Update Simulation
            </button>


            {/* =============================== */}
            {/* PANEL SELECTOR */}
            {/* =============================== */}

            {panelDevices.length > 0 && (

              <div
                style={{
                  marginTop:
                    "10px",

                  marginBottom:
                    "10px",

                  background:
                    "#080b10",

                  border:
                    "1px solid #176070",

                  borderRadius:
                    "8px",

                  padding:
                    "12px"
                }}
              >

                <label
                  style={{
                    display:
                      "block",

                    marginBottom:
                      "6px",

                    color:
                      "#9eefff",

                    fontWeight:
                      700
                  }}
                >
                  Active Electrical Panel
                </label>


                <select
                  value={
                    activePanelDevice?.id ?? ""
                  }

                  onChange={
                    event =>
                      selectPanel(
                        event.target.value
                      )
                  }

                  style={{
                    width:
                      "100%",

                    padding:
                      "10px",

                    background:
                      "#111827",

                    color:
                      "white",

                    border:
                      "1px solid #176070",

                    borderRadius:
                      "5px"
                  }}
                >

                  <option
                    value=""
                    disabled
                  >
                    Select a panel...
                  </option>


                  {panelDevices.map(
                    device => (

                      <option
                        key={
                          device.id
                        }

                        value={
                          device.id
                        }
                      >
                        {device.name}
                        {" — "}
                        {device.mainBreaker ?? 200}A
                      </option>

                    )
                  )}

                </select>

              </div>

            )}


            {/* =============================== */}
            {/* BREAKER PANEL */}
            {/* =============================== */}

            <div
              style={{
                marginTop:
                  "10px",

                marginBottom:
                  "10px"
              }}
            >

              {activePanel ? (

                <BreakerPanel
                  panel={
                    activePanel
                  }

                  circuitStatus={
                    circuitStatus
                  }

                  onTrip={() =>
                    setCircuitStatus(
                      "FAULT"
                    )
                  }

                  onReset={
                    resetBreaker
                  }

                  onInstallBreaker={
                    handleInstallBreaker
                  }
                />

              ) : (

                <div
                  style={{
                    background:
                      "linear-gradient(135deg,#111827,#050505)",

                    border:
                      "1px solid #176070",

                    borderRadius:
                      "10px",

                    padding:
                      "25px",

                    color:
                      "#777",

                    textAlign:
                      "center"
                  }}
                >

                  <div
                    style={{
                      fontSize:
                        "32px",

                      marginBottom:
                        "10px"
                    }}
                  >
                    ⚡
                  </div>


                  <strong
                    style={{
                      color:
                        "#9eefff",

                      fontSize:
                        "16px"
                    }}
                  >
                    No Panel Selected
                  </strong>


                  <div
                    style={{
                      marginTop:
                        "8px",

                      fontSize:
                        "12px"
                    }}
                  >
                    Select a breaker panel or
                    sub panel to view its
                    breakers.
                  </div>

                </div>

              )}

            </div>


            {/* =============================== */}
            {/* SIMULATION */}
            {/* =============================== */}

            <SimulationPanel
              devices={
                activePanelDevice
                  ? devices
                  : []
              }

              connections={
                activePanelDevice
                  ? connections
                  : []
              }

              sourceId={
                activePanelDevice?.id ??
                ""
              }
            />


            {/* =============================== */}
            {/* PROPERTIES */}
            {/* =============================== */}

            <PropertiesPanel
              device={
                selectedDevice
              }

              devices={
                devices
              }

              circuitPaths={
                circuitPaths
              }

              onUpdateDevice={
                updated => {

                  updateDevice(
                    updated
                  );


                  setSelectedDevice(
                    updated
                  );


                  workspaceRef.current?.updateDevice(
                    updated
                  );

                }
              }

            />

          </div>

        </div>

      </div>

    </div>
    </>

  );

}
