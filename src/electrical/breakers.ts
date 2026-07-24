// Residential Wiring Simulator v2.3
// Breaker management utilities


import type {
  Breaker
} from "./breaker";





// Find breaker by circuit assignment


export function findBreakerByCircuit(

breakers:Breaker[],

circuitId:string

):Breaker | undefined {


return breakers.find(

breaker =>

breaker.circuitId === circuitId

);


}







// Find unused breaker


export function findAvailableBreaker(

breakers:Breaker[]

):Breaker | undefined {


return breakers.find(

breaker =>

!breaker.circuitId

);


}







// Assign circuit to breaker


export function assignCircuitToBreaker(

breaker:Breaker,

circuitId:string

):Breaker {


return {


...breaker,


circuitId


};


}







// Remove circuit assignment


export function removeCircuitFromBreaker(

breaker:Breaker

):Breaker {


return {


...breaker,


circuitId:undefined


};


}







// Get breaker status for UI


export function getBreakerStatus(

breaker:Breaker | undefined

):string {



if(!breaker)

return "NO BREAKER";



if(breaker.tripped)

{

return breaker.tripReason

?

`TRIPPED - ${breaker.tripReason}`

:

"TRIPPED";

}



if(!breaker.energized)

return "OFF";



return "ENERGIZED";


}







// Calculate breaker loading


export function calculateBreakerLoad(

breaker:Breaker,

watts:number

){


return {


amps:

Number(

(
watts /

breaker.voltage

)
.toFixed(2)

),


percent:

Number(

(
(
watts /

breaker.voltage
)

/

breaker.amperage

*

100

)
.toFixed(1)

)


};


}