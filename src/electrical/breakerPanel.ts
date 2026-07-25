// Residential Wiring Simulator v2.5
// Breaker Panel System

import {
  createBreaker
} from "./breaker";



import type {
  Breaker
} from "./breaker";


import type {
  BreakerPoles
} from "./types";



export interface BreakerSlot {

id:string;

slot:number;

installed:boolean;

breaker:Breaker | null;


occupiedBy?:string;

}



export interface BreakerPanel {


  id:string;

  name:string;


  manufacturer?:string;


  model?:string;


  mainBreaker:number;


  voltage:240;


  spaces:number;


  serviceConnected:boolean;


  grounded:boolean;


  breakers:BreakerSlot[];

}






// --------------------------------
// Create Panel
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


manufacturer:"Generic",

model:"Residential Load Center",


mainBreaker,


voltage:240,


spaces:slots,


serviceConnected:true,


grounded:true,


breakers:

Array.from(

{length:slots},

(_,index)=>({

id:`slot-${index+1}`,

slot:index+1,

installed:false,

breaker:null

})

)


};


}







// --------------------------------
// Install Breaker
// --------------------------------

export function installBreaker(

panel:BreakerPanel,

breaker:Breaker

):BreakerPanel {



return {


...panel,


breakers:

panel.breakers.map(slot=>{


if(slot.slot !== breaker.slot)

return slot;



return {


...slot,


installed:true,


breaker


};


})


};



}








// --------------------------------
// Remove Breaker
// --------------------------------

export function removeBreaker(

panel:BreakerPanel,

slotNumber:number

):BreakerPanel {



return {


...panel,


breakers:

panel.breakers.map(slot=>{


if(slot.slot !== slotNumber)

return slot;



return {


...slot,


installed:false,


breaker:null


};


})


};



}







// --------------------------------
// Find Slot
// --------------------------------

export function getBreakerSlot(

panel:BreakerPanel,

slotNumber:number

){


return panel.breakers.find(

slot=>slot.slot===slotNumber

);


}
// --------------------------------
// Add Standard Breaker
// --------------------------------

export function addStandardBreaker(

  panel: BreakerPanel,

  slotNumber:number,

  amperage:number

):BreakerPanel {


const breaker = createBreaker(

`breaker-${slotNumber}`,

slotNumber,

amperage,

1 as BreakerPoles,

"STANDARD"

);



return installBreaker(

panel,

breaker

);


}