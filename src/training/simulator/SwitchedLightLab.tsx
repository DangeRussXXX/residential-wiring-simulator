import { useState } from "react";
import type { ElectricalDevice } from "../electrical/types";
import type { ServiceProject } from "./projectWorkflow";

type Wall = "NORTH" | "SOUTH" | "EAST" | "WEST";
type Terminal = "line" | "load" | "ground" | "neutral" | "hot" | "none";
export type SwitchLightConnection = {
  slot: number; areaId: string; wall: Wall; switchId: string; lightId: string;
  panelHot: Terminal; panelNeutral: Terminal; panelGround: Terminal;
  lightHot: Terminal; lightNeutral: Terminal; lightGround: Terminal;
  neutralSplice: boolean; groundSplice: boolean; switchClosed: boolean;
};
type Props = { project: ServiceProject; onChange: (next: ServiceProject) => void; areaId: string; wall: Wall; devices: ElectricalDevice[] };
const field: React.CSSProperties = { background:"#0d2635", color:"#e3f8ff", border:"1px solid #407d97", borderRadius:5, padding:"7px", maxWidth:"100%" };
const button: React.CSSProperties = {...field, cursor:"pointer",background:"#17516d",fontWeight:700};
const card: React.CSSProperties = {border:"1px solid #345d73",padding:10,borderRadius:8,margin:"8px 0"};
const colors: Record<string,string> = {black:"#24272b",white:"#f0f1e7",bare:"#c78b4d"};
function matches(w: {conductor:string;terminal:string|null}[], c:string, test:(t:string)=>boolean) {
  return w.some(x=>x.conductor===c && x.terminal!==null && test(x.terminal));
}
export default function SwitchedLightLab({project,onChange,areaId,wall,devices}:Props) {
  const routes=(project.circuitAssignments??[]).flatMap(a=>(a.destinations??[]).filter(d=>d.areaId===areaId&&d.wall===wall).map(d=>({slot:a.slot,cable:d.cable})));
  const [slot,setSlot]=useState<number>(routes[0]?.slot??1);
  const actualSlot=routes.some(r=>r.slot===slot)?slot:routes[0]?.slot??slot;
  const switches=devices.filter(d=>d.type==="Switch"||d.symbol==="switch-single");
  const lights=devices.filter(d=>d.type==="Light");
  const previous=(project.switchedLightCircuits??[]).find(c=>c.slot===actualSlot&&c.areaId===areaId&&c.wall===wall);
  const [switchChoice,setSwitchChoice]=useState("");
  const [lightChoice,setLightChoice]=useState("");
  const switchId=switches.some(d=>d.id===(previous?.switchId??switchChoice))?(previous?.switchId??switchChoice):switches[0]?.id??"";
  const lightId=lights.some(d=>d.id===(previous?.lightId??lightChoice))?(previous?.lightId??lightChoice):lights[0]?.id??"";
  const c:SwitchLightConnection=previous??{slot:actualSlot,areaId,wall,switchId,lightId,panelHot:"none",panelNeutral:"none",panelGround:"none",lightHot:"none",lightNeutral:"none",lightGround:"none",neutralSplice:false,groundSplice:false,switchClosed:false};
  const [tested,setTested]=useState(false);
  const [expanded,setExpanded]=useState(true);
  function save(next:SwitchLightConnection) {
    onChange({...project,switchedLightCircuits:[...(project.switchedLightCircuits??[]).filter(x=>!(x.slot===next.slot&&x.areaId===next.areaId&&x.wall===next.wall)),next]});
    setTested(false);
  }
  const wires=(project.panelWires??[]).filter(w=>w.slot===actualSlot);
  const breaker=project.distributionPanel?.breakers.find(s=>s.slot===actualSlot)?.breaker;
  const checks=[
    {label:"15A single-pole breaker installed",ok:!!breaker&&breaker.amperage===15&&breaker.poles===1},
    {label:"14/2 NM-B route assigned to this wall",ok:routes.some(r=>r.slot===actualSlot&&r.cable==="14/2 NM-B")},
    {label:"Panel black wire terminated at selected breaker",ok:matches(wires,"black",t=>t===`breaker-${actualSlot}-hot-a`)},
    {label:"Panel white wire terminated at neutral bar",ok:matches(wires,"white",t=>t.startsWith("neutral-"))},
    {label:"Panel bare wire terminated at ground bar",ok:matches(wires,"bare",t=>t.startsWith("ground-"))},
    {label:"Single-pole switch exists on this wall",ok:!!switchId},
    {label:"Light fixture exists on this wall",ok:!!lightId},
    {label:"Panel black → switch LINE",ok:c.panelHot==="line"},
    {label:"Switch LOAD → light HOT",ok:c.lightHot==="hot"},
    {label:"Neutral spliced through switch box → light NEUTRAL",ok:c.neutralSplice&&c.panelNeutral==="neutral"&&c.lightNeutral==="neutral"},
    {label:"Grounds spliced and bonded to switch and light",ok:c.groundSplice&&c.panelGround==="ground"&&c.lightGround==="ground"},
    {label:"Service disconnect and panel main closed",ok:project.service.mainDisconnectClosed&&(!project.distributionMain?.installed||project.distributionMain.closed)}
  ];
  const valid=checks.every(x=>x.ok);
  const energized=valid&&c.switchClosed;
  function choice(label:string,key:keyof SwitchLightConnection,opts:readonly string[]) {
    return <label style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:7,fontSize:13}}>{label}
      <select style={field} value={String(c[key])} onChange={e=>save({...c,[key]:e.target.value})}>{opts.map(v=><option key={v} value={v}>{v==="none"?"Not connected":v.toUpperCase()}</option>)}</select>
    </label>;
  }
  return <section style={{border:"1px solid #2b87ac",borderRadius:10,background:"#0e1c28",color:"#e1f4fc",padding:12,margin:"12px 0"}}>
    <button style={{...button,width:"100%",textAlign:"left"}} onClick={()=>setExpanded(!expanded)}>⚡ Switch-to-Light Wiring & Circuit Test {expanded?"▾":"▸"}</button>
    {expanded&&<>
      <p style={{fontSize:12,color:"#afc8d5"}}>Virtual practice: select an existing switch and light, terminate conductors, then test the modeled circuit. Device selections use the real wall workspace.</p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <label>Assigned breaker <select style={field} value={actualSlot} onChange={e=>{setSlot(Number(e.target.value));setTested(false);}}>{routes.length?routes.map(r=><option key={r.slot} value={r.slot}>#{r.slot} — {r.cable}</option>):<option value={actualSlot}>No route assigned</option>}</select></label>
        <label>Switch <select style={field} value={switchId} onChange={e=>{setSwitchChoice(e.target.value);save({...c,switchId:e.target.value});}}>{switches.length?switches.map(d=><option key={d.id} value={d.id}>{d.name} · {d.id.slice(0,6)}</option>):<option value="">Place a single-pole switch first</option>}</select></label>
        <label>Light <select style={field} value={lightId} onChange={e=>{setLightChoice(e.target.value);save({...c,lightId:e.target.value});}}>{lights.length?lights.map(d=><option key={d.id} value={d.id}>{d.name} · {d.id.slice(0,6)}</option>):<option value="">Place a ceiling light first</option>}</select></label>
      </div>
      <div style={card}>
        <strong>Interactive training circuit</strong>
        <svg viewBox="0 0 680 140" style={{width:"100%",height:"auto",marginTop:8}} aria-label="Panel to switch to light wiring diagram">
          <rect x="10" y="22" width="150" height="92" rx="8" fill="#153447" stroke="#59b4d9"/>
          <rect x="265" y="22" width="150" height="92" rx="8" fill="#153447" stroke="#59b4d9"/>
          <rect x="520" y="22" width="150" height="92" rx="8" fill={energized?"#655424":"#153447"} stroke={energized?"#ffe17c":"#59b4d9"}/>
          <text x="85" y="51" textAnchor="middle" fill="white" fontSize="15">PANEL #{actualSlot}</text>
          <text x="85" y="78" textAnchor="middle" fill="#b3d7e7" fontSize="12">15A · 120V</text>
          <text x="340" y="51" textAnchor="middle" fill="white" fontSize="15">SINGLE-POLE</text>
          <text x="340" y="78" textAnchor="middle" fill={c.switchClosed?"#a0f1a8":"#ffcd8c"} fontSize="13">{c.switchClosed?"CLOSED / ON":"OPEN / OFF"}</text>
          <text x="595" y="51" textAnchor="middle" fill="white" fontSize="15">LIGHT</text>
          <text x="595" y="78" textAnchor="middle" fill={energized?"#ffe17c":"#b3d7e7"} fontSize="13">{energized?"ILLUMINATED":"OFF"}</text>
          <path d="M160 40 H265 M415 40 H520" stroke={colors.black} strokeWidth="7" fill="none"/>
          <path d="M160 40 H265 M415 40 H520" stroke={energized?"#ffc454":"#83929b"} strokeWidth="2" fill="none" strokeDasharray={valid?"none":"7 5"}/>
          <path d="M160 92 H232 V124 H482 V92 H520" stroke={colors.white} strokeWidth="4" fill="none" strokeDasharray={c.neutralSplice?"none":"7 5"}/>
          <path d="M160 106 H222 V133 H492 V106 H520" stroke={colors.bare} strokeWidth="3" fill="none" strokeDasharray={c.groundSplice?"none":"7 5"}/>
        </svg>
        <button style={button} onClick={()=>save({...c,switchClosed:!c.switchClosed})}>Flip Switch → {c.switchClosed?"OFF":"ON"}</button>
        <span style={{marginLeft:12,color:energized?"#a3ffb1":"#e2c99a"}}>{energized?"● LIGHT ON":c.switchClosed&&!valid?"● CIRCUIT INCOMPLETE":"○ LIGHT OFF"}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
        <div style={card}><strong>14/2 cable: Panel → Switch box</strong><p style={{fontSize:12}}>Use the existing breaker popup to terminate panel conductors. Here, terminate their room ends.</p>
          {choice("Black (hot) →", "panelHot", ["none","line","load","ground"])}
          {choice("White (neutral) →", "panelNeutral", ["none","neutral","line","ground"])}
          {choice("Bare (ground) →", "panelGround", ["none","ground","line","neutral"])}
        </div>
        <div style={card}><strong>14/2 cable: Switch box → Light</strong><p style={{fontSize:12}}>The switch load terminal feeds the light's hot. Neutral and ground are spliced through the box.</p>
          {choice("Black switch leg →", "lightHot", ["none","hot","neutral","ground"])}
          {choice("White →", "lightNeutral", ["none","neutral","hot","ground"])}
          {choice("Bare →", "lightGround", ["none","ground","hot","neutral"])}
          <label style={{display:"block",marginTop:10}}><input type="checkbox" checked={c.neutralSplice} onChange={e=>save({...c,neutralSplice:e.target.checked})}/> Neutral splice through switch box</label>
          <label style={{display:"block",marginTop:8}}><input type="checkbox" checked={c.groundSplice} onChange={e=>save({...c,groundSplice:e.target.checked})}/> Ground splice and device bonds</label>
        </div>
      </div>
      <button style={button} onClick={()=>setTested(true)}>TEST PANEL → SWITCH → LIGHT</button>
      {tested&&<div style={card}><strong style={{color:valid?"#a4f3b1":"#ffbaab"}}>{valid?"PASS — Modeled connections complete":"FAULT / INCOMPLETE — Inspect connections"}</strong>
        {checks.map((x,i)=><div key={i} style={{fontSize:12,marginTop:5,color:x.ok?"#9cdeb4":"#ffad9e"}}>{x.ok?"✓":"✕"} {x.label}</div>)}
        <p style={{fontSize:12,color:"#adc7d5"}}>{valid?(c.switchClosed?"Idealized test: light receives nominal 120V.":"Circuit connected; switch open, light OFF."):"No energized voltage result until all checks pass."} This is a logical training model, not an electrical network solver or a real multimeter measurement. Actual power depends on proper circuit protection, approved equipment and wiring methods.</p>
      </div>}
    </>}
  </section>;
}
