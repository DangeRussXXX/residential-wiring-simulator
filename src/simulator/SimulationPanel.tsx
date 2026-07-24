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








export default function SimulationPanel(

{

graph,

sourceId

}:SimulationPanelProps

){



const [result,setResult] =

useState<SimulationControllerResult | null>(null);





const [running,setRunning] =

useState(false);







function runSimulation(){



setRunning(true);




const controller =

new SimulationController(

graph

);





const simulation =

controller.testCircuit(

sourceId

);





setResult(

simulation

);



setRunning(false);



}









return (

<div

style={{

border:"2px solid #444",

borderRadius:"8px",

padding:"15px",

background:"#f5f5f5",

marginTop:"10px"

}}

>


<h2>

Electrical Simulation

</h2>






<button

onClick={runSimulation}

disabled={running}

style={{

padding:"10px",

cursor:"pointer"

}}

>

{

running

?

"Testing..."

:

"TEST CIRCUIT"

}

</button>









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

<span>

{

result.state

}

</span>

</h3>








<h3>

Validation

</h3>



{

result.validation.valid

?

<p>

✅ All connections valid

</p>

:

(

<ul>

{

result.validation.messages.map(
(message,index)=>(
  <div key={index}>

    {message.level === "ERROR" && "❌ "}
    {message.level === "WARNING" && "⚠️ "}
    {message.level === "INFO" && "ℹ️ "}

    {message.message}

  </div>
)
)

}

</ul>

)

}









<h3>

Power Flow

</h3>



<h4>

Energized Devices

</h4>



{

result.powerFlow.energizedDevices.length === 0

?

<p>

No energized devices.

</p>

:

(

<ul>

{

result.powerFlow.energizedDevices.map(

(id)=>(

<li key={id}>

⚡ {id}

</li>

)

)

}

</ul>

)

}









<h4>

Energized Connections

</h4>



{

result.powerFlow.energizedConnections.length === 0

?

<p>

No energized connections.

</p>

:

(

<ul>

{

result.powerFlow.energizedConnections.map(

(id)=>(

<li key={id}>

🔌 {id}

</li>

)

)

}

</ul>

)

}









<h4>

Failed Connections

</h4>



{

result.powerFlow.failedConnections.length === 0

?

<p>

✅ No failures detected.

</p>

:

(

<ul>

{

result.powerFlow.failedConnections.map(

(id)=>(

<li key={id}>

⚠️ {id}

</li>

)

)

}

</ul>

)

}








<h3>

Animation Queue

</h3>



{

result.animations.length === 0

?

<p>

No animation events.

</p>

:

(

<ul>

{

result.animations.map(

(animation,index)=>(


<li key={index}>

{animation.state}

&nbsp;

{

animation.deviceId ||

animation.connectionId

}

&nbsp;

(

{animation.delay}ms

)

</li>


)

)

}

</ul>

)

}





</div>

)

}






</div>

);


}