// Residential Wiring Simulator v2.3
// Connection management system
// Handles creating, removing, and validating electrical connections


import type {
  Connection,
  ConnectionPoint,
  CableType
} from "./connections";


import type {
  CircuitGraph
} from "./circuitGraph";


import {
  addConnectionToGraph,
  removeConnectionFromGraph
} from "./circuitGraph";




// Create a new electrical connection

export function createConnection(

graph:CircuitGraph,

from:ConnectionPoint,

to:ConnectionPoint,

cable:CableType

):CircuitGraph {


const connection:Connection = {

id:crypto.randomUUID(),

from,

to,

cable,

wire:{

gauge:"#14",

conductors:2,

cableType:cable,

length:0,

ampacity:15,

color:"BLACK"

},

installationMethod:"NM-B",

status:"CONNECTED",

energized:false

};


return addConnectionToGraph(

graph,

connection

);


}







// Remove one wire connection

export function deleteConnection(

graph:CircuitGraph,

connectionId:string

):CircuitGraph {


return removeConnectionFromGraph(

graph,

connectionId

);


}







// Find if two terminals are already connected

export function connectionExists(

graph:CircuitGraph,

from:ConnectionPoint,

to:ConnectionPoint

):boolean {



return graph.connections.some(connection=>

(

connection.from.deviceId === from.deviceId &&

connection.from.terminalId === from.terminalId &&

connection.to.deviceId === to.deviceId &&

connection.to.terminalId === to.terminalId

)

||

(

connection.from.deviceId === to.deviceId &&

connection.from.terminalId === to.terminalId &&

connection.to.deviceId === from.deviceId &&

connection.to.terminalId === from.terminalId

)

);


}







// Get all connections for a device

export function getDeviceConnections(

graph:CircuitGraph,

deviceId:string

):Connection[] {



return graph.connections.filter(connection=>

connection.from.deviceId === deviceId ||

connection.to.deviceId === deviceId

);


}







// Disconnect all wiring from a device

export function disconnectDevice(

graph:CircuitGraph,

deviceId:string

):CircuitGraph {



const remaining =

graph.connections.filter(connection=>

connection.from.deviceId !== deviceId &&

connection.to.deviceId !== deviceId

);



return {


...graph,


connections:remaining


};


}