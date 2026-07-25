// Residential Wiring Simulator v2.6
// Component Library
//
// Handles:
// - component browsing
// - search
// - category filtering
// - click placement
// - drag placement preparation


import {
  useState
} from "react";


import type {
  WorkspaceHandle
} from "../simulator/Workspace";


import {
  componentCatalog
} from "../electrical/componentCatalog";


import {
  createLibraryBreaker
} from "../electrical/breaker";

interface Props {

  workspaceRef:
  React.RefObject<WorkspaceHandle | null>;

}




type ComponentItem = {

  name:string;

  type:string;

  category:string;

  description:string;

  symbol:string;

  voltage?:number;

  watts?:number;

  amps?:number;

  isBreaker?:boolean;

};





const components:ComponentItem[] =

componentCatalog.map(c=>({

  name:c.name,

  type:c.name,

  category:c.category,

  description:c.description,

  symbol:c.symbol,

  voltage:c.electrical?.voltage,

  watts:c.electrical?.watts,

  amps:c.electrical?.amps,

  isBreaker:

  c.category==="Breakers"

}));





const categories = [

  ...new Set(
    componentCatalog.map(c=>c.category)
  )

];








export default function ComponentLibrary({

workspaceRef

}:Props){





const [search,setSearch] =

useState("");




const [openCategories,setOpenCategories] =

useState<string[]>(categories);









function add(type:string){

workspaceRef.current?.addDevice(type);

}









function toggleCategory(

category:string

){

setOpenCategories(prev=>

prev.includes(category)

?

prev.filter(c=>c!==category)

:

[

...prev,

category

]

);

}









function dragStart(

e:React.DragEvent,

item:ComponentItem

){



// BREAKER DRAG

if(item.isBreaker){


let breaker;



if(item.name.includes("15A")){


breaker=createLibraryBreaker(

15,

1,

"STANDARD"

);


}

else if(item.name.includes("20A")){


breaker=createLibraryBreaker(

20,

1,

"STANDARD"

);


}

else if(item.name.includes("30A")){


breaker=createLibraryBreaker(

30,

2,

"STANDARD"

);


}

else {


breaker=createLibraryBreaker(

50,

2,

"STANDARD"

);


}



e.dataTransfer.setData(

"breaker",

JSON.stringify(breaker)

);



return;

}






// NORMAL DEVICE DRAG


e.dataTransfer.setData(

"componentType",

item.type

);


}









function getIcon(symbol:string){


switch(symbol){


case "breaker-panel":

return "⚡";


case "switch-single":

return "◐";


case "light-ceiling":

return "💡";


case "outlet":

return "🔌";


case "gfci":

return "GFCI";


case "range":

return "🔥";


case "fan":

return "🌀";


case "hvac":

return "❄";


default:

return "▣";

}


}









return (

<div

style={{

padding:"15px",

height:"100%",

overflowY:"auto",

overflowX:"hidden",

background:"#252526",

color:"white"

}}

>





<h2

style={{

marginTop:0

}}

>

Components

</h2>







<input

placeholder="Search components..."

value={search}

onChange={e=>

setSearch(e.target.value)

}

style={{

width:"100%",

padding:"8px",

marginBottom:"15px",

background:"#1e1e1e",

border:"1px solid #555",

color:"white",

borderRadius:"4px"

}}

/>









{

categories.map(category=>{


const items =

components.filter(c=>

c.category===category &&

c.name
.toLowerCase()
.includes(
search.toLowerCase()
)

);




if(items.length===0)

return null;







return (

<div

key={category}

style={{

marginBottom:"12px"

}}

>





<div

onClick={()=>toggleCategory(category)}

style={{

cursor:"pointer",

fontWeight:"bold",

padding:"10px",

background:"#333",

borderRadius:"5px"

}}

>

{

openCategories.includes(category)

?

"▼"

:

"▶"

}

{" "}

{category}

</div>









{

openCategories.includes(category)

&&

items.map(item=>(



<div

key={item.name}



draggable={true}



onDragStart={(e)=>

dragStart(

e,

item

)

}



onClick={()=>add(item.type)}



style={{

marginTop:"8px",

padding:"12px",

background:"#1e1e1e",

border:"1px solid #555",

borderRadius:"8px",

cursor:"grab",

userSelect:"none"

}}

>





<div

style={{

display:"flex",

alignItems:"center",

gap:"10px"

}}

>



<div

style={{

width:"45px",

height:"45px",

background:"#ddd",

color:"#111",

borderRadius:"6px",

display:"flex",

alignItems:"center",

justifyContent:"center",

fontSize:"22px",

fontWeight:"bold"

}}

>

{

getIcon(item.symbol)

}

</div>







<div>

<div

style={{

fontWeight:"bold"

}}

>

{item.name}

</div>


<div

style={{

fontSize:"12px",

color:"#aaa"

}}

>

{item.description}

</div>


</div>


</div>









<div

style={{

marginTop:"8px",

fontSize:"11px",

color:"#888"

}}

>


{

item.voltage

&&

`${item.voltage}V `

}



{

item.amps

&&

`${item.amps}A `

}



{

item.watts

&&

`${item.watts}W`

}


</div>







<div

style={{

marginTop:"8px",

fontSize:"11px",

color:"#00eaff"

}}

>

{
item.isBreaker
?
"Drag into breaker panel slot"
:
"Click to place • Drag to workspace"
}

</div>





</div>


))


}









</div>


);


})


}







</div>

);

}