// Residential Wiring Simulator v2.2
// Simulation mode definitions


export type SimulationMode =
  | "APPRENTICE"
  | "ENGINEERING"
  | "HYBRID";



export interface SimulationModeInfo {

  id: SimulationMode;

  name: string;

  description: string;

}



export const SIMULATION_MODES:
SimulationModeInfo[] = [

  {

    id: "APPRENTICE",

    name: "Apprentice Training Mode",

    description:
      "Learn residential wiring with inspections, hints, and troubleshooting."

  },


  {

    id: "ENGINEERING",

    name: "Engineering Mode",

    description:
      "Focus on electrical calculations, loads, voltage, and current."

  },


  {

    id: "HYBRID",

    name: "Hybrid Professional Mode",

    description:
      "Combines training feedback with electrical analysis."

  }

];



export function getModeName(
  mode: SimulationMode
): string {

  const selected =
    SIMULATION_MODES.find(
      item => item.id === mode
    );


  return selected
    ? selected.name
    : "Unknown Mode";

}