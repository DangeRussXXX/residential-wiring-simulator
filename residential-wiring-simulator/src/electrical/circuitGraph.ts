// Residential Wiring Simulator v2.5
// Circuit graph engine
//
// Central electrical topology system
//
// Architecture:
//
// Service
//    |
// Breaker Panel
//    |
// Breakers
//    |
// Circuits
//    |
// Wires
//    |
// Devices


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
  Breaker
} from "./breaker";


import type {
  Circuit
} from "./circuit";


import type {
  Wire
} from "./wireModel";


import type {
  ResidentialService
} from "./service";





export interface CircuitGraph {


  // Utility

  service?:ResidentialService;



  // Main panel

  panel?:BreakerPanel;



  // Individual breakers

  breakers:Breaker[];



  // Branch circuits

  circuits:Circuit[];




  // Physical wires

  wires:Wire[];




  // Legacy connection layer

  // kept during transition

  connections:Connection[];




  // Devices

  devices:ElectricalDevice[];


}









export function createCircuitGraph():

CircuitGraph {


return {


devices:[],


connections:[],


breakers:[],


circuits:[],


wires:[]


};


}









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









export function getDeviceConnections(

graph:CircuitGraph,

deviceId:string

):Connection[] {


return graph.connections.filter(

connection =>


connection.from.deviceId===deviceId ||

connection.to.deviceId===deviceId


);


}









export function getConnectedDevices(

graph:CircuitGraph,

deviceId:string

):ElectricalDevice[] {


const connections =

getDeviceConnections(

graph,

deviceId

);



const ids = connections.map(connection=>{


if(

connection.from.deviceId===deviceId

)

return connection.to.deviceId;



return connection.from.deviceId;


});





return graph.devices.filter(device=>

ids.includes(device.id)

);


}









export function countEnergizedConnections(

graph:CircuitGraph

):number {


return graph.connections.filter(

connection=>

connection.energized

).length;


}