import { useState } from "react";
import type { ServiceProject } from "./projectWorkflow";
const btn:React.CSSProperties={padding:"9px 12px",background:"#17465f",color:"#e9f8ff",border:"1px solid #4d9abb",borderRadius:6,cursor:"pointer"};
export default function ElectricalServiceWorkspace({project,onChange}:{project:ServiceProject;onChange:(p:ServiceProject)=>void}){
 const [openL1,setOpenL1]=useState(false),[openL2,setOpenL2]=useState(false),[openNeutral,setOpenNeutral]=useState(false),[openGround,setOpenGround]=useState(false);
 const powered=project.service.mainDisconnectClosed&&!openL1&&!openL2;
 return <section style={{padding:18,color:"#e5f7ff",maxWidth:1300}}>
 <h2 style={{color:"#70dcff"}}>⚡ Electrical Service — Setup & Simulation</h2>
 <p style={{color:"#b7d3e1"}}>Separate upstream service equipment feeding the downstream distribution panel. This is a conceptual, simulated single-phase 120/240V supply.</p>
 <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"center",marginBottom:16}}>
 <label>Service type <select style={btn} value={project.service.route} onChange={e=>onChange({...project,service:{...project.service,route:e.target.value as "UNDERGROUND"|"OVERHEAD"}})}><option value="UNDERGROUND">Underground</option><option value="OVERHEAD">Overhead</option></select></label>
 <label>Rating <select style={btn} value={project.service.amperage} onChange={e=>onChange({...project,service:{...project.service,amperage:Number(e.target.value)}})}>{[100,125,150,200,225,320,400].map(v=><option key={v} value={v}>{v}A</option>)}</select></label>
 <label>Meter location <input style={{...btn,background:"#0d2231"}} value={project.service.meterLocation} onChange={e=>onChange({...project,service:{...project.service,meterLocation:e.target.value}})}/></label>
 </div>
 <svg viewBox="0 0 900 300" style={{width:"100%",background:"#0c1823",border:"1px solid #427d9d",borderRadius:10}} aria-label="Electrical service simulation from utility through meter and disconnect to distribution panel">
 {[[25,"UTILITY"],[245,"METER"],[470,"SERVICE DISCONNECT"],[700,"DISTRIBUTION PANEL"]].map(([x,label])=><g key={String(label)}><rect x={Number(x)} y="62" width="175" height="170" rx="9" fill="#203747" stroke="#73b9d7" strokeWidth="2"/><text x={Number(x)+87} y="92" textAnchor="middle" fontSize="13" fill="#d9f4ff">{label}</text></g>)}
 {[["L1",115,"#dc6969",openL1],["L2",146,"#738fd9",openL2],["N",177,"#e6e9e9",openNeutral],["EGC",208,"#c89962",openGround]].map(([label,y,color,fault])=><g key={String(label)}><path d={`M 200 ${y} H 245 M 420 ${y} H 470 M 645 ${y} H 700`} stroke={String(color)} strokeWidth="8" strokeDasharray={fault?"9 11":undefined}/><text x="215" y={Number(y)-8} fill="#eaf6ff" fontSize="11">{label}</text></g>)}
 <text x="557" y="121" textAnchor="middle" fontSize="12" fill={project.service.mainDisconnectClosed?"#9af0b8":"#ffc7a2"}>{project.service.mainDisconnectClosed?"CLOSED":"OPEN"}</text>
 <text x="787" y="122" textAnchor="middle" fontSize="12" fill={powered?"#a0f0bd":"#ffcaad"}>{powered?"SUPPLY PRESENT":"SUPPLY INTERRUPTED"}</text>
 <text x="787" y="147" textAnchor="middle" fontSize="12" fill="#d0e9f3">Neutral: {openNeutral?"OPEN":"CONNECTED"}</text>
 <text x="787" y="169" textAnchor="middle" fontSize="12" fill="#d0e9f3">EGC: {openGround?"OPEN":"CONNECTED"}</text>
 <text x="450" y="276" textAnchor="middle" fill="#afcadb" fontSize="13">Training model · Neutral-ground bond at service equipment, isolated in downstream panel</text>
 </svg>
 <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:16}}>
 <button style={btn} onClick={()=>onChange({...project,service:{...project.service,mainDisconnectClosed:!project.service.mainDisconnectClosed}})}>{project.service.mainDisconnectClosed?"OPEN":"CLOSE"} simulated service disconnect</button>
 <button style={btn} onClick={()=>setOpenL1(v=>!v)}>L1: {openL1?"OPEN":"CONNECTED"}</button><button style={btn} onClick={()=>setOpenL2(v=>!v)}>L2: {openL2?"OPEN":"CONNECTED"}</button><button style={btn} onClick={()=>setOpenNeutral(v=>!v)}>Neutral: {openNeutral?"OPEN":"CONNECTED"}</button><button style={btn} onClick={()=>setOpenGround(v=>!v)}>EGC: {openGround?"OPEN":"CONNECTED"}</button>
 </div>
 <div style={{marginTop:14,padding:12,border:"1px solid #49778e",borderRadius:8}}><strong>Simulated supply inspection</strong>
 <p>L1–N: {powered&&!openNeutral?"120V nominal":"Unavailable / indeterminate"} · L2–N: {powered&&!openNeutral?"120V nominal":"Unavailable / indeterminate"} · L1–L2: {powered?"240V nominal":"Unavailable"}</p>
 <p style={{color:openNeutral||openGround?"#ffbd9b":"#9fe5b8"}}>{openNeutral?"FAULT: Open neutral — dangerous condition in real systems. ":""}{openGround?"FAULT: Equipment-grounding path interrupted. ":""}{!openNeutral&&!openGround?"Modeled feeder neutral and equipment-grounding paths connected.":""}</p></div>
 <p style={{fontSize:12,color:"#a8c5d5"}}>Virtual demonstration only. Fault toggles are not real wiring operations; simulated readings are illustrative and do not account for loading, backfeed, conductor impedance, or all hazards. The service equipment may remain energized upstream of the disconnect. Do not work on energized service equipment.</p>
 </section>
}
