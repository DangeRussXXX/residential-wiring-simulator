// Residential Wiring Simulator v2.2
// Breaker rules and trip logic

import { Breaker } from "./types";


// Standard breaker sizes
export const BREAKER_SIZES = [
  15,
  20,
  30,
  40,
  50
];


// Create a breaker
export function createBreaker(
  id: string,
  amperage: number,
  voltage: 120 | 240,
  poles: 1 | 2
): Breaker {

  return {

    id,

    amperage,

    voltage,

    poles,

    tripped: false

  };

}


// Continuous load limit
// NEC style 80% rule
export function getRecommendedLoad(
  breaker: Breaker
): number {

  return Number(
    (breaker.amperage * 0.8)
      .toFixed(1)
  );

}


// Determine if breaker should trip
export function shouldBreakerTrip(
  breaker: Breaker,
  circuitAmps: number
): boolean {

  return circuitAmps >
    breaker.amperage;

}


// Trip breaker
export function tripBreaker(
  breaker: Breaker
): Breaker {

  return {

    ...breaker,

    tripped: true

  };

}


// Reset breaker
export function resetBreaker(
  breaker: Breaker
): Breaker {

  return {

    ...breaker,

    tripped: false

  };

}


// Breaker status message
export function getBreakerStatus(
  breaker: Breaker,
  circuitAmps: number
): string {


  if (breaker.tripped) {

    return "🚨 BREAKER TRIPPED";

  }


  if (
    shouldBreakerTrip(
      breaker,
      circuitAmps
    )
  ) {

    return "❌ OVERLOAD - BREAKER SHOULD TRIP";

  }


  if (
    circuitAmps >
    getRecommendedLoad(breaker)
  ) {

    return "⚠ HIGH LOAD";

  }


  return "✓ BREAKER OK";

}