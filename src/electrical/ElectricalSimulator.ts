// Residential Wiring Simulator v2.3
// Electrical simulation engine
//
// Handles:
// - circuit testing
// - power flow
// - load calculations
// - breaker overload detection
// - open circuit detection
// - short circuit detection


import type {

  ElectricalDevice

} from "./types";


import type {

  Connection

} from "./connections";


import type {

  BreakerPanel

} from "./breakerPanel";


import {

  getConnectedDevices

} from "./circuitGraph";


import type {

  CircuitGraph

} from "./circuitGraph";





// Simulation output

export interface SimulationResult {


  powered:boolean;


  amps:number;


  watts:number;


  issues:string[];


  path:string[];


}









export class ElectricalSimulator {



devices:ElectricalDevice[];


connections:Connection[];


panel:BreakerPanel;







constructor(

devices:ElectricalDevice[],

connections:Connection[],

panel:BreakerPanel

){


this.devices = devices;


this.connections = connections;


this.panel = panel;


}









simulate(

circuitId:string

):SimulationResult {



const issues:string[]=[];





// --------------------------------
// Build circuit graph
// --------------------------------


const graph: CircuitGraph = {


devices:this.devices,


connections:this.connections


};








// --------------------------------
// Find connected devices
// --------------------------------


const connectedDevices =

getConnectedDevices(

graph,

this.panel.id

);





const path =

connectedDevices.map(

device => device.id

);









// --------------------------------
// Open circuit detection
// --------------------------------


if(path.length === 0){


return {


powered:false,


amps:0,


watts:0,


issues:[

"OPEN CIRCUIT: No complete electrical path."

],


path:[]

};


}









// --------------------------------
// Calculate load
// --------------------------------


let watts = 0;




path.forEach(

(id:string)=>{


const device =

this.devices.find(

d => d.id === id

);



if(device){


watts +=

device.load?.watts ?? 0;


}


}

);








// --------------------------------
// Calculate current
// --------------------------------


const voltage = 120;



const amps =

Number(

(

watts /

voltage

)

.toFixed(2)

);









// --------------------------------
// Find breaker feeding circuit
// --------------------------------


const breakerSlot =

this.panel.breakers.find(

slot =>

slot.breaker?.circuitId === circuitId

);





const breaker =

breakerSlot?.breaker;









// --------------------------------
// Breaker checks
// --------------------------------


if(breaker){



if(

amps >

breaker.amperage

){


issues.push(

"BREAKER OVERLOAD: Load exceeds breaker rating."

);


}





if(

breaker.tripped

){


issues.push(

breaker.tripReason

?

`BREAKER TRIPPED: ${breaker.tripReason}`

:

"BREAKER TRIPPED."

);


}


}









// --------------------------------
// Connection checks
// --------------------------------


const openConnection =

this.connections.find(

connection =>

connection.status === "OPEN"

);



if(openConnection){


issues.push(

"OPEN CONNECTION DETECTED."

);


}







const faultConnection =

this.connections.find(

connection =>

connection.status === "FAULT"

);



if(faultConnection){


issues.push(

"SHORT CIRCUIT FAULT DETECTED."

);


}









return {


powered:

issues.length === 0,


amps,


watts,


issues,


path


};



}









// --------------------------------
// Breaker controls
// --------------------------------



tripBreaker(

breakerId:string

){



const slot =

this.panel.breakers.find(

s =>

s.id === breakerId

);





if(slot?.breaker){



slot.breaker.tripped = true;


slot.breaker.energized = false;


slot.breaker.tripReason =

"Manual trip";


}



}









resetBreaker(

breakerId:string

){



const slot =

this.panel.breakers.find(

s =>

s.id === breakerId

);





if(slot?.breaker){



slot.breaker.tripped = false;


slot.breaker.energized = false;


slot.breaker.tripReason = undefined;


}



}









// --------------------------------
// Device management
// --------------------------------



addDevice(

device:ElectricalDevice

){


this.devices.push(device);


}








addConnection(

connection:Connection

){


this.connections.push(connection);


}








removeDevice(

deviceId:string

){



this.devices =

this.devices.filter(

device =>

device.id !== deviceId

);





this.connections =

this.connections.filter(

connection =>


connection.from.deviceId !== deviceId &&


connection.to.deviceId !== deviceId


);



}



}