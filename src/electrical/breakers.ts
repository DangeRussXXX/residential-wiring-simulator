// Residential Wiring Simulator
// Electrical Core - Breaker Utilities
//
// Responsibilities:
// - Find breakers
// - Assign/remove circuits
// - Report breaker status
// - Calculate breaker loading
//
// IMPORTANT:
// The Breaker data model lives in ./breaker.ts.
// This file contains utility functions only.

import type {
  Breaker,
} from "./breaker";


// ============================================================
// FIND BREAKER BY CIRCUIT
// ============================================================

export function findBreakerByCircuit(
  breakers: Breaker[],
  circuitId: string
): Breaker | undefined {

  return breakers.find(
    breaker =>
      breaker.circuitId === circuitId
  );

}


// ============================================================
// FIND AVAILABLE BREAKER
// ============================================================
//
// Returns the first breaker that is not currently assigned
// to a circuit.
//
// Physical panel occupancy is NOT checked here.
// Physical placement belongs to breakerPanel.ts.
//

export function findAvailableBreaker(
  breakers: Breaker[]
): Breaker | undefined {

  return breakers.find(
    breaker =>
      !breaker.circuitId
  );

}


// ============================================================
// ASSIGN CIRCUIT
// ============================================================

export function assignCircuitToBreaker(
  breaker: Breaker,
  circuitId: string
): Breaker {

  return {
    ...breaker,
    circuitId,
  };

}


// ============================================================
// REMOVE CIRCUIT ASSIGNMENT
// ============================================================

export function removeCircuitFromBreaker(
  breaker: Breaker
): Breaker {

  return {
    ...breaker,
    circuitId: undefined,
  };

}


// ============================================================
// BREAKER STATUS
// ============================================================

export function getBreakerStatus(
  breaker: Breaker | undefined
): string {

  if (!breaker) {
    return "NO BREAKER";
  }

  if (breaker.tripped) {

    return breaker.tripReason
      ? `TRIPPED - ${breaker.tripReason}`
      : "TRIPPED";

  }

  if (!breaker.energized) {
    return "OFF";
  }

  return "ENERGIZED";

}


// ============================================================
// CALCULATE BREAKER LOAD
// ============================================================
//
// watts / voltage = amps
//
// percent = amps / breaker rating * 100
//
// This is a calculation utility only. It does not change
// breaker state.
//

export function calculateBreakerLoad(
  breaker: Breaker,
  watts: number
): {
  amps: number;
  percent: number;
} {

  if (
    !Number.isFinite(watts) ||
    watts < 0
  ) {

    return {
      amps: 0,
      percent: 0,
    };

  }

  const amps =
    watts /
    breaker.voltage;

  const percent =
    breaker.amperage > 0
      ? (
          amps /
          breaker.amperage
        ) * 100
      : 0;

  return {

    amps:
      Number(
        amps.toFixed(2)
      ),

    percent:
      Number(
        percent.toFixed(1)
      ),

  };

}