// Residential Wiring Simulator v2.5
// Breaker panel internal layout
//
// Handles:
// - real panel slot layout
// - breaker positions
// - breaker drop zones
// - L1/L2 bus display
// - main breaker status


import { useState } from "react";

import type { Breaker } from "../electrical/breaker";



type BreakerPanelLayoutProps = {

  panelName:string;

  mainBreaker:number;

  slots?:number;

  onClose?:()=>void;

};



type PanelSlot = {

  id:number;

  breaker:Breaker | null;

};





export default function BreakerPanelLayout({

  panelName,

  mainBreaker,

  slots=24,

  onClose

}:BreakerPanelLayoutProps){



const [panelSlots,setPanelSlots] =

useState<PanelSlot[]>(

Array.from(

{length:slots},

(_,index)=>({

id:index+1,

breaker:null

})

)

);





const [dragOver,setDragOver] =

useState<number|null>(null);







function handleDrop(

e:React.DragEvent,

slot:number

){


e.preventDefault();



const data =

e.dataTransfer.getData(
"breaker"
);



if(!data)

return;



let breaker:Breaker;



try{


breaker = JSON.parse(data);


}

catch{


console.error(
"Invalid breaker data"
);


return;

}





// assign physical slot position

breaker.slot = slot;






setPanelSlots(prev=>

prev.map(position=>

position.id===slot

?

{

...position,

breaker

}

:

position

)

);



setDragOver(null);


}







return (

<div

style={{

position:"fixed",

right:"30px",

top:"80px",

width:"360px",

maxHeight:"70vh",

overflowY:"auto",

background:"#111827",

border:"2px solid #00eaff",

borderRadius:"12px",

padding:"18px",

color:"white",

fontFamily:"monospace",

zIndex:1000,

boxShadow:
"0 0 25px rgba(0,234,255,.4)"

}}

>


<div

style={{

display:"flex",

justifyContent:"space-between",

alignItems:"center"

}}

>

<h2

style={{

margin:0,

color:"#00eaff"

}}

>

⚡ {panelName}

</h2>



<button

onClick={onClose}

>

X

</button>


</div>









<div

style={{

marginTop:"15px",

padding:"12px",

background:"#222",

borderRadius:"8px"

}}

>

MAIN BREAKER

<br/>


<span

style={{

color:"#39ff14",

fontSize:"20px"

}}

>

● ON

</span>


&nbsp;

{mainBreaker}A


</div>









<div

style={{

display:"grid",

gridTemplateColumns:"1fr 1fr",

gap:"8px",

marginTop:"15px"

}}

>


<div

style={{

textAlign:"center",

color:"#ffcc00",

background:"#050505",

padding:"8px"

}}

>

L1 BUS

</div>



<div

style={{

textAlign:"center",

color:"#ffcc00",

background:"#050505",

padding:"8px"

}}

>

L2 BUS

</div>


</div>









<div

style={{

marginTop:"15px",

display:"flex",

flexDirection:"column",

gap:"6px",

maxHeight:"190px",

overflowY:"auto",

paddingRight:"5px"

}}

>



{

panelSlots.map(slot=>(


<div

key={slot.id}

onDragOver={(e)=>{

e.preventDefault();

setDragOver(slot.id);

}}



onDragLeave={()=>{

setDragOver(null);

}}



onDrop={(e)=>
handleDrop(
e,
slot.id
)
}



style={{

height:"55px",

border:

dragOver===slot.id

?

"2px solid #00ff99"

:

"1px solid #555",


background:"#050505",

display:"flex",

alignItems:"center",

justifyContent:"center",

cursor:"pointer",

borderRadius:"5px"

}}

>



{

slot.breaker

?


<div

style={{

color:"#39ff14",

textAlign:"center"

}}

>

<strong>

SLOT {slot.id}

</strong>

<br/>

{slot.breaker.amperage}A

&nbsp;

{slot.breaker.poles===2
?
"2P"
:
"1P"
}

<br/>

{slot.breaker.breakerType}


</div>



:


<div

style={{

color:"#777",

textAlign:"center"

}}

>

SLOT {slot.id}

<br/>

EMPTY


</div>


}



</div>


))


}



</div>









<div

style={{

marginTop:"15px",

padding:"10px",

background:"#222",

borderRadius:"8px",

color:"#aaa"

}}

>

Drag breakers into slots

</div>









</div>

);


}