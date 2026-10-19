import { useState } from "react";
import type { ElectricalDevice } from "../electrical/types";
import type { Connection } from "../electrical/connections";
import type { ServiceProject } from "./projectWorkflow";

type Props = {
  devices: ElectricalDevice[];
  connections: Connection[];
  project: ServiceProject;
  areaId: string;
  wall: "NORTH" | "SOUTH" | "EAST" | "WEST";
};
export default function WallCircuitInspector({devices,connections,project,areaId,wall}:Props) {
  const [expanded,setExpanded]=useState(true);
  const [run,setRun]=useState(false);
  const routes=(project.circuitAssignments??[]).flatMap(a=>(a.destinations??[]).filter(d=>d.areaId===areaId&&d.wall===wall).map(d=>({slot:a.slot,cable:d.cable})));
  const [slot,setSlot]=useState<number|null>(null);
  const activeSlot=routes.find(r=>r.slot===slot)?.slot??routes[0]?.slot??null;
  const breaker=project.distributionPanel?.breakers.find(b=>b.slot===activeSlot)?.breaker;
  const panelWires=(project.panelWires??[]).filter(w=>w.slot===activeSlot);
  const connected=connections.filter(c=>c.status==="CONNECTED" && devices.some(d=>d.id===c.from.deviceId) && devices.some(d=>d.id===c.to.deviceId));
  const graph=new Map<string,Set<string>>();
  for(const d of devices) graph.set(d.id,new Set());
  for(const c of connected) { graph.get(c.from.deviceId)?.add(c.to.deviceId);graph.get(c.to.deviceId)?.add(c.from.deviceId); }
  const switches=devices.filter(d=>d.type==="Switch");
  const lights=devices.filter(d=>d.type==="Light");
  const receptacles=devices.filter(d=>d.type==="Receptacle");
  function path(a:string,b:string) {
    const visited=new Set([a]), queue=[a];
    while(queue.length) {const id=queue.shift()!;if(id===b)return true;for(const n of graph.get(id)??[])if(!visited.has(n)){visited.add(n);queue.push(n);}}
    return false;
  }
  const linked=switches.some(s=>lights.some(l=>path(s.id,l.id)));
  const checks=[
    {label:"An installed breaker is assigned to this wall",ok:!!breaker},
    {label:"14/2 NM-B cable route is assigned",ok:routes.some(r=>r.slot===activeSlot&&r.cable==="14/2 NM-B")},
    {label:"Panel black conductor is recorded at the selected breaker",ok:panelWires.some(w=>w.conductor==="black"&&w.terminal===`breaker-${activeSlot}-hot-a`)},
    {label:"Panel neutral conductor is recorded at neutral bar",ok:panelWires.some(w=>w.conductor==="white"&&w.terminal?.startsWith("neutral-"))},
    {label:"Panel ground conductor is recorded at grounding bar",ok:panelWires.some(w=>w.conductor==="bare"&&w.terminal?.startsWith("ground-"))},
    {label:"Room workspace contains a switch",ok:switches.length>0},
    {label:"Room workspace contains a light",ok:lights.length>0},
    {label:"Room workspace contains drawn wire connections",ok:connected.length>0},
    {label:"Switch and light are connected in the room's device graph",ok:linked},
    {label:"All drawn room connections are in CONNECTED state",ok:connections.every(c=>c.status==="CONNECTED")},
  ];
  const ok=checks.every(c=>c.ok);
  const style:React.CSSProperties={background:"#102637",color:"#e4f8ff",border:"1px solid #3883a4",borderRadius:8,padding:12,marginTop:12};
  return <section style={style}>
    <button onClick={()=>setExpanded(!expanded)} style={{background:"#155270",color:"white",padding:10,width:"100%",textAlign:"left",border:"1px solid #3782a4",borderRadius:5,fontWeight:700}}>⚡ Wall Circuit Inspector {expanded?"▾":"▸"}</button>
    {expanded&&<>
      <p style={{fontSize:12,color:"#b9d3e2"}}>Tests actual devices and drawn connections in this wall workspace, plus the assigned breaker and saved panel terminations. No duplicate device-wiring exercise.</p>
      <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"center",fontSize:13}}>
        <span>Devices: <strong>{devices.length}</strong></span><span>Drawn connections: <strong>{connections.length}</strong></span>
        <span>Switches: {switches.length}</span><span>Lights: {lights.length}</span><span>Receptacles: {receptacles.length}</span>
        <label>Breaker <select value={activeSlot??""} onChange={e=>{setSlot(Number(e.target.value));setRun(false);}} style={{background:"#142c3b",color:"white",padding:6}}>{routes.length?routes.map(r=><option key={r.slot} value={r.slot}>#{r.slot} · {r.cable}</option>):<option value="">No assigned route</option>}</select></label>
      </div>
      <button onClick={()=>setRun(true)} style={{background:"#14688a",color:"white",padding:"9px 16px",marginTop:12,border:"1px solid #59b8dc",borderRadius:5,cursor:"pointer"}}>TEST DRAWN WALL CIRCUIT</button>
      {run&&<div style={{marginTop:12}}>
        <strong style={{color:ok?"#a7f2b6":"#ffca9c"}}>{ok?"MODELED CHECKS PASS":"INCOMPLETE / FAULT — REVIEW CONNECTIONS"}</strong>
        {checks.map((c,i)=><div key={i} style={{fontSize:12,marginTop:6,color:c.ok?"#b1f0c0":"#ffb7a7"}}>{c.ok?"✓":"✕"} {c.label}</div>)}
        <p style={{fontSize:12,color:"#c0d5e0"}}>This is a topology and recorded-termination inspection, not proof of correct line/load wiring, neutral continuity, device terminal polarity, switch operation, or actual voltage. The existing simulation solver is not yet a complete service-to-room electrical graph. Do not treat PASS as an energized-circuit or safety verification.</p>
      </div>}
    </>}
  </section>;
}
