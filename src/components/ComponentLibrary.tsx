import {
  useState
} from "react";

import type {
  WorkspaceHandle
} from "../simulator/Workspace";


interface Props {

  workspaceRef:
  React.RefObject<WorkspaceHandle | null>;

}



type ComponentItem = {

  name:string;

  type:string;

  category:string;

  description:string;

};



const components:ComponentItem[] = [


{
name:"Breaker Panel",
type:"Breaker Panel",
category:"Panels",
description:"Residential service panel"
},


{
name:"Switch",
type:"Switch",
category:"Switches",
description:"Single pole light switch"
},


{
name:"Light",
type:"Light",
category:"Lighting",
description:"Ceiling light fixture"
},


{
name:"Receptacle",
type:"Receptacle",
category:"Receptacles",
description:"Standard 120V outlet"
},


{
name:"GFCI",
type:"GFCI",
category:"Safety",
description:"Ground fault protected outlet"
}


];



const categories = [

"Panels",
"Switches",
"Lighting",
"Receptacles",
"Safety"

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



function toggleCategory(category:string){

setOpenCategories(prev=>

prev.includes(category)

?

prev.filter(c=>c!==category)

:

[...prev,category]

);

}




return (

<div

style={{

padding:"15px",

height:"100%",

overflow:"auto",

background:"#252526",

color:"white"

}}

>


<h2>

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

color:"white"

}}

/>





{

categories.map(category=>{


const items =
components.filter(c=>

c.category === category &&

c.name
.toLowerCase()
.includes(
search.toLowerCase()
)

);



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

padding:"8px",

background:"#333",

borderRadius:"4px"

}}

>

{

openCategories.includes(category)

?

"▼"

:

"▶"

}

&nbsp;

{category}


</div>





{

openCategories.includes(category)

&&

items.map(item=>(


<div

key={item.type}

onClick={()=>add(item.type)}

style={{

marginTop:"6px",

padding:"12px",

background:"#1e1e1e",

border:"1px solid #555",

borderRadius:"6px",

cursor:"pointer"

}}

>


<div

style={{

fontWeight:"bold"

}}

>

⚡ {item.name}

</div>



<div

style={{

fontSize:"12px",

color:"#aaa",

marginTop:"5px"

}}

>

{item.description}

</div>



<div

style={{

fontSize:"11px",

color:"#888",

marginTop:"5px"

}}

>

Click to place

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