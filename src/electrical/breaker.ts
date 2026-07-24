// Residential Wiring Simulator v2.3
// Individual breaker system
// Represents a physical circuit breaker


import type {
  BreakerPoles,
  Voltage
} from "./types";





export type BreakerType =

  | "STANDARD"
  | "AFCI"
  | "GFCI"
  | "DUAL_FUNCTION";







export interface Breaker {


  id:string;


  amperage:number;


  poles:BreakerPoles;


  voltage:Voltage;



  breakerType:BreakerType;



  // Circuit assigned to breaker

  circuitId?:string;



  // Electrical state

  energized:boolean;


  tripped:boolean;


  tripReason?:string;


}








export function createBreaker(

id:string,

amperage:number,

poles:BreakerPoles,

breakerType:BreakerType="STANDARD"

):Breaker {



return {


id,


amperage,


poles,


voltage:

poles === 2

?

240

:

120,


breakerType,


energized:false,


tripped:false


};


}









export function tripBreaker(

breaker:Breaker,

reason:string

):Breaker {


return {


...breaker,


energized:false,


tripped:true,


tripReason:reason


};


}









export function resetBreaker(

breaker:Breaker

):Breaker {


return {


...breaker,


energized:false,


tripped:false,


tripReason:undefined


};


}









export function energizeBreaker(

breaker:Breaker

):Breaker {



if(breaker.tripped)

return breaker;



return {


...breaker,


energized:true


};


}