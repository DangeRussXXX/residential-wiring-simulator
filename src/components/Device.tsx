import type { Device as DeviceType } from "../electrical/types";
import Terminal from "./Terminal";


type Props = {
  device: DeviceType;
  wireMode: boolean;
  onTerminalClick:
  (
    deviceId:string,
    terminalId:string,
    x:number,
    y:number
  )=>void;
};


export default function Device({
  device,
  wireMode,
  onTerminalClick
}:Props){


return (

<div

style={{

position:"absolute",

left:device.x,

top:device.y,

width:"120px",

height:"70px",

border:"2px solid black",

background:"white",

display:"flex",

alignItems:"center",

justifyContent:"center",

cursor:wireMode
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

selected={false}

onClick={()=>{

onTerminalClick(

device.id,

t.id,

device.x+t.x,

device.y+t.y

);

}}

/>

))}


</div>

);

}