import { useRef, useState } from "react";
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
  const target = devices.find(d=>d.id===circuit.receptacleId);
  const isReceptacle = !!target && /receptacle/i.test(target.type);
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
    {ok:!!target,label:"Selected home-run device exists in the actual room-wall workspace"},
    {ok:!!target && !!circuit.receptacleId,label:"A specific device is selected for this home run"},
    {ok:breaker?.poles===1 && breaker.amperage===15,label:"Breaker and 14 AWG cable are modeled as a 15A branch circuit"},
    {ok:isReceptacle && circuit.roomHot==="brass",label:"Black conductor terminated at receptacle brass terminal"},
    {ok:isReceptacle && circuit.roomNeutral==="silver",label:"White conductor terminated at receptacle silver terminal"},
    {ok:isReceptacle && circuit.roomGround==="green",label:"Bare conductor terminated at receptacle green terminal"}
  ];
}

export default function EndToEndCircuitLab({project,onChange,location}:Props) {
  const [expanded,setExpanded]=useState(true);
  const [slot,setSlot]=useState<number|null>(null);
  const [chosen,setChosen]=useState("");
  const [selectedWire,setSelectedWire]=useState<"black"|"white"|"bare"|null>(null);
  const [drag,setDrag]=useState<{wire:"black"|"white"|"bare";x:number;y:number}|null>(null);
  const diagramRef=useRef<SVGSVGElement|null>(null);
  function position(e:React.PointerEvent<SVGSVGElement>) {
    const r=diagramRef.current?.getBoundingClientRect();
    return r?{x:(e.clientX-r.left)*540/r.width,y:(e.clientY-r.top)*380/r.height}:{x:0,y:0};
  }
  function finishDrag(e:React.PointerEvent<SVGSVGElement>) {
    if(!drag)return;
    const pt=position(e);
    const near=terminals.find(t=>Math.hypot(pt.x-t.x,pt.y-t.y)<29);
    if(near)connect(drag.wire,near.id);
    setDrag(null);
  }
  const [inspection,setInspection]=useState<Check[]|null>(null);
  const areaId=location?.areaId??project.activeAreaId??"";
  const wall=location?.wall??"NORTH";
  const routes=(project.circuitAssignments??[]).flatMap(a=>(a.destinations??[])
    .filter(d=>d.areaId===areaId&&d.wall===wall)
    .map(d=>({slot:a.slot,cable:d.cable})));
  const activeSlot=routes.find(r=>r.slot===slot)?.slot??routes[0]?.slot??slot??1;
  const devices=location?.devices??scopedDevices(project,areaId,wall);
  const receptacles=devices; // All wall devices can receive a planned home run.
  const stored=(project.endToEndCircuits??[]).find(c=>c.slot===activeSlot&&c.areaId===areaId&&c.wall===wall);
  const receptacleId=receptacles.some(d=>d.id===chosen)?chosen:
    receptacles.some(d=>d.id===stored?.receptacleId)?stored!.receptacleId:receptacles[0]?.id??"";
  // A different selected device must not inherit a previous device's terminals.
  const sameDevice=stored?.receptacleId===receptacleId;
  const selectedDevice=devices.find(d=>d.id===receptacleId);
  const supportsTerminals=!!selectedDevice && /receptacle/i.test(selectedDevice.type);
  const circuit:EndToEndCircuit=sameDevice?stored!:{
    slot:activeSlot,areaId,wall,receptacleId,cable:"14/2 NM-B",
    roomHot:null,roomNeutral:null,roomGround:null
  };
  const noRoute=routes.length===0;
  const checks=inspection??[];
  const passed=checks.length>0&&checks.every(c=>c.ok);
  const wires=[
    {id:"black" as const,key:"roomHot" as const,label:"BLACK / HOT",color:"#181b20",y:147},
    {id:"white" as const,key:"roomNeutral" as const,label:"WHITE / NEUTRAL",color:"#f9faf7",y:198},
    {id:"bare" as const,key:"roomGround" as const,label:"BARE COPPER / GROUND",color:"#d28a4e",y:249}
  ];
  // Rear three-quarter training view: brass on right, silver on left, green on frame.
  const terminals=[
    {id:"brass" as const,label:"BRASS / HOT",color:"#d9a349",x:467,y:136},
    {id:"silver" as const,label:"SILVER / NEUTRAL",color:"#d9e1e7",x:347,y:136},
    {id:"green" as const,label:"GREEN / GROUND",color:"#52c98a",x:359,y:279}
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
        Choose which wall device receives this circuit’s home run. Receptacles support conductor-to-screw wiring; other devices show the cable entry until their terminal models are added.
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
      <label style={{display:"block",fontSize:12,marginBottom:8}}>Home-run starting device{" "}
        <select style={{...input,maxWidth:"100%"}} value={receptacleId}
          onChange={e=>{const id=e.target.value;setChosen(id);setInspection(null);setSelectedWire(null);save({...circuit,receptacleId:id,roomHot:null,roomNeutral:null,roomGround:null});}}>
          {receptacles.length===0?<option value="">No devices on this wall</option>:
            receptacles.map(d=><option key={d.id} value={d.id}>{d.name} · {d.type} ({d.id.slice(0,8)})</option>)}
        </select>
      </label>
      {receptacleId&&<>{!supportsTerminals && <div style={{padding:10,border:"1px solid #6d7f94",borderRadius:6,marginBottom:10,fontSize:12,color:"#e8cba5"}}>Home run is assigned to <strong>{selectedDevice?.name ?? "this device"}</strong>. Its white NM-B jacket appears on the wall layout. This device type needs a dedicated terminal/splice wiring model; the receptacle screw diagram is intentionally hidden.</div>}{supportsTerminals&&<>
        <div style={{fontSize:11,color:"#aacbdc",marginBottom:6}}>
          {selectedWire?`Selected ${selectedWire.toUpperCase()}: choose a terminal screw →`:"Select or drag a conductor end to a terminal screw."}
        </div>
        <svg ref={diagramRef} viewBox="0 0 540 380" role="group" aria-label="Interactive rear view of a receptacle with white NM-B jacket and individually exposed conductors"
          onPointerMove={e=>{if(drag)setDrag({...drag,...position(e)});}}
          onPointerUp={finishDrag}
          onPointerCancel={()=>setDrag(null)}
          style={{width:"100%",height:"auto",background:"#071622",border:"1px solid #315b73",borderRadius:8,touchAction:"none",userSelect:"none"}}>
          <defs>
            <linearGradient id="boxsteel" x1="0" x2="1"><stop stopColor="#6c7884"/><stop offset="0.5" stopColor="#b0bcc5"/><stop offset="1" stopColor="#536372"/></linearGradient>
            <linearGradient id="receptacle" x1="0" x2="1"><stop stopColor="#c5c7c3"/><stop offset="0.5" stopColor="#f1f0e8"/><stop offset="1" stopColor="#9fa7a9"/></linearGradient>
          </defs>
          <rect x="8" y="8" width="524" height="364" rx="12" fill="#102a3c" stroke="#3e7795"/>
          <text x="22" y="34" fill="#a2e9ff" fontSize="16" fontWeight="bold">14/2 NM-B HOME RUN</text>
          <text x="321" y="34" fill="#a2e9ff" fontSize="14" fontWeight="bold">DEVICE BOX · REAR VIEW</text>
          {/* Metal device box and back of a duplex receptacle. */}
          <rect x="314" y="54" width="204" height="278" rx="12" fill="url(#boxsteel)" stroke="#cbd8df" strokeWidth="3"/>
          <rect x="329" y="68" width="174" height="247" rx="6" fill="#213b4c" stroke="#8eabb8" strokeWidth="2"/>
          <rect x="375" y="76" width="87" height="228" rx="12" fill="url(#receptacle)" stroke="#f7f8f3" strokeWidth="3"/>
          <rect x="391" y="104" width="56" height="75" rx="8" fill="#d6d9d5" stroke="#9ea9a9"/>
          <rect x="391" y="194" width="56" height="74" rx="8" fill="#d6d9d5" stroke="#9ea9a9"/>
          <circle cx="418" cy="187" r="7" fill="#8a9799" stroke="#ebf1f2"/>
          <rect x="365" y="82" width="9" height="216" rx="3" fill="#b5bdc1"/>
          <text x="376" y="324" fill="#d2e7f2" fontSize="10">Receptacle mounting strap</text>
          {/* White nonmetallic sheath, with individual conductors leaving its end. */}
          <path d="M 22 197 C 53 197 74 197 111 197" fill="none" stroke="#576675" strokeWidth="45" strokeLinecap="round"/>
          <path d="M 22 197 C 53 197 74 197 111 197" fill="none" stroke="#f0eee7" strokeWidth="39" strokeLinecap="round"/>
          <path d="M 22 197 C 53 197 74 197 111 197" fill="none" stroke="#d0cfc8" strokeWidth="2"/>
          <text x="20" y="158" fill="#f1f7f8" fontSize="12">WHITE NM-B JACKET</text>
          <text x="18" y="236" fill="#c5d9e2" fontSize="11">Cable enters box</text>
          {wires.map(w=>{
            const attached=circuit[w.key];
            const end=terminals.find(t=>t.id===attached);
            const startX=111, startY=197;
            const path=end
              ?`M ${startX} ${startY} C 158 ${startY} 149 ${w.y} 213 ${w.y} C 275 ${w.y} ${end.x-80} ${end.y} ${end.x} ${end.y}`
              :`M ${startX} ${startY} C 159 ${startY} 149 ${w.y} 213 ${w.y} L 255 ${w.y}`;
            return <g key={w.id}>
              <path d={path} fill="none" stroke="#07111a" strokeWidth={w.id==="bare"?9:14} strokeLinecap="round"/>
              <path d={path} fill="none" stroke={w.color} strokeWidth={w.id==="bare"?6:10} strokeLinecap="round"/>
              {w.id==="white"&&<path d={path} fill="none" stroke="#d8d9d7" strokeWidth="1"/>}
              <text x="155" y={w.y-15} fill="#e5f6ff" fontSize="11" fontWeight="bold">{w.label}</text>
              {!end&&<g onPointerDown={e=>{e.preventDefault();e.stopPropagation();diagramRef.current?.setPointerCapture(e.pointerId);setSelectedWire(w.id);setDrag({wire:w.id,...position(e)});}}
                onClick={()=>setSelectedWire(w.id)} style={{cursor:"grab"}}>
                <circle cx="255" cy={w.y} r="17" fill="#143247" stroke={selectedWire===w.id?"#39d2ff":"#d4e6ec"} strokeWidth="2"/>
                <circle cx="255" cy={w.y} r="7" fill={w.color} stroke="#698b9d"/>
              </g>}
            </g>;
          })}
          {terminals.map(t=><g key={t.id} onClick={()=>{if(selectedWire)connect(selectedWire,t.id);}} style={{cursor:"pointer"}}>
            <circle cx={t.x} cy={t.y} r="21" fill="#203646" stroke={t.color} strokeWidth="4"/>
            <circle cx={t.x} cy={t.y} r="12" fill={t.color} stroke="#46525a" strokeWidth="1"/>
            <path d={`M ${t.x-7} ${t.y} H ${t.x+7}`} stroke="#39414b" strokeWidth="3"/>
            <circle cx={t.x} cy={t.y} r="27" fill="transparent"/>
          </g>)}
          <text x="426" y="93" fill="#ffe0a2" fontSize="10">HOT →</text>
          <text x="320" y="93" fill="#eef5fa" fontSize="10">NEUTRAL</text>
          <text x="314" y="346" fill="#9ff0b9" fontSize="11">GROUND SCREW</text>
          {drag&&<>
            <path d={`M 255 ${wires.find(w=>w.id===drag.wire)?.y??198} Q 288 ${drag.y} ${drag.x} ${drag.y}`} stroke="#0a1117" strokeWidth="13" fill="none" strokeLinecap="round"/>
            <path d={`M 255 ${wires.find(w=>w.id===drag.wire)?.y??198} Q 288 ${drag.y} ${drag.x} ${drag.y}`} stroke={wires.find(w=>w.id===drag.wire)?.color??"white"} strokeWidth="8" fill="none" strokeLinecap="round"/>
            <circle cx={drag.x} cy={drag.y} r="7" fill="#7edcff"/>
          </>}
          <text x="20" y="354" fill="#b7cfdb" fontSize="11">Select wire → click screw, or drag wire end to screw</text>
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
      </>}</>}
    </>}
  </section>;
}
