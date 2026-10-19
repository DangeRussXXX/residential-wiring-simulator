// Residential Wiring Simulator v2.2
// Wire sizing rules and inspection logic

import type { WireGauge } from "./types";


// Copper conductor ampacity
export const WIRE_AMPACITY: Record<WireGauge, number> = {

  "#14": 15,

  "#12": 20,

  "#10": 30,

  "#8": 40

};


// Get ampacity of wire
export function getWireAmpacity(
  gauge: WireGauge
): number {

  return WIRE_AMPACITY[gauge];

}


// Check if wire is correctly sized
export function isWireCorrect(
  gauge: WireGauge,
  breakerAmps: number
): boolean {

  return (
    getWireAmpacity(gauge)
    >= breakerAmps
  );

}


// Get wire warning message
export function getWireStatus(
  gauge: WireGauge,
  breakerAmps: number
): string {


  const ampacity =
    getWireAmpacity(gauge);


  if (
    ampacity < breakerAmps
  ) {

    return (
      `❌ UNDERSIZED WIRE\n` +
      `${gauge} wire is rated for ${ampacity}A.\n` +
      `Breaker requires ${breakerAmps}A capacity.`
    );

  }


  return (
    `✓ WIRE SIZE OK\n` +
    `${gauge} supports ${ampacity}A.`
  );

}


// Recommend wire size
export function recommendWireSize(
  breakerAmps: number
): WireGauge {


  if (breakerAmps <= 15) {

    return "#14";

  }


  if (breakerAmps <= 20) {

    return "#12";

  }


  if (breakerAmps <= 30) {

    return "#10";

  }


  return "#8";

}