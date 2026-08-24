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


export default function SimulatorLayout() {

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
    setSelectedDevice
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

        {/* =============================== */}
        {/* COMPONENT LIBRARY */}
        {/* =============================== */}

        <div
          style={{
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
            overflow: "hidden",
            minWidth: 0
          }}
        >

          <Workspace
            ref={
              workspaceRef
            }

            onSelectDevice={
              setSelectedDevice
            }

            onCircuitPathsChange={
              setCircuitPaths
            }
          />

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

            display:
              "flex",

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

  );

}