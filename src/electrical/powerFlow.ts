// Residential Wiring Simulator v2.3
// Power flow engine
//
// Determines:
// - energized paths
// - current flow
// - circuit state
// - electrical faults


import type {
  CircuitGraph
} from "./circuitGraph";






export interface PowerFlowResult {


  energizedDevices:string[];


  energizedConnections:string[];


  failedConnections:string[];


}







// Simulate electrical power movement

export function calculatePowerFlow(

graph:CircuitGraph,

sourceId:string

):PowerFlowResult {



const visited = new Set<string>();


const energizedDevices:string[]=[];


const energizedConnections:string[]=[];


const failedConnections:string[]=[];






function walk(deviceId:string){



if(visited.has(deviceId))

return;



visited.add(deviceId);



energizedDevices.push(deviceId);






const deviceConnections =

graph.connections.filter(connection =>


connection.from.deviceId === deviceId ||

connection.to.deviceId === deviceId


);







deviceConnections.forEach(connection=>{



if(connection.status !== "CONNECTED"){


failedConnections.push(

connection.id

);


return;

}




connection.energized = true;



energizedConnections.push(

connection.id

);






const nextDevice =


connection.from.deviceId === deviceId


?


connection.to.deviceId


:


connection.from.deviceId;






walk(nextDevice);



});



}







walk(sourceId);







return {


energizedDevices,


energizedConnections,


failedConnections


};



}








// Reset all electrical states

export function resetPowerFlow(

graph:CircuitGraph

):CircuitGraph {



return {


...graph,


connections:

graph.connections.map(connection =>


({


...connection,


energized:false


})


)


};


}