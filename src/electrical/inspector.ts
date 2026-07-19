// Residential Wiring Simulator v2.2
// Apprentice electrical inspection engine

import { Circuit } from "./types";

import {
  calculateCircuitAmps,
  calculateBreakerLoad,
  calculateContinuousLoad
} from "./calculations";

import {
  getWireStatus,
  isWireCorrect
} from "./wires";

import {
  getBreakerStatus
} from "./breakers";


// Inspection result format

export interface InspectionResult {

  passed: boolean;

  issues: string[];

  warnings: string[];

  summary: string;

}


// Main circuit inspection

export function inspectCircuit(
  circuit: Circuit
): InspectionResult {


  const issues: string[] = [];

  const warnings: string[] = [];


  const amps =
    calculateCircuitAmps(circuit);


  const breakerStatus =
    getBreakerStatus(
      circuit.breaker,
      amps
    );


  const wireCorrect =
    isWireCorrect(
      circuit.wire.gauge,
      circuit.breaker.amperage
    );


  const continuousLoad =
    calculateContinuousLoad(
      circuit
    );


  //
  // Breaker inspection
  //

  if (
    amps >
    circuit.breaker.amperage
  ) {

    issues.push(
      "Circuit load exceeds breaker rating."
    );

  }


  //
  // Wire inspection
  //

  if (!wireCorrect) {

    issues.push(
      getWireStatus(
        circuit.wire.gauge,
        circuit.breaker.amperage
      )
    );

  }


  //
  // Continuous load inspection
  //

  if (
    continuousLoad >
    circuit.breaker.amperage * 0.8
  ) {

    warnings.push(
      "Continuous load exceeds 80% recommendation."
    );

  }


  //
  // Breaker status warning
  //

  if (
    breakerStatus.includes("HIGH")
  ) {

    warnings.push(
      breakerStatus
    );

  }


  const passed =
    issues.length === 0;


  let summary = "";


  if (passed) {

    summary =
      "✓ Circuit passes inspection.";

  }
  else {

    summary =
      "❌ Circuit failed inspection. Review issues.";

  }


  return {

    passed,

    issues,

    warnings,

    summary

  };

}