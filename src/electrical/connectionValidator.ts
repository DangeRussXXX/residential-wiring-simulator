// Residential Wiring Simulator v2.3
// Electrical connection validation engine
//
// Checks:
// - terminal compatibility
// - wire type compatibility
// - basic residential wiring rules
// - beginner mode feedback
// - future NEC expansion point


import type {
  ElectricalDevice,
  DeviceTerminal
} from "./types";


import type {
  Connection
} from "./connections";


import type {
  CableType
} from "./cables";





export type ValidationLevel =

  | "INFO"
  | "WARNING"
  | "ERROR";







export interface ValidationMessage {


  level:ValidationLevel;


  message:string;


}







export interface ConnectionValidationResult {


  valid:boolean;


  messages:ValidationMessage[];


}







// ------------------------------------
// Simulation validation result
// ------------------------------------


export interface ValidationResult {


  valid:boolean;


  failedConnections:string[];


  issues:string[];


}









// ------------------------------------
// Find device terminal
// ------------------------------------

function findTerminal(

device:ElectricalDevice,

terminalId:string

):DeviceTerminal | undefined {


return device.terminals.find(

terminal =>

terminal.id === terminalId

);


}









// ------------------------------------
// Validate terminal compatibility
// ------------------------------------

function validateTerminals(

from:DeviceTerminal,

to:DeviceTerminal

):ValidationMessage[] {


const messages:ValidationMessage[]=[];





if(

from.type==="hot" &&

to.type==="neutral"

){


messages.push({

level:"INFO",

message:

"120V potential difference detected."

});


}







if(

from.type==="ground" ||

to.type==="ground"

){


messages.push({

level:"INFO",

message:

"Equipment grounding path connected."

});


}







if(

from.type==="traveler" ||

to.type==="traveler"

){


messages.push({

level:"INFO",

message:

"Three-way switching traveler detected."

});


}






return messages;


}









// ------------------------------------
// Validate cable selection
// ------------------------------------

function validateCable(

cable:CableType,

device:ElectricalDevice

):ValidationMessage[] {


const messages:ValidationMessage[]=[];





switch(cable){



case "14/2 NM-B":


if(

device.load?.watts &&

device.load.watts > 1800

){


messages.push({

level:"WARNING",

message:

"14/2 NM-B may be undersized for this load."

});


}


break;







case "12/2 NM-B":


messages.push({

level:"INFO",

message:

"12 AWG conductor selected."

});


break;







case "10/2 NM-B":


messages.push({

level:"INFO",

message:

"Heavy appliance conductor selected."

});


break;




}




return messages;


}









// ------------------------------------
// Main connection validation
// ------------------------------------

export function validateConnection(

connection:Connection,

devices:ElectricalDevice[]

):ConnectionValidationResult {



const messages:ValidationMessage[]=[];





const fromDevice =

devices.find(

device =>

device.id === connection.from.deviceId

);





const toDevice =

devices.find(

device =>

device.id === connection.to.deviceId

);






if(!fromDevice || !toDevice){


return {


valid:false,


messages:[

{

level:"ERROR",

message:

"Connected device does not exist."

}

]


};


}







const fromTerminal =

findTerminal(

fromDevice,

connection.from.terminalId

);






const toTerminal =

findTerminal(

toDevice,

connection.to.terminalId

);






if(!fromTerminal || !toTerminal){


return {


valid:false,


messages:[

{

level:"ERROR",

message:

"Terminal not found."

}

]


};


}







messages.push(

...validateTerminals(

fromTerminal,

toTerminal

)

);







messages.push(

...validateCable(

connection.cable,

toDevice

)

);







if(

fromTerminal.type==="neutral"

&&

toTerminal.type==="ground"

){


messages.push({

level:"ERROR",

message:

"Neutral cannot be used as equipment grounding conductor."

});


}







if(

fromTerminal.type==="load"

&&

toTerminal.type==="load"

){


messages.push({

level:"ERROR",

message:

"Load terminals cannot be directly connected together."

});


}








return {


valid:

!

messages.some(

message =>

message.level==="ERROR"

),


messages


};



}









// ------------------------------------
// Validate all connections
// Used by SimulationController
// ------------------------------------

export function validateConnections(

connections:Connection[],

devices:ElectricalDevice[] = []

):ValidationResult {



const failedConnections:string[]=[];


const issues:string[]=[];







connections.forEach(connection=>{



const result =

validateConnection(

connection,

devices

);






if(!result.valid){


failedConnections.push(

connection.id

);



result.messages.forEach(message=>{


if(message.level==="ERROR"){


issues.push(

message.message

);


}



});


}



});








return {


valid:

failedConnections.length===0,



failedConnections,



issues


};



}









// ------------------------------------
// Quick classroom grading helper
// ------------------------------------

export function gradeConnection(

result:ConnectionValidationResult

):string {



if(!result.valid)

return "FAILED";





if(

result.messages.some(

m=>m.level==="WARNING"

)

)

return "CHECK";





return "PASSED";


}