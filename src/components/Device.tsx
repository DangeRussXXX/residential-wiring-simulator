import type { Device as DeviceType } from "../electrical/types";

import Terminal from "./Terminal";


type Props={

device:DeviceType;

wireMode:boolean;

selectedTerminal:string|null;

selected:boolean;

onSelect:(id:string)=>void;


onTerminalClick:

(
deviceId:string,
terminalId:string,
position:{
x:number;
y:number;
}
)=>void;


onStartDrag:(id:string)=>void;

};





export default function Device({

device,

wireMode,

selectedTerminal,

selected,

onSelect,

onTerminalClick,

onStartDrag

}:Props){





function appearance(){


switch(device.type){


case "Breaker Panel":

return {

icon:"⚡",

color:"#bdbdbd"

};



case "Switch":

return {

icon:"◐",

color:"#ffffff"

};



case "Light":

return {

icon:"💡",

color:"#fff2a8"

};



case "Receptacle":

return {

icon:"🔌",

color:"#f5f5f5"

};



case "GFCI":

return {

icon:"GFCI",

color:"#eeeeee"

};



default:

return {

icon:"▣",

color:"#ffffff"

};

}

}





const style=appearance();





return (

<div


onMouseDown={(e)=>{

e.stopPropagation();


onSelect(device.id);



if(!wireMode){

onStartDrag(device.id);

}

}}



style={{

position:"absolute",

left:device.x,

top:device.y,


width:"150px",

height:"95px",


background:style.color,


border:

selected

?

"3px solid #00aaff"

:

"2px solid #333",


borderRadius:"8px",


boxShadow:

selected

?

"0 0 15px rgba(0,170,255,.9)"

:

"0 4px 12px rgba(0,0,0,.25)",



display:"flex",

flexDirection:"column",

alignItems:"center",

justifyContent:"center",



fontWeight:"bold",


cursor:

wireMode

?

"crosshair"

:

"grab",



userSelect:"none",

zIndex:10

}}



>


<div

style={{

fontSize:"28px"

}}

>

{style.icon}

</div>



<div>

{device.name}

</div>





{

device.terminals.map(t=>(


<Terminal


key={t.id}


terminal={t}


selected={

selectedTerminal===

`${device.id}-${t.id}`

}



onClick={(position)=>{


onTerminalClick(

device.id,

t.id,

position

);


}}


/>


))


}



</div>

);

}