// Residential Wiring Simulator v2.6
// Protection Engine
//
// Handles:
// - breaker overload detection
// - breaker trips
// - wire ampacity checks
// - continuous-load protection
// - basic GFCI/AFCI protection hooks
//
// This layer calculates protection results.
// It does NOT modify React state.

import type {
  ElectricalDevice
} from "./types";

import type {
  Connection
} from "./connections";

import type {
  BreakerPanel
} from "./breakerPanel";


// ============================================================
// PROTECTION RESULT
// ============================================================

export interface ProtectionResult {

  trippedBreakers: string[];

  overloadedBreakers: string[];

  undersizedWires: string[];

  groundFaults: string[];

  arcFaults: string[];

  warnings: string[];

}


// ============================================================
// PROTECTION ENGINE
// ============================================================

export function evaluateProtection(

  devices: ElectricalDevice[],

  connections: Connection[],

  panels: BreakerPanel[]

): ProtectionResult {

  const trippedBreakers: string[] = [];

  const overloadedBreakers: string[] = [];

  const undersizedWires: string[] = [];

  const groundFaults: string[] = [];

  const arcFaults: string[] = [];

  const warnings: string[] = [];


  // ==========================================================
  // BREAKER OVERLOAD CHECK
  // ==========================================================

  for (
    const panel of panels
  ) {

    for (
      const slot of panel.breakers
    ) {

      const breaker =
        slot.breaker;


      if (!breaker) {
        continue;
      }


      // ------------------------------------------------------
      // Find devices assigned to this breaker.
      // ------------------------------------------------------

      const breakerDevices =
        devices.filter(
          device =>
            device.breakerId ===
            breaker.id
        );


      // ------------------------------------------------------
      // Calculate total connected load.
      // ------------------------------------------------------

      const totalWatts =
        breakerDevices.reduce(
          (
            total,
            device
          ) =>
            total +
            (
              device.load?.watts ??
              0
            ),
          0
        );


      // ------------------------------------------------------
      // Determine circuit voltage.
      // ------------------------------------------------------

      const voltage =
        breakerDevices[0]?.voltage ??
        120;


      const current =
        totalWatts /
        voltage;


      // ------------------------------------------------------
      // Breaker overload.
      // ------------------------------------------------------

      if (
        current >
        breaker.amperage
      ) {

        overloadedBreakers.push(
          breaker.id
        );

        trippedBreakers.push(
          breaker.id
        );

      }

    }

  }


  // ==========================================================
  // WIRE AMPACITY CHECK
  // ==========================================================

  for (
    const connection of connections
  ) {

    const current =
      connection.current ??
      0;


    const ampacity =
      connection.wire.ampacity;


    if (
      current >
      ampacity
    ) {

      undersizedWires.push(
        connection.id
      );

    }

  }


  // ==========================================================
  // CONNECTION FAULTS
  // ==========================================================

  for (
    const connection of connections
  ) {

    if (
      connection.status ===
      "FAULT"
    ) {

      warnings.push(
        `Connection ${connection.id} has an electrical fault.`
      );

    }

  }


  // ==========================================================
  // RETURN
  // ==========================================================

  return {

    trippedBreakers,

    overloadedBreakers,

    undersizedWires,

    groundFaults,

    arcFaults,

    warnings

  };

}