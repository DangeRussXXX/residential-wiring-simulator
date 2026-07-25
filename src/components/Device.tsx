import Terminal from "./Terminal";

import type {
  ElectricalDevice
} from "../electrical/types";


type Props={

device: ElectricalDevice;

wireMode:boolean;

selectedTerminal:string|null;

selected:boolean;

onSelect:(id:string)=>void;

onTerminalClick:(
  deviceId:string,
  terminalId:string
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





function renderDeviceBody(){


switch(device.symbol){



case "breaker-panel":

return (

<div

style={{

width:"90px",

height:"65px",

background:"#b7b7b7",

border:"2px solid #222",

borderRadius:"4px",

padding:"5px",

boxSizing:"border-box"

}}

>

<div

style={{

fontSize:"9px",

fontWeight:"bold",

textAlign:"center"

}}

>

MAIN {device.mainBreaker}A

</div>


<div

style={{

display:"grid",

gridTemplateColumns:"repeat(4,1fr)",

gap:"3px",

marginTop:"6px"

}}

>

{

Array.from({

length:12

}).map((_,i)=>(

<div

key={i}

style={{

height:"8px",

background:"#222",

borderRadius:"2px"

}}

/>

))

}

</div>


</div>

);



case "switch-single":

return (

<div

style={{

width:"45px",

height:"65px",

background:"#eee",

border:"2px solid #333",

borderRadius:"3px"

}}

>

<div

style={{

width:"4px",

height:"35px",

background:"#555",

margin:"12px auto"

}}

/>

</div>

);



case "outlet":

return (

<div

style={{

width:"55px",

height:"70px",

background:"#eee",

border:"2px solid #333",

borderRadius:"4px"

}}

>

<div

style={{

marginTop:"15px",

fontSize:"22px",

textAlign:"center"

}}

>

||

</div>


<div

style={{

fontSize:"10px",

textAlign:"center"

}}

>

120V

</div>


</div>

);



case "gfci":

return (

<div

style={{

width:"60px",

height:"75px",

background:"#eee",

border:"2px solid #333",

borderRadius:"4px"

}}

>

<button

style={{

fontSize:"8px",

margin:"8px"

}}

>

TEST

</button>


<button

style={{

fontSize:"8px"

}}

>

RESET

</button>


</div>

);



case "light-ceiling":

return (

<div

style={{

fontSize:"40px"

}}

>

◉

</div>

);



case "range":

return (

<div

style={{

width:"80px",

height:"65px",

background:"#555",

border:"2px solid black",

borderRadius:"5px",

color:"white",

fontSize:"12px",

display:"flex",

alignItems:"center",

justifyContent:"center"

}}

>

RANGE

</div>

);



case "hvac":

return (

<div

style={{

width:"80px",

height:"70px",

background:"#777",

border:"2px solid #222",

borderRadius:"5px",

color:"white",

fontSize:"12px",

display:"flex",

alignItems:"center",

justifyContent:"center"

}}

>

HVAC

</div>

);



default:

return (

<div

style={{

fontSize:"32px"

}}

>

▣

</div>

);


}


}







return (

<div


className="device-component"


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

height:"120px",

overflow:"visible",


background:"transparent",


border:

selected

?

"3px solid #00aaff"

:

"none",


borderRadius:"8px",


boxShadow:

selected

?

"0 0 15px rgba(0,170,255,.9)"

:

"none",


display:"flex",

flexDirection:"column",

alignItems:"center",

justifyContent:"center",


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


{renderDeviceBody()}



<div

style={{

fontSize:"12px",

fontWeight:"bold",

marginTop:"5px",

color:"#111"

}}

>

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


onClick={()=>{

onTerminalClick(

device.id,

t.id

);

}}


/>


))


}



</div>

);

}