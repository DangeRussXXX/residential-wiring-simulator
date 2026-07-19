import { useState } from "react";
import Device from "../components/Device";
import type {
  Device as DeviceType,
  Wire
} from "../electrical/types";


export default function Workspace() {


const [devices,setDevices] =
useState<DeviceType[]>([]);


const [wires,setWires] =
useState<Wire[]>([]);


const [wireMode,setWireMode] =
useState(false);


const [wireColor,setWireColor] =
useState("black");


const [selectedTerminal,setSelectedTerminal] =
useState<{

deviceId:string;

terminalId:string;

}|null>(null);



const [dragging,setDragging] =
useState<string|null>(null);





function createDevice(type:string){


let terminals:any[] = [];



switch(type){


case "Breaker Panel":

terminals=[

{
id:"hot",
name:"Main Hot",
type:"hot",
x:10,
y:45
},

{
id:"neutral",
name:"Neutral Bar",
type:"neutral",
x:130,
y:45
},

{
id:"ground",
name:"Ground Bar",
type:"ground",
x:70,
y:80
}

];

break;



case "Switch":

terminals=[

{
id:"line",
name:"Line Hot",
type:"hot",
x:10,
y:45
},

{
id:"load",
name:"Switched Hot",
type:"load",
x:120,
y:45
},

{
id:"ground",
name:"Ground",
type:"ground",
x:65,
y:75
}

];

break;



case "Light":

terminals=[

{
id:"hot",
name:"Light Hot",
type:"load",
x:10,
y:45
},

{
id:"neutral",
name:"Light Neutral",
type:"neutral",
x:120,
y:45
},

{
id:"ground",
name:"Ground",
type:"ground",
x:65,
y:75
}

];

break;



case "Receptacle":

terminals=[

{
id:"hot",
name:"Hot Brass",
type:"hot",
x:10,
y:35
},

{
id:"neutral",
name:"Neutral Silver",
type:"neutral",
x:120,
y:35
},

{
id:"ground",
name:"Ground",
type:"ground",
x:65,
y:75
}

];

break;

}



const device:DeviceType={

id:Date.now().toString(),

name:type,

type,

x:150,

y:150,

terminals

};



setDevices(prev=>[

...prev,

device

]);


}






function terminalClick(

deviceId:string,

terminalId:string

){


if(!wireMode)
return;



if(selectedTerminal===null){


setSelectedTerminal({

deviceId,

terminalId

});


}

else{


if(

selectedTerminal.deviceId===deviceId &&

selectedTerminal.terminalId===terminalId

){

setSelectedTerminal(null);

return;

}



const wire:Wire={


id:Date.now().toString(),


fromDevice:selectedTerminal.deviceId,

fromTerminal:selectedTerminal.terminalId,


toDevice:deviceId,

toTerminal:terminalId,


color:wireColor


};



setWires(prev=>[

...prev,

wire

]);


setSelectedTerminal(null);


}



}





function startDrag(id:string){


if(!wireMode){

setDragging(id);

}

}




function moveBoard(
e:React.MouseEvent<HTMLDivElement>
){


if(!dragging)
return;


const rect =
e.currentTarget.getBoundingClientRect();



setDevices(prev=>

prev.map(d=>

d.id===dragging

?

{

...d,

x:e.clientX-rect.left-65,

y:e.clientY-rect.top-40

}

:

d

)

);


}





function stopDrag(){

setDragging(null);

}






function getPoint(

deviceId:string,

terminalId:string

){


const device =
devices.find(
d=>d.id===deviceId
);


const terminal =
device?.terminals.find(
t=>t.id===terminalId
);



if(!device || !terminal)
return null;



return {

x:device.x + terminal.x,

y:device.y + terminal.y

};


}






function clearWorkspace(){

setDevices([]);

setWires([]);

setSelectedTerminal(null);

}





return (

<div>


<h2>
Component Library
</h2>



<button onClick={()=>createDevice("Breaker Panel")}>
Breaker Panel
</button>


<button onClick={()=>createDevice("Switch")}>
Switch
</button>


<button onClick={()=>createDevice("Light")}>
Light
</button>


<button onClick={()=>createDevice("Receptacle")}>
Receptacle
</button>




<h3>
Wire Controls
</h3>


<button

onClick={()=>setWireMode(!wireMode)}

>

{

wireMode

?

"Exit Wire Tool"

:

"Wire Tool"

}

</button>



<select

value={wireColor}

onChange={
e=>setWireColor(e.target.value)
}

style={{
marginLeft:"10px"
}}

>

<option value="black">
Hot
</option>

<option value="red">
Switched Hot
</option>

<option value="white">
Neutral
</option>

<option value="green">
Ground
</option>


</select>




<h2>
Training Board
</h2>



<div

onMouseMove={moveBoard}

onMouseUp={stopDrag}


style={{

height:"550px",

border:"3px solid black",

background:"#ddd",

position:"relative"

}}

>



<svg

style={{

position:"absolute",

left:0,

top:0,

width:"100%",

height:"100%",

zIndex:1,

pointerEvents:"none"

}}

>


{wires.map(w=>{


const start =
getPoint(
w.fromDevice,
w.fromTerminal
);


const end =
getPoint(
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





{devices.map(d=>(


<Device

key={d.id}

device={d}

wireMode={wireMode}

selectedTerminal={

selectedTerminal

?

`${selectedTerminal.deviceId}-${selectedTerminal.terminalId}`

:

null

}


onTerminalClick={terminalClick}


onStartDrag={startDrag}


/>


))}



</div>



<button

onClick={clearWorkspace}

style={{
marginTop:"15px"
}}

>

Clear Workspace

</button>



<button

onClick={()=>window.print()}

style={{
marginLeft:"10px"
}}

>

Print / Save PDF

</button>


</div>

);

}