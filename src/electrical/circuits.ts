// Residential Wiring Simulator v2.2
// Circuit system foundation

export type CircuitStatus =
  | "OFF"
  | "ACTIVE"
  | "FAULT";


export interface Circuit {

  id:string;

  name:string;


  // 120V or 240V branch circuit
  voltage:120 | 240;


  // breaker feeding this circuit
  breakerId:string;


  // connected equipment
  deviceIds:string[];


  // wires belonging to this circuit
  wireIds:string[];


  status:CircuitStatus;

}