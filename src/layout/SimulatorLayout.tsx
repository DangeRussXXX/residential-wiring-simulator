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





  const resizing =

    useRef(false);







  const [selectedDevice,setSelectedDevice] =

    useState<ElectricalDevice | null>(null);







  const [devices,setDevices] =

    useState<ElectricalDevice[]>([]);







  const [connections,setConnections] =

    useState<Connection[]>([]);







  const [circuitPaths,setCircuitPaths] =

    useState<string[][]>([]);







  const [propertiesWidth,setPropertiesWidth] =

    useState(350);







  const [graph,setGraph] =

    useState<CircuitGraph>({

      devices:[],

      connections:[]

    });









// ---------------------------------
// Resize properties panel
// ---------------------------------

function startResize(
  e:React.MouseEvent
){


  e.preventDefault();


  resizing.current = true;



  const startX =

    e.clientX;



  const startWidth =

    propertiesWidth;





  const handleMouseMove =

    (event:MouseEvent)=>{


      if(!resizing.current)

        return;



      const delta =

        startX - event.clientX;



      const newWidth =

        startWidth + delta;





      if(

        newWidth >=260 &&

        newWidth <=700

      ){

        setPropertiesWidth(newWidth);

      }


    };







  const stopResize = ()=>{


    resizing.current = false;



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
// Workspace updates
// ---------------------------------

function handleDevicesChange(

  updatedDevices:ElectricalDevice[]

){


  setDevices(updatedDevices);



  setGraph({

    devices:updatedDevices,

    connections

  });


}









function handleRefreshSimulation(){



  const currentConnections =

    workspaceRef.current?.getConnections()

    ??

    [];





  setConnections(

    currentConnections

  );





  setGraph({

    devices,

    connections:currentConnections

  });


}









return (

<div

style={{

height:"100vh",

display:"flex",

flexDirection:"column",

background:"#202124",

color:"white"

}}

>





<TopToolbar />









<div

style={{

flex:1,

display:"flex"

}}

>









{/* Component Library */}

<div

style={{

width:"220px",

background:"#252526",

flexShrink:0

}}

>


<ComponentLibrary

workspaceRef={workspaceRef}

/>


</div>









{/* Workspace */}

<div

style={{

flex:1,

padding:"15px",

background:"#303030",

overflow:"hidden"

}}

>





<Workspace

ref={workspaceRef}

onSelectDevice={setSelectedDevice}

onDevicesChange={handleDevicesChange}

onCircuitPathsChange={setCircuitPaths}

/>





</div>









{/* Right Panel */}

<div

style={{

width:`${propertiesWidth}px`,

minWidth:"260px",

maxWidth:"700px",

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

background:"#444",

flexShrink:0,

userSelect:"none"

}}

/>









<div

style={{

flex:1,

overflow:"auto",

display:"flex",

flexDirection:"column",

gap:"10px"

}}

>







<button

onClick={handleRefreshSimulation}

style={{

margin:"10px"

}}

>

Update Simulation

</button>









<SimulationPanel

graph={graph}

sourceId={

devices.find(

device =>

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