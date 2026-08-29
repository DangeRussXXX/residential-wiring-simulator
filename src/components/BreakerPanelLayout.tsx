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

import {
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


type PanelSlot = {

  id: number;

  breaker: Breaker | null;

};


/*
 * Breaker sizes available in the panel.
 */

const BREAKER_SIZES = [
  15,
  20,
  25,
  30,
  40,
  50,
  60
];


/*
 * Breaker type options.
 */

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


/*
 * Pole options.
 */

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


/*
 * Create the physical panel slots.
 */

function makeSlots(
  count: number
): PanelSlot[] {

  return Array.from(
    {
      length: Math.max(
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


/*
 * Display name for a breaker.
 */

function getBreakerLabel(
  breaker: Breaker
): string {

  return (
    breaker.label ||
    `${breaker.amperage}A ${breaker.breakerType}`
  );

}


/*
 * Friendly breaker type label.
 */

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


/*
 * Read the breaker payload supplied by
 * ComponentLibrary.
 *
 * ComponentLibrary writes:
 *
 * dataTransfer.setData(
 *   "breaker",
 *   JSON.stringify(breaker)
 * )
 *
 * This function reads that exact payload.
 */

function readDraggedBreaker(
  event: DragEvent<HTMLDivElement>
): Breaker | null {

  const data =
    event.dataTransfer.getData(
      "breaker"
    );


  if (!data) {

    return null;

  }


  try {

    const parsed =
      JSON.parse(
        data
      ) as Partial<Breaker>;


    /*
     * Validate the minimum information
     * required for a breaker.
     */

    if (
      !parsed ||
      typeof parsed.id !== "string" ||
      typeof parsed.amperage !== "number" ||
      (parsed.poles !== 1 &&
       parsed.poles !== 2) ||
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


/*
 * Determine whether a slot belongs to a particular
 * breaker.
 *
 * This is important for editing an already-installed
 * breaker because the breaker's own occupied slots
 * should not prevent editing it.
 */

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


export default function BreakerPanelLayout({

  panelName,

  mainBreaker,

  slots = 24,

  onClose,

  onBreakerInstalled,

  onBreakerRemoved

}: BreakerPanelLayoutProps) {


  // ==========================================================
  // PANEL
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
  // DRAG STATE
  //
  // The ComponentLibrary owns dragStart.
  //
  // Therefore the panel discovers the breaker
  // from dataTransfer during dragOver.
  // ==========================================================

  const [
    draggingBreaker,
    setDraggingBreaker
  ] = useState<Breaker | null>(
    null
  );


  const [
    dragOverSlot,
    setDragOverSlot
  ] = useState<number | null>(
    null
  );


  // ==========================================================
  // PENDING BREAKER
  //
  // A dropped breaker is stored here first.
  // It is NOT installed until INSTALL BREAKER
  // is pressed.
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
  // VALID DROP SLOTS
  //
  // These are calculated from the breaker currently being
  // dragged.
  //
  // A 1-pole breaker needs one empty slot.
  //
  // A 2-pole breaker needs two consecutive empty slots.
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


        /*
         * 1-pole breaker.
         */

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


        /*
         * 2-pole breaker.
         *
         * It must start on a slot where
         * the following physical slot also exists.
         */

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
  // DRAG OVER SLOT
  //
  // The ComponentLibrary starts the drag, so this component
  // discovers the breaker payload here.
  //
  // This is what makes valid panel slots highlight.
  // ==========================================================

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
    slotNumber: number
  ): void {

    event.preventDefault();


    event.dataTransfer.dropEffect =
      "copy";


    /*
     * If we do not already know which breaker
     * is being dragged, read it directly from
     * the browser's dataTransfer payload.
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


    /*
     * Determine whether this physical slot
     * is a valid starting position.
     */

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


    /*
     * 2-pole validation.
     */

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
  //
  // DROP ONLY opens configuration.
  //
  // It does NOT install the breaker.
  // ==========================================================

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    slotNumber: number
  ): void {

    event.preventDefault();

    event.stopPropagation();


    const breaker =
      readDraggedBreaker(
        event
      );


    /*
     * Clear visual drag state immediately.
     */

    clearDragState();


    if (
      !breaker
    ) {

      console.warn(
        "Panel received a drop, but no breaker payload was found."
      );

      return;

    }


    /*
     * Re-check the actual panel state.
     *
     * This prevents a stale highlight from
     * allowing an invalid drop.
     */

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


    /*
     * 2-pole breaker validation.
     */

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
     * If the library breaker has a generic label such as
     * "20A STANDARD", don't use that as the circuit name.
     *
     * Otherwise preserve the friendly label.
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
  // INSTALL BREAKER
  // ==========================================================

  function installBreaker(): void {

    if (
      !pendingBreaker ||
      selectedSlot === null
    ) {

      return;

    }


    /*
     * Determine whether this is an existing breaker
     * being edited or a brand-new breaker from the library.
     */

    const existingBreaker =
      panelSlots.some(
        slot =>
          slot.breaker?.id ===
          pendingBreaker.id
      );


    /*
     * When editing an existing breaker, its own occupied
     * slots are temporarily considered available.
     *
     * When installing a new breaker, every occupied slot
     * remains unavailable.
     */

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


    /*
     * Check the first physical slot.
     */

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


    /*
     * Check the second physical slot for a 2-pole breaker.
     */

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


    /*
     * Start with the complete Breaker object supplied
     * by ComponentLibrary.
     */

    let installed =
      assignBreakerSlot(
        pendingBreaker,
        selectedSlot
      );


    /*
     * Apply the user's configuration.
     */

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
     * Reassign the slot after changing the electrical
     * properties so bus/load-terminal information is
     * recalculated from the final pole configuration.
     */

    installed =
      assignBreakerSlot(
        installed,
        selectedSlot
      );


    /*
     * Update the panel.
     *
     * First remove every physical slot occupied by
     * this breaker when editing/replacing.
     */

    setPanelSlots(
      previous => {

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
         * Install the breaker into its first physical slot.
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
               * A 2-pole breaker occupies the next
               * physical slot as well.
               *
               * The same breaker object is intentionally
               * referenced by both physical positions.
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


    /*
     * Notify the parent application.
     */

    onBreakerInstalled?.(
      installed
    );


    /*
     * Installation is complete.
     *
     * Close the configuration state.
     */

    setPendingBreaker(
      null
    );


    /*
     * Keep the installed slot selected so
     * the user can immediately see what was installed.
     */

    setSelectedSlot(
      selectedSlot
    );


    /*
     * Clear drag state just in case the install
     * occurred immediately after a drag operation.
     */

    clearDragState();


    /*
     * existingBreaker is intentionally calculated above
     * because it documents the editing/replacement path.
     * Keep the variable referenced to avoid accidental removal
     * during future modifications.
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

            /*
             * Remove every physical slot belonging
             * to the same breaker.
             */

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


    /*
     * Notify parent.
     */

    onBreakerRemoved?.(
      breaker
    );


    /*
     * Clear configuration state.
     */

    setPendingBreaker(
      null
    );


    setSelectedSlot(
      null
    );

  }


  // ==========================================================
  // SELECT SLOT
  //
  // Clicking an installed breaker opens its settings.
  // Clicking an empty slot simply selects it.
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


    /*
     * Empty slot.
     */

    if (
      !slot?.breaker
    ) {

      /*
       * Do not create a fake pending breaker.
       *
       * Configuration only appears for an actual
       * dropped or installed breaker.
       */

      setPendingBreaker(
        null
      );

      return;

    }


    /*
     * Installed breaker.
     */

    const breaker =
      slot.breaker;


    setPendingBreaker(
      breaker
    );


    setBreakerName(
      breaker.label || ""
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

          Choose a highlighted slot

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
                  : ""}
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
                : "120V"}
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