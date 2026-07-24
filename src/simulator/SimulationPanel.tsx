// Residential Wiring Simulator v2.3
// Simulation control panel
//
// Controls:
// - start electrical test
// - display power flow
// - display faults
// - display validation results


import {
  useState
} from "react";


import {
  SimulationController,
  type SimulationControllerResult
} from "../electrical/simulationController";


import type {
  CircuitGraph
} from "../electrical/circuitGraph";





interface SimulationPanelProps {

  graph:CircuitGraph;

  sourceId:string;

}








export default function SimulationPanel({

graph,

sourceId

}:SimulationPanelProps){



const [result,setResult] =

useState<SimulationControllerResult|null>(null);



const [running,setRunning] =

useState(false);







function runSimulation(){


setRunning(true);



if(!sourceId){


setResult(null);

setRunning(false);

return;


}





const controller =

new SimulationController(

graph

);





const simulation =

controller.testCircuit(

sourceId

);





setResult(simulation);



setRunning(false);



}









return (

<div

style={{

border:"2px solid #666",

borderRadius:"8px",

padding:"15px",

background:"#1e1e1e",

color:"white",

marginBottom:"15px"

}}

>





<h2>

⚡ Electrical Simulation

</h2>





<div

style={{

background:"#333",

padding:"10px",

borderRadius:"5px",

marginBottom:"10px"

}}

>


<div>

Devices: {graph.devices.length}

</div>


<div>

Connections: {graph.connections.length}

</div>


<div>

Source:

{" "}

{

sourceId

?

"Breaker Panel"

:

"No breaker panel"

}

</div>


</div>








<button

onClick={runSimulation}

disabled={running}

style={{

width:"100%",

padding:"12px",

fontWeight:"bold",

cursor:"pointer"

}}

>


{

running

?

"Testing Circuit..."

:

"TEST CIRCUIT"

}


</button>









{

!result && (

<p>

Press TEST CIRCUIT to run inspection.

</p>

)

}









{

result && (

<div

style={{

marginTop:"15px"

}}

>





<h3>

Status:

{" "}

{

result.state==="COMPLETE"

&&

"✅ "

}


{

result.state==="FAILED"

&&

"❌ "

}


{

result.state

}

</h3>









<h3>

Validation

</h3>



{

result.validation.messages.length===0

?

<p>

✅ No issues found.

</p>

:

result.validation.messages.map(

(message,index)=>(


<div

key={index}

style={{

marginBottom:"5px"

}}

>


{

message.level==="ERROR"

&&

"❌ "

}


{

message.level==="WARNING"

&&

"⚠️ "

}


{

message.level==="INFO"

&&

"ℹ️ "

}



{message.message}



</div>


)


)

}









<h3>

Power Flow

</h3>





<p>

⚡ Energized Devices:

{" "}

{result.powerFlow.energizedDevices.length}

</p>




{

result.powerFlow.energizedDevices.map(

(id)=>(

<div key={id}>

⚡ {id}

</div>

)

)

}









<p>

🔌 Energized Connections:

{" "}

{result.powerFlow.energizedConnections.length}

</p>





{

result.powerFlow.energizedConnections.map(

(id)=>(

<div key={id}>

🔌 {id}

</div>

)

)

}









<p>

⚠️ Failed Connections:

{" "}

{result.powerFlow.failedConnections.length}

</p>





{

result.powerFlow.failedConnections.map(

(id)=>(

<div key={id}>

❌ {id}

</div>

)

)

}









<h3>

Animation Queue

</h3>



{

result.animations.length===0

?

<p>No events</p>

:

result.animations.map(

(animation,index)=>(


<div key={index}>

{animation.state}

:

{

animation.deviceId ||

animation.connectionId

}

({animation.delay}ms)

</div>


)

)

}







</div>

)

}







</div>

);


}