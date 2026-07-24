// Residential Wiring Simulator v2.3
// Breaker panel hierarchy system
// Panel contains breaker slots which contain breakers


import type {
  Breaker
} from "./breaker";





export interface BreakerSlot {


  id:string;


  // Physical position

  slot:number;



  // Installed breaker

  breaker?:Breaker;



  // Slot state

  installed:boolean;


}








export interface BreakerPanel {


  id:string;


  name:string;



  // Main service breaker

  mainBreaker:number;



  voltage:240;



  breakers:BreakerSlot[];



  serviceConnected:boolean;



  grounded:boolean;


}








export function createBreakerPanel(

id:string,

name:string,

mainBreaker:number,

spaces:number

):BreakerPanel {



const breakers:BreakerSlot[]=[];




for(
let i=1;
i<=spaces;
i++
){


breakers.push({


id:`slot-${i}`,


slot:i,


installed:false


});


}




return {


id,


name,


mainBreaker,


voltage:240,


breakers,


serviceConnected:false,


grounded:false


};


}