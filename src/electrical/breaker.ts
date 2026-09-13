// Residential Wiring Simulator
// Electrical Core - Breaker System
//
// Responsibilities:
// - Breaker electrical characteristics
// - Breaker state
// - Breaker bus legs
// - Breaker load terminals
// - Breaker configuration changes
//
// IMPORTANT:
// A breaker is ONE electrical object.
// A two-pole breaker occupies TWO physical panel slots,
// but both slots reference the same Breaker object.

import type {
  BreakerPoles,
  Voltage,
} from "./types";


// ============================================================
// BREAKER TYPE
// ============================================================

export type BreakerType =
  | "STANDARD"
  | "AFCI"
  | "GFCI"
  | "DUAL_FUNCTION";


// ============================================================
// BREAKER STATUS
// ============================================================

export type BreakerStatus =
  | "OFF"
  | "ON"
  | "TRIPPED";


// ============================================================
// PANEL BUS LEG
// ============================================================

export type BreakerBusLeg =
  | "L1"
  | "L2";


// ============================================================
// BREAKER LOAD TERMINAL
// ============================================================

export interface BreakerLoadTerminal {

  id: string;

  type: "LOAD_HOT";

  busLeg: BreakerBusLeg;

}


// ============================================================
// BREAKER
// ============================================================

export interface Breaker {

  /**
   * Unique breaker identifier.
   */
  id: string;


  /**
   * Starting / primary physical panel slot.
   *
   * Single pole:
   *   5
   *
   * Two pole:
   *   5
   *
   * The second physical slot is always slot + 1.
   */
  slot: number;


  /**
   * User-editable circuit / breaker name.
   */
  label: string;


  /**
   * Breaker amperage rating.
   */
  amperage: number;


  /**
   * Number of physical poles.
   */
  poles: BreakerPoles;


  /**
   * Calculated nominal voltage.
   */
  voltage: Voltage;


  /**
   * Breaker protection type.
   */
  breakerType: BreakerType;


  /**
   * Electrical bus legs used by this breaker.
   */
  busLegs: BreakerBusLeg[];


  /**
   * Load-side hot terminals.
   */
  loadTerminals: BreakerLoadTerminal[];


  /**
   * Circuit fed by this breaker.
   */
  circuitId?: string;


  /**
   * Devices connected to this breaker.
   */
  connectedDevices: string[];


  /**
   * Current breaker state.
   */
  status: BreakerStatus;


  /**
   * Whether the breaker is currently energized.
   */
  energized: boolean;


  /**
   * Whether the breaker has tripped.
   */
  tripped: boolean;


  /**
   * Optional explanation for a trip.
   */
  tripReason?: string;

}


// ============================================================
// VALIDATION
// ============================================================

function validateBreakerConfiguration(
  amperage: number,
  poles: BreakerPoles,
): void {

  if (
    !Number.isFinite(amperage) ||
    amperage <= 0
  ) {

    throw new Error(
      "Breaker amperage must be greater than zero.",
    );

  }

  if (
    poles !== 1 &&
    poles !== 2
  ) {

    throw new Error(
      "Breaker poles must be 1 or 2.",
    );

  }

}


// ============================================================
// SLOT VALIDATION
// ============================================================

function validateBreakerSlot(
  slot: number,
): void {

  if (
    !Number.isInteger(slot)
  ) {

    throw new Error(
      "Breaker slot must be an integer.",
    );

  }

  /*
   * -1 means the breaker exists in the library
   * but has not yet been installed.
   */
  if (
    slot === 0 ||
    slot < -1
  ) {

    throw new Error(
      "Breaker slot must be -1 for an uninstalled breaker or a positive panel slot.",
    );

  }

}


// ============================================================
// BUS LEGS
// ============================================================

function determineBusLegs(
  slot: number,
  poles: BreakerPoles,
): BreakerBusLeg[] {

  /*
   * A two-pole breaker always uses both legs.
   */
  if (
    poles === 2
  ) {

    return [
      "L1",
      "L2",
    ];

  }

  /*
   * An uninstalled library breaker has no
   * meaningful physical slot yet.
   */
  if (
    slot === -1
  ) {

    return [
      "L1",
    ];

  }

  /*
   * Physical panel positions alternate legs.
   */
  return [
    slot % 2 === 0
      ? "L2"
      : "L1",
  ];

}


// ============================================================
// LOAD TERMINALS
// ============================================================

function createLoadTerminals(
  id: string,
  busLegs: BreakerBusLeg[],
): BreakerLoadTerminal[] {

  return busLegs.map(
    (busLeg, index) => ({

      id:
        `${id}-load-hot-${index + 1}`,

      type:
        "LOAD_HOT" as const,

      busLeg,

    }),
  );

}


// ============================================================
// CREATE BREAKER
// ============================================================

export function createBreaker(
  id: string,
  slot: number,
  amperage: number,
  poles: BreakerPoles,
  breakerType: BreakerType = "STANDARD",
  label?: string,
): Breaker {

  validateBreakerConfiguration(
    amperage,
    poles,
  );

  validateBreakerSlot(
    slot,
  );

  const busLegs =
    determineBusLegs(
      slot,
      poles,
    );

  return {

    id,

    slot,

    label:
      label?.trim() ||
      `${amperage}A ${breakerType}`,

    amperage,

    poles,

    voltage:
      poles === 2
        ? 240
        : 120,

    breakerType,

    busLegs,

    loadTerminals:
      createLoadTerminals(
        id,
        busLegs,
      ),

    connectedDevices: [],

    status: "OFF",

    energized: false,

    tripped: false,

  };

}


// ============================================================
// LIBRARY BREAKER
// ============================================================

export function createLibraryBreaker(
  amperage: number,
  poles: BreakerPoles,
  breakerType: BreakerType = "STANDARD",
): Breaker {

  const id =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `breaker-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  return createBreaker(
    id,
    -1,
    amperage,
    poles,
    breakerType,
  );

}


// ============================================================
// ASSIGN SLOT
// ============================================================

export function assignBreakerSlot(
  breaker: Breaker,
  slot: number,
): Breaker {

  validateBreakerSlot(
    slot,
  );

  const busLegs =
    determineBusLegs(
      slot,
      breaker.poles,
    );

  return {

    ...breaker,

    slot,

    voltage:
      breaker.poles === 2
        ? 240
        : 120,

    busLegs,

    loadTerminals:
      createLoadTerminals(
        breaker.id,
        busLegs,
      ),

  };

}


// ============================================================
// RENAME BREAKER
// ============================================================

export function renameBreaker(
  breaker: Breaker,
  label: string,
): Breaker {

  return {

    ...breaker,

    label:
      label.trim(),

  };

}


// ============================================================
// CHANGE AMPERAGE
// ============================================================

export function changeBreakerAmperage(
  breaker: Breaker,
  amperage: number,
): Breaker {

  validateBreakerConfiguration(
    amperage,
    breaker.poles,
  );

  return {

    ...breaker,

    amperage,

  };

}


// ============================================================
// CHANGE TYPE
// ============================================================

export function changeBreakerType(
  breaker: Breaker,
  breakerType: BreakerType,
): Breaker {

  return {

    ...breaker,

    breakerType,

  };

}


// ============================================================
// CHANGE POLES
// ============================================================

export function changeBreakerPoles(
  breaker: Breaker,
  poles: BreakerPoles,
): Breaker {

  validateBreakerConfiguration(
    breaker.amperage,
    poles,
  );

  const busLegs =
    determineBusLegs(
      breaker.slot,
      poles,
    );

  return {

    ...breaker,

    poles,

    voltage:
      poles === 2
        ? 240
        : 120,

    busLegs,

    loadTerminals:
      createLoadTerminals(
        breaker.id,
        busLegs,
      ),

  };

}


// ============================================================
// TRIP
// ============================================================

export function tripBreaker(
  breaker: Breaker,
  reason: string,
): Breaker {

  return {

    ...breaker,

    status: "TRIPPED",

    energized: false,

    tripped: true,

    tripReason: reason,

  };

}


// ============================================================
// RESET
// ============================================================

export function resetBreaker(
  breaker: Breaker,
): Breaker {

  return {

    ...breaker,

    status: "OFF",

    energized: false,

    tripped: false,

    tripReason: undefined,

  };

}


// ============================================================
// ENERGIZE
// ============================================================

export function energizeBreaker(
  breaker: Breaker,
): Breaker {

  if (
    breaker.tripped
  ) {

    return breaker;

  }

  return {

    ...breaker,

    status: "ON",

    energized: true,

  };

}


// ============================================================
// DE-ENERGIZE
// ============================================================

export function deenergizeBreaker(
  breaker: Breaker,
): Breaker {

  return {

    ...breaker,

    status: "OFF",

    energized: false,

  };

}


// ============================================================
// CONNECT DEVICE
// ============================================================

export function connectDeviceToBreaker(
  breaker: Breaker,
  deviceId: string,
): Breaker {

  if (
    breaker.connectedDevices.includes(
      deviceId,
    )
  ) {

    return breaker;

  }

  return {

    ...breaker,

    connectedDevices: [

      ...breaker.connectedDevices,

      deviceId,

    ],

  };

}


// ============================================================
// DISCONNECT DEVICE
// ============================================================

export function disconnectDeviceFromBreaker(
  breaker: Breaker,
  deviceId: string,
): Breaker {

  return {

    ...breaker,

    connectedDevices:
      breaker.connectedDevices.filter(
        id =>
          id !== deviceId,
      ),

  };

}


// ============================================================
// ASSIGN CIRCUIT
// ============================================================

export function assignCircuitToBreaker(
  breaker: Breaker,
  circuitId: string,
): Breaker {

  return {

    ...breaker,

    circuitId,

  };

}


// ============================================================
// CLEAR CIRCUIT
// ============================================================

export function clearBreakerCircuit(
  breaker: Breaker,
): Breaker {

  return {

    ...breaker,

    circuitId: undefined,

  };

}


// ============================================================
// HELPERS
// ============================================================

export function isSinglePoleBreaker(
  breaker: Breaker,
): boolean {

  return breaker.poles === 1;

}


export function isDoublePoleBreaker(
  breaker: Breaker,
): boolean {

  return breaker.poles === 2;

}


export function supplies240Volts(
  breaker: Breaker,
): boolean {

  return (
    breaker.poles === 2 &&
    breaker.voltage === 240
  );

}


export function isOperational(
  breaker: Breaker,
): boolean {

  return (
    breaker.status === "ON" &&
    breaker.energized &&
    !breaker.tripped
  );

}


export function getBreakerBusLegs(
  breaker: Breaker,
): BreakerBusLeg[] {

  return [
    ...breaker.busLegs,
  ];

}


export function getBreakerLoadTerminals(
  breaker: Breaker,
): BreakerLoadTerminal[] {

  return [
    ...breaker.loadTerminals,
  ];

}