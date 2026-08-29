// Residential Wiring Simulator
// Breaker panel internal layout
//
// Features:
// - Physical breaker slots
// - Drag-and-drop breaker installation
// - Available-slot highlighting
// - 1-pole and 2-pole breakers
// - Breaker naming
// - Breaker configuration before installation
// - Install / replace / remove breaker
//
// This component uses the Breaker model from electrical/breaker.ts.

import { useMemo, useState } from "react";

import type {
  Breaker,
  BreakerType
} from "../electrical/breaker";

import {
  assignBreakerSlot,
  createLibraryBreaker
} from "../electrical/breaker";

import type {
  BreakerPoles
} from "../electrical/types";


type BreakerPanelLayoutProps = {

  panelName: string;

  mainBreaker: number;

  slots?: number;

  onClose?: () => void;

  /**
   * Optional callback so the parent application
   * can receive the installed breaker.
   */
  onBreakerInstalled?: (
    breaker: Breaker
  ) => void;

  /**
   * Optional callback when a breaker is removed.
   */
  onBreakerRemoved?: (
    breaker: Breaker
  ) => void;

};


type PanelSlot = {

  id: number;

  breaker: Breaker | null;

};


const BREAKER_SIZES = [
  15,
  20,
  25,
  30,
  40,
  50,
  60
];


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


function getDisplayName(
  breaker: Breaker
): string {

  return breaker.label ||
    `${breaker.amperage}A ${breaker.breakerType}`;

}


function getBreakerTypeLabel(
  breakerType: BreakerType
): string {

  switch (breakerType) {

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


function makeInitialSlots(
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

      id: index + 1,

      breaker: null

    })
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
  // PANEL STATE
  // ==========================================================

  const [
    panelSlots,
    setPanelSlots
  ] = useState<PanelSlot[]>(
    () => makeInitialSlots(slots)
  );


  const [
    selectedSlot,
    setSelectedSlot
  ] = useState<number | null>(
    null
  );


  const [
    dragOverSlot,
    setDragOverSlot
  ] = useState<number | null>(
    null
  );


  const [
    pendingBreaker,
    setPendingBreaker
  ] = useState<Breaker | null>(
    null
  );


  const [
    breakerName,
    setBreakerName
  ] = useState<string>(
    ""
  );


  const [
    amperage,
    setAmperage
  ] = useState<number>(
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
  // FIND OCCUPIED SLOTS
  // ==========================================================

  const occupiedSlots = useMemo(
    () => {

      const occupied = new Set<number>();


      for (
        const position
        of panelSlots
      ) {

        if (
          !position.breaker
        ) {

          continue;

        }


        occupied.add(
          position.id
        );


        if (
          position.breaker.poles === 2
        ) {

          occupied.add(
            position.id + 1
          );

        }

      }


      return occupied;

    },
    [
      panelSlots
    ]
  );


  // ==========================================================
  // CHECK SLOT AVAILABILITY
  // ==========================================================

  function canPlaceBreaker(
    startSlot: number,
    breakerPoles: BreakerPoles
  ): boolean {

    if (
      startSlot < 1
    ) {

      return false;

    }


    if (
      startSlot > panelSlots.length
    ) {

      return false;

    }


    if (
      breakerPoles === 1
    ) {

      return !occupiedSlots.has(
        startSlot
      );

    }


    /*
     * A two-pole breaker needs two
     * consecutive physical slots.
     */

    if (
      startSlot + 1 >
      panelSlots.length
    ) {

      return false;

    }


    return (
      !occupiedSlots.has(
        startSlot
      ) &&
      !occupiedSlots.has(
        startSlot + 1
      )
    );

  }


  // ==========================================================
  // CREATE / READ DRAGGED BREAKER
  // ==========================================================

  function getDraggedBreaker(
    event: React.DragEvent
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


      /*
       * If the Component Library already
       * supplied a complete Breaker object,
       * use it.
       */

      if (
        parsed.id &&
        parsed.label &&
        parsed.busLegs &&
        parsed.loadTerminals &&
        parsed.connectedDevices &&
        parsed.status
      ) {

        return parsed as Breaker;

      }


      /*
       * Compatibility fallback.
       *
       * Older drag code may only provide:
       * id, slot, amperage, breakerType,
       * poles and name.
       */

      const parsedPoles =
        parsed.poles === 2
          ? 2
          : 1;


      const parsedAmps =
        typeof parsed.amperage === "number"
          ? parsed.amperage
          : 20;


      const parsedType =
        parsed.breakerType === "AFCI" ||
        parsed.breakerType === "GFCI" ||
        parsed.breakerType === "DUAL_FUNCTION"
          ? parsed.breakerType
          : "STANDARD";


      const created =
        createLibraryBreaker(
          parsedAmps,
          parsedPoles,
          parsedType
        );


      return {

        ...created,

        id:
          typeof parsed.id === "string"
            ? parsed.id
            : created.id,

        label:
          typeof parsed.label === "string"
            ? parsed.label
            : `${parsedAmps}A ${parsedType}`

      };

    }
    catch (
      error
    ) {

      console.error(
        "Unable to read dragged breaker:",
        error
      );


      return null;

    }

  }


  // ==========================================================
  // DRAG OVER
  // ==========================================================

  function handleDragOver(
    event: React.DragEvent,
    slotNumber: number
  ): void {

    event.preventDefault();

    event.dataTransfer.dropEffect =
      "copy";


    const breaker =
      getDraggedBreaker(
        event
      );


    /*
     * dataTransfer can only be read reliably
     * during drag events in some browsers.
     *
     * If the data isn't available yet,
     * still highlight the slot as a possible
     * drop target.
     */

    const requiredPoles =
      breaker?.poles ??
      1;


    if (
      canPlaceBreaker(
        slotNumber,
        requiredPoles
      )
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
    event: React.DragEvent,
    slotNumber: number
  ): void {

    event.preventDefault();

    event.stopPropagation();


    setDragOverSlot(
      null
    );


    const breaker =
      getDraggedBreaker(
        event
      );


    if (
      !breaker
    ) {

      console.warn(
        "No breaker data found in drag operation."
      );

      return;

    }


    if (
      !canPlaceBreaker(
        slotNumber,
        breaker.poles
      )
    ) {

      return;

    }


    /*
     * The breaker has now been dropped onto
     * a valid physical slot.
     *
     * We don't immediately install it.
     *
     * Instead, open the configuration area
     * so the user can name and configure it.
     */

    setSelectedSlot(
      slotNumber
    );


    setPendingBreaker(
      breaker
    );


    setBreakerName(
      breaker.label &&
      !breaker.label.match(
        /^\d+A/
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
  // SLOT CLICK
  // ==========================================================

  function handleSlotClick(
    slotNumber: number
  ): void {

    const position =
      panelSlots.find(
        item =>
          item.id ===
          slotNumber
      );


    if (
      !position
    ) {

      return;

    }


    /*
     * Clicking an occupied slot selects
     * the installed breaker.
     */

    if (
      position.breaker
    ) {

      const breaker =
        position.breaker;


      setSelectedSlot(
        slotNumber
      );


      setPendingBreaker(
        breaker
      );


      setBreakerName(
        breaker.label
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


      return;

    }


    /*
     * Clicking an empty slot while a breaker
     * is waiting to be configured moves the
     * pending breaker to that slot.
     */

    if (
      pendingBreaker &&
      canPlaceBreaker(
        slotNumber,
        poles
      )
    ) {

      setSelectedSlot(
        slotNumber
      );

    }

  }


  // ==========================================================
  // INSTALL BREAKER
  // ==========================================================

  function handleInstallBreaker(): void {

    if (
      selectedSlot === null
    ) {

      return;

    }


    if (
      !canPlaceBreaker(
        selectedSlot,
        poles
      ) &&
      !(
        pendingBreaker &&
        panelSlots.some(
          position =>
            position.breaker?.id ===
            pendingBreaker.id
        )
      )
    ) {

      return;

    }


    const sourceBreaker =
      pendingBreaker ??
      createLibraryBreaker(
        amperage,
        poles,
        breakerType
      );


    let breaker =
      assignBreakerSlot(
        sourceBreaker,
        selectedSlot
      );


    /*
     * Keep the user's friendly circuit
     * name in the Breaker label.
     */

    const finalName =
      breakerName.trim();


    breaker = {

      ...breaker,

      label:
        finalName ||
        `${amperage}A ${getBreakerTypeLabel(
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
     * Remove an existing breaker if this
     * is a replacement operation.
     */

    const replacingId =
      pendingBreaker?.id;


    setPanelSlots(
      previous => {

        const next =
          previous.map(
            position => {

              /*
               * Remove the old breaker from
               * every physical slot it occupies.
               */

              if (
                replacingId &&
                position.breaker?.id ===
                  replacingId
              ) {

                return {

                  ...position,

                  breaker: null

                };

              }


              return position;

            }
          );


        /*
         * Install the new breaker in the
         * selected physical slot.
         */

        return next.map(
          position => {

            if (
              position.id ===
              selectedSlot
            ) {

              return {

                ...position,

                breaker

              };

            }


            /*
             * Two-pole breakers occupy the
             * following physical slot too.
             *
             * The same breaker object is used
             * so the UI can identify both poles.
             */

            if (
              poles === 2 &&
              position.id ===
                selectedSlot + 1
            ) {

              return {

                ...position,

                breaker

              };

            }


            return position;

          }
        );

      }
    );


    onBreakerInstalled?.(
      breaker
    );


    setPendingBreaker(
      null
    );


    setSelectedSlot(
      selectedSlot
    );

  }


  // ==========================================================
  // REMOVE BREAKER
  // ==========================================================

  function handleRemoveBreaker(): void {

    if (
      selectedSlot === null
    ) {

      return;

    }


    const selected =
      panelSlots.find(
        position =>
          position.id ===
          selectedSlot
      )?.breaker;


    if (
      !selected
    ) {

      return;

    }


    setPanelSlots(
      previous =>
        previous.map(
          position => {

            if (
              position.breaker?.id ===
              selected.id
            ) {

              return {

                ...position,

                breaker: null

              };

            }


            return position;

          }
        )
    );


    onBreakerRemoved?.(
      selected
    );


    setPendingBreaker(
      null
    );


    setSelectedSlot(
      null
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

        width: "390px",

        maxHeight: "85vh",

        overflowY: "auto",

        background:
          "linear-gradient(135deg,#111827,#050505)",

        border:
          "2px solid #00eaff",

        borderRadius:
          "12px",

        padding:
          "18px",

        color:
          "white",

        fontFamily:
          "monospace",

        zIndex:
          1000,

        boxShadow:
          "0 0 25px rgba(0,234,255,.4)",

        boxSizing:
          "border-box"
      }}
    >

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center"
        }}
      >

        <h2
          style={{
            margin:
              0,

            color:
              "#00eaff"
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
              padding:
                "6px 10px",

              background:
                "#3b1010",

              color:
                "#ff8080",

              border:
                "1px solid #ff4040",

              borderRadius:
                "5px",

              cursor:
                "pointer",

              fontWeight:
                800
            }}
          >

            X

          </button>

        )}

      </div>


      {/* =====================================================
          MAIN BREAKER
          ===================================================== */}

      <div
        style={{
          marginTop:
            "15px",

          padding:
            "12px",

          background:
            "#080b10",

          border:
            "1px solid #176070",

          borderRadius:
            "8px"
        }}
      >

        <strong>
          MAIN BREAKER
        </strong>

        <br />

        <span
          style={{
            color:
              "#39ff14",

            fontSize:
              "18px"
          }}
        >

          ● ON

        </span>

        {" "}

        {mainBreaker}A

      </div>


      {/* =====================================================
          BUS
          ===================================================== */}

      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "1fr 1fr",

          gap:
            "8px",

          marginTop:
            "12px"
        }}
      >

        <div
          style={{
            textAlign:
              "center",

            color:
              "#ffcc00",

            background:
              "#050505",

            padding:
              "8px",

            border:
              "1px solid #444",

            borderRadius:
              "5px"
          }}
        >

          L1 BUS

        </div>


        <div
          style={{
            textAlign:
              "center",

            color:
              "#ffcc00",

            background:
              "#050505",

            padding:
              "8px",

            border:
              "1px solid #444",

            borderRadius:
              "5px"
          }}
        >

          L2 BUS

        </div>

      </div>


      {/* =====================================================
          INSTRUCTIONS
          ===================================================== */}

      <div
        style={{
          marginTop:
            "12px",

          padding:
            "10px",

          background:
            "#111827",

          border:
            "1px solid #176070",

          borderRadius:
            "6px",

          color:
            "#aaa",

          fontSize:
            "12px",

          lineHeight:
            1.5
        }}
      >

        Drag a breaker from the Component Library
        onto an available slot.

        <br />

        The slot will open the breaker configuration
        before installation.

      </div>


      {/* =====================================================
          PANEL SLOTS
          ===================================================== */}

      <div
        style={{
          marginTop:
            "15px",

          display:
            "flex",

          flexDirection:
            "column",

          gap:
            "6px",

          maxHeight:
            "300px",

          overflowY:
            "auto",

          paddingRight:
            "5px"
        }}
      >

        {panelSlots.map(
          position => {

            const breaker =
              position.breaker;


            const isSelected =
              selectedSlot ===
              position.id;


            const isDropTarget =
              dragOverSlot ===
              position.id;


            const isOccupied =
              !!breaker;


            const isSecondPole =
              breaker?.poles === 2 &&
              breaker.slot !==
                position.id;


            const canAccept =
              !isOccupied &&
              (
                pendingBreaker
                  ? canPlaceBreaker(
                      position.id,
                      poles
                    )
                  : true
              );


            return (

              <div
                key={
                  `panel-slot-${position.id}`
                }

                onClick={() =>
                  handleSlotClick(
                    position.id
                  )
                }

                onDragOver={event =>
                  handleDragOver(
                    event,
                    position.id
                  )
                }

                onDragLeave={() =>
                  handleDragLeave(
                    position.id
                  )
                }

                onDrop={event =>
                  handleDrop(
                    event,
                    position.id
                  )
                }

                style={{

                  minHeight:
                    "62px",

                  border:
                    isDropTarget
                      ? "3px solid #00ff99"
                      : isSelected
                      ? "2px solid #00eaff"
                      : isOccupied
                      ? "1px solid #39ff14"
                      : "1px solid #444",

                  background:
                    isDropTarget
                      ? "#123b2b"
                      : isOccupied
                      ? "#123b12"
                      : canAccept
                      ? "#080b10"
                      : "#160808",

                  borderRadius:
                    "6px",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  textAlign:
                    "center",

                  cursor:
                    "pointer",

                  padding:
                    "7px",

                  boxSizing:
                    "border-box",

                  transition:
                    ".15s"
                }}
              >

                {breaker ? (

                  <div
                    style={{
                      color:
                        "#39ff14"
                    }}
                  >

                    <strong>
                      SLOT {position.id}
                    </strong>

                    <br />

                    {getDisplayName(
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

                      {getBreakerTypeLabel(
                        breaker.breakerType
                      )}

                      {isSecondPole &&
                        " • 2ND POLE"}

                    </span>

                  </div>

                ) : (

                  <div
                    style={{
                      color:
                        isDropTarget
                          ? "#00ff99"
                          : "#777"
                    }}
                  >

                    <strong>
                      SLOT {position.id}
                    </strong>

                    <br />

                    {isDropTarget
                      ? "DROP HERE"
                      : pendingBreaker &&
                        canPlaceBreaker(
                          position.id,
                          poles
                        )
                      ? "AVAILABLE"
                      : "EMPTY"}

                  </div>

                )}

              </div>

            );

          }
        )}

      </div>


      {/* =====================================================
          CONFIGURATION
          ===================================================== */}

      {(selectedSlot !== null ||
        pendingBreaker !== null) && (

        <div
          style={{
            marginTop:
              "15px",

            padding:
              "12px",

            background:
              "#080b10",

            border:
              "1px solid #176070",

            borderRadius:
              "8px"
          }}
        >

          <h3
            style={{
              marginTop:
                0,

              color:
                "#00eaff"
            }}
          >

            Breaker Configuration

          </h3>


          <div
            style={{
              marginBottom:
                "10px",

              color:
                "#aaa"
            }}
          >

            Selected Slot:{" "}

            <strong
              style={{
                color:
                  "#fff"
              }}
            >
              {selectedSlot}
            </strong>

            {poles === 2 &&
              selectedSlot !== null && (
                <>
                  {" "}—{" "}
                  Slots {selectedSlot}–
                  {selectedSlot + 1}
                </>
              )}

          </div>


          {/* =================================================
              NAME
              ================================================= */}

          <label
            style={{
              display:
                "block",

              marginBottom:
                "5px"
            }}
          >

            Breaker / Circuit Name

          </label>


          <input
            type="text"

            value={
              breakerName
            }

            onChange={event =>
              setBreakerName(
                event.target.value
              )
            }

            placeholder="Kitchen, Bedroom 1, Garage..."

            style={{
              width:
                "100%",

              padding:
                "9px",

              marginBottom:
                "10px",

              boxSizing:
                "border-box",

              background:
                "#111827",

              color:
                "white",

              border:
                "1px solid #176070",

              borderRadius:
                "5px"
            }}
          />


          {/* =================================================
              AMPERAGE
              ================================================= */}

          <label>
            Breaker Size
          </label>


          <select
            value={
              amperage
            }

            onChange={event =>
              setAmperage(
                Number(
                  event.target.value
                )
              )
            }

            style={{
              width:
                "100%",

              padding:
                "9px",

              marginTop:
                "5px",

              marginBottom:
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

            {BREAKER_SIZES.map(
              size => (

                <option
                  key={
                    size
                  }

                  value={
                    size
                  }
                >

                  {size}A

                </option>

              )
            )}

          </select>


          {/* =================================================
              TYPE
              ================================================= */}

          <label>
            Breaker Type
          </label>


          <select
            value={
              breakerType
            }

            onChange={event =>
              setBreakerType(
                event.target.value as BreakerType
              )
            }

            style={{
              width:
                "100%",

              padding:
                "9px",

              marginTop:
                "5px",

              marginBottom:
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


          {/* =================================================
              POLES
              ================================================= */}

          <label>
            Breaker Poles
          </label>


          <select
            value={
              poles
            }

            onChange={event => {

              const value =
                Number(
                  event.target.value
                );


              setPoles(
                value === 2
                  ? 2
                  : 1
              );

            }}

            style={{
              width:
                "100%",

              padding:
                "9px",

              marginTop:
                "5px",

              marginBottom:
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


          {/* =================================================
              VOLTAGE
              ================================================= */}

          <div
            style={{
              padding:
                "9px",

              marginBottom:
                "10px",

              background:
                "#111827",

              border:
                "1px solid #176070",

              borderRadius:
                "5px"
            }}
          >

            Voltage:{" "}

            <strong>

              {poles === 2
                ? "240V"
                : "120V"}

            </strong>

          </div>


          {/* =================================================
              INSTALL
              ================================================= */}

          <button
            onClick={
              handleInstallBreaker
            }

            disabled={
              selectedSlot === null ||
              !canPlaceBreaker(
                selectedSlot,
                poles
              )
            }

            style={{
              width:
                "100%",

              padding:
                "11px",

              background:
                selectedSlot !== null &&
                canPlaceBreaker(
                  selectedSlot,
                  poles
                )
                  ? "#123b12"
                  : "#222",

              color:
                selectedSlot !== null &&
                canPlaceBreaker(
                  selectedSlot,
                  poles
                )
                  ? "#39ff14"
                  : "#777",

              border:
                selectedSlot !== null &&
                canPlaceBreaker(
                  selectedSlot,
                  poles
                )
                  ? "1px solid #39ff14"
                  : "1px solid #444",

              borderRadius:
                "6px",

              fontWeight:
                800,

              cursor:
                selectedSlot !== null &&
                canPlaceBreaker(
                  selectedSlot,
                  poles
                )
                  ? "pointer"
                  : "not-allowed"
            }}
          >

            {pendingBreaker
              ? "INSTALL BREAKER"
              : "INSTALL BREAKER"}

          </button>


          {/* =================================================
              REMOVE
              ================================================= */}

          {pendingBreaker &&
            panelSlots.some(
              position =>
                position.breaker?.id ===
                pendingBreaker.id
            ) && (

              <button
                onClick={
                  handleRemoveBreaker
                }

                style={{
                  width:
                    "100%",

                  padding:
                    "9px",

                  marginTop:
                    "8px",

                  background:
                    "#3b1010",

                  color:
                    "#ff8080",

                  border:
                    "1px solid #ff4040",

                  borderRadius:
                    "6px",

                  fontWeight:
                    800,

                  cursor:
                    "pointer"
                }}
              >

                REMOVE BREAKER

              </button>

            )}

        </div>

      )}

    </div>

  );

}