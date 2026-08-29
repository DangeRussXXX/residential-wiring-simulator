// Residential Wiring Simulator v2.5
// Individual breaker system
//
// Phase 1:
// - Each breaker is independently identifiable
// - Each breaker gets a unique line terminal
// - Breakers retain their own circuit/device ownership
// - Breaker state remains independent from other breakers

import type {
  BreakerPoles,
  Voltage
} from "./types";


// --------------------------------
// Breaker Type
// --------------------------------

export type BreakerType =
  | "STANDARD"
  | "AFCI"
  | "GFCI"
  | "DUAL_FUNCTION";


// --------------------------------
// Breaker Status
// --------------------------------

export type BreakerStatus =
  | "OFF"
  | "ON"
  | "TRIPPED";


// --------------------------------
// Breaker Terminal
// --------------------------------

export interface BreakerTerminal {

  id: string;

  type:
    | "HOT"
    | "NEUTRAL";

}


// --------------------------------
// Breaker
// --------------------------------

export interface Breaker {

  id: string;

  slot: number;

  label: string;

  amperage: number;

  poles: BreakerPoles;

  voltage: Voltage;

  breakerType: BreakerType;

  terminals: BreakerTerminal[];

  // Circuit supplied by this breaker
  circuitId?: string;

  // Devices supplied by this breaker
  connectedDevices: string[];

  status: BreakerStatus;

  energized: boolean;

  tripped: boolean;

  tripReason?: string;

}


// --------------------------------
// Create Breaker
// --------------------------------

export function createBreaker(

  id: string,

  slot: number,

  amperage: number,

  poles: BreakerPoles,

  breakerType: BreakerType = "STANDARD"

): Breaker {

  /*
   * IMPORTANT
   *
   * The terminal ID must be unique to this breaker.
   *
   * Previously every breaker used:
   *
   *     "line"
   *
   * That made multiple breakers look like the
   * same electrical connection point to the
   * workspace wiring system.
   *
   * We now create:
   *
   *     breaker-123-line
   *
   *     breaker-456-line
   *
   * etc.
   */

  const lineTerminalId =
    `${id}-line`;


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

    terminals: [

      {
        id: lineTerminalId,

        type: "HOT"
      }

    ],

    connectedDevices: [],

    status: "OFF",

    energized: false,

    tripped: false

  };

}


// --------------------------------
// Library Breaker Preset
// --------------------------------

export function createLibraryBreaker(

  amperage: number,

  poles: BreakerPoles,

  breakerType: BreakerType

): Breaker {

  return createBreaker(

    crypto.randomUUID(),

    0,

    amperage,

    poles,

    breakerType

  );

}


// --------------------------------
// Trip Breaker
// --------------------------------

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


// --------------------------------
// Reset Breaker
// --------------------------------

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


// --------------------------------
// Energize Breaker
// --------------------------------

export function energizeBreaker(

  breaker: Breaker

): Breaker {

  if (breaker.tripped) {

    return breaker;

  }


  return {

    ...breaker,

    status: "ON",

    energized: true

  };

}


// --------------------------------
// Connect Device To Breaker
// --------------------------------

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


// --------------------------------
// Disconnect Device From Breaker
// --------------------------------

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


// --------------------------------
// Assign Circuit To Breaker
// --------------------------------

export function assignCircuitToBreaker(

  breaker: Breaker,

  circuitId: string

): Breaker {

  return {

    ...breaker,

    circuitId

  };

}


// --------------------------------
// Remove Circuit From Breaker
// --------------------------------

export function clearBreakerCircuit(

  breaker: Breaker

): Breaker {

  return {

    ...breaker,

    circuitId: undefined

  };

}