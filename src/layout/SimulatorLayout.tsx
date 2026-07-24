// Residential Wiring Simulator v2.3
// Main simulator layout
//
// Handles:
// - component library
// - workspace
// - properties panel
// - simulation panel
// - live circuit graph


import {
  useRef,
  useState
} from "react";


import Workspace from "../simulator/Workspace";

import SimulationPanel from "../simulator/SimulationPanel";

import ComponentLibrary from "../components/ComponentLibrary";

import TopToolbar from "../components/TopToolbar";

import PropertiesPanel from "../components/PropertiesPanel";


import type {
  WorkspaceHandle
} from "../simulator/Workspace";


import type {
  ElectricalDevice
} from "../electrical/types";


import type {
  Connection
} from "../electrical/connections";


import type {
  CircuitGraph
} from "../electrical/circuitGraph";







export default function SimulatorLayout(){



const workspaceRef =

useRef<WorkspaceHandle>(null);




// Existing properties resize

const resizing =

useRef(false);


// New component library resize

const componentResizing =

useRef(false);





const [selectedDevice,setSelectedDevice] =

useState<ElectricalDevice|null>(null);





const [devices,setDevices] =

useState<ElectricalDevice[]>([]);





const [,setConnections] =

useState<Connection[]>([]);





const [circuitPaths,setCircuitPaths] =

useState<string[][]>([]);





const [propertiesWidth,setPropertiesWidth] =

useState(350);




// New component panel width

const [componentWidth,setComponentWidth] =

useState(220);





const [graph,setGraph] =

useState<CircuitGraph>({

devices:[],

connections:[]

});









// ---------------------------------
// Resize right panel
// ---------------------------------

function startResize(

e:React.MouseEvent

){


e.preventDefault();


resizing.current=true;



const startX=e.clientX;


const startWidth=propertiesWidth;





const handleMouseMove=(event:MouseEvent)=>{


if(!resizing.current)

return;



const delta=startX-event.clientX;



const width=startWidth+delta;



if(width>=260 && width<=700){

setPropertiesWidth(width);

}


};






const stopResize=()=>{


resizing.current=false;



window.removeEventListener(

"mousemove",

handleMouseMove

);



window.removeEventListener(

"mouseup",

stopResize

);



};





window.addEventListener(

"mousemove",

handleMouseMove

);



window.addEventListener(

"mouseup",

stopResize

);



}









// ---------------------------------
// Resize component library
// ---------------------------------

function startComponentResize(

e:React.MouseEvent

){


e.preventDefault();


componentResizing.current=true;



const startX=e.clientX;


const startWidth=componentWidth;





const handleMouseMove=(event:MouseEvent)=>{


if(!componentResizing.current)

return;



const delta=event.clientX-startX;



const width=startWidth+delta;



if(width>=160 && width<=500){

setComponentWidth(width);

}


};






const stopResize=()=>{


componentResizing.current=false;



window.removeEventListener(

"mousemove",

handleMouseMove

);



window.removeEventListener(

"mouseup",

stopResize

);



};





window.addEventListener(

"mousemove",

handleMouseMove

);



window.addEventListener(

"mouseup",

stopResize

);



}









// ---------------------------------
// Device updates
// ---------------------------------

function handleDevicesChange(

updatedDevices:ElectricalDevice[]

){


setDevices(updatedDevices);



setGraph(prev=>({


devices:updatedDevices,


connections:prev.connections


}));


}









// ---------------------------------
// Connection updates
// ---------------------------------

function handleConnectionsChange(

updatedConnections:Connection[]

){


setConnections(updatedConnections);



setGraph(prev=>({


devices:prev.devices,


connections:updatedConnections


}));


}









// ---------------------------------
// Manual refresh
// ---------------------------------

function refreshSimulation(){


const currentConnections =

workspaceRef.current?.getConnections()

??

[];



setConnections(currentConnections);



setGraph({

devices:devices,

connections:currentConnections

});


}









// ---------------------------------
// Render
// ---------------------------------

return (

<div

style={{

height:"100vh",

display:"flex",

flexDirection:"column",

background:"#202124",

color:"white",

overflow:"hidden"

}}

>


<TopToolbar />









<div

style={{

flex:1,

display:"flex",

minHeight:0,

overflow:"hidden"

}}

>









{/* COMPONENT LIBRARY */}

<div

style={{

width:`${componentWidth}px`,

background:"#252526",

height:"100%",

overflowY:"auto",

overflowX:"hidden",

flexShrink:0

}}

>


<ComponentLibrary

workspaceRef={workspaceRef}

/>


</div>









{/* COMPONENT RESIZE BAR */}

<div

onMouseDown={startComponentResize}

style={{

width:"10px",

cursor:"col-resize",

background:"#444",

flexShrink:0,

userSelect:"none"

}}

/>









{/* WORKSPACE */}

<div

style={{

flex:1,

padding:"15px",

background:"#303030",

overflow:"hidden",

minWidth:0,

minHeight:0

}}

>


<Workspace

ref={workspaceRef}

onSelectDevice={setSelectedDevice}

onDevicesChange={handleDevicesChange}

onConnectionsChange={handleConnectionsChange}

onCircuitPathsChange={setCircuitPaths}

/>


</div>









{/* RIGHT SIDE PANELS */}

<div

style={{

width:`${propertiesWidth}px`,

minWidth:"260px",

maxWidth:"700px",

display:"flex",

background:"#252526",

height:"100%",

minHeight:0,

flexShrink:0

}}

>









{/* RESIZE BAR */}

<div

onMouseDown={startResize}

style={{

width:"10px",

cursor:"col-resize",

background:"#444",

flexShrink:0,

userSelect:"none"

}}

/>









{/* SCROLL AREA */}

<div

style={{

flex:1,

minHeight:0,

overflowY:"auto",

overflowX:"hidden",

padding:"10px",

display:"flex",

flexDirection:"column",

gap:"10px"

}}

>


<button

style={{

padding:"12px",

fontWeight:"bold"

}}

>

TEST CIRCUIT

</button>



<button

onClick={refreshSimulation}

style={{

padding:"12px",

fontWeight:"bold"

}}

>

Update Simulation

</button>









<SimulationPanel

graph={graph}

sourceId={

devices.find(

device=>

device.type==="Breaker Panel"

)?.id

??

""

}

/>









<PropertiesPanel

device={selectedDevice}

devices={devices}

circuitPaths={circuitPaths}

onUpdateDevice={(updated)=>{

setSelectedDevice(updated);

workspaceRef.current?.updateDevice(

updated

);

}}

/>

</div>

</div>

</div>

</div>

);

}