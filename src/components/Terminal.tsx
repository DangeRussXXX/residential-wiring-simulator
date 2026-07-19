import type { Terminal as TerminalType } from "../electrical/types";


type Props = {

terminal: TerminalType;

selected:boolean;

onClick:(position:{
x:number;
y:number;
})=>void;

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


const rect =
e.currentTarget.getBoundingClientRect();



onClick({

x: rect.left + rect.width / 2,

y: rect.top + rect.height / 2

});


}}



style={{

position:"absolute",

left:terminal.x - 8,

top:terminal.y - 8,


width:"16px",

height:"16px",


borderRadius:"50%",


background:terminalColor(),



border:

selected

?

"3px solid #00aaff"

:

"2px solid #333",



boxShadow:

selected

?

"0 0 12px #00aaff"

:

"0 2px 5px rgba(0,0,0,.4)",



cursor:"pointer",


zIndex:20,


transition:"all .15s"

}}


/>

);

}