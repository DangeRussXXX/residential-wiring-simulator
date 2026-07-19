import { useState } from "react";
import Device from "../components/Device";
import type { Device as DeviceType, Wire } from "../electrical/types";

export default function Workspace() {


const [devices,setDevices] =
useState<DeviceType[]>([

{
id:"light1",

name:"Light",

x:300,

y:150,

terminals:[

{
id:"hot",
name:"Hot",
type:"hot",
x:0,
y:35
},

{
id:"neutral",
name:"Neutral",
type:"neutral",
x:120,
y:35
},

{
id:"ground",
name:"Ground",
type:"ground",
x:60,
y:70
}

]

},


{
id:"switch1",

name:"Switch",

x:100,

y:150,

terminals:[

{
id:"line",
name:"Line Hot",
type:"hot",
x:0,
y:35
},

{
id:"load",
name:"Load",
type:"load",
x:120,
y:35
},

{
id:"ground",
name:"Ground",
type:"ground",
x:60,
y:70
}

]

}

]);



const [wires,setWires] =
useState<Wire[]>([]);


const [wireMode,setWireMode] =
useState(false);


const [selected,setSelected] =
useState<any>(null);



function terminalClick(

deviceId:string,

terminalId:string,

x:number,

y:number

){


if(!wireMode)
return;



if(!selected){


setSelected({

deviceId,

terminalId,

x,
y

});


}

else{


setWires([

...wires,

{

id:Date.now().toString(),

fromDevice:selected.deviceId,

fromTerminal:selected.terminalId,

toDevice:deviceId,

toTerminal:terminalId,

color:"black"

}

]);


setSelected(null);


}

}





function terminalPosition(

deviceId:string,

terminalId:string

){

const device =
devices.find(d=>d.id===deviceId);


const terminal =
device?.terminals.find(
t=>t.id===terminalId
);


if(!device || !terminal)
return null;


return {

x:device.x+terminal.x,

y:device.y+terminal.y

};

}




return (

<div>


<h2>
Training Board Workspace
</h2>


<button

onClick={()=>setWireMode(!wireMode)}

>

{wireMode
?
"Exit Wire Tool"
:
"Wire Tool"}

</button>



<div

style={{

position:"relative",

height:"500px",

border:"3px solid black",

background:"#eee",

marginTop:"20px"

}}

>


<svg

style={{

position:"absolute",

width:"100%",

height:"100%"

}}

>


{wires.map(w=>{


const start =
terminalPosition(
w.fromDevice,
w.fromTerminal
);


const end =
terminalPosition(
w.toDevice,
w.toTerminal
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

strokeWidth="4"

/>

);


})}


</svg>




{devices.map(device=>(

<Device

key={device.id}

device={device}

wireMode={wireMode}

onTerminalClick={
terminalClick
}

/>

))}



</div>


</div>

);

}