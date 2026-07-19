// Residential Wiring Simulator v2.2
// Electrical calculation engine

import { ElectricalDevice, Circuit } from "./types";


// Convert watts to amps
export function wattsToAmps(
  watts: number,
  voltage: number
): number {

  if (voltage === 0) {
    return 0;
  }

  return Number((watts / voltage).toFixed(2));

}


// Calculate total circuit wattage
export function calculateTotalWatts(
  devices: ElectricalDevice[]
): number {

  return devices.reduce(
    (total, device) =>
      total + device.load.watts,
    0
  );

}


// Calculate circuit amperage
export function calculateCircuitAmps(
  circuit: Circuit
): number {

  const watts = calculateTotalWatts(
    circuit.devices
  );

  return wattsToAmps(
    watts,
    circuit.voltage
  );

}


// Calculate breaker percentage loading
export function calculateBreakerLoad(
  circuit: Circuit
): number {

  const amps = calculateCircuitAmps(
    circuit
  );

  return Number(
    ((amps / circuit.breaker.amperage) * 100)
      .toFixed(1)
  );

}


// Check if breaker is overloaded
export function isBreakerOverloaded(
  circuit: Circuit
): boolean {

  const amps = calculateCircuitAmps(
    circuit
  );

  return amps > circuit.breaker.amperage;

}


// Continuous load calculation
export function calculateContinuousLoad(
  circuit: Circuit
): number {

  const watts = circuit.devices.reduce(
    (total, device) => {

      if (device.load.continuous) {
        return total + device.load.watts;
      }

      return total;

    },
    0
  );


  return wattsToAmps(
    watts,
    circuit.voltage
  );

}


// Human-readable circuit report
export function getCircuitReport(
  circuit: Circuit
) {

  const watts =
    calculateTotalWatts(circuit.devices);


  const amps =
    calculateCircuitAmps(circuit);


  const load =
    calculateBreakerLoad(circuit);


  return {

    watts,

    amps,

    breaker:
      circuit.breaker.amperage,

    loadPercent:
      load,

    overloaded:
      amps > circuit.breaker.amperage

  };

}