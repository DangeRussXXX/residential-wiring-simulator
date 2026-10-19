import { useState } from "react";
import type { ElectricalDevice } from "../electrical/types";

export type CableKind = "14/2 NM-B"|"14/3 NM-B"|"12/2 NM-B"|"12/3 NM-B"|"14/2 MC"|"12/2 MC"|"12/3 MC";
export type CableEnd = "from"|"to";
export const PANEL_SOURCE_ID="__panel_p1__";
export type CableRecord = {
  id:string; from:string; to:string; type:CableKind;
  areaId?:string; wall?:"NORTH"|"SOUTH"|"EAST"|"WEST"; breakerSlot?:number;
  fromName?:string; toName?:string; fromSymbol?:string; toSymbol?:string;
  ends:Record<CableEnd,Record<string,string|null>>;
};
export const cableKinds:CableKind[]=["14/2 NM-B","14/3 NM-B","12/2 NM-B","12/3 NM-B","14/2 MC","12/2 MC","12/3 MC"];
export function conductors(type:CableKind) {
  return type.includes("/3")?["black","red","white","ground"]:["black","white","ground"];
}
export function deviceTerminals(device?:ElectricalDevice):{id:string;label:string;color:string}[] {
  if(!device)return [];
  const sym=device.symbol;
  if(sym==="switch-three-way")return [
    {id:"common",label:"Common (dark screw)",color:"#303438"},
    {id:"traveler-1",label:"Traveler 1 (brass)",color:"#c58c32"},
    {id:"traveler-2",label:"Traveler 2 (brass)",color:"#c58c32"},
    {id:"ground",label:"Ground (green)",color:"#3aaa76"},
    {id:"neutral-splice",label:"Neutral splice (connector)",color:"#e5e8ea"}
  ];
  if(sym==="switch-single"||sym==="dimmer")return [
    {id:"line",label:"Line (brass)",color:"#c58c32"},
    {id:"load",label:"Switched hot (brass)",color:"#c58c32"},
    {id:"ground",label:"Ground (green)",color:"#3aaa76"},
    {id:"neutral-splice",label:"Neutral splice (connector)",color:"#e5e8ea"}
  ];
  if(sym==="outlet"||sym==="gfci")return [
    {id:"brass",label:"Hot (brass)",color:"#c58c32"},
    {id:"silver",label:"Neutral (silver)",color:"#e5e8ea"},
    {id:"ground",label:"Ground (green)",color:"#3aaa76"}
  ];
  if(sym.startsWith("light")||/light/i.test(device.type))return [
    {id:"fixture-hot",label:"Fixture hot",color:"#c58c32"},
    {id:"fixture-neutral",label:"Fixture neutral",color:"#e5e8ea"},
    {id:"ground",label:"Fixture ground",color:"#3aaa76"}
  ];
  return [
    {id:"hot-splice",label:"Hot splice",color:"#c58c32"},
    {id:"neutral-splice",label:"Neutral splice",color:"#e5e8ea"},
    {id:"ground",label:"Equipment ground",color:"#3aaa76"}
  ];
}
const colors:Record<string,string>={black:"#181b22",red:"#d83e37",white:"#f8fafc",ground:"#ba7843"};
const panel:React.CSSProperties={background:"#102637",border:"1px solid #36728d",borderRadius:7,padding:10,color:"#e5f6ff",fontSize:18};
export default function CableWiringPanel({cable,devices,onChange,onRemove}:{
  cable:CableRecord;devices:ElectricalDevice[];onChange:(c:CableRecord)=>void;onRemove:()=>void;
}) {
  const [end,setEnd]=useState<CableEnd>("from");
  const [selected,setSelected]=useState<string|null>(null);
  const dev=devices.find(d=>d.id===cable[end]) ??
    (cable[end]===PANEL_SOURCE_ID ? ({id:PANEL_SOURCE_ID,name:"Panel P1",type:"Distribution Panel",symbol:"breaker-panel"} as ElectricalDevice) :
    ({id:cable[end],name:end==="from"?(cable.fromName||"Starting device"):(cable.toName||"Destination device"),
      type:end==="from"?(cable.fromName||"Device"):(cable.toName||"Device"),
      symbol:end==="from"?(cable.fromSymbol||"outlet"):(cable.toSymbol||"outlet")} as ElectricalDevice));
  const terms=cable[end]===PANEL_SOURCE_ID?[
    {id:"breaker-hot",label:"Breaker load terminal",color:"#c58c32"},
    {id:"neutral-bar",label:"Neutral bar",color:"#e5e8ea"},
    {id:"ground-bar",label:"Equipment-ground bar",color:"#3aaa76"}
  ]:deviceTerminals(dev);
  const colorsList=conductors(cable.type);
  const attached=cable.ends[end]||{};
  const choose=(terminal:string)=>{
    if(!selected)return;
    onChange({...cable,ends:{...cable.ends,[end]:{...attached,[selected]:terminal}}});
    setSelected(null);
  };
  return <section style={panel}>
    <div style={{fontWeight:700,color:"#83e5ff",marginBottom:8}}>🔌 Cable Conductor Wiring</div>
    <div style={{fontSize:16,marginBottom:8}}>{cable.type} · {cable.from===PANEL_SOURCE_ID?"Panel P1":devices.find(d=>d.id===cable.from)?.name||cable.fromName||"Device"} → {devices.find(d=>d.id===cable.to)?.name||cable.toName||"Device"}</div>
    <div style={{display:"flex",gap:6,marginBottom:8}}>
      {(["from","to"] as CableEnd[]).map(e=><button key={e} type="button" onClick={()=>{setEnd(e);setSelected(null)}} style={{flex:1,padding:7,border:"1px solid #368bab",background:end===e?"#167193":"#183d51",color:"white",borderRadius:5}}>{e==="from"?"Starting device / panel":"Destination device"}</button>)}
    </div>
    <div style={{marginBottom:7,fontWeight:700}}>{dev?.name||"Device missing"}</div>
    <svg viewBox="0 0 390 235" width="100%" aria-label="Cable conductors and device terminals" style={{background:"#0b1b28",border:"1px solid #36687c",borderRadius:6}}>
      <path d="M 0 117 H 85" stroke="#e9e7df" strokeWidth="26" strokeLinecap="round"/>
      <path d="M 0 117 H 85" stroke="#aeb8bf" strokeWidth="1" fill="none"/>
      <rect x="256" y="20" width="124" height="195" rx="12" fill="#1c4968" stroke="#86b3c8" strokeWidth="3"/>
      <rect x="270" y="35" width="96" height="160" rx="8" fill="#c5d1d4" stroke="#617987" strokeWidth="2"/>
      {colorsList.map((c,i)=>{
        const y=45+i*47, assigned=attached[c],idx=terms.findIndex(t=>t.id===assigned);
        const endY=idx>=0?44+idx*34:y;
        return <g key={c} onClick={()=>setSelected(c)} style={{cursor:"pointer"}}>
          <path d={`M 77 117 Q 120 117 133 ${y} L ${idx>=0?317:198} ${endY}`} fill="none" stroke={c==="white"?"#566a77":"#07141d"} strokeWidth="11" strokeLinecap="round"/>
          <path d={`M 77 117 Q 120 117 133 ${y} L ${idx>=0?317:198} ${endY}`} fill="none" stroke={colors[c]} strokeWidth="7" strokeLinecap="round"/>
          <circle cx={idx>=0?317:198} cy={endY} r="9" fill={colors[c]} stroke={selected===c?"#24e6ff":"#8ba9b6"} strokeWidth={selected===c?4:2}/>
          <text x="133" y={y-11} fontSize="14" fontWeight="bold" fill="#bce7f5">{c.toUpperCase()}</text>
        </g>;
      })}
      {terms.map((t,i)=><g key={t.id} onClick={()=>choose(t.id)} style={{cursor:selected?"pointer":"default"}}>
        <circle cx="317" cy={44+i*34} r="12" fill={t.color} stroke={selected?"#22d5f0":"#263f4e"} strokeWidth="3"/>
        <path d={`M 310 ${44+i*34} h14`} stroke="#37434c" strokeWidth="2"/>
        <title>{t.label}</title>
      </g>)}
    </svg>
    <div style={{fontSize:16,color:"#b9d7e5",margin:"6px 0"}}>{selected?`Selected ${selected}. Click a terminal screw or splice circle.`:"Select a loose or connected conductor, then click its terminal."}</div>
    {colorsList.map(c=><div key={c} style={{display:"flex",gap:7,alignItems:"center",padding:"4px 0"}}>
      <span style={{width:12,height:12,borderRadius:10,background:colors[c],border:"1px solid #8a9ea8"}}/>
      <span style={{flex:1}}>{c.toUpperCase()} · {terms.find(t=>t.id===attached[c])?.label||"Loose / not connected"}</span>
      <button type="button" onClick={()=>setSelected(c)} style={{padding:"3px 7px"}}>Select</button>
      <button type="button" onClick={()=>onChange({...cable,ends:{...cable.ends,[end]:{...attached,[c]:null}}})} style={{padding:"3px 7px"}}>Remove</button>
    </div>)}
    <button type="button" onClick={onRemove} style={{marginTop:8,padding:8,background:"#5d2b37",color:"#fff",border:"1px solid #a85c69",borderRadius:5}}>Remove this cable</button>
  </section>;
}
