// Residential Wiring Simulator v3.3
// Breaker Panel Internal Layout
//
// Supports:
// - Installing breakers
// - Editing installed breakers
// - Renaming breakers/circuits
// - Changing breaker amperage
// - Changing breaker type
// - Changing pole count
// - Changing panel main breaker amperage
// - Removing breakers
// - Native drag/drop support
//
// IMPORTANT:
// Use React's DragEvent type explicitly as ReactDragEvent.
// This avoids conflict with the browser DOM DragEvent type.

import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import type {
  DragEvent as ReactDragEvent
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

import {
  BREAKER_DRAG_EVENT,
  BREAKER_DRAG_END_EVENT
} from "./ComponentLibrary";


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

  onMainBreakerChanged?: (
    amperage: number
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
// MAIN BREAKER SIZES
// ============================================================

const MAIN_BREAKER_SIZES = [
  60,
  80,
  100,
  125,
  150,
  175,
  200,
  225,
  300,
  400
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
// POLES
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
// MAKE SLOTS
// ============================================================

function makeSlots(
  count: number
): PanelSlot[] {

  return Array.from(
    {
      length: Math.max(1, count)
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
// BREAKER VALIDATION
// ============================================================

function isValidBreaker(
  value: unknown
): value is Breaker {

  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const breaker =
    value as Partial<Breaker>;

  return (

    typeof breaker.id === "string" &&

    typeof breaker.amperage === "number" &&

    (
      breaker.poles === 1 ||
      breaker.poles === 2
    ) &&

    (
      breaker.breakerType === "STANDARD" ||
      breaker.breakerType === "GFCI" ||
      breaker.breakerType === "AFCI" ||
      breaker.breakerType === "DUAL_FUNCTION"
    )

  );
}


// ============================================================
// READ BREAKER FROM DROP
// ============================================================

function readDraggedBreaker(
  event: ReactDragEvent<HTMLDivElement>
): Breaker | null {

  const dataTransfer =
    event.dataTransfer;

  if (!dataTransfer) {
    return null;
  }


  // ----------------------------------------------------------
  // APPLICATION/JSON
  // ----------------------------------------------------------

  try {

    const json =
      dataTransfer.getData(
        "application/json"
      );

    if (json) {

      const parsed =
        JSON.parse(json) as unknown;

      if (
        isValidBreaker(parsed)
      ) {

        return parsed;

      }

    }

  } catch {
    // Continue to other formats.
  }


  // ----------------------------------------------------------
  // BREAKER
  // ----------------------------------------------------------

  try {

    const json =
      dataTransfer.getData(
        "breaker"
      );

    if (json) {

      const parsed =
        JSON.parse(json) as unknown;

      if (
        isValidBreaker(parsed)
      ) {

        return parsed;

      }

    }

  } catch {
    // Continue to text/plain.
  }


  // ----------------------------------------------------------
  // TEXT
  // ----------------------------------------------------------

  try {

    const json =
      dataTransfer.getData(
        "text/plain"
      );

    if (json) {

      const parsed =
        JSON.parse(json) as unknown;

      if (
        isValidBreaker(parsed)
      ) {

        return parsed;

      }

    }

  } catch {
    // Not a breaker payload.
  }


  return null;
}


// ============================================================
// CAN DROP
// ============================================================

function canDropBreaker(
  breaker: Breaker,
  slotNumber: number,
  panelSlots: PanelSlot[]
): boolean {

  const firstIndex =
    slotNumber - 1;


  if (
    firstIndex < 0 ||
    firstIndex >= panelSlots.length
  ) {

    return false;

  }


  const first =
    panelSlots[firstIndex];


  if (
    !first ||
    first.breaker
  ) {

    return false;

  }


  // ----------------------------------------------------------
  // ONE POLE
  // ----------------------------------------------------------

  if (
    breaker.poles === 1
  ) {

    return true;

  }


  // ----------------------------------------------------------
  // TWO POLE
  // ----------------------------------------------------------

  const second =
    panelSlots[firstIndex + 1];


  if (
    !second ||
    second.breaker
  ) {

    return false;

  }


  return true;
}


// ============================================================
// FIND BREAKER START SLOT
//
// A two-pole breaker is stored in both physical slots.
// Therefore clicking either physical slot must resolve back
// to the first/starting slot.
//
// The panel array itself is the source of truth.
// ============================================================

function findBreakerStartSlot(
  breakerId: string,
  panelSlots: PanelSlot[]
): number | null {

  const index =
    panelSlots.findIndex(
      slot =>
        slot.breaker?.id ===
        breakerId
    );


  if (
    index === -1
  ) {

    return null;

  }


  return (
    index + 1
  );
}


// ============================================================
// GET BREAKER LABEL
// ============================================================

function getBreakerLabel(
  breaker: Breaker
): string {

  return (
    breaker.label ||
    `${breaker.amperage}A ${getTypeLabel(
      breaker.breakerType
    )}`
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
// COMPONENT
// ============================================================

export default function BreakerPanelLayout({

  panelName,

  mainBreaker,

  slots = 24,

  onClose,

  onBreakerInstalled,

  onBreakerRemoved,

  onMainBreakerChanged

}: BreakerPanelLayoutProps) {


  // ==========================================================
  // PANEL SLOTS
  // ==========================================================

  const [
    panelSlots,
    setPanelSlots
  ] = useState<PanelSlot[]>(
    () =>
      makeSlots(slots)
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
  // ACTIVE DRAG BREAKER
  // ==========================================================

  const draggingBreakerRef =
    useRef<Breaker | null>(null);

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
  // PENDING / EDITING BREAKER
  // ==========================================================

  const [
    pendingBreaker,
    setPendingBreaker
  ] = useState<Breaker | null>(
    null
  );


  // ==========================================================
  // BREAKER NAME
  // ==========================================================

  const [
    breakerName,
    setBreakerName
  ] = useState("");


  // ==========================================================
  // AMPERAGE
  // ==========================================================

  const [
    amperage,
    setAmperage
  ] = useState(20);


  // ==========================================================
  // BREAKER TYPE
  // ==========================================================

  const [
    breakerType,
    setBreakerType
  ] = useState<BreakerType>(
    "STANDARD"
  );


  // ==========================================================
  // POLES
  // ==========================================================

  const [
    poles,
    setPoles
  ] = useState<BreakerPoles>(
    1
  );


  // ==========================================================
  // MAIN BREAKER
  // ==========================================================

  const [
    panelMainBreaker,
    setPanelMainBreaker
  ] = useState(
    mainBreaker
  );


  // ==========================================================
  // SYNC MAIN BREAKER
  // ==========================================================

  useEffect(() => {

    setPanelMainBreaker(
      mainBreaker
    );

  }, [
    mainBreaker
  ]);


  // ==========================================================
  // SYNC SLOT COUNT
  // ==========================================================

  useEffect(() => {

    setPanelSlots(
      previous => {

        if (
          previous.length === slots
        ) {

          return previous;

        }


        const next =
          makeSlots(slots);


        previous.forEach(
          existing => {

            if (
              existing.id <=
              next.length
            ) {

              next[
                existing.id - 1
              ].breaker =
                existing.breaker;

            }

          }
        );


        return next;

      }
    );

  }, [
    slots
  ]);


  // ==========================================================
  // DETERMINE WHETHER SELECTED BREAKER IS INSTALLED
  // ==========================================================

  const isEditingInstalledBreaker =
    useMemo(() => {

      if (
        !pendingBreaker
      ) {

        return false;

      }


      return panelSlots.some(
        slot =>
          slot.breaker?.id ===
          pendingBreaker.id
      );

    }, [
      pendingBreaker,
      panelSlots
    ]);


  // ==========================================================
  // CAPTURE BREAKER DRAG
  // ==========================================================

  useEffect(() => {

    function handleBreakerDrag(
      event: Event
    ): void {

      const customEvent =
        event as CustomEvent<unknown>;

      const breaker =
        customEvent.detail;


      if (
        !isValidBreaker(
          breaker
        )
      ) {

        console.warn(
          "[BreakerPanelLayout] Invalid drag event:",
          breaker
        );

        return;

      }


      draggingBreakerRef.current =
        breaker;

      setDraggingBreaker(
        breaker
      );

      setDragOverSlot(
        null
      );

    }


    function handleBreakerDragEnd(): void {

      draggingBreakerRef.current =
        null;

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

      const result =
        new Set<number>();


      const breaker =
        draggingBreakerRef.current ||
        draggingBreaker;


      if (!breaker) {

        return result;

      }


      for (
        let index = 0;
        index < panelSlots.length;
        index++
      ) {

        const slotNumber =
          index + 1;


        if (
          canDropBreaker(
            breaker,
            slotNumber,
            panelSlots
          )
        ) {

          result.add(
            slotNumber
          );

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

    draggingBreakerRef.current =
      null;

    setDraggingBreaker(
      null
    );

    setDragOverSlot(
      null
    );

  }


  // ==========================================================
  // DRAG ENTER
  // ==========================================================

  function handleDragEnter(
    event: ReactDragEvent<HTMLDivElement>,
    slotNumber: number
  ): void {

    event.preventDefault();
    event.stopPropagation();


    const breaker =
      draggingBreakerRef.current;


    if (!breaker) {

      return;

    }


    if (
      canDropBreaker(
        breaker,
        slotNumber,
        panelSlots
      )
    ) {

      setDragOverSlot(
        slotNumber
      );

    }

  }


  // ==========================================================
  // DRAG OVER
  // ==========================================================

  function handleDragOver(
    event: ReactDragEvent<HTMLDivElement>,
    slotNumber: number
  ): void {

    event.preventDefault();
    event.stopPropagation();


    const breaker =
      draggingBreakerRef.current;


    if (!breaker) {

      event.dataTransfer.dropEffect =
        "none";

      return;

    }


    const valid =
      canDropBreaker(
        breaker,
        slotNumber,
        panelSlots
      );


    if (valid) {

      event.dataTransfer.dropEffect =
        "copy";

      setDragOverSlot(
        slotNumber
      );

    } else {

      event.dataTransfer.dropEffect =
        "none";

      setDragOverSlot(
        null
      );

    }

  }


  // ==========================================================
  // DRAG LEAVE
  // ==========================================================

  function handleDragLeave(
    event: ReactDragEvent<HTMLDivElement>,
    slotNumber: number
  ): void {

    event.stopPropagation();


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
    event: ReactDragEvent<HTMLDivElement>,
    slotNumber: number
  ): void {

    event.preventDefault();
    event.stopPropagation();


    let breaker =
      draggingBreakerRef.current;


    if (!breaker) {

      breaker =
        readDraggedBreaker(
          event
        );

    }


    if (!breaker) {

      console.error(
        "[BreakerPanelLayout] Drop failed: no breaker."
      );

      clearDragState();

      return;

    }


    if (
      !canDropBreaker(
        breaker,
        slotNumber,
        panelSlots
      )
    ) {

      console.warn(
        "[BreakerPanelLayout] Invalid drop:",
        slotNumber
      );

      clearDragState();

      return;

    }


    // --------------------------------------------------------
    // OPEN CONFIGURATION
    // --------------------------------------------------------

    setPendingBreaker(
      breaker
    );

    setSelectedSlot(
      slotNumber
    );


    // --------------------------------------------------------
    // LOAD NAME
    //
    // Preserve a real custom circuit name.
    // Generic generated labels are replaced by the editor
    // placeholder instead.
    // --------------------------------------------------------

    setBreakerName(
      breaker.label &&
      !breaker.label.startsWith(
        `${breaker.amperage}A`
      )
        ? breaker.label
        : ""
    );


    // --------------------------------------------------------
    // LOAD SETTINGS
    // --------------------------------------------------------

    setAmperage(
      breaker.amperage
    );

    setBreakerType(
      breaker.breakerType
    );

    setPoles(
      breaker.poles
    );


    clearDragState();

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


    const configuredBreaker: Breaker = {

      ...pendingBreaker,

      amperage,

      breakerType,

      poles,

      voltage:
        poles === 2
          ? 240
          : 120,

      label:
        breakerName.trim() ||
        `${amperage}A ${getTypeLabel(
          breakerType
        )}`

    };


    // --------------------------------------------------------
    // Verify placement.
    // --------------------------------------------------------

    if (
      !canDropBreaker(
        configuredBreaker,
        selectedSlot,
        panelSlots
      )
    ) {

      alert(
        "The selected slot is no longer available."
      );

      return;

    }


    // --------------------------------------------------------
    // Assign physical starting slot.
    // --------------------------------------------------------

    const installed =
      assignBreakerSlot(
        configuredBreaker,
        selectedSlot
      );


    const finalBreaker: Breaker = {

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


    // --------------------------------------------------------
    // Put breaker into physical slot(s).
    // --------------------------------------------------------

    setPanelSlots(
      previous => {

        return previous.map(
          item => {

            if (
              item.id ===
              selectedSlot
            ) {

              return {
                ...item,
                breaker:
                  finalBreaker
              };

            }


            if (
              finalBreaker.poles === 2 &&
              item.id ===
              selectedSlot + 1
            ) {

              return {
                ...item,
                breaker:
                  finalBreaker
              };

            }


            return item;

          }
        );

      }
    );


    onBreakerInstalled?.(
      finalBreaker
    );


    // --------------------------------------------------------
    // CLOSE CONFIGURATION.
    // --------------------------------------------------------

    setPendingBreaker(
      null
    );

    setSelectedSlot(
      null
    );

    clearDragState();

  }


  // ==========================================================
  // UPDATE EXISTING BREAKER
  // ==========================================================

  function updateBreaker(): void {

    if (
      !pendingBreaker
    ) {

      return;

    }


    // --------------------------------------------------------
    // Find the physical starting slot from actual panel state.
    // --------------------------------------------------------

    const firstSlot =
      findBreakerStartSlot(
        pendingBreaker.id,
        panelSlots
      );


    if (
      firstSlot === null
    ) {

      installBreaker();

      return;

    }


    // --------------------------------------------------------
    // Create updated breaker.
    // --------------------------------------------------------

    const updated: Breaker = {

      ...pendingBreaker,

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


    // --------------------------------------------------------
    // Remove ALL physical positions of old breaker.
    // --------------------------------------------------------

    const withoutOld =
      panelSlots.map(
        item => {

          if (
            item.breaker?.id ===
            pendingBreaker.id
          ) {

            return {
              ...item,
              breaker: null
            };

          }


          return item;

        }
      );


    // --------------------------------------------------------
    // Check whether new configuration fits.
    // --------------------------------------------------------

    if (
      !canDropBreaker(
        updated,
        firstSlot,
        withoutOld
      )
    ) {

      alert(
        "The new breaker configuration does not fit in the selected panel slots."
      );

      return;

    }


    // --------------------------------------------------------
    // Assign updated breaker to its starting slot.
    // --------------------------------------------------------

    const assigned =
      assignBreakerSlot(
        updated,
        firstSlot
      );


    const finalBreaker: Breaker = {

      ...assigned,

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


    // --------------------------------------------------------
    // Put updated breaker into physical slot(s).
    // --------------------------------------------------------

    const updatedPanel =
      withoutOld.map(
        item => {

          if (
            item.id ===
            firstSlot
          ) {

            return {
              ...item,
              breaker:
                finalBreaker
            };

          }


          if (
            finalBreaker.poles === 2 &&
            item.id ===
            firstSlot + 1
          ) {

            return {
              ...item,
              breaker:
                finalBreaker
            };

          }


          return item;

        }
      );


    setPanelSlots(
      updatedPanel
    );


    // --------------------------------------------------------
    // Notify parent.
    // --------------------------------------------------------

    onBreakerInstalled?.(
      finalBreaker
    );


    // --------------------------------------------------------
    // Keep editor open.
    // --------------------------------------------------------

    setPendingBreaker(
      finalBreaker
    );

    setSelectedSlot(
      firstSlot
    );

    setBreakerName(
      breakerName.trim()
    );

    setAmperage(
      amperage
    );

    setBreakerType(
      breakerType
    );

    setPoles(
      poles
    );

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
                breaker: null
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

    setBreakerName(
      ""
    );

  }


  // ==========================================================
  // SELECT SLOT
  // ==========================================================

  function selectSlot(
    slotNumber: number
  ): void {

    const slot =
      panelSlots.find(
        item =>
          item.id ===
          slotNumber
      );


    if (!slot) {

      return;

    }


    setSelectedSlot(
      slotNumber
    );


    // --------------------------------------------------------
    // EMPTY SLOT
    // --------------------------------------------------------

    if (
      !slot.breaker
    ) {

      setPendingBreaker(
        null
      );

      setBreakerName(
        ""
      );

      return;

    }


    // --------------------------------------------------------
    // INSTALLED BREAKER
    // --------------------------------------------------------

    const breaker =
      slot.breaker;


    setPendingBreaker(
      breaker
    );


    // --------------------------------------------------------
    // IMPORTANT:
    //
    // Always load the actual stored label.
    //
    // This makes:
    // Bedroom
    // Kitchen
    // Dishwasher
    // Garage
    // HVAC
    //
    // appear immediately when clicked.
    // --------------------------------------------------------

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
  // MAIN BREAKER CHANGE
  // ==========================================================

  function handleMainBreakerChange(
    value: number
  ): void {

    setPanelMainBreaker(
      value
    );

    onMainBreakerChanged?.(
      value
    );

  }


  // ==========================================================
  // CLOSE SETTINGS
  // ==========================================================

  function closeBreakerSettings(): void {

    setPendingBreaker(
      null
    );

    setSelectedSlot(
      null
    );

    setBreakerName(
      ""
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

        pointerEvents:
          "auto",

        boxShadow:
          "0 0 25px rgba(0,234,255,.4)"

      }}
    >

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

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

              background:
                "#3b1010",

              color:
                "#ff8080",

              border:
                "1px solid #ff4040",

              borderRadius:
                "5px",

              padding:
                "6px 10px",

              cursor:
                "pointer"

            }}
          >
            X
          </button>

        )}

      </div>


      {/* ================================================== */}
      {/* PANEL SETTINGS */}
      {/* ================================================== */}

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

        <div
          style={{

            color:
              "#00eaff",

            fontWeight:
              800,

            marginBottom:
              "10px"

          }}
        >
          PANEL SETTINGS
        </div>


        <label>
          Main Breaker
        </label>


        <select
          value={
            panelMainBreaker
          }

          onChange={
            event =>
              handleMainBreakerChange(
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

          {MAIN_BREAKER_SIZES.map(
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


        <div
          style={{

            marginTop:
              "8px",

            color:
              "#777",

            fontSize:
              "11px"

          }}
        >
          Panel service/main breaker size
        </div>

      </div>


      {/* ================================================== */}
      {/* MAIN BREAKER */}
      {/* ================================================== */}

      <div
        style={{

          marginTop:
            "15px",

          padding:
            "12px",

          background:
            "#222",

          borderRadius:
            "8px"

        }}
      >

        MAIN BREAKER

        <br />

        <span
          style={{

            color:
              "#39ff14",

            fontSize:
              "20px"

          }}
        >
          ● ON
        </span>

        {" "}

        {panelMainBreaker}A

      </div>


      {/* ================================================== */}
      {/* BUS */}
      {/* ================================================== */}

      <div
        style={{

          display:
            "grid",

          gridTemplateColumns:
            "1fr 1fr",

          gap:
            "8px",

          marginTop:
            "15px"

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
              "8px"

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
              "8px"

          }}
        >
          L2 BUS
        </div>

      </div>


      {/* ================================================== */}
      {/* DRAG ACTIVE */}
      {/* ================================================== */}

      {draggingBreaker && (

        <div
          style={{

            marginTop:
              "12px",

            padding:
              "10px",

            background:
              "#063b2d",

            border:
              "1px solid #00ff99",

            borderRadius:
              "7px",

            color:
              "#00ff99",

            textAlign:
              "center",

            fontWeight:
              800

          }}
        >

          DROP LOCATION ACTIVE

          <br />

          {draggingBreaker.amperage}A{" "}

          {draggingBreaker.poles === 2
            ? "2-POLE / 240V"
            : "1-POLE / 120V"
          }

          <br />

          {draggingBreaker.poles === 2
            ? "Choose two consecutive highlighted slots"
            : "Choose a highlighted slot"
          }

        </div>

      )}


      {/* ================================================== */}
      {/* SLOTS */}
      {/* ================================================== */}

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


            const breakerStartSlot =
              breaker
                ? findBreakerStartSlot(
                    breaker.id,
                    panelSlots
                  )
                : null;


            const isSecondPole =
              breaker?.poles === 2 &&
              breakerStartSlot !== null &&
              slot.id !== breakerStartSlot;


            return (

              <div
                key={
                  `panel-slot-${slot.id}`
                }

                onDragEnter={
                  event =>
                    handleDragEnter(
                      event,
                      slot.id
                    )
                }

                onDragOver={
                  event =>
                    handleDragOver(
                      event,
                      slot.id
                    )
                }

                onDragLeave={
                  event =>
                    handleDragLeave(
                      event,
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
                    "all .15s",

                  opacity:
                    isSecondPole
                      ? 0.9
                      : 1

                }}
              >

                {breaker ? (

                  <div
                    style={{

                      color:
                        "#39ff14",

                      textAlign:
                        "center",

                      width:
                        "100%"

                    }}
                  >

                    <strong>
                      SLOT {slot.id}
                    </strong>


                    {isSecondPole && (
                      <>
                        {" "}
                        <span
                          style={{
                            color:
                              "#ffcc00"
                          }}
                        >
                          2-POLE
                        </span>
                      </>
                    )}

                    <br />


                    <span
                      style={{

                        fontSize:
                          "15px",

                        fontWeight:
                          800

                      }}
                    >
                      {getBreakerLabel(
                        breaker
                      )}
                    </span>

                    <br />

                    {breaker.amperage}A{" "}

                    {breaker.poles === 2
                      ? "2P / 240V"
                      : "1P / 120V"
                    }

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

                    <br />

                    <span
                      style={{

                        fontSize:
                          "9px",

                        color:
                          "#00eaff"

                      }}
                    >
                      CLICK TO EDIT
                    </span>

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
                      : "EMPTY"
                    }

                  </div>

                )}

              </div>

            );

          }
        )}

      </div>


      {/* ================================================== */}
      {/* BREAKER SETTINGS */}
      {/* ================================================== */}

      {pendingBreaker && (

        <div
          style={{

            marginTop:
              "15px",

            padding:
              "12px",

            background:
              "#080b10",

            border:
              "1px solid #00eaff",

            borderRadius:
              "8px"

          }}
        >

          {/* ================================================= */}
          {/* TITLE */}
          {/* ================================================= */}

          <h3
            style={{

              marginTop:
                0,

              color:
                "#00eaff"

            }}
          >

            {isEditingInstalledBreaker
              ? "EDIT BREAKER"
              : "NEW BREAKER"
            }

          </h3>


          {/* ================================================= */}
          {/* SELECTED SLOT */}
          {/* ================================================= */}

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
                {selectedSlot + 1}
              </>

            )}

          </div>


          {/* ================================================= */}
          {/* NAME */}
          {/* ================================================= */}

          <label
            style={{
              display:
                "block",
              fontWeight:
                800
            }}
          >
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

            placeholder="Bedroom, Kitchen, Dishwasher..."

            autoComplete="off"

            style={{

              width:
                "100%",

              boxSizing:
                "border-box",

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
          />


          {/* ================================================= */}
          {/* AMPERAGE */}
          {/* ================================================= */}

          <label
            style={{
              display:
                "block",
              fontWeight:
                800
            }}
          >
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

          <label
            style={{
              display:
                "block",
              fontWeight:
                800
            }}
          >
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


          {/* ================================================= */}
          {/* POLES */}
          {/* ================================================= */}

          <label
            style={{
              display:
                "block",
              fontWeight:
                800
            }}
          >
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


          {/* ================================================= */}
          {/* VOLTAGE */}
          {/* ================================================= */}

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
                : "120V"
              }
            </strong>

          </div>


          {/* ================================================= */}
          {/* SAVE / UPDATE */}
          {/* ================================================= */}

          {isEditingInstalledBreaker ? (

            <button
              onClick={
                updateBreaker
              }

              style={{

                width:
                  "100%",

                padding:
                  "11px",

                background:
                  "#123b12",

                color:
                  "#39ff14",

                border:
                  "1px solid #39ff14",

                borderRadius:
                  "6px",

                fontWeight:
                  800,

                cursor:
                  "pointer"

              }}
            >
              UPDATE BREAKER
            </button>

          ) : (

            <button
              onClick={
                installBreaker
              }

              style={{

                width:
                  "100%",

                padding:
                  "11px",

                background:
                  "#123b12",

                color:
                  "#39ff14",

                border:
                  "1px solid #39ff14",

                borderRadius:
                  "6px",

                fontWeight:
                  800,

                cursor:
                  "pointer"

              }}
            >
              INSTALL BREAKER
            </button>

          )}


          {/* ================================================= */}
          {/* REMOVE */}
          {/* ================================================= */}

          {isEditingInstalledBreaker && (

            <button
              onClick={() =>
                removeBreaker(
                  pendingBreaker
                )
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


          {/* ================================================= */}
          {/* CLOSE */}
          {/* ================================================= */}

          <button
            onClick={
              closeBreakerSettings
            }

            style={{

              width:
                "100%",

              padding:
                "9px",

              marginTop:
                "8px",

              background:
                "#222",

              color:
                "#aaa",

              border:
                "1px solid #555",

              borderRadius:
                "6px",

              fontWeight:
                800,

              cursor:
                "pointer"

            }}
          >
            CLOSE SETTINGS
          </button>

        </div>

      )}


      {/* ================================================== */}
      {/* DEFAULT MESSAGE */}
      {/* ================================================== */}

      {!draggingBreaker &&
       !pendingBreaker && (

        <div
          style={{

            marginTop:
              "15px",

            padding:
              "10px",

            background:
              "#222",

            borderRadius:
              "8px",

            color:
              "#aaa",

            textAlign:
              "center"

          }}
        >

          Click an installed breaker
          to edit its name and settings.

          <br />

          <span
            style={{

              fontSize:
                "11px",

              color:
                "#777"

            }}
          >
            Example: Bedroom, Kitchen,
            Dishwasher, Garage, HVAC.

          </span>

        </div>

      )}

    </div>

  );

}