import type {
  ElectricalDevice
} from "../electrical/types";


type PropertiesPanelProps = {

  device: ElectricalDevice | null;

  devices: ElectricalDevice[];

  circuitPaths: string[][];

  onUpdateDevice:(updated:ElectricalDevice)=>void;

};



export default function PropertiesPanel({

device,

devices,

circuitPaths,

onUpdateDevice

}: PropertiesPanelProps){



function updateWatts(value:number){

  if(!device)
    return;


  const safeValue = Math.max(
    0,
    value || 0
  );


  onUpdateDevice({

    ...device,

    load:{
      ...device.load,
      watts:safeValue
    }

  });

}



function updateName(value:string){

  if(!device)
    return;


  onUpdateDevice({

    ...device,

    name:value

  });

}



return (

<div

style={{

padding:"15px",

height:"100%",

overflow:"auto"

}}

>


<h3>
Properties
</h3>



{
device ? (

<div>


<label>
Name
</label>


<input

value={device.name}

onChange={e=>
updateName(e.target.value)
}

style={{

width:"100%",

marginBottom:"10px"

}}

/>



<p>

<strong>
Type:
</strong>

<br/>

{device.type}

</p>





{
device.type === "Breaker Panel" && (

<div>


<p>

<strong>
Main Breaker:
</strong>

<br/>

{device.breakerSize} amps

</p>



<p>

<strong>
Voltage:
</strong>

<br/>

{device.voltage} volts

</p>



<p>

<strong>
Connected Load:
</strong>

<br/>

{device.calculatedLoad ?? 0} watts

</p>



<h4>
Connected Devices
</h4>



<table

style={{

width:"100%",

borderCollapse:"collapse"

}}

>

<thead>

<tr>

<th>
Name
</th>

<th>
Type
</th>

<th>
Load
</th>

</tr>

</thead>



<tbody>

{

circuitPaths.flatMap((path)=>{

const deviceName =
path[path.length - 1];


const connected =
devices.find(d =>
  d.name === deviceName
);


if(!connected)
  return [];


return [

<tr key={connected.id}>

<td>
{connected.name}
</td>

<td>
{connected.type}
</td>

<td>
{connected.load?.watts ?? 0} W
</td>

</tr>

];

})

}

</tbody>

</table>





<h4>
Circuit Paths
</h4>



{

circuitPaths.length > 0 ?

(

<ul>

{

circuitPaths.map((path,index)=>(

<li key={index}>

{path.join(" → ")}

</li>

))

}

</ul>

)

:

(

<p>
No circuit path found.
</p>

)

}





<p>

<strong>
Calculated Amps:
</strong>

<br/>

{device.calculatedAmps?.toFixed(1) ?? 0} amps

</p>



</div>

)

}



{
device.type !== "Breaker Panel"

&&

<>

<label>

Load (watts)

</label>



<select

value={device.load?.watts ?? 0}

onChange={e=>
updateWatts(
Number(e.target.value)
)
}

style={{

width:"100%",

marginBottom:"10px"

}}

>


<option value={0}>
0 watts
</option>


<option value={60}>
60 watts - Light
</option>


<option value={100}>
100 watts
</option>


<option value={300}>
300 watts - Switch Load
</option>


<option value={1500}>
1500 watts - Appliance
</option>


<option value={1800}>
1800 watts - Receptacle
</option>


</select>



<p>

<strong>
Current Load:
</strong>

<br/>

{device.load?.watts ?? 0} watts

</p>


</>

}



<hr/>



<h4>
Terminals
</h4>



<ul>

{

device.terminals.map(t=>(

<li key={t.id}>

{t.name}

</li>

))

}

</ul>



</div>

)

:

(

<p>
Select a component to view details.
</p>

)

}



</div>

);

}