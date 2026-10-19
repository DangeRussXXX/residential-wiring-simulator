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
type End = "brass" | "silver" | "green";
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
  const [expanded,setExpanded]=useState(true);
  const [slot,setSlot]=useState<number|null>(null);
  const [chosen,setChosen]=useState("");
  const [selectedWire,setSelectedWire]=useState<"black"|"white"|"bare"|null>(null);
  const [inspection,setInspection]=useState<Check[]|null>(null);
  const areaId=location?.areaId??project.activeAreaId??"";
  const wall=location?.wall??"NORTH";
  const routes=(project.circuitAssignments??[]).flatMap(a=>(a.destinations??[])
    .filter(d=>d.areaId===areaId&&d.wall===wall)
    .map(d=>({slot:a.slot,cable:d.cable})));
  const activeSlot=routes.find(r=>r.slot===slot)?.slot??routes[0]?.slot??slot??1;
  const devices=location?.devices??scopedDevices(project,areaId,wall);
  const receptacles=devices.filter(d=>/receptacle/i.test(d.type));
  const stored=(project.endToEndCircuits??[]).find(c=>c.slot===activeSlot&&c.areaId===areaId&&c.wall===wall);
  const receptacleId=receptacles.some(d=>d.id===chosen)?chosen:
    receptacles.some(d=>d.id===stored?.receptacleId)?stored!.receptacleId:receptacles[0]?.id??"";
  // A different selected device must not inherit a previous device's terminals.
  const sameDevice=stored?.receptacleId===receptacleId;
  const circuit:EndToEndCircuit=sameDevice?stored!:{
    slot:activeSlot,areaId,wall,receptacleId,cable:"14/2 NM-B",
    roomHot:null,roomNeutral:null,roomGround:null
  };
  const noRoute=routes.length===0;
  const checks=inspection??[];
  const passed=checks.length>0&&checks.every(c=>c.ok);
  const wires=[
    {id:"black" as const,key:"roomHot" as const,label:"BLACK / HOT",color:"#20252d",y:92},
    {id:"white" as const,key:"roomNeutral" as const,label:"WHITE / NEUTRAL",color:"#f5f7fb",y:171},
    {id:"bare" as const,key:"roomGround" as const,label:"BARE / GROUND",color:"#c98c54",y:250}
  ];
  const terminals=[
    {id:"brass" as const,label:"BRASS · HOT",color:"#d7a13d",x:405,y:102},
    {id:"silver" as const,label:"SILVER · NEUTRAL",color:"#d5e0ec",x:405,y:171},
    {id:"green" as const,label:"GREEN · GROUND",color:"#49d28c",x:405,y:240}
  ];
  function save(next:EndToEndCircuit) {
    onChange({...project,endToEndCircuits:[
      ...(project.endToEndCircuits??[]).filter(c=>!(c.slot===next.slot&&c.areaId===next.areaId&&c.wall===next.wall)),
      next
    ]});
    setInspection(null);
  }
  function connect(wire:"black"|"white"|"bare",terminal:End) {
    const key=wire==="black"?"roomHot":wire==="white"?"roomNeutral":"roomGround";
    save({...circuit,receptacleId,[key]:terminal});
    setSelectedWire(null);
  }
  function disconnect(wire:"black"|"white"|"bare") {
    const key=wire==="black"?"roomHot":wire==="white"?"roomNeutral":"roomGround";
    save({...circuit,receptacleId,[key]:null});
    setSelectedWire(null);
  }
  return <section style={{border:"1px solid #36728d",background:"#101f2d",borderRadius:8,padding:9,color:"#e5f6ff",margin:"0 0 10px"}}>
    <button type="button" onClick={()=>setExpanded(v=>!v)}
      style={{...btn,width:"100%",textAlign:"left",fontWeight:700,background:"#155270"}}>
      ⚡ Room → Breaker Wiring {expanded?"▾":"▸"}
    </button>
    {expanded&&<>
      <p style={{fontSize:11,color:"#bdd1dc",lineHeight:1.5}}>
        Interactive receptacle wiring. Select a conductor and then its terminal, or drag a conductor end onto a screw.
        Terminations save to this project. Panel terminations are still made in Wire / Edit.
      </p>
      <label style={{fontSize:12}}>Breaker{" "}
        <select style={{...input,maxWidth:"100%"}} value={activeSlot}
          onChange={e=>{setSlot(Number(e.target.value));setChosen("");setInspection(null);setSelectedWire(null);}}>
          {(project.distributionPanel?.breakers??[]).filter(s=>s.breaker).map(s=>
            <option key={s.slot} value={s.slot}>#{s.slot} · {s.breaker?.amperage}A</option>)}
        </select>
      </label>
      <div style={{fontSize:11,color:noRoute?"#ffcb9b":"#9fdfbe",margin:"8px 0"}}>
        {noRoute?"No home run assigned to this wall yet. Assign it in Circuit Routing & Wiring.":
          `Panel route: ${routes.find(r=>r.slot===activeSlot)?.cable??"not assigned"} (planned)`}
      </div>
      <label style={{display:"block",fontSize:12,marginBottom:8}}>Wall receptacle{" "}
        <select style={{...input,maxWidth:"100%"}} value={receptacleId}
          onChange={e=>{setChosen(e.target.value);setInspection(null);setSelectedWire(null);}}>
          {receptacles.length===0?<option value="">No receptacle on this wall</option>:
            receptacles.map(d=><option key={d.id} value={d.id}>{d.name} ({d.id.slice(0,8)})</option>)}
        </select>
      </label>
      {receptacleId&&<>
        <div style={{fontSize:11,color:"#aacbdc",marginBottom:6}}>
          {selectedWire?`Selected ${selectedWire.toUpperCase()}: choose a terminal screw →`:"Select or drag a conductor end to a terminal screw."}
        </div>
        <svg viewBox="0 0 510 326" role="group" aria-label="Interactive 14/2 NM-B home-run conductors and receptacle terminal screws"
          style={{width:"100%",height:"auto",background:"#071622",border:"1px solid #315b73",borderRadius:8,touchAction:"none"}}>
          <rect x="10" y="15" width="490" height="296" rx="12" fill="#0e2739" stroke="#426b83"/>
          <text x="28" y="42" fill="#8bdfff" fontSize="15" fontWeight="bold">14/2 NM-B HOME RUN</text>
          <text x="315" y="42" fill="#8bdfff" fontSize="14" fontWeight="bold">RECEPTACLE</text>
          <rect x="15" y="68" width="120" height="208" rx="14" fill="#b8a887" stroke="#ebd5a6" strokeWidth="3"/>
          <text x="24" y="293" fill="#a4c5d5" fontSize="11">Cable jacket</text>
          <rect x="340" y="65" width="145" height="215" rx="16" fill="#c8d2d9" stroke="#f2f7fa" strokeWidth="3"/>
          <rect x="358" y="83" width="104" height="178" rx="9" fill="#e4e8e9" stroke="#8796a2"/>
          <circle cx="375" cy="124" r="6" fill="#768896"/>
          <circle cx="427" cy="124" r="6" fill="#768896"/>
          <rect x="391" y="114" width="8" height="22" rx="3" fill="#334956"/>
          <rect x="412" y="114" width="8" height="22" rx="3" fill="#334956"/>
          <circle cx="405" cy="200" r="11" fill="#647786"/>
          <circle cx="405" cy="200" r="5" fill="#d6e0e5"/>
          {wires.map(w=>{
            const attached=circuit[w.key];
            const end=terminals.find(t=>t.id===attached);
            return <g key={w.id}>
              <path d={end?`M 133 ${w.y} L 225 ${w.y} L ${end.x-20} ${end.y} L ${end.x} ${end.y}`:`M 133 ${w.y} L 226 ${w.y}`}
                fill="none" stroke={w.id==="white"?"#526f80":"#07131b"} strokeWidth="12" strokeLinecap="round"/>
              <path d={end?`M 133 ${w.y} L 225 ${w.y} L ${end.x-20} ${end.y} L ${end.x} ${end.y}`:`M 133 ${w.y} L 226 ${w.y}`}
                fill="none" stroke={w.color} strokeWidth="7" strokeLinecap="round"/>
              <circle cx="226" cy={w.y} r="14" fill={selectedWire===w.id?"#3db7e7":"#19374b"}
                stroke={selectedWire===w.id?"#b4f4ff":w.color} strokeWidth="3"
                onPointerDown={e=>{e.preventDefault();setSelectedWire(w.id);}}
                onClick={()=>setSelectedWire(w.id)} style={{cursor:"grab"}}/>
              <text x="144" y={w.y-18} fill="#e1f5ff" fontSize="11">{w.label}</text>
              {attached&&<text x="240" y={w.y+25} fill="#9ee6b9" fontSize="10">→ {attached.toUpperCase()}</text>}
            </g>;
          })}
          {terminals.map(t=><g key={t.id}
            onPointerUp={()=>{if(selectedWire)connect(selectedWire,t.id);}}
            onClick={()=>{if(selectedWire)connect(selectedWire,t.id);}}
            style={{cursor:"pointer"}}>
            <circle cx={t.x} cy={t.y} r="22" fill="#263c4c" stroke={t.color} strokeWidth="4"/>
            <circle cx={t.x} cy={t.y} r="11" fill={t.color}/>
            <path d={`M ${t.x-6} ${t.y} H ${t.x+6}`} stroke="#35424c" strokeWidth="3"/>
            <text x="287" y={t.y-25} fill="#e5f4fc" fontSize="10">{t.label}</text>
          </g>)}
        </svg>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
          {wires.map(w=><div key={w.id} style={{display:"flex",alignItems:"center",gap:6,fontSize:11}}>
            <span style={{width:13,height:13,borderRadius:"50%",background:w.color,border:"1px solid #9bb5c2",flexShrink:0}}/>
            <strong style={{minWidth:42}}>{w.id.toUpperCase()}</strong>
            <span style={{flex:1}}>{circuit[w.key]?.toUpperCase()??"Not connected"}</span>
            <button type="button" onClick={()=>setSelectedWire(w.id)} style={{...btn,padding:"4px 6px",background:selectedWire===w.id?"#267fa1":"#17445c"}}>Select</button>
            <button type="button" disabled={!circuit[w.key]} onClick={()=>disconnect(w.id)} style={{...btn,padding:"4px 6px"}}>Remove</button>
          </div>)}
        </div>
        <button type="button" style={{...btn,marginTop:10,width:"100%"}} disabled={noRoute}
          onClick={()=>setInspection(inspect(project,{...circuit,receptacleId}))}>TEST ROOM → BREAKER WIRING</button>
        {inspection&&<div style={{marginTop:10,borderTop:"1px solid #355568",paddingTop:9}}>
          <strong style={{color:passed?"#8cf2ad":"#ffd09b",fontSize:12}}>
            {passed?"MODELED CONNECTION CHECKS PASS":"INCOMPLETE / FAULT — Review connections"}
          </strong>
          {checks.map((c,i)=><div key={i} style={{fontSize:11,marginTop:5,color:c.ok?"#a0ebbc":"#ffbbab"}}>
            {c.ok?"✓":"✕"} {c.label}
          </div>)}
          <p style={{fontSize:11,color:"#b6c8d5"}}>
            Logical termination inspection only. This does not establish actual voltage,
            conductor continuity, real-world safety, or code compliance.
          </p>
        </div>}
      </>}
    </>}
  </section>;
}
