import type { Device as DeviceType } from "../electrical/types";
import Terminal from "./Terminal";


type Props = {

device: DeviceType;

wireMode:boolean;

selectedTerminal:string | null;

onTerminalClick:
(
deviceId:string,
terminalId:string
)=>void;

onStartDrag:
(
id:string
)=>void;

};



export default function Device({

device,

wireMode,

selectedTerminal,

onTerminalClick,

onStartDrag

}:Props){



return (

<div

onMouseDown={()=>{

if(!wireMode){

onStartDrag(device.id);

}

}}

style={{

position:"absolute",

left:device.x,

top:device.y,

width:"130px",

height:"75px",

border:"2px solid black",

background:"#fff",

display:"flex",

alignItems:"center",

justifyContent:"center",

fontWeight:"bold",

cursor:

wireMode

?

"default"

:

"grab"

}}

>

{device.name}



{device.terminals.map(t=>(

<Terminal

key={t.id}

terminal={t}

selected={

selectedTerminal===

`${device.id}-${t.id}`

}

onClick={()=>{

onTerminalClick(

device.id,

t.id

);

}}

/>

))}


</div>

);

}