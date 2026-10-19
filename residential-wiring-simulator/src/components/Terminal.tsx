import type { DeviceTerminal as TerminalType } from "../electrical/types";


type Props = {
  terminal: TerminalType;
  selected:boolean;
  onClick:()=>void;
};


export default function Terminal({
terminal,
selected,
onClick
}:Props){


function terminalColor(){

switch(terminal.type){

case "hot":
return "#111111";

case "load":
return "#d62828";

case "neutral":
return "#ffffff";

case "ground":
return "#2a9d45";

case "traveler":
return "#2563eb";

default:
return "#888888";

}

}


return (

<div

title={terminal.name}

onClick={(e)=>{
 e.stopPropagation();
 onClick();
}}

style={{

position:"absolute",

left:terminal.x - 8,

top:terminal.y - 8,

width:"16px",

height:"16px",

borderRadius:"50%",

background:terminalColor(),

border:selected
?
"3px solid #00aaff"
:
"2px solid #333",

cursor:"crosshair",

zIndex:100

}}

/>

);

}