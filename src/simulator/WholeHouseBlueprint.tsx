import { useState } from "react";
import type { ServiceProject } from "./projectWorkflow";
import type { ElectricalDevice } from "../electrical/types";

type PlanRoom = { name: string; x: number; y: number; w: number; h: number; kind?: "garage" | "utility" };
const rooms: PlanRoom[] = [
  {name:"2-Car Garage",x:20,y:20,w:290,h:290,kind:"garage"},
  {name:"Utility / Laundry",x:310,y:20,w:160,h:115,kind:"utility"},
  {name:"Kitchen",x:470,y:20,w:220,h:175},
  {name:"Living Room",x:690,y:20,w:290,h:240},
  {name:"Hallway",x:310,y:195,w:380,h:65},
  {name:"Bathroom 1",x:310,y:135,w:160,h:60},
  {name:"Bedroom 1",x:20,y:310,w:280,h:210},
  {name:"Bedroom 2",x:300,y:310,w:220,h:210},
  {name:"Bathroom 2",x:520,y:310,w:160,h:210},
  {name:"Bedroom 3",x:680,y:260,w:300,h:260}
];
const panel = {x:335,y:75};
const control: React.CSSProperties={border:"1px solid #4185a6",borderRadius:6,padding:"8px 12px",background:"#174158",color:"#e7faff",cursor:"pointer"};
const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]/g,"");
function readRoomDevices(projectId:string,areaId:string):ElectricalDevice[] {
  try {
    const store=JSON.parse(localStorage.getItem("rws-workspaces-v2")||"{}") as Record<string,{devices?:ElectricalDevice[]}>;
    return (["NORTH","SOUTH","EAST","WEST"] as const).flatMap(w=>store[`${projectId}:${areaId}:${w}`]?.devices??[]);
  } catch { return []; }
}
type Props={project:ServiceProject;onChange:(p:ServiceProject)=>void;onOpenRoom:(areaId:string)=>void;onOpenPanel:()=>void};
export default function WholeHouseBlueprint({project,onChange,onOpenRoom,onOpenPanel}:Props){
 const [selectedCircuit,setSelectedCircuit]=useState<number|null>(null);
 const [showRuns,setShowRuns]=useState(true);
 const [showSymbols,setShowSymbols]=useState(true);
 const [showAll,setShowAll]=useState(true);
 const main=project.buildings.find(b=>b.kind==="MAIN");
 const aliases=(name:string)=>name==="Bedroom 1"?["bedroom1","bedroom"]:name==="2-Car Garage"?["2cargarage","garage"]:[normalize(name)];
 const lookup=(name:string)=>project.areas.find(a=>a.buildingId===main?.id&&aliases(name).includes(normalize(a.name)));
 const assignments=project.circuitAssignments??[];
 const routes=assignments.flatMap(a=>(a.destinations??[]).map(d=>({...d,slot:a.slot,name:a.name})));
 const visible=routes.filter(r=>selectedCircuit===null||r.slot===selectedCircuit);
 const byArea=(id:string)=>visible.filter(r=>r.areaId===id);
 function addTemplate(){
   if(!main)return;
   const existing=new Set(project.areas.filter(a=>a.buildingId===main.id).map(a=>normalize(a.name)));
   const missing=rooms.filter(r=>!aliases(r.name).some(alias=>existing.has(alias))).map(r=>({id:crypto.randomUUID(),name:r.name,buildingId:main.id,kind:"ROOM" as const}));
   if(missing.length)onChange({...project,areas:[...project.areas,...missing]});
 }
 const allMain=project.areas.filter(a=>a.buildingId===main?.id);
 const unmatched=allMain.filter(a=>!rooms.some(r=>aliases(r.name).includes(normalize(a.name))));
 const routeTargets=rooms.flatMap(room=>{const area=lookup(room.name);return area?byArea(area.id).map(r=>({room,area,route:r})):[];});
 const circuitSlots=Array.from(new Set(assignments.map(a=>a.slot))).sort((a,b)=>a-b);
 return <div style={{color:"#dff3ff",maxWidth:1440,margin:"auto"}}>
   <h2 style={{margin:"0 0 6px",color:"#8be9ff"}}>🏠 Whole-House Electrical Blueprint</h2>
   <p style={{color:"#b1cfde",fontSize:13}}>Single-story starter layout with attached 2-car garage. Home-run arrows indicate panel destinations, not the physical cable path. Existing room-wall projects remain unchanged.</p>
   <div style={{display:"flex",flexWrap:"wrap",gap:9,marginBottom:12,alignItems:"center"}}>
     <button style={control} onClick={addTemplate}>+ Add Missing Template Rooms</button>
     <button style={control} onClick={onOpenPanel}>Open Distribution Panel</button>
     <label style={{fontSize:13}}>Circuit <select style={control} value={selectedCircuit??"ALL"} onChange={e=>setSelectedCircuit(e.target.value==="ALL"?null:Number(e.target.value))}><option value="ALL">All circuits</option>{circuitSlots.map(n=><option key={n} value={n}>#{n} — {assignments.find(a=>a.slot===n)?.name||"Unnamed"}</option>)}</select></label>
     <label><input type="checkbox" checked={showRuns} onChange={e=>setShowRuns(e.target.checked)}/> Home runs</label>
     <label><input type="checkbox" checked={showSymbols} onChange={e=>setShowSymbols(e.target.checked)}/> Device symbols</label>
     <label><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/> Unassigned rooms</label>
   </div>
   <div style={{overflowX:"auto",background:"#09233a",border:"1px solid #317c9f",borderRadius:10,padding:12}}>
     <svg viewBox="0 0 1000 545" style={{width:"100%",minWidth:680,display:"block"}} role="img" aria-label="Single-story house electrical blueprint with two-car garage and home-run arrows to distribution panel">
       <defs>
         <pattern id="bp-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#397391" strokeWidth=".45" opacity=".55"/></pattern>
         <marker id="bp-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#ffc56b" strokeWidth="1.2"/></marker>
       </defs>
       <rect width="1000" height="545" fill="url(#bp-grid)"/>
       {rooms.map(room=>{
         const area=lookup(room.name);
         const active=!!area&&byArea(area.id).length>0;
         const faded=!showAll&&!active;
         const devices=area?readRoomDevices(project.id,area.id):[];
         const symbols=devices.filter(d=>["Switch","Light","Receptacle"].includes(d.type));
         return <g key={room.name} opacity={faded?.3:1}>
           <rect x={room.x} y={room.y} width={room.w} height={room.h} fill={room.kind==="garage"?"#163d4c":active?"#174461":"#103047"} stroke={active?"#a6ecff":"#7db3ce"} strokeWidth="3"/>
           {room.kind==="garage"&&<><rect x="30" y="28" width="128" height="72" fill="none" stroke="#7196a8" strokeDasharray="8 4"/><rect x="173" y="28" width="127" height="72" fill="none" stroke="#7196a8" strokeDasharray="8 4"/><text x="165" y="124" fontSize="11" fill="#a7c5d3" textAnchor="middle">2 vehicle bays</text></>}
           <text x={room.x+room.w/2} y={room.y+room.h/2-7} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#effaff">{room.name}</text>
           <text x={room.x+room.w/2} y={room.y+room.h/2+13} textAnchor="middle" fontSize="10" fill={area?"#91e4fd":"#ffcc88"}>{area?`${byArea(area.id).length} assigned home run(s)`:"Template room · not added"}</text>
           {showSymbols&&symbols.slice(0,16).map((d,i)=>{
             const x=room.x+20+(i%5)*Math.max(25,Math.min(42,(room.w-35)/5));
             const y=room.y+room.h-22-Math.floor(i/5)*22;
             return <g key={`${d.id}-${i}`}><circle cx={x} cy={y} r="8" stroke="#b5ecff" strokeWidth="1.4" fill="#11334b"/><text x={x} y={y+3.5} textAnchor="middle" fill="#e8f9ff" fontSize="9">{d.type==="Switch"?"S":d.type==="Light"?"L":"R"}</text></g>;
           })}
           {area&&<rect x={room.x+3} y={room.y+3} width={room.w-6} height={room.h-6} fill="transparent" style={{cursor:"pointer"}} onClick={()=>onOpenRoom(area.id)}><title>Open {room.name} wall workspaces</title></rect>}
         </g>;
       })}
       {showRuns&&routeTargets.map(({room,route},i)=>{
         const sx=room.x+room.w/2,sy=room.y+room.h/2;
         const offset=(i%5-2)*6;
         const midx=sx+(panel.x-sx)*.55;
         return <g key={`${route.slot}-${room.name}-${route.wall}-${i}`}>
           <path d={`M${sx} ${sy+offset} L${midx} ${sy+offset} L${midx} ${panel.y+offset} L${panel.x} ${panel.y+offset}`} stroke="#ffca72" strokeWidth={selectedCircuit===route.slot?3.3:1.7} strokeDasharray="8 5" fill="none" markerEnd="url(#bp-arrow)" opacity=".87"/>
           <rect x={sx-44} y={sy+offset-22} width="88" height="17" rx="3" fill="#082136" stroke="#b88946" strokeWidth=".5"/>
           <text x={sx} y={sy+offset-10} textAnchor="middle" fontSize="10" fill="#ffe3a5">HR #{route.slot} · {route.cable.replace(" NM-B","")}</text>
         </g>;
       })}
       <g onClick={onOpenPanel} style={{cursor:"pointer"}}>
         <rect x={panel.x-31} y={panel.y-27} width="62" height="54" rx="5" fill="#143746" stroke="#ffd38a" strokeWidth="3"/>
         <text x={panel.x} y={panel.y-3} textAnchor="middle" fill="#fff0c6" fontSize="12" fontWeight="bold">P1</text>
         <text x={panel.x} y={panel.y+12} textAnchor="middle" fill="#fff0c6" fontSize="10">PANEL</text>
         <title>Open Main Distribution Panel</title>
       </g>
       <text x="18" y="537" fill="#9bbbd0" fontSize="10">SCHEMATIC CONCEPT • Not to scale • No actual cable route or voltage calculations</text>
     </svg>
   </div>
   <div style={{display:"flex",flexWrap:"wrap",gap:14,marginTop:12,fontSize:12,color:"#c5dbe8"}}><span>▱ Room outline</span><span style={{color:"#ffd08a"}}>⇢ Dashed gold = home run to P1</span><span>Ⓢ Switch · Ⓛ Light · Ⓡ Receptacle</span><span>Click a room to open its wall workspace</span></div>
   <div style={{marginTop:14,background:"#112d40",padding:14,borderRadius:9,border:"1px solid #315d74"}}>
     <strong>Project circuits and home runs</strong>
     {visible.length===0?<p style={{fontSize:13,color:"#b3cedd"}}>No home runs assigned yet. Open Main Distribution Panel → Circuit Routing & Wiring, then assign a breaker to a room and wall. Click “Add Missing Template Rooms” if you want the full starter house added to Project Explorer.</p>:
     <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:9}}>{visible.map((r,i)=>{
       const area=project.areas.find(a=>a.id===r.areaId);
       return <div key={`${r.slot}-${r.areaId}-${r.wall}-${i}`} style={{border:"1px solid #476c83",borderRadius:6,padding:9,fontSize:12,minWidth:200}}><strong>HR #{r.slot} → P1</strong><div>{area?.name||"Unknown area"} / {r.wall}</div><div>{r.cable} · {project.distributionPanel?.breakers.find(b=>b.slot===r.slot)?.breaker?.amperage??"—"}A breaker</div></div>;
     })}</div>}
     {unmatched.length>0&&<p style={{fontSize:12,color:"#ffd69a"}}>Existing rooms not in this starter template: {unmatched.map(a=>a.name).join(", ")}. They remain in Project Explorer; custom room positioning is planned for a later blueprint update.</p>}
     <p style={{fontSize:12,color:"#a9c4d4",marginBottom:0}}>A home-run arrow is an electrical-plan designation, not a promise of a direct physical route. Symbols represent saved wall devices where available; room placement is schematic, not dimensionally accurate. A circuit may feed multiple devices or rooms.</p>
   </div>
 </div>;
}
