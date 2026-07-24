// Residential Wiring Simulator v2.3
// Circuit graph engine
// Central topology system for electrical simulation


import type {
  ElectricalDevice
} from "./types";


import type {
  Connection
} from "./connections";


import type {
  BreakerPanel
} from "./breakerPanel";


import type {
  ResidentialService
} from "./service";





// Complete electrical system graph

export interface CircuitGraph {


  // Utility source

  service?:ResidentialService;



  // Distribution equipment

  panel?:BreakerPanel;



  // All devices in workspace

  devices:ElectricalDevice[];




  // Physical wire connections

  connections:Connection[];


}





// Create empty graph

export function createCircuitGraph():

CircuitGraph {


return {


devices:[],


connections:[]


};


}







// Add a device to graph

export function addDeviceToGraph(

graph:CircuitGraph,

device:ElectricalDevice

):CircuitGraph {


return {


...graph,


devices:[

...graph.devices,

device

]


};


}







// Remove device from graph

export function removeDeviceFromGraph(

graph:CircuitGraph,

deviceId:string

):CircuitGraph {


return {


...graph,


devices:

graph.devices.filter(

device =>

device.id !== deviceId

),



connections:

graph.connections.filter(

connection =>

connection.from.deviceId !== deviceId &&

connection.to.deviceId !== deviceId

)


};


}







// Add physical connection

export function addConnectionToGraph(

graph:CircuitGraph,

connection:Connection

):CircuitGraph {


return {


...graph,


connections:[

...graph.connections,

connection

]


};


}







// Remove a single wire connection

export function removeConnectionFromGraph(

graph:CircuitGraph,

connectionId:string

):CircuitGraph {


return {


...graph,


connections:

graph.connections.filter(

connection =>

connection.id !== connectionId

)


};


}







// Find all connections for a device

export function getDeviceConnections(

graph:CircuitGraph,

deviceId:string

):Connection[] {


return graph.connections.filter(

connection =>


connection.from.deviceId === deviceId ||

connection.to.deviceId === deviceId


);


}







// Find devices connected to another device

export function getConnectedDevices(

graph:CircuitGraph,

deviceId:string

):ElectricalDevice[] {


const connections =

getDeviceConnections(

graph,

deviceId

);



const ids =

connections.map(connection => {


if(

connection.from.deviceId === deviceId

){

return connection.to.deviceId;

}


return connection.from.deviceId;


});




return graph.devices.filter(device =>

ids.includes(device.id)

);


}







// Trace power path through system

export function traceCircuitPath(

graph:CircuitGraph,

startDeviceId:string,

visited = new Set<string>()

):string[] {



if(

visited.has(startDeviceId)

){

return [];

}



visited.add(startDeviceId);




const device =

graph.devices.find(

d => d.id === startDeviceId

);



if(!device)

return [];





const connected =

getConnectedDevices(

graph,

startDeviceId

);





return [


device.name,


...connected.flatMap(

next =>

traceCircuitPath(

graph,

next.id,

visited

)

)


];



}







// Check if graph contains a closed circuit

export function hasCompletePath(

graph:CircuitGraph,

startDeviceId:string,

endDeviceId:string

):boolean {



const visited =

new Set<string>();





function search(

current:string

):boolean {



if(

current === endDeviceId

)

return true;




if(

visited.has(current)

)

return false;



visited.add(current);




const connected =

getConnectedDevices(

graph,

current

);



return connected.some(

device =>

search(device.id)

);


}



return search(startDeviceId);


}







// Count energized connections

export function countEnergizedConnections(

graph:CircuitGraph

):number {


return graph.connections.filter(

connection =>

connection.energized

).length;


}