// Residential Wiring Simulator v2.3
// Apprentice electrical inspection engine
//
// Checks:
// - breaker sizing
// - conductor sizing
// - continuous loads
// - breaker condition
// - NEC style warnings


import type {
  Circuit
} from "./types";


import {
  calculateCircuitAmps,
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


  passed:boolean;


  issues:string[];


  warnings:string[];


  summary:string;


}









// Main circuit inspection

export function inspectCircuit(

circuit:Circuit

):InspectionResult {



const issues:string[]=[];


const warnings:string[]=[];






// --------------------------------
// Calculate circuit values
// --------------------------------


const amps =

calculateCircuitAmps(

circuit

);






const continuousLoad =

calculateContinuousLoad(

circuit

);








// --------------------------------
// Breaker inspection
// --------------------------------


const breakerStatus =

getBreakerStatus(

circuit.breaker

);





if(

circuit.breaker.tripped

){


issues.push(

`Breaker is tripped${

circuit.breaker.tripReason

?

": " + circuit.breaker.tripReason

:

"."

}`

);


}






if(

amps >

circuit.breaker.amperage

){


issues.push(

"Circuit load exceeds breaker rating."

);


}








// --------------------------------
// Wire inspection
// --------------------------------


if(

!circuit.wire.gauge

){


issues.push(

"No wire gauge selected."

);


}

else {



const wireCorrect =

isWireCorrect(

circuit.wire.gauge,

circuit.breaker.amperage

);




if(!wireCorrect){


issues.push(

getWireStatus(

circuit.wire.gauge,

circuit.breaker.amperage

)

);


}


}









// --------------------------------
// Continuous load inspection
// --------------------------------


if(

continuousLoad >

circuit.breaker.amperage * 0.8

){


warnings.push(

"Continuous load exceeds 80% recommendation."

);


}








// --------------------------------
// Breaker status inspection
// --------------------------------


if(

breakerStatus !== "ENERGIZED" &&

breakerStatus !== "OFF"

){


warnings.push(

breakerStatus

);


}









// --------------------------------
// Final result
// --------------------------------


const passed =

issues.length === 0;





const summary =

passed

?

"✓ Circuit passes inspection."

:

"❌ Circuit failed inspection. Review issues.";







return {


passed,


issues,


warnings,


summary


};



}