import { useState } from "react";
import type { PanelWire, ServiceProject } from "./projectWorkflow";

type Cable = PanelWire["cable"];
type Mode = "wire" | "inspect";
const btn:React.CSSProperties={background:"#17465e",color:"#e5f7ff",border:"1px solid #4c93b0",borderRadius:6,padding:"7px 10px",cursor:"pointer"};
const colors:Record<PanelWire["conductor"],string>={black:"#161a1d",red:"#e24a4a",white:"#f5f5ed",bare:"#c48b52"};
const names:Record<PanelWire["conductor"],string>={black:"Black (hot)",red:"Red (hot)",white:"White (neutral)",bare:"Bare (equipment ground)"};
export default function BreakerWiringPopup({project,slot,mode,onChange,onClose}:{project:ServiceProject;slot:number;mode:Mode;onChange:(next:ServiceProject)=>void;onClose:()=>void}){
  const [position,setPosition]=useState({x:0,y:0});
  const [drag,setDrag]=useState<{x:number;y:number;left:number;top:number}|null>(null);
  const [result,setResult]=useState<string[]>([]);
  const breaker=project.distributionPanel?.breakers.find(s=>s.slot===slot)?.breaker;
  const all=project.panelWires??[];
  const wires=all.filter(w=>w.slot===slot);
  const [cable,setCable]=useState<Cable>(wires[0]?.cable??"14/2 NM-B");
  const update=(next:PanelWire[])=>{onChange({...project,panelWires:next});setResult([]);};
  const replace=()=>{const kinds:PanelWire["conductor"][]=cable.includes("/3")?["black","red","white","bare"]:["black","white","bare"];
    update([...all.filter(w=>w.slot!==slot),...kinds.map(conductor=>({id:`${slot}-${conductor}`,slot,cable,conductor,terminal:null}))]);};
  const inspect=()=>{
    const issues:string[]=[];
    if(!breaker)issues.push("No installed breaker.");
    if(!wires.length)issues.push("No training cable created.");
    for(const w of wires){
      if(!w.terminal){issues.push(`${names[w.conductor]} is disconnected.`);continue;}
      const ok=w.conductor==="white"?w.terminal.startsWith("neutral-"):w.conductor==="bare"?w.terminal.startsWith("ground-"):w.terminal===`breaker-${slot}-hot-${w.conductor==="black"?"a":"b"}`;
      if(!ok)issues.push(`${names[w.conductor]}: incorrect terminal (${w.terminal}).`);
      if(all.some(other=>other.id!==w.id&&other.terminal===w.terminal))issues.push(`Terminal ${w.terminal} is shared by another conductor.`);
    }
    if(breaker?.poles===1&&wires.some(w=>w.conductor==="red"))issues.push("Red conductor in single-pole training exercise: unused conductor handling is not modeled.");
    if(breaker?.poles===2&&!wires.some(w=>w.conductor==="red"))issues.push("Two-pole training exercise needs a second hot conductor.");
    if(breaker?.status!=="ON")issues.push(`Breaker is ${breaker?.status??"missing"}.`);
    if(!project.service.mainDisconnectClosed)issues.push("Upstream service disconnect is open.");
    if(project.distributionMain?.installed&&!project.distributionMain.closed)issues.push("Distribution main is open.");
    setResult(issues.length?issues:["PASS: Saved virtual terminations meet the exercise rules. Not a real electrical continuity or safety test."]);
  };
  const terminalOptions=(wire:PanelWire)=>{
    const items=[{value:"",label:"Disconnected"},...Array.from({length:Math.ceil((project.distributionPanel?.breakers.length??24)/2)},(_,i)=>({value:`neutral-${i+1}`,label:`Neutral bar · N${i+1}`})),...Array.from({length:Math.ceil((project.distributionPanel?.breakers.length??24)/2)},(_,i)=>({value:`ground-${i+1}`,label:`Ground bar · G${i+1}`})),{value:`breaker-${slot}-hot-a`,label:`Breaker #${slot} · load A`},...(breaker?.poles===2?[{value:`breaker-${slot}-hot-b`,label:`Breaker #${slot} · load B`}]:[])];
    return <select aria-label={`Terminal for ${names[wire.conductor]}`} value={wire.terminal??""} onChange={e=>{const target=e.target.value||null;if(target&&all.some(w=>w.id!==wire.id&&w.terminal===target)){setResult([`Terminal ${target} is already occupied.`]);return;}update(all.map(w=>w.id===wire.id?{...w,terminal:target}:w));}} style={{...btn,background:"#0b1d29",flex:"1 1 220px",minWidth:0}}>{items.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select>;
  };
  return <div role="presentation" style={{position:"fixed",inset:0,zIndex:60,background:"#0008",display:"flex",alignItems:"center",justifyContent:"center",padding:14}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section role="dialog" aria-modal="true" aria-label={`Breaker ${slot} ${mode==="wire"?"wiring":"troubleshooting"}`} style={{width:"min(610px,95vw)",maxHeight:"85vh",overflowY:"auto",transform:`translate(${position.x}px,${position.y}px)`,background:"#102434",border:"2px solid #50b9df",borderRadius:12,boxShadow:"0 20px 70px #000b",color:"#e8f7ff"}}>
      <header onMouseDown={e=>{if((e.target as HTMLElement).closest("button"))return;setDrag({x:e.clientX,y:e.clientY,left:position.x,top:position.y});}} onMouseMove={e=>{if(drag&&e.buttons===1)setPosition({x:drag.left+e.clientX-drag.x,y:drag.top+e.clientY-drag.y});}} onMouseUp={()=>setDrag(null)} onMouseLeave={()=>setDrag(null)} style={{padding:14,display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",background:"#183a50",cursor:"move"}}>
        <strong>⚡ Breaker #{slot} — {mode==="wire"?"Wire / Edit":"Troubleshoot"}</strong><button style={btn} onClick={onClose} aria-label="Close wiring popup">✕</button>
      </header>
      <div style={{padding:16}}>
        <p style={{fontSize:12,color:"#b7d0dd",marginTop:0}}>Training-only, de-energized virtual panel. Changes immediately update the main realistic panel. Drag the title bar to move this popup.</p>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:12}}><label>Cable <select value={cable} onChange={e=>setCable(e.target.value as Cable)} style={btn}>{["14/2 NM-B","12/2 NM-B","14/3 NM-B","12/3 NM-B"].map(v=><option key={v}>{v}</option>)}</select></label><button style={btn} onClick={replace}>{wires.length?"Replace cable (resets terminals)":"Create cable"}</button></div>
        {wires.length? wires.map(w=><div key={w.id} style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",border:"1px solid #355f75",borderRadius:7,padding:9,marginBottom:7}}><span style={{width:12,height:20,background:colors[w.conductor],border:"1px solid #b8c8cf",borderRadius:4}}/><strong style={{minWidth:140}}>{names[w.conductor]}</strong>{terminalOptions(w)}</div>):<p style={{color:"#ffd79e"}}>Create a cable to begin wiring.</p>}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}><button style={btn} onClick={inspect}>Inspect / Troubleshoot</button><button style={btn} onClick={()=>update(all.map(w=>w.slot===slot?{...w,terminal:null}:w))}>Disconnect conductors</button></div>
        {result.length>0&&<div role="status" style={{marginTop:12,padding:10,border:"1px solid #557b90",borderRadius:7}}>{result.map((line,i)=><p key={i} style={{color:line.startsWith("PASS")?"#9bf4b9":"#ffbc9c",fontSize:13,margin:"5px 0"}}>{line.startsWith("PASS")?"✓ ":"⚠ "}{line}</p>)}</div>}
        <p style={{fontSize:11,color:"#9ab9ca"}}>Logical training inspection only. Does not verify equipment listing, wire routing clearances, voltage, torque, or NEC compliance.</p>
      </div>
    </section>
  </div>;
}
