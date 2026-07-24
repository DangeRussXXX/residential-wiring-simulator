// Residential Wiring Simulator v2.3
// Main simulator workspace
//
// Handles:
// - device placement
// - terminal wiring
// - visual wires
// - electrical connections
// - circuit topology


import {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef
} from "react";


import {
  componentCatalog
} from "../electrical/componentCatalog";


import Device from "../components/Device";


import type {

ElectricalDevice,

Wire,

Voltage,

BreakerPoles

} from "../electrical/types";


import type {

Connection

} from "../electrical/connections";






export type WorkspaceHandle = {


addDevice:

(name:string)=>void;



updateDevice:

(device:ElectricalDevice)=>void;



getConnections:

()=>Connection[];


};







type WorkspaceProps = {


onSelectDevice?:

(
device:ElectricalDevice | null
)=>void;



onDevicesChange?:

(
devices:ElectricalDevice[]
)=>void;



onCircuitPathsChange?:

(
paths:string[][]
)=>void;


};








const Workspace = forwardRef<WorkspaceHandle, WorkspaceProps>(

function Workspace({

onSelectDevice,

onDevicesChange,

onCircuitPathsChange

},

ref

){







const [devices,setDevices] =

useState<ElectricalDevice[]>([]);






// Visual drawing wires

const [wires,setWires] =

useState<Wire[]>([]);






// Electrical simulation connections

const [connections,setConnections] =

useState<Connection[]>([]);







const [wireMode,setWireMode] =

useState(false);







const [wireColor,setWireColor] =

useState("black");








const [selectedTerminal,setSelectedTerminal] =

useState<{

deviceId:string;

terminalId:string;


}|null>(null);








const [selectedDevice,setSelectedDevice] =

useState<ElectricalDevice|null>(null);







const [dragging,setDragging] =

useState<string|null>(null);







const svgRef =

useRef<SVGSVGElement|null>(null);









// ----------------------------------
// Create device from catalog
// ----------------------------------


function createDevice(name:string){



const definition =

componentCatalog.find(

c=>c.name===name

);



if(!definition)

return;







const terminals =

definition.terminals.map(t=>({


...t,


id:

`${t.id}-${crypto.randomUUID()}`


}));







const device:ElectricalDevice = {



id:

crypto.randomUUID(),



name:

definition.name,



type:

definition.type,



connectedDevices:[],



calculatedLoad:0,



calculatedAmps:0,



amperage:

definition.electrical?.amps,



poles:

definition.electrical?.poles as BreakerPoles,



breakerSize:

definition.electrical?.amps,



mainBreaker:

definition.type==="Breaker Panel"

?

definition.electrical?.amps

:

undefined,



terminals,



load:{

watts:

definition.electrical?.watts ?? 0

},



voltage:

(

definition.electrical?.voltage ?? 120

) as Voltage,



x:150,



y:120,



tripped:false



};








setDevices(prev=>{


const updated=[

...prev,

device

];


onDevicesChange?.(updated);


return updated;


});


}









// ----------------------------------
// Update device
// ----------------------------------


function updateDevice(

updatedDevice:ElectricalDevice

){



setDevices(prev=>{


const updated =

prev.map(device=>



device.id===updatedDevice.id

?

updatedDevice

:

device


);



onDevicesChange?.(updated);



return updated;



});




setSelectedDevice(updatedDevice);


onSelectDevice?.(updatedDevice);


}









useImperativeHandle(ref,()=>({



addDevice:createDevice,



updateDevice,



getConnections:()=>connections



}));
// ----------------------------------
// Select device
// ----------------------------------

function selectDevice(id:string){


let device =

devices.find(d=>d.id===id) || null;



if(!device)

return;





const paths =

device.type==="Breaker Panel"

?

getCircuitPaths(

device,

devices

)

:

[];




onCircuitPathsChange?.(paths);





if(device.type==="Breaker Panel"){


const load =

calculateLoad(

device,

devices

);



const updatedDevice = {


...device,


calculatedLoad:load,


calculatedAmps:

load /

(device.voltage ?? 120)


};



setDevices(prev=>

prev.map(d=>

d.id===updatedDevice.id

?

updatedDevice

:

d

)

);



device = updatedDevice;


}





setSelectedDevice(device);


onSelectDevice?.(device);


}









// ----------------------------------
// Terminal wiring
// ----------------------------------

function terminalClick(

deviceId:string,

terminalId:string

){



if(!wireMode)

return;






if(!selectedTerminal){


setSelectedTerminal({


deviceId,


terminalId


});



return;


}







const wire:Wire = {


id:

crypto.randomUUID(),


fromDevice:

selectedTerminal.deviceId,


fromTerminal:

selectedTerminal.terminalId,


toDevice:

deviceId,


toTerminal:

terminalId,


color:wireColor


};






const connection:Connection = {


id:

crypto.randomUUID(),



from:{


deviceId:

selectedTerminal.deviceId,


terminalId:

selectedTerminal.terminalId


},



to:{


deviceId,


terminalId


},



cable:"14/2 NM-B",



status:"CONNECTED",



installationMethod:"NM-B",



energized:false


};







setWires(prev=>[

...prev,

wire

]);





setConnections(prev=>[

...prev,

connection

]);







setDevices(prev=>{


const updated =

prev.map(device=>{


if(device.id===selectedTerminal.deviceId){


return {


...device,


connectedDevices:[


...new Set([

...(device.connectedDevices ?? []),

deviceId

])


]


};


}






if(device.id===deviceId){


return {


...device,


connectedDevices:[


...new Set([

...(device.connectedDevices ?? []),

selectedTerminal.deviceId

])


]


};


}





return device;


});





onDevicesChange?.(updated);



return updated;



});






setSelectedTerminal(null);


}









// ----------------------------------
// Dragging
// ----------------------------------

function startDrag(id:string){


if(!wireMode){


setDragging(id);


}


}








function moveBoard(

e:React.MouseEvent<HTMLDivElement>

){


if(!dragging)

return;





const rect =

e.currentTarget.getBoundingClientRect();





setDevices(prev=>

prev.map(device=>



device.id===dragging

?

{


...device,


x:

e.clientX -

rect.left -

75,



y:

e.clientY -

rect.top -

45


}


:

device



)

);


}









// ----------------------------------
// Clear board
// ----------------------------------

function clearWorkspace(){


setDevices([]);


setWires([]);


setConnections([]);


setSelectedTerminal(null);


setSelectedDevice(null);


onCircuitPathsChange?.([]);


}









// ----------------------------------
// Circuit path finder
// ----------------------------------

function getCircuitPaths(

device:ElectricalDevice,

deviceList:ElectricalDevice[],

path:string[]=[device.name],

visited=new Set<string>()

):string[][] {



if(visited.has(device.id))

return [];




const nextVisited =

new Set(visited);



nextVisited.add(device.id);




let paths:string[][]=[];



(device.connectedDevices ?? [])

.forEach(id=>{


const connected =

deviceList.find(

d=>d.id===id

);



if(!connected)

return;




if(nextVisited.has(connected.id))

return;





const newPath=[

...path,

connected.name

];



paths.push(newPath);



paths.push(

...getCircuitPaths(

connected,

deviceList,

newPath,

nextVisited

)

);



});





return paths;


}









function calculateLoad(

device:ElectricalDevice,

deviceList:ElectricalDevice[],

visited=new Set<string>()

):number {



if(visited.has(device.id))

return 0;



visited.add(device.id);




return (

device.connectedDevices ?? []

).reduce((total,id)=>{


const connected =

deviceList.find(

d=>d.id===id

);



if(!connected)

return total;




return (

total +

(connected.load?.watts ?? 0) +

calculateLoad(

connected,

deviceList,

visited

)

);



},0);



}









function getTerminalPosition(

deviceId:string,

terminalId:string

){



const device =

devices.find(

d=>d.id===deviceId

);



const terminal =

device?.terminals.find(

t=>t.id===terminalId

);





if(!device || !terminal)

return null;





return {


x:

device.x + terminal.x,


y:

device.y + terminal.y


};



}









return (

<div>


<div

style={{

display:"flex",

gap:"10px",

marginBottom:"10px"

}}

>


<button

onClick={()=>setWireMode(!wireMode)}

>

{

wireMode

?

"Exit Wire"

:

"Wire Tool"

}

</button>




<select

value={wireColor}

onChange={e=>

setWireColor(e.target.value)

}

>

<option value="black">
Hot
</option>

<option value="red">
Load
</option>

<option value="white">
Neutral
</option>

<option value="green">
Ground
</option>

</select>





<button

onClick={clearWorkspace}

>

Clear

</button>



</div>








<div

className="training-board"

onMouseMove={moveBoard}

onMouseUp={()=>setDragging(null)}

style={{

width:"100%",

height:"calc(100vh - 170px)",

minHeight:"700px",

overflow:"auto",

background:"#d7dbe0",

border:"2px solid #555",

borderRadius:"8px",

position:"relative"

}}

>





<div

style={{

width:"2000px",

height:"1200px",

position:"relative"

}}

>




<svg

ref={svgRef}

style={{

position:"absolute",

left:0,

top:0,

width:"2000px",

height:"1200px",

pointerEvents:"none"

}}

>


{

wires.map(w=>{


const start =

getTerminalPosition(

w.fromDevice,

w.fromTerminal

);



const end =

getTerminalPosition(

w.toDevice,

w.toTerminal

);



if(!start || !end)

return null;




return (

<line

key={w.id}

x1={start.x}

y1={start.y}

x2={end.x}

y2={end.y}

stroke={w.color}

strokeWidth="5"

/>

);


})

}


</svg>







{

devices.map(device=>(


<Device


key={device.id}


device={device}


wireMode={wireMode}



selectedTerminal={

selectedTerminal

?

`${selectedTerminal.deviceId}-${selectedTerminal.terminalId}`

:

null

}



selected={

selectedDevice?.id===device.id

}



onSelect={selectDevice}



onTerminalClick={terminalClick}



onStartDrag={startDrag}


/>


))


}




</div>


</div>


</div>

);


});



export default Workspace;
