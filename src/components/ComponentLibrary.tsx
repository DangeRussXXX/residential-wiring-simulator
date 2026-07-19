import type { WorkspaceHandle } from "../simulator/Workspace";


interface Props {

workspaceRef:
React.RefObject<WorkspaceHandle | null>;

}



export default function ComponentLibrary({
workspaceRef
}:Props){



function add(type:string){

workspaceRef.current?.addDevice(type);

}



return (

<div

style={{

padding:"15px",

display:"flex",

flexDirection:"column",

gap:"10px"

}}

>


<h3>
Components
</h3>


<button onClick={()=>add("Breaker Panel")}>
Breaker Panel
</button>


<button onClick={()=>add("Switch")}>
Switch
</button>


<button onClick={()=>add("Light")}>
Light
</button>


<button onClick={()=>add("Receptacle")}>
Receptacle
</button>


<button onClick={()=>add("GFCI")}>
GFCI
</button>


</div>

);

}