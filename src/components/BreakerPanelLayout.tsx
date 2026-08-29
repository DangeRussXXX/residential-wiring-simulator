// Residential Wiring Simulator
// Breaker panel internal layout
//
// Breaker workflow:
//
// 1. Drag breaker from Component Library.
// 2. Move over panel slots.
// 3. Valid slots highlight while dragging.
// 4. Drop breaker on a valid slot.
// 5. Dropped breaker becomes the "pending" breaker.
// 6. Configure name, amperage, type and poles.
// 7. Press INSTALL BREAKER.
// 8. Breaker is installed into the selected slot.
//
// IMPORTANT:
// DROP does NOT install the breaker.
// INSTALL BREAKER performs the actual installation.
//
// IMPORTANT DRAG FIX:
// ComponentLibrary publishes the dragged breaker through
// a browser CustomEvent because custom dataTransfer values
// are not reliably available during dragover.

import {
  useEffect,
  useMemo,
  useState,
  type DragEvent
} from "react";

import type {
  Breaker,
  BreakerType
} from "../electrical/breaker";

import {
  assignBreakerSlot
} from "../electrical/breaker";

import type {
  BreakerPoles
} from "../electrical/types";


// ============================================================
// DRAG EVENTS
// ============================================================

const BREAKER_DRAG_EVENT =
  "residential-wiring-breaker-drag";

const BREAKER_DRAG_END_EVENT =
  "residential-wiring-breaker-drag-end";


// ============================================================
// PROPS
// ============================================================

type BreakerPanelLayoutProps = {

  panelName: string;

  mainBreaker: number;

  slots?: number;

  onClose?: () => void;

  onBreakerInstalled?: (
    breaker: Breaker
  ) => void;

  onBreakerRemoved?: (
    breaker: Breaker
  ) => void;

};


// ============================================================
// PANEL SLOT
// ============================================================

type PanelSlot = {

  id: number;

  breaker: Breaker | null;

};


// ============================================================
// BREAKER SIZES
// ============================================================

const BREAKER_SIZES = [
  15,
  20,
  25,
  30,
  40,
  50,
  60
];


// ============================================================
// BREAKER TYPES
// ============================================================

const BREAKER_TYPES: {
  value: BreakerType;
  label: string;
}[] = [

  {
    value: "STANDARD",
    label: "Standard"
  },

  {
    value: "GFCI",
    label: "GFCI"
  },

  {
    value: "AFCI",
    label: "AFCI"
  },

  {
    value: "DUAL_FUNCTION",
    label: "AFCI/GFCI Combo"
  }

];


// ============================================================
// POLE OPTIONS
// ============================================================

const POLE_OPTIONS: {
  value: BreakerPoles;
  label: string;
}[] = [

  {
    value: 1,
    label: "1 Pole — 120V"
  },

  {
    value: 2,
    label: "2 Pole — 240V"
  }

];


// ============================================================
// CREATE PANEL SLOTS
// ============================================================

function makeSlots(
  count: number
): PanelSlot[] {

  return Array.from(
    {
      length:
        Math.max(
          1,
          count
        )
    },
    (_, index) => ({

      id:
        index + 1,

      breaker:
        null

    })
  );

}


// ============================================================
// BREAKER LABEL
// ============================================================

function getBreakerLabel(
  breaker: Breaker
): string {

  return (
    breaker.label ||
    `${breaker.amperage}A ${breaker.breakerType}`
  );

}


// ============================================================
// TYPE LABEL
// ============================================================

function getTypeLabel(
  type: BreakerType
): string {

  switch (type) {

    case "AFCI":
      return "AFCI";

    case "GFCI":
      return "GFCI";

    case "DUAL_FUNCTION":
      return "AFCI/GFCI";

    default:
      return "STANDARD";

  }

}


// ============================================================
// READ DRAGGED BREAKER
// ============================================================

function readDraggedBreaker(
  event: DragEvent<HTMLDivElement>
): Breaker | null {

  const data =
    event.dataTransfer.getData(
      "breaker"
    );


  if (
    !data
  ) {

    return null;

  }


  try {

    const parsed =
      JSON.parse(
        data
      ) as Partial<Breaker>;


    if (
      !parsed ||
      typeof parsed.id !== "string" ||
      typeof parsed.amperage !== "number" ||
      (
        parsed.poles !== 1 &&
        parsed.poles !== 2
      ) ||
      (
        parsed.breakerType !== "STANDARD" &&
        parsed.breakerType !== "GFCI" &&
        parsed.breakerType !== "AFCI" &&
        parsed.breakerType !== "DUAL_FUNCTION"
      )
    ) {

      return null;

    }


    return parsed as Breaker;

  }

  catch (error) {

    console.error(
      "Could not read dragged breaker:",
      error
    );

    return null;

  }

}


// ============================================================
// SLOT BELONGS TO BREAKER
// ============================================================

function slotBelongsToBreaker(
  slot: PanelSlot,
  breaker: Breaker | null
): boolean {

  if (
    !breaker ||
    !slot.breaker
  ) {

    return false;

  }


  return (
    slot.breaker.id ===
    breaker.id
  );

}


// ============================================================
// PANEL
// ============================================================

export default function BreakerPanelLayout({

  panelName,

  mainBreaker,

  slots = 24,

  onClose,

  onBreakerInstalled,

  onBreakerRemoved

}: BreakerPanelLayoutProps) {


  // ==========================================================
  // PANEL SLOTS
  // ==========================================================

  const [
    panelSlots,
    setPanelSlots
  ] = useState<PanelSlot[]>(
    () =>
      makeSlots(
        slots
      )
  );


  // ==========================================================
  // SELECTED SLOT
  // ==========================================================

  const [
    selectedSlot,
    setSelectedSlot
  ] = useState<number | null>(
    null
  );


  // ==========================================================
  // DRAGGED BREAKER
  // ==========================================================

  const [
    draggingBreaker,
    setDraggingBreaker
  ] = useState<Breaker | null>(
    null
  );


  // ==========================================================
  // DRAG OVER SLOT
  // ==========================================================

  const [
    dragOverSlot,
    setDragOverSlot
  ] = useState<number | null>(
    null
  );


  // ==========================================================
  // PENDING BREAKER
  // ==========================================================

  const [
    pendingBreaker,
    setPendingBreaker
  ] = useState<Breaker | null>(
    null
  );


  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const [
    breakerName,
    setBreakerName
  ] = useState(
    ""
  );


  const [
    amperage,
    setAmperage
  ] = useState(
    20
  );


  const [
    breakerType,
    setBreakerType
  ] = useState<BreakerType>(
    "STANDARD"
  );


  const [
    poles,
    setPoles
  ] = useState<BreakerPoles>(
    1
  );


  // ==========================================================
  // LISTEN FOR COMPONENT LIBRARY BREAKER DRAG
  // ==========================================================
  //
  // This is the central fix.
  //
  // ComponentLibrary sends:
  //
  // window.dispatchEvent(
  //   new CustomEvent(
  //     "residential-wiring-breaker-drag",
  //     { detail: breaker }
  //   )
  // );
  //
  // The panel receives the complete breaker immediately.
  // ==========================================================

  useEffect(() => {

    function handleBreakerDrag(
      event: Event
    ): void {

      const customEvent =
        event as CustomEvent<Breaker>;


      const breaker =
        customEvent.detail;


      if (
        !breaker
      ) {

        return;

      }


      setDraggingBreaker(
        breaker
      );


      setDragOverSlot(
        null
      );

    }


    function handleBreakerDragEnd(): void {

      setDraggingBreaker(
        null
      );

      setDragOverSlot(
        null
      );

    }


    window.addEventListener(
      BREAKER_DRAG_EVENT,
      handleBreakerDrag
    );


    window.addEventListener(
      BREAKER_DRAG_END_EVENT,
      handleBreakerDragEnd
    );


    return () => {

      window.removeEventListener(
        BREAKER_DRAG_EVENT,
        handleBreakerDrag
      );


      window.removeEventListener(
        BREAKER_DRAG_END_EVENT,
        handleBreakerDragEnd
      );

    };

  }, []);


  // ==========================================================
  // VALID DROP SLOTS
  // ==========================================================

  const validDropSlots =
    useMemo(() => {

      if (
        !draggingBreaker
      ) {

        return new Set<number>();

      }


      const result =
        new Set<number>();


      for (
        let index = 0;
        index < panelSlots.length;
        index++
      ) {

        const slotNumber =
          index + 1;


        // ----------------------------------------------------
        // 1-POLE
        // ----------------------------------------------------

        if (
          draggingBreaker.poles === 1
        ) {

          if (
            !panelSlots[index].breaker
          ) {

            result.add(
              slotNumber
            );

          }


          continue;

        }


        // ----------------------------------------------------
        // 2-POLE
        // ----------------------------------------------------

        if (
          index + 1 <
          panelSlots.length
        ) {

          const first =
            panelSlots[index];

          const second =
            panelSlots[index + 1];


          if (
            !first.breaker &&
            !second.breaker
          ) {

            result.add(
              slotNumber
            );

          }

        }

      }


      return result;

    }, [
      draggingBreaker,
      panelSlots
    ]);


  // ==========================================================
  // CLEAR DRAG STATE
  // ==========================================================

  function clearDragState(): void {

    setDraggingBreaker(
      null
    );

    setDragOverSlot(
      null
    );

  }


  // ==========================================================
  // DRAG OVER
  // ==========================================================

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
    slotNumber: number
  ): void {

    event.preventDefault();


    event.dataTransfer.dropEffect =
      "copy";


    /*
     * Normally the CustomEvent has already supplied the
     * breaker. This fallback is retained for compatibility
     * with other breaker drag sources.
     */

    let breaker =
      draggingBreaker;


    if (
      !breaker
    ) {

      breaker =
        readDraggedBreaker(
          event
        );


      if (
        breaker
      ) {

        setDraggingBreaker(
          breaker
        );

      }

    }


    if (
      !breaker
    ) {

      setDragOverSlot(
        null
      );

      return;

    }


    // --------------------------------------------------------
    // 1-POLE
    // --------------------------------------------------------

    if (
      breaker.poles === 1
    ) {

      const target =
        panelSlots.find(
          item =>
            item.id ===
            slotNumber
        );


      if (
        target &&
        !target.breaker
      ) {

        setDragOverSlot(
          slotNumber
        );

      }

      else {

        setDragOverSlot(
          null
        );

      }


      return;

    }


    // --------------------------------------------------------
    // 2-POLE
    // --------------------------------------------------------

    const first =
      panelSlots.find(
        item =>
          item.id ===
          slotNumber
      );


    const second =
      panelSlots.find(
        item =>
          item.id ===
          slotNumber + 1
      );


    if (
      first &&
      second &&
      !first.breaker &&
      !second.breaker
    ) {

      setDragOverSlot(
        slotNumber
      );

    }

    else {

      setDragOverSlot(
        null
      );

    }

  }


  // ==========================================================
  // DRAG LEAVE
  // ==========================================================

  function handleDragLeave(
    slotNumber: number
  ): void {

    if (
      dragOverSlot ===
      slotNumber
    ) {

      setDragOverSlot(
        null
      );

    }

  }


  // ==========================================================
  // DROP
  // ==========================================================

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    slotNumber: number
  ): void {

    event.preventDefault();

    event.stopPropagation();


    /*
     * Try the actual drop payload first.
     */

    let breaker =
      readDraggedBreaker(
        event
      );


    /*
     * If the browser does not provide the custom dataTransfer
     * value, use the breaker already received through the
     * CustomEvent.
     */

    if (
      !breaker
    ) {

      breaker =
        draggingBreaker;

    }


    clearDragState();


    if (
      !breaker
    ) {

      console.warn(
        "Panel received a breaker drop, but no breaker was available."
      );

      return;

    }


    // --------------------------------------------------------
    // VALIDATE 1-POLE
    // --------------------------------------------------------

    if (
      breaker.poles === 1
    ) {

      const target =
        panelSlots.find(
          item =>
            item.id ===
            slotNumber
        );


      if (
        !target ||
        target.breaker
      ) {

        return;

      }

    }


    // --------------------------------------------------------
    // VALIDATE 2-POLE
    // --------------------------------------------------------

    if (
      breaker.poles === 2
    ) {

      const first =
        panelSlots.find(
          item =>
            item.id ===
            slotNumber
        );


      const second =
        panelSlots.find(
          item =>
            item.id ===
            slotNumber + 1
        );


      if (
        !first ||
        !second ||
        first.breaker ||
        second.breaker
      ) {

        return;

      }

    }


    /*
     * DROP = PENDING.
     *
     * Nothing is installed yet.
     */

    setPendingBreaker(
      breaker
    );


    setSelectedSlot(
      slotNumber
    );


    /*
     * Generic library labels become blank circuit names.
     */

    setBreakerName(
      breaker.label &&
      !breaker.label.startsWith(
        `${breaker.amperage}A`
      )
        ? breaker.label
        : ""
    );


    setAmperage(
      breaker.amperage
    );


    setBreakerType(
      breaker.breakerType
    );


    setPoles(
      breaker.poles
    );

  }


  // ==========================================================
  // INSTALL
  // ==========================================================

  function installBreaker(): void {

    if (
      !pendingBreaker ||
      selectedSlot === null
    ) {

      return;

    }


    /*
     * Determine whether the pending breaker is already
     * installed and is being edited.
     */

    const existingBreaker =
      panelSlots.some(
        slot =>
          slot.breaker?.id ===
          pendingBreaker.id
      );


    const selectedTarget =
      panelSlots.find(
        item =>
          item.id ===
          selectedSlot
      );


    if (
      !selectedTarget
    ) {

      return;

    }


    // --------------------------------------------------------
    // FIRST SLOT
    // --------------------------------------------------------

    const firstOccupiedByOther =
      selectedTarget.breaker &&
      !slotBelongsToBreaker(
        selectedTarget,
        pendingBreaker
      );


    if (
      firstOccupiedByOther
    ) {

      alert(
        "The selected slot is already occupied."
      );

      return;

    }


    // --------------------------------------------------------
    // SECOND SLOT
    // --------------------------------------------------------

    if (
      poles === 2
    ) {

      const second =
        panelSlots.find(
          item =>
            item.id ===
            selectedSlot + 1
        );


      if (
        !second
      ) {

        alert(
          "A 2-pole breaker requires two consecutive physical slots."
        );

        return;

      }


      const secondOccupiedByOther =
        second.breaker &&
        !slotBelongsToBreaker(
          second,
          pendingBreaker
        );


      if (
        secondOccupiedByOther
      ) {

        alert(
          "A 2-pole breaker requires two consecutive empty slots."
        );

        return;

      }

    }


    // --------------------------------------------------------
    // BUILD BREAKER
    // --------------------------------------------------------

    let installed =
      assignBreakerSlot(
        pendingBreaker,
        selectedSlot
      );


    installed = {

      ...installed,

      label:
        breakerName.trim() ||
        `${amperage}A ${getTypeLabel(
          breakerType
        )}`,

      amperage,

      breakerType,

      poles,

      voltage:
        poles === 2
          ? 240
          : 120

    };


    /*
     * Recalculate electrical slot/bus information after
     * applying the final pole configuration.
     */

    installed =
      assignBreakerSlot(
        installed,
        selectedSlot
      );


    // --------------------------------------------------------
    // UPDATE PANEL
    // --------------------------------------------------------

    setPanelSlots(
      previous => {

        /*
         * Remove all physical positions belonging to the
         * breaker being edited.
         */

        const cleared =
          previous.map(
            item => {

              if (
                item.breaker?.id ===
                pendingBreaker.id
              ) {

                return {

                  ...item,

                  breaker:
                    null

                };

              }


              return item;

            }
          );


        /*
         * Install the first physical slot.
         */

        const installedSlots =
          cleared.map(
            item => {

              if (
                item.id ===
                selectedSlot
              ) {

                return {

                  ...item,

                  breaker:
                    installed

                };

              }


              /*
               * A 2-pole breaker occupies the next physical
               * slot as well.
               */

              if (
                poles === 2 &&
                item.id ===
                  selectedSlot + 1
              ) {

                return {

                  ...item,

                  breaker:
                    installed

                };

              }


              return item;

            }
          );


        return installedSlots;

      }
    );


    // --------------------------------------------------------
    // NOTIFY PARENT
    // --------------------------------------------------------

    onBreakerInstalled?.(
      installed
    );


    // --------------------------------------------------------
    // CLOSE CONFIGURATION
    // --------------------------------------------------------

    setPendingBreaker(
      null
    );


    setSelectedSlot(
      selectedSlot
    );


    clearDragState();


    /*
     * Keep this variable referenced because it explicitly
     * documents the edit/replacement path.
     */

    void existingBreaker;

  }


  // ==========================================================
  // REMOVE BREAKER
  // ==========================================================

  function removeBreaker(
    breaker: Breaker
  ): void {

    setPanelSlots(
      previous =>
        previous.map(
          item => {

            if (
              item.breaker?.id ===
              breaker.id
            ) {

              return {

                ...item,

                breaker:
                  null

              };

            }


            return item;

          }
        )
    );


    onBreakerRemoved?.(
      breaker
    );


    setPendingBreaker(
      null
    );


    setSelectedSlot(
      null
    );

  }


  // ==========================================================
  // SELECT SLOT
  // ==========================================================

  function selectSlot(
    slotNumber: number
  ): void {

    setSelectedSlot(
      slotNumber
    );


    const slot =
      panelSlots.find(
        item =>
          item.id ===
          slotNumber
      );


    if (
      !slot?.breaker
    ) {

      setPendingBreaker(
        null
      );

      return;

    }


    const breaker =
      slot.breaker;


    setPendingBreaker(
      breaker
    );


    setBreakerName(
      breaker.label ||
      ""
    );


    setAmperage(
      breaker.amperage
    );


    setBreakerType(
      breaker.breakerType
    );


    setPoles(
      breaker.poles
    );

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      style={{
        position: "fixed",
        right: "30px",
        top: "80px",
        width: "380px",
        maxHeight: "80vh",
        overflowY: "auto",
        background: "#111827",
        border: "2px solid #00eaff",
        borderRadius: "12px",
        padding: "18px",
        color: "white",
        fontFamily: "monospace",
        zIndex: 1000,
        boxShadow:
          "0 0 25px rgba(0,234,255,.4)"
      }}
    >

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >

        <h2
          style={{
            margin: 0,
            color: "#00eaff"
          }}
        >
          ⚡ {panelName}
        </h2>


        {onClose && (

          <button
            onClick={
              onClose
            }

            style={{
              background: "#3b1010",
              color: "#ff8080",
              border: "1px solid #ff4040",
              borderRadius: "5px",
              padding: "6px 10px",
              cursor: "pointer"
            }}
          >
            X
          </button>

        )}

      </div>


      {/* ================================================== */}
      {/* MAIN BREAKER */}
      {/* ================================================== */}

      <div
        style={{
          marginTop: "15px",
          padding: "12px",
          background: "#222",
          borderRadius: "8px"
        }}
      >

        MAIN BREAKER

        <br />

        <span
          style={{
            color: "#39ff14",
            fontSize: "20px"
          }}
        >
          ● ON
        </span>

        {" "}

        {mainBreaker}A

      </div>


      {/* ================================================== */}
      {/* BUS */}
      {/* ================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginTop: "15px"
        }}
      >

        <div
          style={{
            textAlign: "center",
            color: "#ffcc00",
            background: "#050505",
            padding: "8px"
          }}
        >
          L1 BUS
        </div>


        <div
          style={{
            textAlign: "center",
            color: "#ffcc00",
            background: "#050505",
            padding: "8px"
          }}
        >
          L2 BUS
        </div>

      </div>


      {/* ================================================== */}
      {/* DRAG INSTRUCTION */}
      {/* ================================================== */}

      {draggingBreaker && (

        <div
          style={{
            marginTop: "12px",
            padding: "10px",
            background: "#063b2d",
            border:
              "1px solid #00ff99",
            borderRadius: "7px",
            color: "#00ff99",
            textAlign: "center",
            fontWeight: 800
          }}
        >

          DROP LOCATION ACTIVE

          <br />

          {draggingBreaker.poles === 2
            ? "2-pole breaker: choose two consecutive highlighted slots"
            : "Choose a highlighted slot"
          }

        </div>

      )}


      {/* ================================================== */}
      {/* SLOTS */}
      {/* ================================================== */}

      <div
        style={{
          marginTop: "15px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          maxHeight: "300px",
          overflowY: "auto",
          paddingRight: "5px"
        }}
      >

        {panelSlots.map(
          slot => {

            const breaker =
              slot.breaker;


            const isValidDrop =
              validDropSlots.has(
                slot.id
              );


            const isDragTarget =
              dragOverSlot ===
              slot.id;


            const isSelected =
              selectedSlot ===
              slot.id;


            return (

              <div
                key={
                  `panel-slot-${slot.id}`
                }

                onDragOver={
                  event =>
                    handleDragOver(
                      event,
                      slot.id
                    )
                }

                onDragLeave={() =>
                  handleDragLeave(
                    slot.id
                  )
                }

                onDrop={
                  event =>
                    handleDrop(
                      event,
                      slot.id
                    )
                }

                onClick={() =>
                  selectSlot(
                    slot.id
                  )
                }

                style={{

                  minHeight:
                    "58px",

                  border:
                    isDragTarget
                      ? "3px solid #00ff99"
                      : isValidDrop
                      ? "2px solid #00aaff"
                      : isSelected
                      ? "2px solid #00eaff"
                      : breaker
                      ? "1px solid #39ff14"
                      : "1px solid #555",

                  background:
                    isDragTarget
                      ? "#063b2d"
                      : isValidDrop
                      ? "#06263b"
                      : breaker
                      ? "#123b12"
                      : "#050505",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  cursor:
                    "pointer",

                  borderRadius:
                    "5px",

                  padding:
                    "6px",

                  boxSizing:
                    "border-box",

                  transition:
                    "all .15s"

                }}
              >

                {breaker ? (

                  <div
                    style={{
                      color:
                        "#39ff14",
                      textAlign:
                        "center"
                    }}
                  >

                    <strong>
                      SLOT {slot.id}
                    </strong>

                    <br />

                    {getBreakerLabel(
                      breaker
                    )}

                    <br />

                    {breaker.amperage}A{" "}

                    {breaker.poles === 2
                      ? "2P / 240V"
                      : "1P / 120V"}

                    <br />

                    <span
                      style={{
                        fontSize:
                          "10px",
                        color:
                          "#8cff8c"
                      }}
                    >
                      {getTypeLabel(
                        breaker.breakerType
                      )}
                    </span>


                    {breaker.poles === 2 && (

                      <>
                        <br />

                        <span
                          style={{
                            fontSize:
                              "10px",
                            color:
                              "#8cff8c"
                          }}
                        >
                          2-POLE BREAKER
                        </span>
                      </>

                    )}

                  </div>

                ) : (

                  <div
                    style={{
                      textAlign:
                        "center",
                      color:
                        isValidDrop
                          ? "#00aaff"
                          : "#777"
                    }}
                  >

                    <strong>
                      SLOT {slot.id}
                    </strong>

                    <br />

                    {isValidDrop
                      ? "DROP BREAKER HERE"
                      : "EMPTY"}

                  </div>

                )}

              </div>

            );

          }
        )}

      </div>


      {/* ================================================== */}
      {/* CONFIGURATION */}
      {/* ================================================== */}

      {pendingBreaker && (

        <div
          style={{
            marginTop: "15px",
            padding: "12px",
            background: "#080b10",
            border:
              "1px solid #00eaff",
            borderRadius: "8px"
          }}
        >

          <h3
            style={{
              marginTop: 0,
              color: "#00eaff"
            }}
          >
            {pendingBreaker.slot === -1
              ? "Configure Breaker"
              : "Breaker Settings"}
          </h3>


          {/* ================================================= */}
          {/* SELECTED SLOT */}
          {/* ================================================= */}

          <div
            style={{
              marginBottom: "10px",
              color: "#aaa"
            }}
          >

            Selected Slot:{" "}

            <strong
              style={{
                color: "#fff"
              }}
            >
              {selectedSlot}
            </strong>

            {poles === 2 && (
              <>
                {" "}—{" "}

                {selectedSlot !== null
                  ? selectedSlot + 1
                  : ""
                }

              </>
            )}

          </div>


          {/* ================================================= */}
          {/* NAME */}
          {/* ================================================= */}

          <label>
            Breaker / Circuit Name
          </label>

          <input
            value={
              breakerName
            }

            onChange={
              event =>
                setBreakerName(
                  event.target.value
                )
            }

            placeholder="Kitchen"

            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "9px",
              marginTop: "5px",
              marginBottom: "10px",
              background: "#111827",
              color: "white",
              border:
                "1px solid #176070",
              borderRadius: "5px"
            }}
          />


          {/* ================================================= */}
          {/* AMPERAGE */}
          {/* ================================================= */}

          <label>
            Breaker Size
          </label>

          <select
            value={
              amperage
            }

            onChange={
              event =>
                setAmperage(
                  Number(
                    event.target.value
                  )
                )
            }

            style={{
              width: "100%",
              padding: "9px",
              marginTop: "5px",
              marginBottom: "10px",
              background: "#111827",
              color: "white",
              border:
                "1px solid #176070",
              borderRadius: "5px"
            }}
          >

            {BREAKER_SIZES.map(
              size => (

                <option
                  key={size}
                  value={size}
                >
                  {size}A
                </option>

              )
            )}

          </select>


          {/* ================================================= */}
          {/* TYPE */}
          {/* ================================================= */}

          <label>
            Breaker Type
          </label>

          <select
            value={
              breakerType
            }

            onChange={
              event =>
                setBreakerType(
                  event.target.value as BreakerType
                )
            }

            style={{
              width: "100%",
              padding: "9px",
              marginTop: "5px",
              marginBottom: "10px",
              background: "#111827",
              color: "white",
              border:
                "1px solid #176070",
              borderRadius: "5px"
            }}
          >

            {BREAKER_TYPES.map(
              option => (

                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                >
                  {option.label}
                </option>

              )
            )}

          </select>


          {/* ================================================= */}
          {/* POLES */}
          {/* ================================================= */}

          <label>
            Number of Poles
          </label>

          <select
            value={
              poles
            }

            onChange={
              event => {

                const value =
                  Number(
                    event.target.value
                  );


                setPoles(
                  value === 2
                    ? 2
                    : 1
                );

              }
            }

            style={{
              width: "100%",
              padding: "9px",
              marginTop: "5px",
              marginBottom: "10px",
              background: "#111827",
              color: "white",
              border:
                "1px solid #176070",
              borderRadius: "5px"
            }}
          >

            {POLE_OPTIONS.map(
              option => (

                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                >
                  {option.label}
                </option>

              )
            )}

          </select>


          {/* ================================================= */}
          {/* VOLTAGE */}
          {/* ================================================= */}

          <div
            style={{
              padding: "9px",
              marginBottom: "10px",
              background: "#111827",
              border:
                "1px solid #176070",
              borderRadius: "5px"
            }}
          >

            Voltage:{" "}

            <strong>
              {poles === 2
                ? "240V"
                : "120V"
              }
            </strong>

          </div>


          {/* ================================================= */}
          {/* INSTALL */}
          {/* ================================================= */}

          <button
            onClick={
              installBreaker
            }

            style={{
              width: "100%",
              padding: "11px",
              background: "#123b12",
              color: "#39ff14",
              border:
                "1px solid #39ff14",
              borderRadius: "6px",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            INSTALL BREAKER
          </button>


          {/* ================================================= */}
          {/* REMOVE */}
          {/* ================================================= */}

          {pendingBreaker.slot >= 1 && (

            <button
              onClick={() =>
                removeBreaker(
                  pendingBreaker
                )
              }

              style={{
                width: "100%",
                padding: "9px",
                marginTop: "8px",
                background: "#3b1010",
                color: "#ff8080",
                border:
                  "1px solid #ff4040",
                borderRadius: "6px",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              REMOVE BREAKER
            </button>

          )}

        </div>

      )}


      {/* ================================================== */}
      {/* DEFAULT INSTRUCTION */}
      {/* ================================================== */}

      {!draggingBreaker &&
       !pendingBreaker && (

        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            background: "#222",
            borderRadius: "8px",
            color: "#aaa",
            textAlign: "center"
          }}
        >

          Drag a breaker from the
          Component Library into a
          highlighted slot.

          <br />

          <span
            style={{
              fontSize: "11px",
              color: "#777"
            }}
          >
            Dropping opens configuration.
            Installation occurs only after
            pressing INSTALL BREAKER.
          </span>

        </div>

      )}

    </div>

  );

}