// Residential Wiring Simulator v2.4
// Main simulator workspace
//
// Handles:
// - device placement
// - terminal wiring
// - visual wires
// - electrical connections
// - circuit topology
// - simulator context integration


import {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef
} from "react";


import {
  useSimulator
} from "./SimulatorContext";


import {
  componentCatalog
} from "../electrical/componentCatalog";


import Device from "../components/Device";


import type {

  ElectricalDevice,

  Voltage,

  BreakerPoles

} from "../electrical/types";


import type {

  Wire

} from "../electrical/wireModel";


import type {

  Connection

} from "../electrical/connections";







export type WorkspaceHandle = {


  addDevice:

  (
    name:string
  )=>void;



  updateDevice:

  (
    device:ElectricalDevice
  )=>void;



  getConnections:

  (
  )=>Connection[];


};









type WorkspaceProps = {


  onSelectDevice?:

  (
    device:ElectricalDevice|null
  )=>void;



  onCircuitPathsChange?:

  (
    paths:string[][]
  )=>void;


};









const Workspace = forwardRef<WorkspaceHandle, WorkspaceProps>(

function Workspace({

  onSelectDevice,

  onCircuitPathsChange

},

ref

){



// ----------------------------------
// GLOBAL SIMULATOR STATE
// ----------------------------------

const {

  devices,

  setDevices,

  connections,

  setConnections,

  selectedDevice,

  setSelectedDevice


}=useSimulator();









// ----------------------------------
// LOCAL WORKSPACE STATE
// ----------------------------------

const [wires,setWires] =

useState<Wire[]>([]);



const [wireMode,setWireMode] =

useState(false);



const [wireColor,setWireColor] =

useState("black");



const [selectedTerminal,setSelectedTerminal] =

useState<{

  deviceId:string;

  terminalId:string;

}|null>(null);



const [dragging,setDragging] =

useState<string|null>(null);



const svgRef =

useRef<SVGSVGElement|null>(null);









// ----------------------------------
// Create device from catalog
// ----------------------------------

function createDevice(

  name:string

){


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







setDevices(prev=>[

...prev,

device

]);


}









// ----------------------------------
// Update device
// ----------------------------------

function updateDevice(

updatedDevice:ElectricalDevice

){


setDevices(prev=>

prev.map(device=>

device.id===updatedDevice.id

?

updatedDevice

:

device

)

);



setSelectedDevice(updatedDevice);


onSelectDevice?.(updatedDevice);


}









// ----------------------------------
// Expose workspace API
// ----------------------------------

useImperativeHandle(ref,()=>({


addDevice:createDevice,


updateDevice,


getConnections:()=>connections


}));
// ----------------------------------
// Select device
// ----------------------------------

function selectDevice(

  id:string

){


let device =

devices.find(

d=>d.id===id

) || null;



if(!device)

return;





if(device.type==="Breaker Panel"){



const paths =

getCircuitPaths(

device,

devices

);



onCircuitPathsChange?.(paths);





const load =

calculateLoad(

device,

devices

);





device = {


...device,


calculatedLoad:load,


calculatedAmps:

load /

(device.voltage ?? 120)

};



setDevices(prev=>

prev.map(d=>

d.id===device?.id

?

device!

:

d

)

);



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











// ----------------------------------
// Prevent duplicate connections
// ----------------------------------

const duplicateExists = connections.some(connection =>

(
connection.from.deviceId === selectedTerminal.deviceId &&
connection.from.terminalId === selectedTerminal.terminalId &&
connection.to.deviceId === deviceId &&
connection.to.terminalId === terminalId
)

||

(
connection.from.deviceId === deviceId &&
connection.from.terminalId === terminalId &&
connection.to.deviceId === selectedTerminal.deviceId &&
connection.to.terminalId === selectedTerminal.terminalId
)

);



if(duplicateExists){

console.warn(
"Connection already exists"
);

setSelectedTerminal(null);

return;

}

const wire:Wire = {

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


gauge:

"#14",


cableType:

"14/2 NM-B",


installation:

"NM-B",


color:

wireColor.toUpperCase() as Wire["color"],


length:

0,


energized:

false,


current:

0,


voltage:

120

};

const connection:Connection = {

  id:crypto.randomUUID(),

  from:{
    deviceId:selectedTerminal.deviceId,
    terminalId:selectedTerminal.terminalId
  },

  to:{
    deviceId,
    terminalId
  },

  cable:"14/2 NM-B",

  wire:{

    gauge:"#14",

    conductors:2,

    cableType:"14/2 NM-B",

    length:0,

    ampacity:15,

    color:"BLACK"

  },

  installationMethod:"NM-B",

  status:"CONNECTED",

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









setDevices(prev=>

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


})

);









setSelectedTerminal(null);


}









// ----------------------------------
// Dragging
// ----------------------------------

function startDrag(

id:string

){


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
// Clear workspace
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
// Find circuit paths
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









// ----------------------------------
// Calculate connected load
// ----------------------------------

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









// ----------------------------------
// Find terminal position
// ----------------------------------

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









// ----------------------------------
// Render
// ----------------------------------

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

onMouseDown={(e)=>{

  const target = e.target as HTMLElement;


  if(
    target.closest(".device-component")
  ){

    return;

  }


  setSelectedDevice(null);

  onSelectDevice?.(null);

  setSelectedTerminal(null);

}}

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

w.from.deviceId,

w.from.terminalId

);





const end =

getTerminalPosition(

w.to.deviceId,

w.to.terminalId

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

data-device-id={device.id}

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