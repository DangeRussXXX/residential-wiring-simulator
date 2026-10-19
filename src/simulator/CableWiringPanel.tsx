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
export function conductors(type:CableKind) {return type.includes("/3")?["black","red","white","ground"]:["black","white","ground"];}
type Terminal={id:string;label:string;color:string};
export function deviceTerminals(device?:ElectricalDevice):Terminal[] {
  if(!device)return [];
  const sym=device.symbol;
  if(sym==="switch-three-way")return [
    {id:"common",label:"Common · dark screw",color:"#3b414a"},
    {id:"traveler-1",label:"Traveler 1 · brass",color:"#d7a34b"},
    {id:"traveler-2",label:"Traveler 2 · brass",color:"#d7a34b"},
    {id:"ground",label:"Ground · green screw",color:"#33b477"},
    {id:"neutral-splice",label:"Neutral splice · connector",color:"#e7ecf0"}
  ];
  if(sym==="switch-single"||sym==="dimmer")return [
    {id:"line",label:"Line · brass screw",color:"#d7a34b"},
    {id:"load",label:"Switched hot · brass screw",color:"#d7a34b"},
    {id:"ground",label:"Ground · green screw",color:"#33b477"},
    {id:"neutral-splice",label:"Neutral splice · connector",color:"#e7ecf0"}
  ];
  if(sym==="gfci")return [
    {id:"brass",label:"LINE hot · brass",color:"#d7a34b"},
    {id:"silver",label:"LINE neutral · silver",color:"#e7ecf0"},
    {id:"ground",label:"Ground · green",color:"#33b477"},
    {id:"load-hot",label:"LOAD hot · brass",color:"#d7a34b"},
    {id:"load-neutral",label:"LOAD neutral · silver",color:"#e7ecf0"}
  ];
  if(sym==="outlet")return [
    {id:"brass",label:"Hot · brass screw",color:"#d7a34b"},
    {id:"silver",label:"Neutral · silver screw",color:"#e7ecf0"},
    {id:"ground",label:"Ground · green screw",color:"#33b477"}
  ];
  if(sym.startsWith("light")||/light/i.test(device.type))return [
    {id:"fixture-hot",label:"Fixture hot lead",color:"#d7a34b"},
    {id:"fixture-neutral",label:"Fixture neutral lead",color:"#e7ecf0"},
    {id:"ground",label:"Fixture ground",color:"#33b477"}
  ];
  return [{id:"hot-splice",label:"Hot splice",color:"#d7a34b"},{id:"neutral-splice",label:"Neutral splice",color:"#e7ecf0"},{id:"ground",label:"Equipment ground",color:"#33b477"}];
}
const colors:Record<string,string>={black:"#141820",red:"#d83e37",white:"#f9fbff",ground:"#bc7946"};
const panelStyle:React.CSSProperties={background:"#102637",border:"1px solid #36728d",borderRadius:7,padding:10,color:"#e5f6ff",fontSize:18};
function positions(kind:string,terminals:Terminal[]):Record<string,{x:number;y:number}>{
  const coords:Record<string,{x:number;y:number}>={};
  if(kind==="panel"){
    const a=[[315,64],[315,127],[315,193]];
    terminals.forEach((t,i)=>coords[t.id]={x:a[i]?.[0]??315,y:a[i]?.[1]??193});
  }else if(kind==="switch-three-way"){
    Object.assign(coords,{common:{x:299,y:65},"traveler-1":{x:350,y:94},"traveler-2":{x:350,y:155},ground:{x:299,y:204},"neutral-splice":{x:249,y:208}});
  }else if(kind==="switch-single"||kind==="dimmer"){
    Object.assign(coords,{line:{x:350,y:76},load:{x:350,y:151},ground:{x:300,y:204},"neutral-splice":{x:249,y:205}});
  }else if(kind==="gfci"){
    Object.assign(coords,{brass:{x:352,y:59},silver:{x:285,y:59},ground:{x:316,y:203},"load-hot":{x:352,y:170},"load-neutral":{x:285,y:170}});
  }else if(kind==="outlet"){
    Object.assign(coords,{brass:{x:350,y:73},silver:{x:283,y:73},ground:{x:317,y:205}});
  }else if(kind==="light"){
    Object.assign(coords,{"fixture-hot":{x:290,y:84},"fixture-neutral":{x:340,y:84},ground:{x:316,y:194}});
  }else terminals.forEach((t,i)=>coords[t.id]={x:315,y:60+i*60});
  return coords;
}
function DeviceArtwork({kind,breakerSlot}:{kind:string;breakerSlot?:number}){
  if(kind==="panel")return <g>
    <rect x="240" y="15" width="142" height="214" rx="10" fill="#293e4d" stroke="#9aaeba" strokeWidth="4"/>
    <rect x="250" y="28" width="121" height="188" rx="4" fill="#b1c0c6" stroke="#687e8b" strokeWidth="2"/>
    <rect x="260" y="40" width="95" height="44" rx="5" fill="#1c2c37" stroke="#596e7b" strokeWidth="2"/>
    <rect x="267" y="46" width="58" height="29" rx="3" fill="#334a57"/>
    <rect x="325" y="46" width="24" height="29" rx="3" fill="#657e8a"/>
    <text x="288" y="63" textAnchor="middle" fontSize="11" fill="#fff">{`#${breakerSlot??1}`}</text>
    <text x="315" y="97" textAnchor="middle" fontSize="11" fill="#122c3c">BREAKER</text>
    <rect x="260" y="114" width="95" height="28" rx="4" fill="#d4dadd" stroke="#687f89"/>
    <text x="307" y="132" fontSize="11" textAnchor="middle" fill="#263943">NEUTRAL BAR</text>
    <rect x="260" y="181" width="95" height="26" rx="4" fill="#bcdbd4" stroke="#678f86"/>
    <text x="305" y="197" fontSize="11" textAnchor="middle" fill="#24453d">GROUND BAR</text>
  </g>;
  if(kind==="light")return <g>
    <circle cx="316" cy="122" r="82" fill="#697b82" stroke="#d1d9dd" strokeWidth="5"/>
    <circle cx="316" cy="122" r="66" fill="#f5f0d9" stroke="#bdc7c9" strokeWidth="3"/>
    <circle cx="316" cy="122" r="37" fill="#e7d6a8" stroke="#bd9e65" strokeWidth="3"/>
    <path d="M 302 121 Q 316 96 330 121 Q 317 146 302 121" fill="none" stroke="#c39048" strokeWidth="4"/>
    <rect x="295" y="177" width="42" height="26" rx="5" fill="#65767d" stroke="#c8d3d5"/>
  </g>;
  const isSwitch=kind==="switch-single"||kind==="switch-three-way"||kind==="dimmer";
  return <g>
    <rect x="268" y="20" width="97" height="199" rx="13" fill="#d8dddf" stroke="#8ea3ae" strokeWidth="5"/>
    <rect x="282" y="32" width="70" height="175" rx="7" fill="#f2f1e9" stroke="#b0b5b3" strokeWidth="2"/>
    {isSwitch?<>
      <rect x="296" y="68" width="42" height="104" rx="5" fill="#c6c8c3" stroke="#919d9c" strokeWidth="2"/>
      <rect x="310" y="94" width="15" height="50" rx="3" fill="#4a5358" stroke="#7a858a"/>
      <rect x="310" y="91" width="15" height="22" rx="3" fill="#e5e4dc"/>
    </>:<>
      {[75,148].map(y=><g key={y}><path d={`M 302 ${y-9} v16 M 330 ${y-9} v16`} stroke="#3c474c" strokeWidth="6" strokeLinecap="round"/><path d={`M 316 ${y+9} l-6 8 h12 z`} fill="#48575e"/></g>)}
      {kind==="gfci"&&<><rect x="304" y="104" width="28" height="24" rx="3" fill="#b6bdbd" stroke="#8a989a"/><text x="318" y="119" textAnchor="middle" fontSize="9" fill="#26353b">TEST</text></>}
    </>}
    <circle cx="316" cy="31" r="4" fill="#929b9c"/>
    <circle cx="316" cy="209" r="4" fill="#929b9c"/>
  </g>;
}
function kindFor(device:ElectricalDevice|undefined,fromPanel:boolean){
  if(fromPanel)return "panel";
  const sym=device?.symbol??"";
  if(sym==="switch-three-way"||sym==="switch-single"||sym==="dimmer"||sym==="gfci"||sym==="outlet")return sym;
  if(sym.startsWith("light")||/light/i.test(device?.name??"")||/light/i.test(device?.type??""))return "light";
  return "outlet";
}
export default function CableWiringPanel({cable,devices,onChange,onRemove}:{
  cable:CableRecord;devices:ElectricalDevice[];onChange:(c:CableRecord)=>void;onRemove:()=>void;
}) {
  const [end,setEnd]=useState<CableEnd>("from");
  const [selected,setSelected]=useState<string|null>(null);
  const fromPanel=cable[end]===PANEL_SOURCE_ID;
  const dev=devices.find(d=>d.id===cable[end])??(fromPanel?
    ({id:PANEL_SOURCE_ID,name:"Panel P1",type:"Distribution Panel",symbol:"breaker-panel"} as ElectricalDevice):
    ({id:cable[end],name:end==="from"?(cable.fromName||"Starting device"):(cable.toName||"Destination device"),type:end==="from"?(cable.fromName||"Device"):(cable.toName||"Device"),symbol:end==="from"?(cable.fromSymbol||"outlet"):(cable.toSymbol||"outlet")} as ElectricalDevice));
  const kind=kindFor(dev,fromPanel);
  const terms=fromPanel?[
    {id:"breaker-hot",label:`Breaker #${cable.breakerSlot??1} · load terminal`,color:"#d7a34b"},
    {id:"neutral-bar",label:"Neutral bar",color:"#e7ecf0"},
    {id:"ground-bar",label:"Equipment-ground bar",color:"#33b477"}
  ]:deviceTerminals(dev);
  const points=positions(kind,terms);
  const colorsList=conductors(cable.type);
  const attached=cable.ends[end]||{};
  const choose=(terminal:string)=>{
    if(!selected)return;
    const ground=selected==="ground", groundTerminal=terminal==="ground"||terminal==="ground-bar";
    if(ground!==groundTerminal)return;
    if(selected==="white"&&["line","load","common","traveler-1","traveler-2","brass","breaker-hot","load-hot","fixture-hot","hot-splice"].includes(terminal))return;
    if(selected!=="white"&&["neutral-bar","silver","load-neutral","fixture-neutral","neutral-splice"].includes(terminal))return;
    onChange({...cable,ends:{...cable.ends,[end]:{...attached,[selected]:terminal}}});
    setSelected(null);
  };
  return <section style={panelStyle}>
    <div style={{fontWeight:700,color:"#83e5ff",marginBottom:8}}>🔌 Device Wiring · Actual Terminal Layout</div>
    <div style={{fontSize:16,marginBottom:8}}>{cable.type} · {cable.from===PANEL_SOURCE_ID?"Panel P1":devices.find(d=>d.id===cable.from)?.name||cable.fromName||"Device"} → {devices.find(d=>d.id===cable.to)?.name||cable.toName||"Device"}</div>
    <div style={{display:"flex",gap:6,marginBottom:8}}>
      {(["from","to"] as CableEnd[]).map(e=><button key={e} type="button" onClick={()=>{setEnd(e);setSelected(null)}} style={{flex:1,padding:7,border:"1px solid #368bab",background:end===e?"#167193":"#183d51",color:"white",borderRadius:5}}>{e==="from"?"Panel / starting device":"Destination device"}</button>)}
    </div>
    <div style={{marginBottom:7,fontWeight:700}}>{dev.name} · {kind==="panel"?`Breaker #${cable.breakerSlot??1}`:kind.replaceAll("-"," ")}</div>
    <svg viewBox="0 0 390 245" width="100%" aria-label={`Interactive ${dev.name} wiring terminals`} style={{background:"#0b1b28",border:"1px solid #36687c",borderRadius:6}}>
      <path d="M 0 124 H 80" stroke={fromPanel?"#181b20":"#e9e7df"} strokeWidth="26" strokeLinecap="round"/>
      <path d="M 0 124 H 80" stroke="#9caeb9" strokeWidth="1"/>
      <DeviceArtwork kind={kind} breakerSlot={cable.breakerSlot}/>
      {colorsList.map((c,i)=>{
        const y=45+i*(colorsList.length===4?48:65),assigned=attached[c];
        const t=assigned?points[assigned]:undefined;
        const targetX=t?.x??201,targetY=t?.y??y;
        return <g key={c} onClick={()=>setSelected(c)} style={{cursor:"pointer"}}>
          <path d={`M 76 124 Q 115 124 132 ${y} L ${targetX} ${targetY}`} fill="none" stroke={c==="white"?"#61737d":"#06131d"} strokeWidth="11" strokeLinecap="round"/>
          <path d={`M 76 124 Q 115 124 132 ${y} L ${targetX} ${targetY}`} fill="none" stroke={colors[c]} strokeWidth="7" strokeLinecap="round"/>
          <circle cx={targetX} cy={targetY} r="7" fill={colors[c]} stroke={selected===c?"#24e6ff":"#7895a4"} strokeWidth={selected===c?4:2}/>
          <text x="120" y={Math.max(14,y-11)} fontSize="12" fontWeight="bold" fill="#bce7f5">{c.toUpperCase()}</text>
        </g>;
      })}
      {terms.map(t=>{const pt=points[t.id];if(!pt)return null;const isSplice=t.id.includes("splice");return <g key={t.id} onClick={()=>choose(t.id)} style={{cursor:selected?"pointer":"default"}}>
        {isSplice?<rect x={pt.x-14} y={pt.y-10} width="28" height="20" rx="6" fill="#edbd5a" stroke="#5e4c2d" strokeWidth="3"/>:<circle cx={pt.x} cy={pt.y} r="13" fill={t.color} stroke="#324855" strokeWidth="3"/>}
        <path d={`M ${pt.x-7} ${pt.y} h14`} stroke="#354653" strokeWidth="3"/>
        <title>{t.label}</title>
      </g>;})}
    </svg>
    <div style={{fontSize:15,color:"#b9d7e5",margin:"8px 0"}}>{selected?`Selected ${selected.toUpperCase()} — click the actual screw or splice in the diagram.`:"Select a conductor, then click the matching terminal or splice."}</div>
    {terms.map(t=><div key={t.id} style={{fontSize:14,color:"#a7c9da",margin:"2px 0"}}>• {t.label}</div>)}
    {colorsList.map(c=><div key={c} style={{display:"flex",gap:7,alignItems:"center",padding:"5px 0"}}>
      <span style={{width:12,height:12,borderRadius:10,background:colors[c],border:"1px solid #8a9ea8"}}/>
      <span style={{flex:1,fontSize:15}}>{c.toUpperCase()} · {terms.find(t=>t.id===attached[c])?.label||"Loose"}</span>
      <button type="button" onClick={()=>setSelected(c)} style={{padding:"5px 7px"}}>Select</button>
      <button type="button" onClick={()=>onChange({...cable,ends:{...cable.ends,[end]:{...attached,[c]:null}}})} style={{padding:"5px 7px"}}>Remove</button>
    </div>)}
    <button type="button" onClick={onRemove} style={{marginTop:8,padding:8,background:"#5d2b37",color:"#fff",border:"1px solid #a85c69",borderRadius:5}}>Remove this cable</button>
  </section>;
}
