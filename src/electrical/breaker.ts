// Residential Wiring Simulator v2.5
// Individual breaker system
//
// Represents physical breakers installed inside panels


import type {
  BreakerPoles,
  Voltage
} from "./types";





export type BreakerType =

  | "STANDARD"
  | "AFCI"
  | "GFCI"
  | "DUAL_FUNCTION";





export type BreakerStatus =

  | "OFF"
  | "ON"
  | "TRIPPED";





export interface BreakerTerminal {


  id:string;


  type:

    | "HOT"

    | "NEUTRAL";


}








export interface Breaker {


  id:string;



  // Panel position

  slot:number;



  label:string;



  // Electrical rating

  amperage:number;



  poles:BreakerPoles;



  voltage:Voltage;



  breakerType:BreakerType;



  // Physical terminals

  terminals:BreakerTerminal[];




  // Circuit assigned

  circuitId?:string;



  // Devices downstream

  connectedDevices:string[];




  // State

  status:BreakerStatus;



  energized:boolean;



  tripped:boolean;



  tripReason?:string;


}









export function createBreaker(

id:string,

slot:number,

amperage:number,

poles:BreakerPoles,

breakerType:BreakerType="STANDARD"

):Breaker {



return {


id,


slot,


label:

`${amperage}A Breaker`,



amperage,



poles,



voltage:

poles===2

?

240

:

120,



breakerType,



terminals:

[

{

id:"line",

type:"HOT"

}

],



connectedDevices:[],



status:"OFF",



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


status:"TRIPPED",


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


status:"OFF",


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


status:"ON",


energized:true


};


}