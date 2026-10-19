import { useState } from "react";
import type { ServiceProject, EndToEndCircuit } from "./projectWorkflow";
import type { ElectricalDevice } from "../electrical/types";

type Wall = EndToEndCircuit["wall"];
type Props = {
  project: ServiceProject;
  onChange: (project: ServiceProject) => void;
  location?: { areaId: string; wall: Wall; devices: ElectricalDevice[] };
};
const btn: React.CSSProperties = {background:"#17445c",color:"#e5f8ff",border:"1px solid #428eae",borderRadius:5,padding:"8px 10px",cursor:"pointer"};
const input: React.CSSProperties = {...btn,background:"#0b1a27"};
const ends = ["brass","silver","green"] as const;
type End = typeof ends[number];
type Check = { ok: boolean; label: string };
function scopedDevices(project: ServiceProject, areaId: string, wall: Wall): ElectricalDevice[] {
  try {
    const all = JSON.parse(localStorage.getItem("rws-workspaces-v2") || "{}") as Record<string,{devices?:ElectricalDevice[]}>;
    return all[`${project.id}:${areaId}:${wall}`]?.devices ?? [];
  } catch { return []; }
}
function inspect(project: ServiceProject, circuit: EndToEndCircuit): Check[] {
  const breaker = project.distributionPanel?.breakers.find(s=>s.slot===circuit.slot)?.breaker;
  const route = project.circuitAssignments?.find(a=>a.slot===circuit.slot)?.destinations?.find(d=>d.areaId===circuit.areaId && d.wall===circuit.wall);
  const conductors = (project.panelWires??[]).filter(w=>w.slot===circuit.slot);
  const find = (color:string)=>conductors.find(w=>w.conductor===color);
  const devices = scopedDevices(project,circuit.areaId,circuit.wall);
  const target = devices.find(d=>d.id===circuit.receptacleId && /receptacle/i.test(d.type));
  const otherTerminations = (project.panelWires??[]).filter(w=>w.slot!==circuit.slot);
  const unique = ["black","white","bare"].every(color=>{
    const terminal=find(color)?.terminal;
    return !!terminal && !otherTerminations.some(w=>w.terminal===terminal);
  });
  return [
    {ok:!!breaker && breaker.poles===1 && breaker.amperage===15 && breaker.breakerType==="STANDARD",label:"15A standard single-pole breaker installed"},
    {ok:breaker?.status==="ON",label:`Branch breaker is ON (currently ${breaker?.status??"missing"})`},
    {ok:project.service.mainDisconnectClosed && (!project.distributionMain?.installed || project.distributionMain.closed),label:"Simulated upstream disconnect and distribution main closed"},
    {ok:!!route && route.cable==="14/2 NM-B",label:"14/2 NM-B route assigned to this room and wall"},
    {ok:!!find("black") && find("black")?.terminal===`breaker-${circuit.slot}-hot-a`,label:"Black conductor terminated at selected breaker load terminal"},
    {ok:!!find("white") && !!find("white")?.terminal?.startsWith("neutral-"),label:"White conductor terminated at panel neutral bar"},
    {ok:!!find("bare") && !!find("bare")?.terminal?.startsWith("ground-"),label:"Bare conductor terminated at equipment-ground bar"},
    {ok:unique,label:"Panel terminal connections do not conflict with another circuit"},
    {ok:!!target,label:"Selected receptacle exists in the actual room-wall workspace"},
    {ok:!!target && !!circuit.receptacleId,label:"A specific room receptacle is selected for this home run"},
    {ok:breaker?.poles===1 && breaker.amperage===15,label:"Breaker and 14 AWG cable are modeled as a 15A branch circuit"},
    {ok:circuit.roomHot==="brass",label:"Black conductor terminated at receptacle brass terminal"},
    {ok:circuit.roomNeutral==="silver",label:"White conductor terminated at receptacle silver terminal"},
    {ok:circuit.roomGround==="green",label:"Bare conductor terminated at receptacle green terminal"}
  ];
}
export default function EndToEndCircuitLab({project,onChange,location}:Props) {
  const [slot,setSlot]=useState(1);
  const [areaId,setAreaId]=useState(project.areas[0]?.id??"");
  const [wall,setWall]=useState<Wall>("NORTH");
  const [inspection,setInspection]=useState<Check[]|null>(null);
  const currentArea=location?.areaId??areaId;
  const currentWall=location?.wall??wall;
  const routes=(project.circuitAssignments??[]).flatMap(a=>(a.destinations??[]).filter(d=>d.areaId===currentArea&&d.wall===currentWall).map(d=>({slot:a.slot,cable:d.cable})));
  const activeSlot=location ? (routes.some(r=>r.slot===slot)?slot:routes[0]?.slot??slot) : slot;
  const devices=location?.devices??scopedDevices(project,currentArea,currentWall);
  const receptacles=devices.filter(d=>/receptacle/i.test(d.type));
  const stored=(project.endToEndCircuits??[]).find(c=>c.slot===activeSlot&&c.areaId===currentArea&&c.wall===currentWall);
  const [chosen,setChosen]=useState("");
  const receptacleId=receptacles.some(d=>d.id===(stored?.receptacleId??chosen))?(stored?.receptacleId??chosen):receptacles[0]?.id??"";
  const circuit:EndToEndCircuit=stored??{slot:activeSlot,areaId:currentArea,wall:currentWall,receptacleId,cable:"14/2 NM-B",roomHot:null,roomNeutral:null,roomGround:null};

  function save(next:EndToEndCircuit) {
    onChange({...project,endToEndCircuits:[...(project.endToEndCircuits??[]).filter(c=>!(c.slot===next.slot&&c.areaId===next.areaId&&c.wall===next.wall)),next]});
    setInspection(null);
  }
  const checks=inspection??[];
  const noRoute=location && routes.length===0;
  const passed=checks.length>0&&checks.every(c=>c.ok);
  return <section style={{border:"1px solid #36728d",background:"#101f2d",borderRadius:10,padding:14,color:"#e5f6ff",margin:"12px 0"}}>
    <h3 style={{color:"#77e0ff",margin:"0 0 8px"}}>⚡ Room → Breaker Wiring — 15A / 14/2</h3>
    <p style={{fontSize:12,color:"#bdd1dc"}}>Wire one receptacle from this actual wall workspace to its assigned panel breaker. Set up the breaker and route in Main Distribution Panel → Circuit Routing & Wiring; use Wire / Edit to terminate black, white and bare at the panel. Then choose the receptacle terminals below. This is a saved-termination exercise, not a live voltage solver.</p>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:10}}>
      <label>Breaker <select style={input} value={activeSlot} onChange={e=>{setSlot(Number(e.target.value));setInspection(null);}}>{(project.distributionPanel?.breakers??[]).filter(s=>s.breaker).map(s=><option key={s.slot} value={s.slot}>#{s.slot} · {s.breaker?.amperage}A</option>)}</select></label>
      {!location&&<>
        <label>Room <select style={input} value={currentArea} onChange={e=>{setAreaId(e.target.value);setInspection(null);}}>{project.areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        <label>Wall <select style={input} value={currentWall} onChange={e=>{setWall(e.target.value as Wall);setInspection(null);}}>{(["NORTH","SOUTH","EAST","WEST"] as Wall[]).map(w=><option key={w}>{w}</option>)}</select></label>
      </>}
    </div>
    {noRoute && <p style={{color:"#ffcb9b",fontSize:13}}>No home run assigned to this wall yet. Go to Main Distribution Panel, select a breaker, then add this room and wall in Circuit Routing & Wiring.</p>}
    <div style={{fontSize:12,marginBottom:10}}>Panel route: {routes.some(r=>r.slot===activeSlot&&r.cable==="14/2 NM-B")?"✓ 14/2 NM-B planned":"Not yet assigned. Use Circuit Destinations in Service & Panel."}</div>
    <label style={{display:"block",marginBottom:12}}>Actual wall receptacle
      <select style={{...input,marginLeft:8,maxWidth:"100%"}} value={receptacleId} onChange={e=>{setChosen(e.target.value);save({...circuit,receptacleId:e.target.value,roomHot:null,roomNeutral:null,roomGround:null});}}>
        {receptacles.length===0?<option value="">No receptacle on this wall</option>:receptacles.map(d=><option key={d.id} value={d.id}>{d.name} ({d.id.slice(0,8)})</option>)}
      </select>
    </label>
    {receptacleId&&<div style={{border:"1px solid #395c70",padding:12,borderRadius:8,marginBottom:12}}>
      <strong>Virtual receptacle terminal connections</strong>
      <p style={{fontSize:12,color:"#aac9d8"}}>Choose the physical terminal for each conductor. Wrong connections are allowed so you can practice fault-finding.</p>
      {([["roomHot","Black (hot)"],["roomNeutral","White (neutral)"],["roomGround","Bare (ground)"]] as const).map(([key,label])=><label key={key} style={{display:"flex",gap:12,alignItems:"center",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap"}}>{label}
        <select style={input} value={circuit[key]??""} onChange={e=>save({...circuit,receptacleId,[key]:e.target.value?e.target.value as End:null})}>
          <option value="">Not connected</option>{ends.map(end=><option key={end} value={end}>{end==="brass"?"Brass / HOT":end==="silver"?"Silver / NEUTRAL":"Green / GROUND"}</option>)}
        </select>
      </label>)}
    </div>}
    <button style={btn} disabled={!!noRoute || !receptacleId} onClick={()=>setInspection(inspect(project,{...circuit,receptacleId}))}>INSPECT ROOM-TO-BREAKER CONNECTION</button>
    {inspection&&<div style={{marginTop:12,borderTop:"1px solid #355568",paddingTop:10}}>
      <strong style={{color:passed?"#8cf2ad":"#ffd09b"}}>{passed?"PASS — All modeled circuit checks complete":"INCOMPLETE / FAULT — Review the checks"}</strong>
      {checks.map((c,i)=><div key={i} style={{fontSize:12,marginTop:5,color:c.ok?"#a0ebbc":"#ffbbab"}}>{c.ok?"✓":"✕"} {c.label}</div>)}
      <p style={{fontSize:12,color:"#b6c8d5"}}>{passed?"Idealized no-load model: nominal hot–neutral 120V, hot–ground 120V, neutral–ground approximately 0V.":"Voltage results withheld until all modeled checks pass."} This is a logical training inspection, NOT a physics-based voltage measurement or proof of real-world safety, conductor continuity, correct equipment listing, or code compliance.</p>
    </div>}
  </section>;
}
