// Residential Wiring Simulator v2.6
// Electrical Simulation Engine
//
// Responsibilities:
// - Determine energized circuits
// - Calculate device loads
// - Calculate circuit current
// - Calculate voltage drop
// - Detect overloaded breakers
// - Detect undersized conductors
// - Detect open circuits
// - Propagate breaker state through the circuit
//
// This file contains electrical simulation logic only.
// It does NOT contain React/UI code.

import type {
  ElectricalDevice,
  WireGauge
} from "./types";

import type {
  Breaker
} from "./breaker";

import {
  isOperational,
  tripBreaker
} from "./breaker";

import type {
  BreakerPanel
} from "./breakerPanel";

import type {
  Connection
} from "./connections";


// ============================================================
// SIMULATION RESULT
// ============================================================

export interface DeviceSimulationResult {

  deviceId: string;

  energized: boolean;

  voltage: number;

  watts: number;

  amps: number;

  fault: boolean;

  faultReason?: string;

}


export interface CircuitSimulationResult {

  circuitId?: string;

  energized: boolean;

  voltage: number;

  watts: number;

  amps: number;

  voltageDrop: number;

  overloaded: boolean;

  fault: boolean;

  faultReason?: string;

  deviceResults: DeviceSimulationResult[];

}


export interface PanelSimulationResult {

  panelId: string;

  energized: boolean;

  totalWatts: number;

  totalAmps: number;

  circuits: CircuitSimulationResult[];

  overloaded: boolean;

  faults: string[];

}


// ============================================================
// WIRE AMPACITY
// ============================================================
//
// Simplified simulator values.
//
// These are modeling values for the simulator, not a substitute
// for applicable electrical code or installation requirements.
//

function getWireAmpacity(
  gauge: WireGauge
): number {

  switch (gauge) {

    case "#14":
      return 15;

    case "#12":
      return 20;

    case "#10":
      return 30;

    case "#8":
      return 40;

    default:
      return 0;

  }

}


// ============================================================
// DEVICE LOAD
// ============================================================

export function getDeviceWatts(
  device: ElectricalDevice
): number {

  return device.load?.watts ?? 0;

}


// ============================================================
// DEVICE CURRENT
// ============================================================

export function calculateDeviceCurrent(
  device: ElectricalDevice
): number {

  const watts =
    getDeviceWatts(device);


  const voltage =
    device.voltage ?? 120;


  if (
    voltage <= 0
  ) {

    return 0;

  }


  // P = V × I
  // I = P / V

  return watts / voltage;

}


// ============================================================
// GET CONNECTED DEVICE IDS
// ============================================================

function getConnectedDeviceIds(
  deviceId: string,
  connections: Connection[]
): string[] {

  const ids =
    new Set<string>();


  connections.forEach(
    connection => {

      if (
        connection.status !==
        "CONNECTED"
      ) {

        return;

      }


      if (
        connection.from.deviceId ===
        deviceId
      ) {

        ids.add(
          connection.to.deviceId
        );

      }


      if (
        connection.to.deviceId ===
        deviceId
      ) {

        ids.add(
          connection.from.deviceId
        );

      }

    }
  );


  return [
    ...ids
  ];

}


// ============================================================
// BREAKER ENERGIZATION
// ============================================================

export function isDeviceEnergized(
  device: ElectricalDevice,
  panel: BreakerPanel | undefined,
  breaker: Breaker | undefined
): boolean {

  // ----------------------------------------------------------
  // Device must belong to a powered panel.
  // ----------------------------------------------------------

  if (
    !panel ||
    !panel.serviceConnected
  ) {

    return false;

  }


  // ----------------------------------------------------------
  // Panel must be grounded.
  //
  // This is intentionally conservative for the simulator.
  // ----------------------------------------------------------

  if (
    !panel.grounded
  ) {

    return false;

  }


  // ----------------------------------------------------------
  // Device must have an operational breaker.
  // ----------------------------------------------------------

  if (
    !breaker ||
    !isOperational(breaker)
  ) {

    return false;

  }


  // ----------------------------------------------------------
  // Device itself may be tripped.
  // ----------------------------------------------------------

  if (
    device.tripped
  ) {

    return false;

  }


  return true;

}


// ============================================================
// VOLTAGE DROP
// ============================================================
//
// Simplified voltage-drop calculation.
//
// Vdrop = I × R
//
// Resistance is approximated from conductor gauge and length.
//

function getOhmsPer1000Ft(
  gauge: WireGauge
): number {

  switch (gauge) {

    case "#14":
      return 2.525;

    case "#12":
      return 1.588;

    case "#10":
      return 0.999;

    case "#8":
      return 0.628;

    default:
      return 0;

  }

}


export function calculateVoltageDrop(
  current: number,
  gauge: WireGauge,
  length: number
): number {

  if (
    current <= 0 ||
    length <= 0
  ) {

    return 0;

  }


  const resistance =
    getOhmsPer1000Ft(gauge) *
    (length / 1000);


  return current * resistance;

}


// ============================================================
// CIRCUIT LOAD
// ============================================================

export function calculateCircuitLoad(
  devices: ElectricalDevice[]
): number {

  return devices.reduce(
    (
      total,
      device
    ) => {

      return (
        total +
        getDeviceWatts(device)
      );

    },
    0
  );

}


// ============================================================
// CIRCUIT CURRENT
// ============================================================

export function calculateCircuitCurrent(
  devices: ElectricalDevice[],
  voltage: number
): number {

  const watts =
    calculateCircuitLoad(
      devices
    );


  if (
    voltage <= 0
  ) {

    return 0;

  }


  return watts / voltage;

}


// ============================================================
// BREAKER OVERLOAD
// ============================================================

export function isBreakerOverloaded(
  breaker: Breaker,
  current: number
): boolean {

  return (
    current >
    breaker.amperage
  );

}


// ============================================================
// WIRE OVERLOAD
// ============================================================

export function isWireOverloaded(
  gauge: WireGauge,
  current: number
): boolean {

  return (
    current >
    getWireAmpacity(gauge)
  );

}


// ============================================================
// FIND DEVICE GROUP
// ============================================================
//
// Returns all devices connected to the starting device.
//
// Traversal stops at another panel.
//

export function findConnectedDevices(
  startDeviceId: string,
  devices: ElectricalDevice[],
  connections: Connection[]
): ElectricalDevice[] {

  const visited =
    new Set<string>();


  const queue: string[] = [
    startDeviceId
  ];


  const result: ElectricalDevice[] = [];


  while (
    queue.length > 0
  ) {

    const currentId =
      queue.shift()!;


    if (
      visited.has(
        currentId
      )
    ) {

      continue;

    }


    visited.add(
      currentId
    );


    const device =
      devices.find(
        item =>
          item.id === currentId
      );


    if (!device) {

      continue;

    }


    // --------------------------------------------------------
    // Panels terminate the device-side traversal.
    // --------------------------------------------------------

    if (
      device.id !== startDeviceId &&
      (
        device.type ===
          "Breaker Panel" ||
        device.type ===
          "Sub Panel"
      )
    ) {

      continue;

    }


    result.push(
      device
    );


    const connectedIds =
      getConnectedDeviceIds(
        currentId,
        connections
      );


    connectedIds.forEach(
      id => {

        if (
          !visited.has(id)
        ) {

          queue.push(id);

        }

      }
    );

  }


  return result;

}


// ============================================================
// SIMULATE CIRCUIT
// ============================================================

export function simulateCircuit(
  devices: ElectricalDevice[],
  panel: BreakerPanel,
  breaker: Breaker
): CircuitSimulationResult {

  const circuitDevices =
    devices.filter(
      device =>
        device.panelId ===
        panel.id &&
        device.breakerId ===
        breaker.id
    );


  const energized =
    panel.serviceConnected &&
    panel.grounded &&
    isOperational(breaker);


  const voltage =
    breaker.voltage;


  const watts =
    calculateCircuitLoad(
      circuitDevices
    );


  const amps =
    voltage > 0
      ? watts / voltage
      : 0;


  const overloaded =
    isBreakerOverloaded(
      breaker,
      amps
    );


  const deviceResults:
    DeviceSimulationResult[] =
    circuitDevices.map(
      device => {

        const deviceEnergized =
          energized &&
          !device.tripped;


        const deviceWatts =
          getDeviceWatts(
            device
          );


        const deviceAmps =
          calculateDeviceCurrent(
            device
          );


        return {

          deviceId:
            device.id,

          energized:
            deviceEnergized,

          voltage:
            deviceEnergized
              ? (
                  device.voltage ??
                  voltage
                )
              : 0,

          watts:
            deviceWatts,

          amps:
            deviceAmps,

          fault:
            false

        };

      }
    );


  let fault = false;

  let faultReason:
    string | undefined;


  if (
    overloaded
  ) {

    fault = true;

    faultReason =
      `Circuit current ${amps.toFixed(2)}A exceeds ${breaker.amperage}A breaker rating.`;

  }


  return {

    circuitId:
      breaker.circuitId,

    energized,

    voltage:
      energized
        ? voltage
        : 0,

    watts,

    amps,

    voltageDrop:
      0,

    overloaded,

    fault,

    faultReason,

    deviceResults

  };

}


// ============================================================
// SIMULATE PANEL
// ============================================================

export function simulatePanel(
  devices: ElectricalDevice[],
  panel: BreakerPanel
): PanelSimulationResult {

  const breakerMap =
    new Map<string, Breaker>();


  panel.breakers.forEach(
    slot => {

      if (
        slot.breaker
      ) {

        breakerMap.set(
          slot.breaker.id,
          slot.breaker
        );

      }

    }
  );


  const circuits:
    CircuitSimulationResult[] = [];


  const faults:
    string[] = [];


  breakerMap.forEach(
    breaker => {

      const result =
        simulateCircuit(
          devices,
          panel,
          breaker
        );


      circuits.push(
        result
      );


      if (
        result.faultReason
      ) {

        faults.push(
          result.faultReason
        );

      }

    }
  );


  const totalWatts =
    circuits.reduce(
      (
        total,
        circuit
      ) =>
        total +
        circuit.watts,
      0
    );


  const totalAmps =
    circuits.reduce(
      (
        total,
        circuit
      ) =>
        total +
        circuit.amps,
      0
    );


  return {

    panelId:
      panel.id,

    energized:
      panel.serviceConnected,

    totalWatts,

    totalAmps,

    circuits,

    overloaded:
      circuits.some(
        circuit =>
          circuit.overloaded
      ),

    faults

  };

}


// ============================================================
// APPLY BREAKER PROTECTION
// ============================================================
//
// Returns a new breaker object.
//
// The existing breaker is never mutated.
//

export function applyBreakerProtection(
  breaker: Breaker,
  current: number
): Breaker {

  if (
    isBreakerOverloaded(
      breaker,
      current
    )
  ) {

    return tripBreaker(
      breaker,
      `Overcurrent: ${current.toFixed(2)}A exceeds ${breaker.amperage}A.`
    );

  }


  return breaker;

}


// ============================================================
// SIMULATE CONNECTION
// ============================================================

export function simulateConnection(
  connection: Connection,
  devices: ElectricalDevice[]
): Connection {

  if (
    connection.status !==
    "CONNECTED"
  ) {

    return {

      ...connection,

      energized: false,

      current: 0

    };

  }


  const from =
    devices.find(
      device =>
        device.id ===
        connection.from.deviceId
    );


  const to =
    devices.find(
      device =>
        device.id ===
        connection.to.deviceId
    );


  if (
    !from ||
    !to
  ) {

    return {

      ...connection,

      status:
        "FAULT",

      energized:
        false,

      current:
        0

    };

  }


  const energized =
    !from.tripped &&
    !to.tripped;


  return {

    ...connection,

    energized,

    current:
      energized
        ? calculateDeviceCurrent(
            to
          )
        : 0

  };

}


// ============================================================
// SIMULATE ALL CONNECTIONS
// ============================================================

export function simulateConnections(
  connections: Connection[],
  devices: ElectricalDevice[]
): Connection[] {

  return connections.map(
    connection =>
      simulateConnection(
        connection,
        devices
      )
  );

}


// ============================================================
// FULL SIMULATION
// ============================================================

export function runSimulation(
  devices: ElectricalDevice[],
  connections: Connection[],
  panels: BreakerPanel[]
) {

  const panelResults =
    panels.map(
      panel =>
        simulatePanel(
          devices,
          panel
        )
    );


  const updatedConnections =
    simulateConnections(
      connections,
      devices
    );


  return {

    panels:
      panelResults,

    connections:
      updatedConnections

  };

}