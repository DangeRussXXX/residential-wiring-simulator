import { useState } from "react";
import type { ElectricalDevice } from "../electrical/types";

export type CableKind = "14/2 NM-B"|"14/3 NM-B"|"12/2 NM-B"|"12/3 NM-B"|"14/2 MC"|"12/2 MC"|"12/3 MC";
export type CableEnd = "from"|"to";
export const PANEL_SOURCE_ID="__panel_p1__";
export type SpliceMember = {cableId:string;end:CableEnd;conductor:string};
export type SpliceRecord = {id:string;deviceId:string;members:SpliceMember[];connector:string;pigtailTerminal?:string};
export type CableRecord = {
  id:string; from:string; to:string; type:CableKind;
  areaId?:string; wall?:"NORTH"|"SOUTH"|"EAST"|"WEST"; breakerSlot?:number;
  fromName?:string; toName?:string; fromSymbol?:string; toSymbol?:string;
  ends:Record<CableEnd,Record<string,string|null>>;
  splices?:SpliceRecord[];
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
// Coordinates are on the rear/terminal-side illustration, not the front plate.
function positions(kind:string,terminals:Terminal[]):Record<string,{x:number;y:number}>{
  const coords:Record<string,{x:number;y:number}>={};
  const maps:Record<string,Record<string,{x:number;y:number}>>={
    panel:{"breaker-hot":{x:344,y:75},"neutral-bar":{x:344,y:155},"ground-bar":{x:344,y:231}},
    outlet:{brass:{x:358,y:95},silver:{x:260,y:95},ground:{x:309,y:243}},
    gfci:{brass:{x:358,y:73},silver:{x:260,y:73},"load-hot":{x:358,y:183},"load-neutral":{x:260,y:183},ground:{x:309,y:243}},
    "switch-single":{line:{x:358,y:92},load:{x:358,y:177},ground:{x:260,y:233},"neutral-splice":{x:212,y:236}},
    dimmer:{line:{x:358,y:92},load:{x:358,y:177},ground:{x:260,y:233},"neutral-splice":{x:212,y:236}},
    "switch-three-way":{common:{x:260,y:93},"traveler-1":{x:358,y:93},"traveler-2":{x:358,y:178},ground:{x:309,y:243},"neutral-splice":{x:212,y:236}},
    light:{"fixture-hot":{x:268,y:100},"fixture-neutral":{x:351,y:100},ground:{x:309,y:230}}
  };
  terminals.forEach((t,i)=>{coords[t.id]=maps[kind]?.[t.id]??{x:310,y:70+i*40};});
  return coords;
}
function DeviceArtwork({kind,breakerSlot,front}:{kind:string;breakerSlot?:number;front:boolean}){
  const isSwitch=kind==="switch-single"||kind==="switch-three-way"||kind==="dimmer";
  if(kind==="panel")return <g>
    <rect x="245" y="22" width="137" height="241" rx="10" fill="#243b4c" stroke="#94b0c1" strokeWidth="4"/>
    <rect x="258" y="34" width="110" height="218" rx="5" fill="#b5c2c9" stroke="#627f8d" strokeWidth="2"/>
    <rect x="271" y="52" width="83" height="42" rx="4" fill="#243844" stroke="#526a78" strokeWidth="2"/>
    <text x="310" y="68" fontSize="11" textAnchor="middle" fill="#fff">BREAKER</text>
    <text x="310" y="82" fontSize="12" textAnchor="middle" fill="#fff">#{breakerSlot??1}</text>
    <rect x="272" y="137" width="80" height="31" rx="3" fill="#dbe3e8" stroke="#6d8390"/>
    <text x="310" y="150" fontSize="9" textAnchor="middle" fill="#263e4c">NEUTRAL</text>
    <text x="310" y="160" fontSize="9" textAnchor="middle" fill="#263e4c">BAR</text>
    <rect x="272" y="212" width="80" height="31" rx="3" fill="#a7d5c1" stroke="#528778"/>
    <text x="310" y="229" fontSize="10" textAnchor="middle" fill="#245448">GROUND</text>
  </g>;
  if(kind==="light")return <g>
    <circle cx="309" cy="143" r="99" fill="#667b85" stroke="#c6d4dc" strokeWidth="5"/>
    <circle cx="309" cy="143" r="80" fill={front?"#f6eed7":"#2a485a"} stroke="#b6c9d3" strokeWidth="3"/>
    {front?<circle cx="309" cy="143" r="46" fill="#f1d99d" stroke="#ad8a4a" strokeWidth="4"/>:
      <><rect x="272" y="90" width="74" height="87" rx="8" fill="#e2e4dc" stroke="#9aa7aa" strokeWidth="3"/>
      <text x="309" y="190" textAnchor="middle" fill="#e5f6ff" fontSize="11">FIXTURE BASE</text></>}
  </g>;
  return <g>
    <rect x="267" y="24" width="86" height="234" rx="13" fill="#c8d0d4" stroke="#849baa" strokeWidth="5"/>
    <rect x="278" y="36" width="64" height="209" rx="7" fill={front?"#efeee7":"#5b6972"} stroke="#a2adb3" strokeWidth="2"/>
    {front?(isSwitch?<><rect x="290" y="95" width="40" height="89" rx="5" fill="#e4e4dd" stroke="#9ca7a9"/>
      <rect x="301" y="116" width="18" height="43" rx="3" fill="#4a5358"/></>:
      [95,176].map(y=><g key={y}><path d={`M 293 ${y-12} v20 M 326 ${y-12} v20`} stroke="#38444c" strokeWidth="6" strokeLinecap="round"/><path d={`M 309 ${y+8} l-7 10 h14 z`} fill="#38444c"/></g>)):
      <><rect x="284" y="49" width="52" height="176" rx="5" fill={isSwitch?"#282f38":"#e6e5db"} stroke="#929ca1" strokeWidth="2"/>
      {isSwitch?<><rect x="298" y="86" width="25" height="103" rx="5" fill="#b2bac0" stroke="#7e8992"/>
        <rect x="306" y="118" width="9" height="32" fill="#46505a"/></>:
        <><rect x="295" y="71" width="30" height="43" rx="4" fill="#cbd1d0" stroke="#929da0"/>
          <rect x="295" y="156" width="30" height="43" rx="4" fill="#cbd1d0" stroke="#929da0"/></>}
      </>}
    <circle cx="310" cy="39" r="4" fill="#778b95"/>
    <circle cx="310" cy="242" r="4" fill="#778b95"/>
    {kind==="outlet"&&!front&&<><rect x="345" y="118" width="6" height="22" fill="#d5b36c" stroke="#886a2c"/>
      <rect x="268" y="118" width="6" height="22" fill="#d6dfe5" stroke="#6f8b9a"/></>}
    {kind==="gfci"&&!front&&<><text x="349" y="56" fontSize="9" fill="#f7d79b">LINE</text>
      <text x="349" y="167" fontSize="9" fill="#f7d79b">LOAD</text></>}
  </g>;
}
function kindFor(device:ElectricalDevice|undefined,fromPanel:boolean){
  if(fromPanel)return "panel";
  const sym=device?.symbol??"";
  if(sym==="switch-three-way"||sym==="switch-single"||sym==="dimmer"||sym==="gfci"||sym==="outlet")return sym;
  if(sym.startsWith("light")||/light/i.test(device?.name??"")||/light/i.test(device?.type??""))return "light";
  return "outlet";
}
export default function CableWiringPanel({cable,devices,onChange,onRemove,allCables,onChangeCables}:{
  cable:CableRecord;devices:ElectricalDevice[];onChange:(c:CableRecord)=>void;onRemove:()=>void;
  allCables?:CableRecord[];onChangeCables?:(cables:CableRecord[])=>void;
}) {
  const [end,setEnd]=useState<CableEnd>("from");
  const [selected,setSelected]=useState<string|null>(null);
  const [view,setView]=useState<"rear"|"front">("rear");
  const [spliceSelection,setSpliceSelection]=useState<string[]>([]);
  const [connector,setConnector]=useState("Listed twist-on connector");
  const [pigtailTerminal,setPigtailTerminal]=useState("");
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
  const boxId=cable[end];
  const available=(allCables??[cable]).flatMap(c=>(["from","to"] as CableEnd[]).flatMap(e=>c[e]===boxId?
    conductors(c.type).map(conductor=>({key:`${c.id}|${e}|${conductor}`,cableId:c.id,end:e,conductor,cable:c})):[]));
  const splices=(allCables??[cable]).flatMap(c=>c.splices??[]).filter(sp=>sp.deviceId===boxId);
  const saveAll=(next:CableRecord[])=>{
    if(onChangeCables)onChangeCables(next);
    else {const updated=next.find(c=>c.id===cable.id);if(updated)onChange(updated);}
  };
  const changeConnection=(cableId:string,side:CableEnd,conductor:string,value:string|null)=>{
    saveAll((allCables??[cable]).map(c=>c.id===cableId?{...c,ends:{...c.ends,[side]:{...c.ends[side],[conductor]:value}}}:c));
  };
  const createSplice=()=>{
    const members=available.filter(a=>spliceSelection.includes(a.key));
    if(members.length<2)return;
    if(members.some(m=>m.cable.ends[m.end]?.[m.conductor]))return;
    // Keep neutral, equipment ground, and ungrounded conductors in separate splice groups.
    const families=new Set(members.map(m=>m.conductor==="ground"?"ground":m.conductor==="white"?"neutral":"hot"));
    if(families.size!==1)return;
    const family=[...families][0];
    if(pigtailTerminal){
      const allowed=family==="ground"?["ground","ground-bar"]:family==="neutral"?["silver","neutral-bar","load-neutral","fixture-neutral"]:["line","load","common","traveler-1","traveler-2","brass","breaker-hot","load-hot","fixture-hot"];
      if(!allowed.includes(pigtailTerminal))return;
    }
    const id=`splice-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const splice:SpliceRecord={id,deviceId:boxId,connector,members:members.map(({cableId,end,conductor})=>({cableId,end,conductor})),...(pigtailTerminal?{pigtailTerminal}: {})};
    saveAll((allCables??[cable]).map(c=>{
      const entries=members.filter(m=>m.cableId===c.id);
      let next={...c,ends:{from:{...c.ends.from},to:{...c.ends.to}}};
      for(const m of entries)next.ends[m.end][m.conductor]=`splice:${id}`;
      if(c.id===cable.id)next={...next,splices:[...(c.splices??[]),splice]};
      return next;
    }));
    setSpliceSelection([]);setPigtailTerminal("");
  };
  const removeSplice=(id:string)=>{
    saveAll((allCables??[cable]).map(c=>({
      ...c,splices:(c.splices??[]).filter(sp=>sp.id!==id),
      ends:{from:Object.fromEntries(Object.entries(c.ends.from??{}).map(([k,v])=>[k,v===`splice:${id}`?null:v])),
        to:Object.fromEntries(Object.entries(c.ends.to??{}).map(([k,v])=>[k,v===`splice:${id}`?null:v]))}
    })));
  };
  const choose=(terminal:string)=>{
    if(!selected)return;
    if((attached[selected]??"").startsWith("splice:")||attached[selected]==="cap")return;
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
    <div style={{display:"flex",gap:8,marginBottom:8}}>
      <button type="button" onClick={()=>setView("rear")} aria-pressed={view==="rear"}
        style={{flex:1,padding:9,background:view==="rear"?"#167193":"#183d51",color:"white",border:"1px solid #368bab",borderRadius:5}}>Rear · Terminals</button>
      <button type="button" onClick={()=>setView("front")} aria-pressed={view==="front"}
        style={{flex:1,padding:9,background:view==="front"?"#167193":"#183d51",color:"white",border:"1px solid #368bab",borderRadius:5}}>Front · Identify</button>
    </div>
    <svg viewBox="0 0 390 280" width="100%" aria-label={`Interactive ${dev.name} wiring terminals`} style={{background:"#0b1b28",border:"1px solid #36687c",borderRadius:6}}>
      <path d="M 0 124 H 80" stroke={fromPanel?"#181b20":"#e9e7df"} strokeWidth="26" strokeLinecap="round"/>
      <path d="M 0 124 H 80" stroke="#9caeb9" strokeWidth="1"/>
      <DeviceArtwork kind={kind} breakerSlot={cable.breakerSlot} front={view==="front"}/>
      {view==="rear"&&colorsList.map((c,i)=>{
        const y=45+i*(colorsList.length===4?48:65),assigned=attached[c];
        const t=assigned?points[assigned]:undefined;
        const isCapped=assigned==="cap";
        const splice=assigned?.startsWith("splice:")?splices.find(sp=>`splice:${sp.id}`===assigned):undefined;
        const targetX=t?.x??201,targetY=t?.y??y;
        return <g key={c} onClick={()=>setSelected(c)} style={{cursor:"pointer"}}>
          <path d={`M 76 124 Q 115 124 132 ${y} L ${targetX} ${targetY}`} fill="none" stroke={c==="white"?"#61737d":"#06131d"} strokeWidth="11" strokeLinecap="round"/>
          <path d={`M 76 124 Q 115 124 132 ${y} L ${targetX} ${targetY}`} fill="none" stroke={colors[c]} strokeWidth="7" strokeLinecap="round"/>
          <circle cx={targetX} cy={targetY} r="7" fill={colors[c]} stroke={selected===c?"#24e6ff":"#7895a4"} strokeWidth={selected===c?4:2}/>
          {isCapped&&<path d={`M ${targetX-4} ${targetY-12} L ${targetX+9} ${targetY-12} L ${targetX+12} ${targetY+4} L ${targetX-7} ${targetY+4} Z`} fill="#e49a35" stroke="#f8d59c" strokeWidth="2"/>}
          {splice&&<path d={`M ${targetX-5} ${targetY-12} L ${targetX+8} ${targetY-12} L ${targetX+12} ${targetY+4} L ${targetX-8} ${targetY+4} Z`} fill="#e49a35" stroke="#f8d59c" strokeWidth="2"/>}
          <text x="120" y={Math.max(14,y-11)} fontSize="12" fontWeight="bold" fill="#bce7f5">{c.toUpperCase()}</text>
        </g>;
      })}
      {view==="rear"&&terms.map(t=>{const pt=points[t.id];if(!pt)return null;const isSplice=t.id.includes("splice");const ground=t.id==="ground"||t.id==="ground-bar";return <g key={t.id} onClick={()=>choose(t.id)} style={{cursor:"pointer"}}>
        <circle cx={pt.x} cy={pt.y} r="20" fill="none" stroke={selected?"#16e4fa":"#4c7286"} strokeWidth={selected?3:1} strokeDasharray={selected?"4 3":undefined}/>

        {isSplice?<rect x={pt.x-14} y={pt.y-10} width="28" height="20" rx="6" fill="#edbd5a" stroke="#5e4c2d" strokeWidth="3"/>:<circle cx={pt.x} cy={pt.y} r="13" fill={t.color} stroke="#324855" strokeWidth="3"/>}
        <path d={`M ${pt.x-7} ${pt.y} h14`} stroke="#354653" strokeWidth="3"/>
        {!isSplice&&<path d={`M ${pt.x} ${pt.y-7} v14`} stroke="#354653" strokeWidth="2"/>}
        <title>{t.label} — click to terminate selected conductor</title>
      </g>;})}
    </svg>
    <div style={{fontSize:15,color:"#b9d7e5",margin:"8px 0"}}>{view==="front"?"Front view is for identifying the device. Select Rear · Terminals to connect wires.":selected?`Selected ${selected.toUpperCase()} — click the actual screw or splice in the diagram.`:"Select a conductor, then click the matching terminal or splice."}</div>
    {view==="rear"&&<div style={{fontSize:13,color:"#a8cfe0",marginBottom:6}}>Terminal screws and splice connectors are clickable. Brass = hot, silver = neutral, green = ground; a dark screw identifies the 3-way common.</div>}
    {terms.map(t=><div key={t.id} style={{fontSize:14,color:"#a7c9da",margin:"2px 0"}}>• {t.label}</div>)}
    {colorsList.map(c=><div key={c} style={{display:"flex",gap:7,alignItems:"center",padding:"5px 0"}}>
      <span style={{width:12,height:12,borderRadius:10,background:colors[c],border:"1px solid #8a9ea8"}}/>
      <span style={{flex:1,fontSize:15}}>{c.toUpperCase()} · {attached[c]==="cap"?"Capped individually":attached[c]?.startsWith("splice:")?"Wire-nut splice":terms.find(t=>t.id===attached[c])?.label||"Loose"}</span>
      <button type="button" onClick={()=>setSelected(c)} style={{padding:"5px 7px"}}>Select</button>
      <button type="button" onClick={()=>{const value=attached[c];if(value?.startsWith("splice:"))removeSplice(value.slice(7));else changeConnection(cable.id,end,c,null);}} style={{padding:"5px 7px"}}>Remove</button>
      <button type="button" disabled={Boolean(attached[c])} onClick={()=>changeConnection(cable.id,end,c,"cap")} style={{padding:"5px 7px"}}>Cap</button>
    </div>)}
    {!fromPanel&&<div style={{marginTop:14,padding:10,border:"1px solid #38667b",borderRadius:6}}>
      <strong style={{color:"#83e5ff"}}>Wire Nuts, Splices & Pigtails</strong>
      <p style={{fontSize:14,margin:"6px 0"}}>Select loose conductors from cables entering this same box. Each wire nut joins only the selected conductor ends.</p>
      <div style={{maxHeight:190,overflowY:"auto"}}>{available.map(a=>{
        const val=a.cable.ends[a.end]?.[a.conductor];
        return <label key={a.key} style={{display:"flex",gap:8,alignItems:"center",fontSize:15,margin:"5px 0",opacity:val?0.55:1}}>
          <input type="checkbox" disabled={Boolean(val)} checked={spliceSelection.includes(a.key)} onChange={e=>setSpliceSelection(prev=>e.target.checked?[...prev,a.key]:prev.filter(k=>k!==a.key))}/>
          <span style={{display:"inline-block",width:12,height:12,borderRadius:8,background:colors[a.conductor]}}/>
          {a.conductor.toUpperCase()} · {a.cable.type} · {a.end==="from"?"Start":"End"} {val?`(${val==="cap"?"capped":"connected"})`:""}
        </label>;
      })}</div>
      <label style={{display:"block",fontSize:14,marginTop:8}}>Connector type
        <select value={connector} onChange={e=>setConnector(e.target.value)} style={{display:"block",width:"100%",padding:7,background:"#173d50",color:"white"}}>
          <option>Listed twist-on connector</option><option>Listed lever connector</option>
        </select>
      </label>
      <label style={{display:"block",fontSize:14,marginTop:8}}>Optional pigtail destination
        <select value={pigtailTerminal} onChange={e=>setPigtailTerminal(e.target.value)} style={{display:"block",width:"100%",padding:7,background:"#173d50",color:"white"}}>
          <option value="">No pigtail</option>{terms.filter(t=>!t.id.includes("splice")).map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </label>
      <button type="button" disabled={spliceSelection.length<2} onClick={createSplice} style={{marginTop:8,padding:9,background:"#155c7c",color:"white",border:"1px solid #4b9fbc",borderRadius:5}}>Join selected conductors</button>
      {splices.map(sp=><div key={sp.id} style={{padding:"8px 0",borderBottom:"1px solid #35566a",fontSize:14}}>
        🟠 {sp.connector} · {sp.members.length} conductors{sp.pigtailTerminal?` · Pigtail to ${terms.find(t=>t.id===sp.pigtailTerminal)?.label??sp.pigtailTerminal}`:""}
        <button type="button" onClick={()=>removeSplice(sp.id)} style={{marginLeft:8,padding:5}}>Remove splice</button>
      </div>)}
      <p style={{fontSize:13,color:"#b7cbd5"}}>Training model: connector suitability, box fill, conductor preparation, and bonding must be checked against the actual connector/device listing. Pigtails here represent a splice-to-terminal link, not an added physical conductor in the wall view.</p>
    </div>}
    <button type="button" onClick={onRemove} style={{marginTop:8,padding:8,background:"#5d2b37",color:"#fff",border:"1px solid #a85c69",borderRadius:5}}>Remove this cable</button>
  </section>;
}
