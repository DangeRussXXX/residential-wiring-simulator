// Residential Wiring Simulator v2.3
// Wire Tool UI
//
// Cable selection interface
// Connection creation remains controlled by Workspace


import type {
  ConnectionPoint
} from "../electrical/connections";


import type {
  CableType
} from "../electrical/cables";




type WireToolProps = {


active:boolean;


cable:CableType;


setCable:(

cable:CableType

)=>void;



selectedStart:ConnectionPoint|null;


};







export default function WireTool({

active,

cable,

setCable,

selectedStart


}:WireToolProps){





return (

<div

style={{

padding:"10px",

background:"#222",

color:"white"

}}

>


<h3>
Wire Tool
</h3>





{

!active

?

<p>
Wire mode disabled
</p>


:

<>

<label>

Cable Type

</label>



<select

value={cable}

onChange={e=>

setCable(

e.target.value as CableType

)

}

>

<option value="14/2 NM-B">
14/2 NM-B
</option>


<option value="12/2 NM-B">
12/2 NM-B
</option>


<option value="10/2 NM-B">
10/2 NM-B
</option>


<option value="14/3 NM-B">
14/3 NM-B
</option>


<option value="12/3 NM-B">
12/3 NM-B
</option>


</select>





<p>

{

selectedStart

?

"Start terminal selected"

:

"Click a terminal to begin"

}

</p>



</>

}




</div>

);

}