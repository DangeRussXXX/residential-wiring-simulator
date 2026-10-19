// Residential Wiring Simulator v2.5
// Circuit branch system
//
// Represents a residential branch circuit
//
// Architecture:
//
// Breaker Panel
//      |
//      |
//   Breaker
//      |
//      |
//   Circuit
//      |
//      |
//   Wire(s)
//      |
//      |
//   Devices
//
// Supports:
// - branch circuits
// - circuit inspection
// - conductor validation
// - electrical simulation



export type CircuitStatus =

  | "OFF"

  | "ACTIVE"

  | "FAULT";





export type CircuitType =

  | "LIGHTING"

  | "RECEPTACLE"

  | "APPLIANCE"

  | "DEDICATED";





export type InspectionStatus =

  | "PASS"

  | "WARNING"

  | "FAIL";









export interface Circuit {


// --------------------------------
// Identity
// --------------------------------


id:string;



// Display name

name:string;





// --------------------------------
// Circuit classification
// --------------------------------


type:CircuitType;





// --------------------------------
// Electrical information
// --------------------------------


voltage:

120 |

240;



// Breaker feeding this circuit

breakerId:string;



// Breaker capacity

ratedAmperage:number;



// Calculated load current

currentAmperage:number;





// --------------------------------
// Circuit connection points
// --------------------------------
//
// Allows:
//
// Breaker Terminal
//       |
//       |
// Circuit
//       |
//       |
// Wire
//       |
//       |
// Device


sourceTerminalId?:string;


neutralTerminalId?:string;


groundTerminalId?:string;









// --------------------------------
// Connected equipment
// --------------------------------


deviceIds:string[];





// --------------------------------
// Physical wiring
// --------------------------------


wireIds:string[];









// --------------------------------
// Branch circuit support
// --------------------------------
//
// Example:
//
// Bedroom Circuit
//
//       |
//       +---- Light Branch
//       |
//       +---- Outlet Branch


parentCircuitId?:string;


branchIds:string[];









// --------------------------------
// Conductor requirements
// --------------------------------


hasHot:boolean;


hasNeutral:boolean;


hasGround:boolean;









// --------------------------------
// Load calculation
// --------------------------------


totalWatts:number;









// --------------------------------
// Operating state
// --------------------------------


status:CircuitStatus;



faultMessage?:string;









// --------------------------------
// Inspection system
// --------------------------------


inspectionStatus:InspectionStatus;


inspectionMessages:string[];





}