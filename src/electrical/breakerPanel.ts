// Residential Wiring Simulator v2.5
// Breaker panel definitions
//
// Handles:
// - breaker panel model
// - breaker slots
// - panel creation


import type {
  Breaker
} from "./breaker";




// --------------------------------
// Breaker slot
// --------------------------------

export interface BreakerSlot {

  id:string;

  slot:number;

  installed:boolean;

  breaker:Breaker | null;

}






// --------------------------------
// Breaker panel
// --------------------------------

export interface BreakerPanel {


  id:string;


  name:string;


  mainBreaker:number;


  voltage:240;


  serviceConnected:boolean;


  grounded:boolean;


  breakers:BreakerSlot[];


}








// --------------------------------
// Create breaker panel
// --------------------------------

export function createBreakerPanel(

  id:string,

  name:string,

  mainBreaker:number,

  slots:number

):BreakerPanel {



return {


id,

name,

mainBreaker,


voltage:240,


serviceConnected:true,


grounded:true,



breakers:

Array.from(

{length:slots},

(_,index)=>(


{

id:`slot-${index+1}`,

slot:index+1,


installed:false,


breaker:null


}


)

)


};


}