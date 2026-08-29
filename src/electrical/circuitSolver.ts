// Residential Wiring Simulator v2.6
// Circuit Solver
//
// Determines:
// - energized devices
// - de-energized devices
// - circuit loads
// - circuit current
// - connection faults
// - breaker-controlled power
//
// This layer performs electrical calculation.
// It does NOT modify React state.
//
// Power flow:
//
// Panel
//   ↓
// Breaker
//   ↓
// Circuit devices
//
// A breaker that is OFF or TRIPPED does not energize its
// assigned devices.

import type {
  ElectricalDevice
} from "./types";

import type {
  Connection
} from "./connections";

import type {
  BreakerPanel
} from "./breakerPanel";

import {
  buildElectricalGraph,
  findReachableDevices
} from "./electricalGraph";

import {
  isOperational
} from "./breaker";


// ============================================================
// SOLVER RESULT
// ============================================================

export interface CircuitSolveResult {

  energizedDevices: string[];

  deenergizedDevices: string[];

  faults: string[];

  loads: Record<string, number>;

  currents: Record<string, number>;

}


// ============================================================
// SOLVE CIRCUIT
// ============================================================

export function solveCircuit(

  devices: ElectricalDevice[],

  connections: Connection[],

  panels: BreakerPanel[]

): CircuitSolveResult {

  const energizedDevices: string[] = [];

  const deenergizedDevices: string[] = [];

  const faults: string[] = [];

  const loads: Record<string, number> = {};

  const currents: Record<string, number> = {};


  // ==========================================================
  // BUILD ELECTRICAL GRAPH
  // ==========================================================

  const graph =
    buildElectricalGraph(
      devices,
      connections
    );


  // ==========================================================
  // CALCULATE DEVICE LOADS
  // ==========================================================

  for (
    const device of devices
  ) {

    const watts =
      device.load?.watts ?? 0;


    loads[device.id] =
      watts;


    currents[device.id] =
      device.voltage
        ? watts / device.voltage
        : 0;

  }


  // ==========================================================
  // FIND ENERGIZED PANELS
  // ==========================================================

  const energizedPanelIds =
    new Set<string>();


  for (
    const panel of panels
  ) {

    if (
      panel.serviceConnected
    ) {

      energizedPanelIds.add(
        panel.id
      );

    }

  }


  // ==========================================================
  // DETERMINE OPERATIONAL BREAKERS
  // ==========================================================

  const operationalBreakers =
    new Set<string>();


  for (
    const panel of panels
  ) {

    // --------------------------------------------------------
    // Only breakers physically installed in this panel
    // matter for this panel's circuits.
    // --------------------------------------------------------

    for (
      const slot of panel.breakers
    ) {

      const breaker =
        slot.breaker;


      if (
        !breaker
      ) {

        continue;

      }


      if (
        isOperational(
          breaker
        )
      ) {

        operationalBreakers.add(
          breaker.id
        );

      }

    }

  }


  // ==========================================================
  // FIND DEVICES SUPPLIED BY OPERATIONAL BREAKERS
  // ==========================================================

  const devicesSuppliedByOperationalBreakers =
    new Set<string>();


  for (
    const device of devices
  ) {

    if (
      !device.breakerId
    ) {

      continue;

    }


    if (
      !operationalBreakers.has(
        device.breakerId
      )
    ) {

      continue;

    }


    devicesSuppliedByOperationalBreakers.add(
      device.id
    );

  }


  // ==========================================================
  // TRACE POWER FROM ENERGIZED PANELS
  // ==========================================================
  //
  // A device must satisfy BOTH:
  //
  // 1. It is connected to an energized panel.
  //
  // 2. It belongs to an operational breaker.
  //
  // This prevents an OFF/TRIPPED breaker from being treated
  // as a power source.
  //

  const reachableFromPanels =
    new Set<string>();


  for (
    const panelId
    of energizedPanelIds
  ) {

    const reachable =
      findReachableDevices(
        graph,
        panelId
      );


    for (
      const deviceId
      of reachable
    ) {

      reachableFromPanels.add(
        deviceId
      );

    }

  }


  // ==========================================================
  // DETERMINE DEVICE ENERGY STATE
  // ==========================================================

  for (
    const device
    of devices
  ) {

    // --------------------------------------------------------
    // PANELS
    // --------------------------------------------------------

    if (
      device.type === "Breaker Panel" ||
      device.type === "Sub Panel"
    ) {

      if (
        energizedPanelIds.has(
          device.id
        )
      ) {

        energizedDevices.push(
          device.id
        );

      }
      else {

        deenergizedDevices.push(
          device.id
        );

      }

      continue;

    }


    // --------------------------------------------------------
    // DEVICE MUST BE REACHABLE FROM AN ENERGIZED PANEL
    // --------------------------------------------------------

    if (
      !reachableFromPanels.has(
        device.id
      )
    ) {

      deenergizedDevices.push(
        device.id
      );

      continue;

    }


    // --------------------------------------------------------
    // DEVICE MUST HAVE A BREAKER ASSIGNMENT
    // --------------------------------------------------------

    if (
      !device.breakerId
    ) {

      deenergizedDevices.push(
        device.id
      );

      continue;

    }


    // --------------------------------------------------------
    // BREAKER MUST BE OPERATIONAL
    // --------------------------------------------------------

    if (
      !devicesSuppliedByOperationalBreakers.has(
        device.id
      )
    ) {

      deenergizedDevices.push(
        device.id
      );

      continue;

    }


    // --------------------------------------------------------
    // DEVICE IS ENERGIZED
    // --------------------------------------------------------

    energizedDevices.push(
      device.id
    );

  }


  // ==========================================================
  // CHECK CONNECTIONS
  // ==========================================================

  for (
    const connection of connections
  ) {

    const fromDevice =
      devices.find(
        device =>
          device.id ===
          connection.from.deviceId
      );


    const toDevice =
      devices.find(
        device =>
          device.id ===
          connection.to.deviceId
      );


    // --------------------------------------------------------
    // MISSING DEVICE
    // --------------------------------------------------------

    if (
      !fromDevice ||
      !toDevice
    ) {

      faults.push(
        `Connection ${connection.id} references a missing device.`
      );

      continue;

    }


    // --------------------------------------------------------
    // OPEN CONNECTION
    // --------------------------------------------------------

    if (
      connection.status ===
      "OPEN"
    ) {

      faults.push(
        `Connection ${connection.id} is open.`
      );

    }


    // --------------------------------------------------------
    // FAULT CONNECTION
    // --------------------------------------------------------

    if (
      connection.status ===
      "FAULT"
    ) {

      faults.push(
        `Connection ${connection.id} is faulted.`
      );

    }

  }


  // ==========================================================
  // CHECK BREAKER REFERENCES
  // ==========================================================

  const installedBreakerIds =
    new Set<string>();


  for (
    const panel of panels
  ) {

    for (
      const slot of panel.breakers
    ) {

      if (
        slot.breaker
      ) {

        installedBreakerIds.add(
          slot.breaker.id
        );

      }

    }

  }


  for (
    const device of devices
  ) {

    if (
      !device.breakerId
    ) {

      continue;

    }


    if (
      !installedBreakerIds.has(
        device.breakerId
      )
    ) {

      faults.push(
        `Device ${device.name} references breaker ${device.breakerId}, but that breaker is not installed.`
      );

    }

  }


  // ==========================================================
  // RETURN RESULT
  // ==========================================================

  return {

    energizedDevices,

    deenergizedDevices,

    faults,

    loads,

    currents

  };

}