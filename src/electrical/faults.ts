// Residential Wiring Simulator v2.2
// Fault simulation and troubleshooting engine


export type FaultType =
  | "HOT_NEUTRAL_SHORT"
  | "HOT_GROUND_FAULT"
  | "OPEN_NEUTRAL"
  | "MISSING_GROUND"
  | "NONE";



export interface ElectricalFault {

  type: FaultType;

  title: string;

  description: string;

  severity: "WARNING" | "DANGER";

  breakerShouldTrip: boolean;

}



// Fault database

export const FAULTS: ElectricalFault[] = [

  {

    type: "HOT_NEUTRAL_SHORT",

    title:
      "Hot to Neutral Short",

    description:
      "The energized conductor is directly connected to the neutral conductor.",

    severity:
      "DANGER",

    breakerShouldTrip:
      true

  },


  {

    type: "HOT_GROUND_FAULT",

    title:
      "Hot to Ground Fault",

    description:
      "The energized conductor has contacted the grounding path.",

    severity:
      "DANGER",

    breakerShouldTrip:
      true

  },


  {

    type: "OPEN_NEUTRAL",

    title:
      "Open Neutral",

    description:
      "The neutral conductor is disconnected, preventing a complete circuit path.",

    severity:
      "WARNING",

    breakerShouldTrip:
      false

  },


  {

    type:
      "MISSING_GROUND",

    title:
      "Missing Equipment Ground",

    description:
      "The circuit does not have a proper grounding path.",

    severity:
      "WARNING",

    breakerShouldTrip:
      false

  }

];



// Get fault information

export function getFault(
  type: FaultType
): ElectricalFault | undefined {


  return FAULTS.find(
    fault =>
      fault.type === type
  );

}



// Determine if fault trips breaker

export function faultTripsBreaker(
  type: FaultType
): boolean {


  const fault =
    getFault(type);


  return fault
    ? fault.breakerShouldTrip
    : false;

}



// Apprentice explanation

export function explainFault(
  type: FaultType
): string {


  const fault =
    getFault(type);


  if (!fault) {

    return "No fault detected.";

  }


  return (

    `${fault.title}\n\n` +

    `${fault.description}\n\n` +

    `Breaker trip expected: ` +

    `${fault.breakerShouldTrip ? "YES" : "NO"}`

  );

}