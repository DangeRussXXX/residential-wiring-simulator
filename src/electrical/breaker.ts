// Residential Wiring Simulator
// Electrical Core - Breaker System
//
// Design goals:
// - A breaker protects a circuit.
// - A breaker connects to one or two hot bus legs.
// - A breaker does NOT contain neutral or ground terminals.
// - Neutral and ground belong to the panel/bus system.
// - Single-pole breakers supply one hot leg.
// - Double-pole breakers supply L1 + L2.
// - Breaker state is independent.
// - Protection type is modeled independently from the circuit.
//
// This is the electrical-core foundation for the full-house simulator.

import type {
  BreakerPoles,
  Voltage
} from "./types";


// ============================================================
// Breaker Type
// ============================================================

export type BreakerType =
  | "STANDARD"
  | "AFCI"
  | "GFCI"
  | "DUAL_FUNCTION";


// ============================================================
// Breaker Status
// ============================================================

export type BreakerStatus =
  | "OFF"
  | "ON"
  | "TRIPPED";


// ============================================================
// Panel Bus Leg
// ============================================================
//
// A breaker connects to the panel's hot bus.
//
// IMPORTANT:
// Neutral and ground are NOT breaker bus legs.
//
// Single pole:
//   L1 OR L2
//
// Double pole:
//   L1 AND L2
//

export type BreakerBusLeg =
  | "L1"
  | "L2";


// ============================================================
// Breaker Load Terminal
// ============================================================
//
// This is the conductor/load-side connection leaving the breaker.
//
// The breaker itself does not own the neutral or grounding
// conductor.
//

export interface BreakerLoadTerminal {

  id: string;

  type: "LOAD_HOT";

  busLeg: BreakerBusLeg;

}


// ============================================================
// Breaker
// ============================================================

export interface Breaker {

  /**
   * Unique breaker identifier.
   */
  id: string;


  /**
   * Physical panel position.
   *
   * For a two-pole breaker this represents the
   * starting slot/position.
   */
  slot: number;


  /**
   * Human-readable breaker label.
   */
  label: string;


  /**
   * Overcurrent protection rating in amperes.
   */
  amperage: number;


  /**
   * Number of poles.
   *
   * 1 = single pole
   * 2 = double pole
   */
  poles: BreakerPoles;


  /**
   * Nominal circuit voltage.
   *
   * Single pole = 120V
   * Double pole = 240V
   */
  voltage: Voltage;


  /**
   * Type of protection provided.
   */
  breakerType: BreakerType;


  /**
   * Hot bus legs supplied by this breaker.
   *
   * Single pole:
   *   ["L1"] or ["L2"]
   *
   * Double pole:
   *   ["L1", "L2"]
   */
  busLegs: BreakerBusLeg[];


  /**
   * Load-side hot terminals.
   *
   * One terminal for each breaker pole.
   */
  loadTerminals: BreakerLoadTerminal[];


  /**
   * Circuit supplied by this breaker.
   */
  circuitId?: string;


  /**
   * Devices associated with the circuit.
   *
   * Kept for compatibility with the current application.
   *
   * The long-term electrical model should resolve
   * device connectivity through the electrical graph.
   */
  connectedDevices: string[];


  /**
   * Current operating state.
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
   * Explanation for the most recent trip.
   */
  tripReason?: string;

}


// ============================================================
// Breaker Configuration Validation
// ============================================================

function validateBreakerConfiguration(
  amperage: number,
  poles: BreakerPoles
): void {

  if (!Number.isFinite(amperage) || amperage <= 0) {

    throw new Error(
      "Breaker amperage must be greater than zero."
    );

  }


  if (poles !== 1 && poles !== 2) {

    throw new Error(
      "Breaker poles must be 1 or 2."
    );

  }

}


// ============================================================
// Determine Bus Legs
// ============================================================
//
// The panel ultimately decides which physical bus position
// a breaker occupies.
//
// For now:
// - slot parity determines the default hot leg.
//
// This keeps the breaker model independent from the panel
// while giving us deterministic L1/L2 behavior.
//
// Later the panel can explicitly assign the bus legs.
//

function determineBusLegs(
  slot: number,
  poles: BreakerPoles
): BreakerBusLeg[] {

  if (poles === 2) {

    return [
      "L1",
      "L2"
    ];

  }


  const isEvenSlot =
    slot % 2 === 0;


  return [
    isEvenSlot
      ? "L2"
      : "L1"
  ];

}


// ============================================================
// Create Breaker
// ============================================================

export function createBreaker(

  id: string,

  slot: number,

  amperage: number,

  poles: BreakerPoles,

  breakerType: BreakerType = "STANDARD"

): Breaker {

  validateBreakerConfiguration(
    amperage,
    poles
  );


  const busLegs =
    determineBusLegs(
      slot,
      poles
    );


  const loadTerminals =
    busLegs.map(
      (busLeg, index) => ({

        id:
          `${id}-load-hot-${index + 1}`,

        type:
          "LOAD_HOT" as const,

        busLeg

      })
    );


  return {

    id,

    slot,

    label:
      `${amperage}A ${breakerType}`,

    amperage,

    poles,

    voltage:
      poles === 2
        ? 240
        : 120,

    breakerType,

    busLegs,

    loadTerminals,

    connectedDevices: [],

    status: "OFF",

    energized: false,

    tripped: false

  };

}


// ============================================================
// Library Breaker Preset
// ============================================================

export function createLibraryBreaker(

  amperage: number,

  poles: BreakerPoles,

  breakerType: BreakerType = "STANDARD"

): Breaker {

  return createBreaker(

    crypto.randomUUID(),

    0,

    amperage,

    poles,

    breakerType

  );

}


// ============================================================
// Trip Breaker
// ============================================================

export function tripBreaker(

  breaker: Breaker,

  reason: string

): Breaker {

  return {

    ...breaker,

    status: "TRIPPED",

    energized: false,

    tripped: true,

    tripReason: reason

  };

}


// ============================================================
// Reset Breaker
// ============================================================

export function resetBreaker(

  breaker: Breaker

): Breaker {

  return {

    ...breaker,

    status: "OFF",

    energized: false,

    tripped: false,

    tripReason: undefined

  };

}


// ============================================================
// Energize Breaker
// ============================================================

export function energizeBreaker(

  breaker: Breaker

): Breaker {

  /**
   * A tripped breaker cannot simply be energized.
   *
   * It must first be reset.
   */

  if (breaker.tripped) {

    return breaker;

  }


  return {

    ...breaker,

    status: "ON",

    energized: true

  };

}


// ============================================================
// De-energize Breaker
// ============================================================

export function deenergizeBreaker(

  breaker: Breaker

): Breaker {

  return {

    ...breaker,

    status: "OFF",

    energized: false

  };

}


// ============================================================
// Connect Device To Breaker
// ============================================================
//
// Compatibility helper for the existing application.
//
// This does NOT represent the actual electrical connection.
//
// The electrical graph will eventually determine the actual
// conductor/device path.
//

export function connectDeviceToBreaker(

  breaker: Breaker,

  deviceId: string

): Breaker {

  if (
    breaker.connectedDevices.includes(
      deviceId
    )
  ) {

    return breaker;

  }


  return {

    ...breaker,

    connectedDevices: [

      ...breaker.connectedDevices,

      deviceId

    ]

  };

}


// ============================================================
// Disconnect Device From Breaker
// ============================================================

export function disconnectDeviceFromBreaker(

  breaker: Breaker,

  deviceId: string

): Breaker {

  return {

    ...breaker,

    connectedDevices:
      breaker.connectedDevices.filter(

        id =>
          id !== deviceId

      )

  };

}


// ============================================================
// Assign Circuit To Breaker
// ============================================================

export function assignCircuitToBreaker(

  breaker: Breaker,

  circuitId: string

): Breaker {

  return {

    ...breaker,

    circuitId

  };

}


// ============================================================
// Remove Circuit From Breaker
// ============================================================

export function clearBreakerCircuit(

  breaker: Breaker

): Breaker {

  return {

    ...breaker,

    circuitId: undefined

  };

}


// ============================================================
// Breaker Helper Functions
// ============================================================

export function isSinglePoleBreaker(
  breaker: Breaker
): boolean {

  return breaker.poles === 1;

}


export function isDoublePoleBreaker(
  breaker: Breaker
): boolean {

  return breaker.poles === 2;

}


export function supplies240Volts(
  breaker: Breaker
): boolean {

  return (
    breaker.poles === 2 &&
    breaker.voltage === 240
  );

}


export function isOperational(
  breaker: Breaker
): boolean {

  return (
    breaker.status === "ON" &&
    breaker.energized &&
    !breaker.tripped
  );

}


// ============================================================
// Get Breaker Bus Legs
// ============================================================

export function getBreakerBusLegs(
  breaker: Breaker
): BreakerBusLeg[] {

  return [
    ...breaker.busLegs
  ];

}


// ============================================================
// Get Breaker Load Terminals
// ============================================================

export function getBreakerLoadTerminals(
  breaker: Breaker
): BreakerLoadTerminal[] {

  return [
    ...breaker.loadTerminals
  ];

}