// Residential Wiring Simulator v2.5
// Main simulator layout

import {
  useRef,
  useState
} from "react";


import Workspace from "../simulator/Workspace";

import SimulationPanel from "../simulator/SimulationPanel";

import ComponentLibrary from "../components/ComponentLibrary";

import BreakerPanel from "../components/BreakerPanel";

import PropertiesPanel from "../components/PropertiesPanel";

import Toolbar from "../toolbar/Toolbar";


import type {
  WorkspaceHandle
} from "../simulator/Workspace";


import {
  useSimulator
} from "../simulator/SimulatorContext";


import {
  createBreakerPanel
} from "../electrical/breakerPanel";




export default function SimulatorLayout(){


const workspaceRef =
useRef<WorkspaceHandle>(null);


const resizing =
useRef(false);


const componentResizing =
useRef(false);





const {

devices,

setDevices,

connections,

setConnections,

selectedDevice,

setSelectedDevice

}=useSimulator();





const [

propertiesWidth,

setPropertiesWidth

]=useState(350);



const [

componentWidth,

setComponentWidth

]=useState(220);



const [

circuitPaths,

setCircuitPaths

]=useState<string[][]>([]);



const [
  circuitStatus,
  setCircuitStatus
]=useState<
"READY" | "WARNING" | "FAULT"
>("READY");







// ---------------------------------
// ACTIVE BREAKER PANEL
// ---------------------------------

const panelDevice =

selectedDevice?.type === "Breaker Panel"

?

selectedDevice

:

null;



const panel = panelDevice

?

createBreakerPanel(

panelDevice.id,

panelDevice.name,

panelDevice.mainBreaker ?? 200,

12

)

:

null;







// ---------------------------------
// UPDATE DEVICE
// ---------------------------------

function updateDevice(
updatedDevice:any
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

}









// ---------------------------------
// REFRESH SIMULATION
// ---------------------------------

function refreshSimulation(){

const currentConnections =

workspaceRef.current?.getConnections()

??

[];


setConnections(
currentConnections
);

}


// ---------------------------------
// RESET BREAKER
// ---------------------------------

function resetBreaker(){

  setCircuitStatus("READY");

}






// ---------------------------------
// RESIZE RIGHT PANEL
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


const width =

startWidth +

(startX-event.clientX);



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
// RESIZE COMPONENT LIBRARY
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


const width =

startWidth +

(event.clientX-startX);



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

<Toolbar
  circuitStatus={circuitStatus}
  onResetBreaker={resetBreaker}
/>





{

panel &&

(

<div

style={{

flexShrink:0,

background:"#181818",

padding:"10px"

}}

>

<BreakerPanel

panel={panel}

circuitStatus={circuitStatus}

onTrip={() => setCircuitStatus("FAULT")}

onReset={resetBreaker}

/>

</div>

)

}








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

flexShrink:0

}}

>


<ComponentLibrary

workspaceRef={workspaceRef}

/>


</div>







{/* COMPONENT RESIZE */}

<div

onMouseDown={startComponentResize}

style={{

width:"10px",

cursor:"col-resize",

background:"#444",

flexShrink:0

}}

/>








{/* WORKSPACE */}

<div

style={{

flex:1,

padding:"15px",

background:"#303030",

overflow:"hidden",

minWidth:0

}}

>


<Workspace

ref={workspaceRef}

onSelectDevice={setSelectedDevice}

onCircuitPathsChange={setCircuitPaths}

/>


</div>









{/* RIGHT PANEL */}

<div

style={{

width:`${propertiesWidth}px`,

minWidth:"260px",

display:"flex",

background:"#252526",

flexShrink:0

}}

>





<div

onMouseDown={startResize}

style={{

width:"10px",

cursor:"col-resize",

background:"#444"

}}

/>









<div

style={{

flex:1,

overflowY:"auto",

padding:"10px"

}}

>





<button

onClick={refreshSimulation}

style={{

padding:"12px",

width:"100%"

}}

>

Update Simulation

</button>









<SimulationPanel

devices={devices}

connections={connections}

sourceId={

panelDevice?.id ?? ""

}

/>









<PropertiesPanel

device={selectedDevice}

devices={devices}

circuitPaths={circuitPaths}

onUpdateDevice={(updated)=>{


updateDevice(updated);


setSelectedDevice(updated);


workspaceRef.current?.updateDevice(updated);


}}

/>







</div>


</div>








</div>


</div>


);

}