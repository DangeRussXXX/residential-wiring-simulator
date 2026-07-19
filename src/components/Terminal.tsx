import type { Terminal as TerminalType } from "../electrical/types";


type Props = {

terminal:TerminalType;

selected:boolean;

onClick:()=>void;

};


export default function Terminal({

terminal,

selected,

onClick

}:Props){


return (

<div

title={terminal.name}

onClick={onClick}

style={{

position:"absolute",

left:terminal.x-8,

top:terminal.y-8,

width:"16px",

height:"16px",

borderRadius:"50%",


background:

selected

?

"yellow"

:

terminal.type==="hot"

?

"black"

:

terminal.type==="neutral"

?

"white"

:

"green",


border:"2px solid gray",

cursor:"crosshair"

}}

/>

);

}