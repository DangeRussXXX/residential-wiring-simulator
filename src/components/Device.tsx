import { useState } from "react";
import type { ElectricalDevice } from "../electrical/types";
import type { CableRecord } from "../simulator/CableWiringPanel";

type Props = {
  device: ElectricalDevice;
  wireMode: boolean;
  selectedTerminal: string | null;
  selected: boolean;
  onSelect: (id: string) => void;
  onTerminalClick: (deviceId: string, terminalId: string) => void;
  onStartDrag: (id: string) => void;
  onCableStart: (id: string) => void;
  onCableDestination: (id: string) => void;
  cableSource: boolean;
  wiringCables?: CableRecord[];
};

/** Visual-only equipment drawings. Electrical behavior remains in the simulation engine. */
function ReceptacleFace({ gfci = false }: { gfci?: boolean }) {
  return <svg viewBox="0 0 82 116" width="82" height="116" aria-label={gfci ? "GFCI receptacle" : "Duplex receptacle"}>
    <rect x="6" y="2" width="70" height="112" rx="8" fill="#d0d2d4" stroke="#6e7479" strokeWidth="2"/>
    <rect x="15" y="7" width="52" height="102" rx="8" fill="#f4f1e9" stroke="#b4b4b0" strokeWidth="1.8"/>
    {[33,80].map(y => <g key={y}>
      <rect x="28" y={y-11} width="5" height="15" rx="1.4" fill="#37383a"/>
      <rect x="48" y={y-11} width="5" height="15" rx="1.4" fill="#37383a"/>
      <path d={`M38 ${y+9} q3 -5 6 0 l-1 5 h-4z`} fill="#3e4144"/>
    </g>)}
    {gfci && <g><rect x="34" y="48" width="15" height="7" rx="2" fill="#b33d32"/><rect x="34" y="57" width="15" height="7" rx="2" fill="#3e4144"/><text x="41" y="47" fontSize="5" textAnchor="middle" fill="#353535">TEST / RESET</text></g>}
    <circle cx="41" cy="10" r="2.2" fill="#a7a9a9" stroke="#7b7b7b"/>
    <circle cx="41" cy="105" r="2.2" fill="#a7a9a9" stroke="#7b7b7b"/>
  </svg>;
}

function SwitchFace() {
  return <svg viewBox="0 0 82 116" width="82" height="116" aria-label="Single pole switch">
    <rect x="6" y="2" width="70" height="112" rx="7" fill="#d0d2d4" stroke="#6e7479" strokeWidth="2"/>
    <rect x="15" y="7" width="52" height="102" rx="7" fill="#f4f1e9" stroke="#b4b4b0" strokeWidth="1.8"/>
    <rect x="34" y="35" width="14" height="47" rx="3" fill="#d3d1ca" stroke="#8e8c85"/>
    <path d="M36 43 L46 38 L46 68 L36 73 Z" fill="#fefdf9" stroke="#a5a49d"/>
    <circle cx="41" cy="11" r="2.3" fill="#a7a9a9"/><circle cx="41" cy="105" r="2.3" fill="#a7a9a9"/>
  </svg>;
}

function BoxFace({ title, large = false }: { title: string; large?: boolean }) {
  return <svg viewBox="0 0 118 122" width="118" height="122" aria-label={title}>
    <rect x="6" y="8" width="106" height="106" rx="8" fill="#15559a" stroke="#0d335c" strokeWidth="5"/>
    <rect x="15" y="17" width="88" height="88" rx="5" fill="#194776" stroke="#76a9d6" strokeWidth="2"/>
    <rect x="20" y="21" width="78" height="78" rx="3" fill="#254e7a" stroke="#112f50"/>
    <path d="M9 30 H22 M96 30 H109 M9 91 H22 M96 91 H109" stroke="#b7c8d7" strokeWidth="4"/>
    {large ? <g>{Array.from({length: 8}, (_,i)=><rect key={i} x={26+(i%2)*37} y={30+Math.floor(i/2)*17} width="28" height="10" rx="2" fill="#292e33" stroke="#7b848d"/>)}</g> : <g><rect x="44" y="33" width="30" height="48" rx="4" fill="#d8d6d0" stroke="#8a8c8e"/><rect x="50" y="40" width="18" height="35" rx="2" fill="#3d4146"/></g>}
    <text x="59" y="97" fontSize="8" textAnchor="middle" fill="#f2f6ff">{title}</text>
  </svg>;
}

function DeviceFace({ device }: { device: ElectricalDevice }) {
  switch(device.symbol) {
    case "outlet": return <ReceptacleFace/>;
    case "gfci": return <ReceptacleFace gfci/>;
    case "switch-single": case "switch-three-way": case "dimmer": return <SwitchFace/>;
    case "breaker-panel": case "sub-panel": return <BoxFace title={device.mainBreaker ? `${device.mainBreaker}A PANEL` : "PANEL"} large/>;
    case "water-heater": return <svg viewBox="0 0 100 128" width="100" height="128" aria-label="Water heater"><rect x="22" y="6" width="56" height="114" rx="17" fill="#e7e8e7" stroke="#858c93" strokeWidth="3"/><ellipse cx="50" cy="14" rx="28" ry="9" fill="#f8f9f8" stroke="#858c93"/><rect x="29" y="48" width="42" height="30" rx="3" fill="#d8e2e6" stroke="#8597a2"/><text x="50" y="60" textAnchor="middle" fontSize="8" fill="#324f5c">WATER</text><text x="50" y="70" textAnchor="middle" fontSize="8" fill="#324f5c">HEATER</text><rect x="36" y="116" width="9" height="9" fill="#888"/><rect x="56" y="116" width="9" height="9" fill="#888"/></svg>;
    case "range": return <svg viewBox="0 0 110 116" width="110" height="116" aria-label="Electric range"><rect x="8" y="9" width="94" height="101" rx="6" fill="#c8cdd0" stroke="#70787e" strokeWidth="3"/><rect x="14" y="15" width="82" height="44" fill="#303940" rx="4"/>{[[36,29],[74,29],[36,48],[74,48]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="10" fill="none" stroke="#9aadb4" strokeWidth="2"/><circle cx={x} cy={y} r="5" fill="none" stroke="#9aadb4" strokeWidth="1"/></g>)}<rect x="19" y="67" width="72" height="34" rx="3" fill="#303b44" stroke="#8196a3"/><rect x="42" y="62" width="26" height="3" fill="#78868e"/></svg>;
    case "fan": return <svg viewBox="0 0 110 110" width="110" height="110" aria-label="Ventilation fan"><rect x="5" y="5" width="100" height="100" rx="8" fill="#d6dadd" stroke="#8b979e" strokeWidth="4"/><circle cx="55" cy="55" r="38" fill="#495965"/>{[0,90,180,270].map(a=><path key={a} d="M55 55 Q33 22 55 17 Q81 18 55 55" fill="#b9c7cd" transform={`rotate(${a} 55 55)`}/>)}<circle cx="55" cy="55" r="9" fill="#7f919b"/></svg>;
    case "hvac": return <svg viewBox="0 0 120 112" width="120" height="112" aria-label="HVAC unit"><rect x="5" y="9" width="110" height="95" rx="7" fill="#c4cbd0" stroke="#75838b" strokeWidth="4"/><circle cx="60" cy="55" r="39" fill="#55646d" stroke="#84949c" strokeWidth="4"/>{[0,72,144,216,288].map(a=><path key={a} d="M60 55 Q35 21 63 19 Q78 36 60 55" fill="#c2d1d7" transform={`rotate(${a} 60 55)`}/>)}<circle cx="60" cy="55" r="8" fill="#71818b"/></svg>;
    case "light-ceiling": case "light-recessed": return <svg viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="42" fill="#e6e7e5" stroke="#6c7075" strokeWidth="5"/><circle cx="50" cy="50" r="30" fill="#fff7d6" stroke="#b4a57b"/><circle cx="50" cy="50" r="8" fill="#d7c68b"/></svg>;
    default: return <BoxFace title={device.name.slice(0,14)}/>;
  }
}


/** Integrated open box: all conductors and connectors are drawn INSIDE the same device. */
/** Readable expanded wiring editor visualization. Each conductor is drawn only to its
 * saved terminal; unassigned ends stop loose, caps stay isolated, and splices
 * remain distinct from direct device terminations. */
function ExpandedDeviceWiring({device,cables,width=500}:{device:ElectricalDevice;cables:CableRecord[];width?:number}) {
  const isGfci=device.symbol==="gfci";
  const isSwitch=["switch-single","switch-three-way","dimmer"].includes(device.symbol);
  const isLight=device.symbol.startsWith("light");
  const terminals=isGfci?[
    {id:"line-hot",name:"LINE HOT",x:414,y:107,color:"#d9a247"},
    {id:"line-neutral",name:"LINE NEUTRAL",x:342,y:107,color:"#d2dce3"},
    {id:"load-hot",name:"LOAD HOT",x:414,y:197,color:"#d9a247"},
    {id:"load-neutral",name:"LOAD NEUTRAL",x:342,y:197,color:"#d2dce3"},
    {id:"ground",name:"GROUND",x:378,y:287,color:"#3bb887"}
  ]:isSwitch?[
    {id:"line",name:"LINE / COMMON",x:414,y:108,color:"#d9a247"},
    {id:"load",name:"LOAD",x:414,y:199,color:"#d9a247"},
    {id:"traveler-1",name:"TRAVELER 1",x:342,y:108,color:"#d9a247"},
    {id:"traveler-2",name:"TRAVELER 2",x:342,y:199,color:"#d9a247"},
    {id:"ground",name:"GROUND",x:378,y:287,color:"#3bb887"}
  ]:isLight?[
    {id:"hot",name:"FIXTURE HOT",x:414,y:133,color:"#d9a247"},
    {id:"neutral",name:"FIXTURE NEUTRAL",x:342,y:133,color:"#d2dce3"},
    {id:"ground",name:"GROUND",x:378,y:287,color:"#3bb887"}
  ]:[
    {id:"hot",name:"HOT / BRASS",x:414,y:133,color:"#d9a247"},
    {id:"neutral",name:"NEUTRAL / SILVER",x:342,y:133,color:"#d2dce3"},
    {id:"ground",name:"GROUND",x:378,y:287,color:"#3bb887"}
  ];
  const resolve=(value:string)=>{
    const v=value.toLowerCase();
    return terminals.find(t=>t.id===v)||terminals.find(t=>v.includes(t.id))||
      terminals.find(t=>v.includes("ground")?t.id==="ground":v.includes("neutral")?t.id.includes("neutral"):v.includes("hot")||v.includes("brass")?t.id.includes("hot")||t.id==="line":false);
  };
  const colors:Record<string,string>={black:"#101820",white:"#ffffff",ground:"#bb783e",red:"#df4343"};
  const entries=cables.flatMap((c,ci)=>{
    const side=c.from===device.id?"from":"to";
    const conductors=c.type.includes("/3")?["black","red","white","ground"]:["black","white","ground"];
    return conductors.map((color,i)=>({c,side,color,terminal:c.ends?.[side]?.[color]??null,ci,i}));
  });
  const splices=cables.flatMap(c=>c.splices??[]).filter((sp,i,all)=>sp.deviceId===device.id&&all.findIndex(other=>other.id===sp.id)===i);
  return <svg viewBox="0 0 500 345" width={width} height={Math.round(width*345/500)} role="img" aria-label={`Expanded wiring for ${device.name}; saved connections only`} style={{display:"block",maxWidth:"100%"}}>
    <rect x="4" y="5" width="492" height="334" rx="13" fill="#dce4e6" stroke="#577788" strokeWidth="4"/>
    <rect x="14" y="15" width="472" height="314" rx="8" fill="#f1f2ec" stroke="#9bb0b9" strokeWidth="2"/>
    <rect x="312" y="53" width="142" height="253" rx="15" fill="#b4c2c9" stroke="#627f8e" strokeWidth="5"/>
    <rect x="329" y="68" width="108" height="222" rx="10" fill="#faf8f1" stroke="#8d9fa6" strokeWidth="3"/>
    {isSwitch?<g><rect x="367" y="148" width="22" height="60" rx="4" fill="#83949c"/><rect x="372" y="157" width="12" height="40" rx="2" fill="#f8f8f0"/></g>:
      isLight?<circle cx="383" cy="174" r="39" fill="#fff2c8" stroke="#b6a982" strokeWidth="3"/>:
      <g>{[113,215].map(y=><g key={y}><rect x="357" y={y} width="9" height="29" rx="2" fill="#384b53"/><rect x="401" y={y} width="9" height="29" rx="2" fill="#384b53"/></g>)}{isGfci&&<g><rect x="372" y="163" width="25" height="13" rx="3" fill="#bb493e"/><rect x="372" y="180" width="25" height="13" rx="3" fill="#454f56"/></g>}</g>}
    <text x="250" y="322" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#234557">{cables.length} cable(s) · saved connections only</text>
    {terminals.map(t=><g key={t.id}>
      <circle cx={t.x} cy={t.y} r="12" fill={t.color} stroke="#405b68" strokeWidth="3"/>
      <path d={`M ${t.x-5} ${t.y} H ${t.x+5}`} stroke="#3a4e56" strokeWidth="3"/>
      <title>{t.name}</title>
    </g>)}
    {cables.slice(0,4).map((c,i)=>{
      const x=188+(i-(Math.min(cables.length,4)-1)/2)*38;
      return <g key={c.id}>
        <path d={`M ${x} -4 V 57`} stroke="#37444c" strokeWidth="23"/>
        <path d={`M ${x} -4 V 57`} stroke={c.type.includes("MC")?"#a8b5bd":"#eeeae0"} strokeWidth="17"/>
        <rect x={x-13} y="49" width="26" height="11" rx="3" fill="#879ba5" stroke="#476573" strokeWidth="2"/>
        <title>{c.type} · {c.fromName??"Panel"} → {c.toName??device.name}</title>
      </g>;
    })}
    {entries.map(({c,color,terminal,ci,i})=>{
      if(ci>=4)return null;
      const sx=188+(ci-(Math.min(cables.length,4)-1)/2)*38,sy=59;
      const isSplice=!!terminal?.startsWith("splice:");
      const t=terminal&&!isSplice&&terminal!=="cap"?resolve(terminal):undefined;
      const ex=t?.x??(105+ci*24+i*22),ey=t?.y??(terminal==="cap"?128+i*35:185+i*31);
      const path=`M ${sx} ${sy} C ${sx} ${sy+40} ${ex-36} ${ey-37} ${ex} ${ey}`;
      return <g key={`${c.id}-${color}`}>
        {!isSplice&&<g>
          <path d={path} stroke={color==="white"?"#667e8a":"#9ab0ba"} strokeWidth="11" fill="none" strokeLinecap="round"/>
          <path d={path} stroke={colors[color]} strokeWidth="7" fill="none" strokeLinecap="round"/>
          {!t&&terminal!=="cap"&&<g><circle cx={ex} cy={ey} r="5" fill={colors[color]} stroke="#546e7a" strokeWidth="2"/><circle cx={ex} cy={ey} r="2" fill="#dcae6b"/><title>Unconnected loose conductor</title></g>}
          {terminal==="cap"&&<g transform={`translate(${ex} ${ey-10})`}><path d="M -10 10 L -9 -5 Q 0 -21 9 -5 L 10 10 Z" fill="#f2a13a" stroke="#a96a26" strokeWidth="2"/><path d="M -7 0 H 7 M -7 5 H 7" stroke="#b66b26" strokeWidth="2"/></g>}
        </g>}
        <title>{color.toUpperCase()} · {c.fromName??"Panel"} → {c.toName??device.name} · {terminal??"Loose"}</title>
      </g>;
    })}
    {splices.slice(0,4).map((sp,i)=>{
      const x=55+i*57,y=125+i%2*37;
      const t=sp.pigtailTerminal?resolve(sp.pigtailTerminal):undefined;
      return <g key={sp.id}>
        {sp.members.map((m,j)=>{
          const ci=cables.findIndex(c=>c.id===m.cableId);
          if(ci<0||ci>=4)return null;
          const sx=188+(ci-(Math.min(cables.length,4)-1)/2)*38;
          const ex=x-9+j*6;
          return <g key={`${m.cableId}-${m.conductor}-${j}`}>
            <path d={`M ${sx} 59 C ${sx-20} 100 ${ex} ${y+31} ${ex} ${y+10}`} stroke="#8ca2ac" strokeWidth="10" fill="none"/>
            <path d={`M ${sx} 59 C ${sx-20} 100 ${ex} ${y+31} ${ex} ${y+10}`} stroke={colors[m.conductor]??"#111820"} strokeWidth="6" fill="none"/>
          </g>;
        })}
        {t&&<g><path d={`M ${x+9} ${y+10} C ${x+48} ${y+62} ${t.x-45} ${t.y-45} ${t.x} ${t.y}`} stroke="#91a5ae" strokeWidth="10" fill="none"/><path d={`M ${x+9} ${y+10} C ${x+48} ${y+62} ${t.x-45} ${t.y-45} ${t.x} ${t.y}`} stroke={colors[sp.members[0]?.conductor??"black"]} strokeWidth="6" fill="none"/></g>}
        <path d={`M ${x-12} ${y+10} L ${x-10} ${y-7} Q ${x} ${y-25} ${x+10} ${y-7} L ${x+12} ${y+10} Z`} fill="#f2a33b" stroke="#ac6c29" strokeWidth="2"/>
        <path d={`M ${x-8} ${y-2} H ${x+8} M ${x-8} ${y+4} H ${x+8}`} stroke="#b56b24" strokeWidth="2"/>
        <title>{sp.members.length}-wire splice {sp.pigtailTerminal?`pigtail to ${sp.pigtailTerminal}`:""}</title>
      </g>;
    })}
  </svg>;
}

/** Compact wall symbol: accurate cable presence without pretending loose wires are
 * connected to device screws. The expanded view owns the full termination map. */
function CompactWiredDevice({device,cables}:{device:ElectricalDevice;cables:CableRecord[]}) {
  const shown=cables.slice(0,3);
  const colors:Record<string,string>={black:"#111c24",white:"#fffdf2",red:"#d23e46",ground:"#bd7942"};
  return <svg viewBox="0 0 150 126" width="150" height="126" role="img" aria-label={`${device.name}, ${cables.length} cables; expand for terminal wiring`}>
    <rect x="9" y="20" width="132" height="101" rx="7" fill="#c5d1d5" stroke="#577789" strokeWidth="2.5"/>
    <rect x="15" y="26" width="120" height="89" rx="5" fill="#e8edeb" stroke="#9baeb7"/>
    {shown.map((c,i)=>{
      const x=31+i*20;
      const wireColors=c.type.includes("/3")?["black","red","white","ground"]:["black","white","ground"];
      return <g key={c.id}>
        <path d={`M ${x} 0 V 43`} stroke="#4e626b" strokeWidth="12"/>
        <path d={`M ${x} 0 V 43`} stroke={c.type.includes("MC")?"#b4bec3":"#f1e9d9"} strokeWidth="8"/>
        <rect x={x-7} y="17" width="14" height="8" rx="2" fill="#8298a3" stroke="#456273"/>
        {wireColors.map((color,j)=>{
          const dx=(j-(wireColors.length-1)/2)*8;
          const ex=x+dx*2;
          return <g key={color}>
            <path d={`M ${x} 43 Q ${x+dx} 54 ${ex} 65`} fill="none" stroke="#657b86" strokeWidth="4.5" strokeLinecap="round"/>
            <path d={`M ${x} 43 Q ${x+dx} 54 ${ex} 65`} fill="none" stroke={colors[color]} strokeWidth="2.7" strokeLinecap="round"/>
          </g>;
        })}
      </g>;
    })}
    <g transform="translate(82 28) scale(.68)">
      <rect x="0" y="0" width="72" height="114" rx="9" fill="#aebfc8" stroke="#658392" strokeWidth="3"/>
      <rect x="9" y="8" width="54" height="98" rx="7" fill="#f7f6ee" stroke="#96a9af" strokeWidth="2"/>
      {device.symbol.startsWith("light") ? <circle cx="36" cy="55" r="22" fill="#fff0c4" stroke="#b9aa81" strokeWidth="2"/> :
       device.symbol.includes("switch") || device.symbol==="dimmer" ? <rect x="30" y="34" width="12" height="42" rx="3" fill="#e0e0da" stroke="#8196a0" strokeWidth="2"/> :
       <g>{[31,69].map(y=><g key={y}><rect x="23" y={y} width="6" height="16" rx="1" fill="#34434b"/><rect x="43" y={y} width="6" height="16" rx="1" fill="#34434b"/></g>)}</g>}
    </g>
    {cables.length>3&&<text x="22" y="109" fontSize="10" fill="#25495b">+{cables.length-3} cables</text>}
  </svg>;
}

export default function Device({ device, wireMode, selectedTerminal, selected, onSelect, onTerminalClick, onStartDrag, onCableStart, onCableDestination, cableSource, wiringCables=[] }: Props) {
  void selectedTerminal; void onTerminalClick;
  const [expanded,setExpanded]=useState(false);
  const showWiredBox=wiringCables.length>0;
  // Keep the wall footprint fixed. The detailed wiring is available on demand,
  // without moving the device or obscuring neighboring boxes.
  const wallWidth = expanded && showWiredBox ? 540 : 150;
  const wallHeight = expanded && showWiredBox ? 430 : 150;
  const isExpanded=expanded&&showWiredBox;

  const wallMounted = ["outlet", "gfci", "switch-single", "switch-three-way", "dimmer"].includes(device.symbol);
  return <div className="device-component" title={`${device.name} — ${device.type}. Select to inspect or install.`} onMouseDown={e => { e.stopPropagation(); onSelect(device.id); if (wireMode) onCableDestination(device.id); else if(!expanded) onStartDrag(device.id); }}
    style={{position:"absolute",left:device.x-(wallWidth-150)/2,top:device.y-(wallHeight-150)/2,width:wallWidth,height:wallHeight,boxSizing:"border-box",border:selected?"2px solid #00c9f3":"2px solid transparent",borderRadius:8,boxShadow:isExpanded?"0 14px 36px #0009, 0 0 0 3px #00c9f3":"none",background:isExpanded?"#c9d0d1":"transparent",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:wireMode?"crosshair":"grab",userSelect:"none",zIndex:isExpanded?45:10}}>
    {!showWiredBox&&wallMounted && <div title="Electrical device box" style={{position:"absolute",top:10,left:18,width:114,height:120,background:"#174e87",border:"4px solid #12375c",borderRadius:9,boxShadow:"inset 0 0 0 3px #4680ad, 2px 4px 7px #0005"}}/>}
    <div style={{position:"relative",zIndex:1,transform:"none",filter:"drop-shadow(1px 3px 2px #0005)",pointerEvents:"none"}}>
      {isExpanded ? <ExpandedDeviceWiring device={device} cables={wiringCables} width={500}/> :
        showWiredBox ? <CompactWiredDevice device={device} cables={wiringCables}/> : <DeviceFace device={device}/>}
    </div>
    {showWiredBox&&<button type="button" title={isExpanded?"Collapse wiring view":"Expand wiring on wall"} onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();setExpanded(v=>!v);onSelect(device.id);}} style={{position:"absolute",top:2,right:2,zIndex:50,background:"#13516c",color:"#fff",border:"2px solid #7edcf0",borderRadius:5,padding:"4px 8px",fontSize:isExpanded?16:12,cursor:"pointer"}}>{isExpanded?"− Close":"⤢"}</button>}
    {isExpanded&&<div style={{position:"absolute",bottom:5,left:12,right:12,textAlign:"center",fontSize:13,color:"#183c4c",fontWeight:700,pointerEvents:"none"}}>Only saved connections shown · Click − Close to return to wall</div>}
    <div style={{position:"absolute",top:isExpanded?wallHeight-27:130,left:isExpanded?8:-8,width:isExpanded?wallWidth-16:166,textAlign:"center",fontSize:12,fontWeight:700,color:"#17212c",textShadow:"0 1px #ffffff",pointerEvents:"none"}}>{device.name}</div>
    <button type="button" aria-label={`Start cable from ${device.name}`} title="Wire Tool: select cable source"
      onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();if(wireMode && !cableSource) onCableStart(device.id); else if(wireMode) onCableDestination(device.id); else onCableStart(device.id)}}
      style={{position:"absolute",left:-9,top:isExpanded?Math.round(wallHeight/2):61,width:20,height:20,padding:0,borderRadius:"50%",
        border:"2px solid #173b4d",background:cableSource?"#00e6ff":"#a2a8ad",
        boxShadow:cableSource?"0 0 0 4px #00e6ff55":"none",zIndex:30,cursor:"crosshair"}}/>
  </div>;
}
