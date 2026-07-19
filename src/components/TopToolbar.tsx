export default function TopToolbar(){


return (

<div

style={{

height:"55px",

display:"flex",

alignItems:"center",

padding:"0 20px",

background:"#111",

borderBottom:"1px solid #444",

gap:"15px"

}}

>


<h2

style={{

marginRight:"30px",

fontSize:"20px"

}}

>

Residential Wiring Simulator

</h2>





<button>

Save

</button>



<button>

Load

</button>




<button

onClick={()=>window.print()}

>

Print

</button>





<button>

Test Circuit

</button>




<button>

Lessons

</button>



</div>

);

}