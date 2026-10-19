// Residential Wiring Simulator v2.4
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


import type {
  ElectricalDevice
} from "../electrical/types";


import type {
  Connection
} from "../electrical/connections";





interface SimulationPanelProps {

  devices: ElectricalDevice[];

  connections: Connection[];

  sourceId:string;

}








export default function SimulationPanel({

devices,

connections,

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






const graph:CircuitGraph = {

  devices,

  connections,

  breakers:[],

  circuits:[],

  wires:[]

};






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

color:"#ffffff",

marginBottom:"15px",

overflow:"auto"

}}

>





<h2

style={{

color:"#00d9ff",

marginTop:0

}}

>

⚡ Electrical Simulation

</h2>







<div

style={{

background:"#2b2b2b",

padding:"10px",

borderRadius:"5px"

}}

>


<div>

<strong>Devices:</strong>{" "}

{devices.length}

</div>



<div>

<strong>Connections:</strong>{" "}

{connections.length}

</div>



<div>

<strong>Source:</strong>{" "}

{sourceId || "NONE"}

</div>






<hr/>





<h3>

Device List

</h3>



{

devices.length===0

?

<p>No devices loaded.</p>


:

devices.map(device=>(

<div

key={device.id}

>

⚡ {device.name}

({device.type})

</div>

))

}







<hr/>





<h3>

Connection List

</h3>



{

connections.length===0

?

<p>No connections loaded.</p>


:

connections.map(connection=>(

<div

key={connection.id}

>

🔌 {connection.from.deviceId}

→

{connection.to.deviceId}

</div>

))

}



</div>









<button

onClick={runSimulation}

disabled={running}

style={{

width:"100%",

padding:"12px",

fontWeight:"bold",

cursor:"pointer",

marginTop:"10px"

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

?

"✅ COMPLETE"

:

"❌ FAILED"

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

>

{

message.level==="ERROR"

&& "❌ "

}


{

message.level==="WARNING"

&& "⚠️ "

}


{

message.level==="INFO"

&& "ℹ️ "

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









<hr/>





<h3>

Graph Debug

</h3>



<div>

Devices loaded:

{" "}

{devices.length}

</div>



<div>

Connections loaded:

{" "}

{connections.length}

</div>



<div>

Source:

{" "}

{sourceId || "NONE"}

</div>








</div>

);


}