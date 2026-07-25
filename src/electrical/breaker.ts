// Residential Wiring Simulator v2.5
// Individual breaker system

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

  slot:number;

  label:string;


  amperage:number;

  poles:BreakerPoles;

  voltage:Voltage;


  breakerType:BreakerType;


  terminals:BreakerTerminal[];


  circuitId?:string;


  connectedDevices:string[];


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
`${amperage}A ${breakerType}`,



amperage,


poles,


voltage:

poles===2

?240
:120,



breakerType,



terminals:[

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






// --------------------------------
// Library breaker presets
// --------------------------------


export function createLibraryBreaker(

amperage:number,

poles:BreakerPoles,

breakerType:BreakerType

):Breaker {


return createBreaker(

crypto.randomUUID(),

0,

amperage,

poles,

breakerType

);


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