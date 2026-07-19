import type { Terminal as TerminalType } from "../electrical/types";


type Props = {

terminal: TerminalType;

selected: boolean;

onClick: () => void;

};


export default function Terminal({

terminal,

selected,

onClick

}: Props){


function color(){

switch(terminal.type){

case "hot":
return "black";

case "load":
return "red";

case "neutral":
return "white";

case "ground":
return "green";

case "traveler":
return "blue";

default:
return "gray";

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

left:terminal.x - 10,

top:terminal.y - 10,

width:"20px",

height:"20px",

borderRadius:"50%",


background:

selected

?

"yellow"

:

color(),


border:"2px solid #555",

boxSizing:"border-box",

cursor:"crosshair",

zIndex:10

}}

/>

);

}