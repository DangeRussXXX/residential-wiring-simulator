import {
useRef
} from "react";


import Workspace from "../simulator/Workspace";

import ComponentLibrary from "../components/ComponentLibrary";

import TopToolbar from "../components/TopToolbar";

import PropertiesPanel from "../components/PropertiesPanel";


import type {
WorkspaceHandle
} from "../simulator/Workspace";



export default function SimulatorLayout(){


const workspaceRef =
useRef<WorkspaceHandle>(null);



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


<div

style={{

width:"220px",

background:"#252526"

}}

>


<ComponentLibrary

workspaceRef={workspaceRef}

/>


</div>





<div

style={{

flex:1,

padding:"15px",

background:"#303030"

}}

>


<Workspace

ref={workspaceRef}

/>


</div>





<div

style={{

width:"260px",

background:"#252526"

}}

>


<PropertiesPanel />



</div>



</div>


</div>

);

}