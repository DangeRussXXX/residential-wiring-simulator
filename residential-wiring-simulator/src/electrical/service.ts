// Residential Wiring Simulator v2.3
// Electrical service entrance system
// Utility → Meter → Panel hierarchy


export type ServiceStatus =
  | "DISCONNECTED"
  | "CONNECTED"
  | "FAULT";


export type ServiceVoltage =
  | 120
  | 240;




// Connection point used by circuit graph

export interface ServiceConnectionPoint {

  id:string;

  name:string;

  type:
    | "line"
    | "neutral"
    | "ground";

}





// Utility transformer supplying residence

export interface UtilityTransformer {

  id:string;

  name:string;

  voltage:240;

  available:boolean;

  status:ServiceStatus;


  terminals:ServiceConnectionPoint[];

}






// Service conductors

export interface ServiceDrop {


  id:string;


  transformerId:string;


  meterId:string;


  conductors:number;


  voltage:ServiceVoltage;


  status:ServiceStatus;


  terminals:ServiceConnectionPoint[];

}






// Electric meter

export interface ElectricMeter {


  id:string;


  name:string;


  serviceDropId:string;


  voltage:240;


  connected:boolean;


  terminals:ServiceConnectionPoint[];

}







// Complete residential service

export interface ResidentialService {


  id:string;


  name:string;


  transformer:UtilityTransformer;


  serviceDrop:ServiceDrop;


  meter:ElectricMeter;


  panelId:string;


  energized:boolean;


  status:ServiceStatus;

}








// Create default residential service

export function createResidentialService(
panelId:string
):ResidentialService {



const transformer:UtilityTransformer = {


id:"utility-transformer",


name:"Utility Transformer",


voltage:240,


available:true,


status:"CONNECTED",


terminals:[

{
id:"hotA",
name:"Hot A",
type:"line"
},

{
id:"hotB",
name:"Hot B",
type:"line"
},

{
id:"neutral",
name:"Neutral",
type:"neutral"
}

]


};







const serviceDrop:ServiceDrop = {


id:"service-drop",


transformerId:
transformer.id,


meterId:
"electric-meter",


conductors:3,


voltage:240,


status:"CONNECTED",


terminals:[

{
id:"line",
name:"Service Conductors",
type:"line"
}

]


};







const meter:ElectricMeter = {


id:"electric-meter",


name:"Residential Electric Meter",


serviceDropId:
serviceDrop.id,


voltage:240,


connected:true,


terminals:[

{
id:"line-in",
name:"Utility Side",
type:"line"
},

{
id:"line-out",
name:"Panel Side",
type:"line"
}

]


};







return {


id:"residential-service",


name:"Residential Electrical Service",


transformer,


serviceDrop,


meter,


panelId,


energized:false,


status:"CONNECTED"


};


}








export function energizeService(
service:ResidentialService
):ResidentialService {


return {

...service,

energized:true,

status:"CONNECTED"

};


}








export function disconnectService(
service:ResidentialService
):ResidentialService {


return {

...service,

energized:false,

status:"DISCONNECTED"

};


}