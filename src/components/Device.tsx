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


/** First-pass simple wiring: one 14/2 cable, one standard receptacle, no splice.
 * All endpoints come from the saved cable end. No connection is invented. */
function SimpleReceptacleWiring({device,cable}:{device:ElectricalDevice;cable:CableRecord}) {
  const side=cable.from===device.id?"from":"to";
  const assignments=cable.ends?.[side]??{};
  const endpoints=[
    {wire:"black",x:120,y:52,color:"#111820",label:"HOT · brass"},
    {wire:"white",x:31,y:52,color:"#ffffff",label:"NEUTRAL · silver"},
    {wire:"ground",x:77,y:102,color:"#b97943",label:"GROUND · green"}
  ];
  const isAttached=(wire:string)=>{
    const terminal=String(assignments[wire]??"").toLowerCase();
    if(!terminal||terminal==="cap"||terminal.startsWith("splice:"))return false;
    if(wire==="ground")return terminal.includes("ground");
    if(wire==="white")return terminal.includes("neutral")||terminal.includes("silver");
    return terminal.includes("hot")||terminal.includes("brass")||terminal==="line";
  };
  return <svg viewBox="0 0 150 122" width="150" height="122" role="img" aria-label={`${device.name}: one cable enters at top, conductors visible to saved receptacle terminals`}>
    <rect x="3" y="3" width="144" height="116" rx="10" fill="#aebbc2" stroke="#4d6877" strokeWidth="3"/>
    <rect x="10" y="10" width="130" height="102" rx="6" fill="#dce4e5" stroke="#78909a" strokeWidth="1.5"/>
    <rect x="61" y="13" width="28" height="13" rx="3" fill="#697e87" stroke="#3c5968" strokeWidth="2"/>
    <path d="M 75 -2 V 23" stroke="#111820" strokeWidth="13"/>
    <path d="M 75 -2 V 23" stroke="#c8c9c5" strokeWidth="9"/>
    <rect x="48" y="35" width="54" height="70" rx="8" fill="#f2f1e9" stroke="#7f949e" strokeWidth="2.5"/>
    <rect x="62" y="48" width="5" height="13" rx="1" fill="#343e44"/>
    <rect x="84" y="48" width="5" height="13" rx="1" fill="#343e44"/>
    <path d="M 70 66 L 80 66 L 75 60 Z" fill="#343e44"/>
    <rect x="62" y="76" width="5" height="13" rx="1" fill="#343e44"/>
    <rect x="84" y="76" width="5" height="13" rx="1" fill="#343e44"/>
    <path d="M 70 95 L 80 95 L 75 89 Z" fill="#343e44"/>
    {endpoints.map(({wire,x,y,color,label})=>{
      const attached=isAttached(wire);
      const capped=assignments[wire]==="cap";
      const endX=attached?x:wire==="black"?109:wire==="white"?40:95;
      const endY=attached?y:wire==="ground"?94:40;
      const d=`M 75 23 C ${wire==="black"?116:wire==="white"?33:76} 40 ${endX} ${endY-16} ${endX} ${endY}`;
      return <g key={wire}>
        <path d={d} fill="none" stroke={wire==="white"?"#627a87":"#637d89"} strokeWidth="7" strokeLinecap="round"/>
        <path d={d} fill="none" stroke={color} strokeWidth="4.7" strokeLinecap="round"/>
        {capped&&<g transform={`translate(${endX} ${endY-7})`}><path d="M -6 5 L -6 -4 Q 0 -15 6 -4 L 6 5 Z" fill="#efa135" stroke="#a8641d" strokeWidth="1.5"/><path d="M -4 -1 H 4 M -4 2 H 4" stroke="#b46c25" strokeWidth="1"/></g>}
        <title>{wire.toUpperCase()} — {attached?`connected to ${label}`:capped?"individually capped":"loose / not terminated"}</title>
      </g>;
    })}
    {endpoints.map(({wire,x,y,label})=><g key={`terminal-${wire}`}>
      <circle cx={x} cy={y} r="6.5" fill={wire==="black"?"#c99942":wire==="white"?"#c7d3d9":"#3cb681"} stroke="#385362" strokeWidth="1.8"/>
      <path d={`M ${x-3} ${y} H ${x+3}`} stroke="#364750" strokeWidth="1.5"/>
      <title>{label} · {isAttached(wire)?"connected":"not connected"}</title>
    </g>)}
  </svg>;
}

/** Integrated open box: all conductors and connectors are drawn INSIDE the same device. */
function WiredBox({device,cables}:{device:ElectricalDevice;cables:CableRecord[]}) {
  const splices=cables.flatMap(c=>c.splices??[]).filter((sp,i,all)=>sp.deviceId===device.id&&all.findIndex(other=>other.id===sp.id)===i);
  const wires=cables.flatMap(c=>{
    const end=c.from===device.id?"from":"to";
    return (c.type.includes("/3")?["black","red","white","ground"]:["black","white","ground"]).map(color=>({c,end,color,terminal:c.ends?.[end]?.[color]??null}));
  });
  const colors:Record<string,string>={black:"#13191d",white:"#f7f9f8",red:"#e24343",ground:"#bc7843"};
  const isGfci=device.symbol==="gfci";
  const isSwitch=device.symbol.includes("switch")||device.symbol==="dimmer";
  const terminals=isGfci?[
    {id:"line-hot",x:121,y:36,color:"#d6a049"},{id:"line-neutral",x:97,y:36,color:"#cbd9e0"},
    {id:"load-hot",x:121,y:66,color:"#d6a049"},{id:"load-neutral",x:97,y:66,color:"#cbd9e0"},
    {id:"ground",x:110,y:98,color:"#34b783"}
  ]:isSwitch?[
    {id:"line",x:119,y:36,color:"#d6a049"},{id:"load",x:119,y:70,color:"#d6a049"},
    {id:"common",x:119,y:36,color:"#373c40"},{id:"traveler-1",x:119,y:58,color:"#d6a049"},
    {id:"traveler-2",x:119,y:81,color:"#d6a049"},{id:"ground",x:110,y:99,color:"#34b783"}
  ]:[
    {id:"hot",x:121,y:43,color:"#d6a049"},{id:"neutral",x:97,y:43,color:"#cbd9e0"},
    {id:"ground",x:110,y:98,color:"#34b783"}
  ];
  const terminalPoint=(name:string)=>{
    const lower=name.toLowerCase();
    const t=terminals.find(t=>t.id===lower)||terminals.find(t=>lower.includes(t.id))||
      terminals.find(t=>lower.includes("ground")?t.id==="ground":lower.includes("neutral")?t.id.includes("neutral"):t.id.includes("hot")||t.id==="line");
    return t??terminals[0];
  };
  const nut=(x:number,y:number)=><g>
    <path d={`M ${x-7} ${y+8} L ${x-7} ${y-2} Q ${x} ${y-14} ${x+7} ${y-2} L ${x+7} ${y+8} Z`} fill="#efa337" stroke="#ffda8b" strokeWidth="1.6"/>
    <path d={`M ${x-5} ${y} H ${x+5} M ${x-5} ${y+4} H ${x+5}`} stroke="#a96323" strokeWidth="1.2"/>
  </g>;
  const trace=(path:string,color:string)=><g>
    <path d={path} fill="none" stroke={color==="white"?"#647d8a":"#8099a5"} strokeWidth="5.7" strokeLinecap="round"/>
    <path d={path} fill="none" stroke={colors[color]??"#202b34"} strokeWidth="3.4" strokeLinecap="round"/>
  </g>;
  return <svg viewBox="0 0 150 122" width="150" height="122" style={{display:"block",overflow:"visible"}} aria-label={`${device.name} with actual saved cable terminations`}>
    <rect x="3" y="2" width="144" height="116" rx="9" fill="#a7b5bd" stroke="#4d6b7c" strokeWidth="3"/>
    <rect x="10" y="9" width="130" height="102" rx="6" fill="#e1e1d8" stroke="#788f9b" strokeWidth="1.5"/>
    <rect x="80" y="14" width="52" height="92" rx="8" fill="#d2d8da" stroke="#7e8c93" strokeWidth="2"/>
    <rect x="88" y="21" width="36" height="78" rx="5" fill="#f5f3e9" stroke="#9ea9a9" strokeWidth="1.5"/>
    {isGfci&&<g><rect x="99" y="47" width="14" height="6" rx="2" fill="#b74640"/><rect x="99" y="55" width="14" height="6" rx="2" fill="#48545d"/></g>}
    {isSwitch&&<rect x="101" y="43" width="10" height="28" rx="2" fill="#85939c" stroke="#52616c"/>}
    {!isSwitch&&!isGfci&&<circle cx="106" cy="61" r="12" fill="#fff7d8" stroke="#aab3b7" strokeWidth="2"/>}
    {terminals.map(t=><g key={t.id}><circle cx={t.x} cy={t.y} r="5.3" fill={t.color} stroke="#4e626d" strokeWidth="1.2"/><path d={`M ${t.x-2.6} ${t.y} H ${t.x+2.6}`} stroke="#31424b" strokeWidth="1.3"/></g>)}
    {wires.map(({c,end,color,terminal},i)=>{
      const entryX=16+(i%4)*9,entryY=106;
      if(terminal?.startsWith("splice:"))return null;
      const t=terminal&&terminal!=="cap"?terminalPoint(terminal):null;
      const capped=terminal==="cap";
      const targetX=t?.x??(22+(i%4)*11),targetY=t?.y??(capped?35+(Math.floor(i/4)*24):32+(i%4)*13);
      return <g key={`${c.id}-${end}-${color}`}>
        {trace(`M ${entryX} ${entryY} C ${entryX} ${entryY-36} ${targetX-22} ${targetY+23} ${targetX} ${targetY}`,color)}
        {capped&&nut(targetX,targetY-8)}
        <title>{color.toUpperCase()} · {c.fromName??"Panel"} → {c.toName??device.name} · {terminal??"Loose"}</title>
      </g>;
    })}
    {splices.slice(0,3).map((sp,i)=>{
      const x=26+i*21,y=26+(i%2)*11;
      return <g key={sp.id}>
        {sp.members.slice(0,5).map((m,j)=>{
          const startX=18+j*9;
          return <g key={`${m.cableId}-${m.end}-${m.conductor}-${j}`}>
            {trace(`M ${startX} 106 C ${startX-4} 69 ${x-8+j*4} ${y+26} ${x-7+j*4} ${y+8}`,m.conductor)}
          </g>;
        })}
        {sp.pigtailTerminal&&(()=>{const t=terminalPoint(sp.pigtailTerminal);const family=sp.members[0]?.conductor??"black";return <g>{trace(`M ${x+6} ${y+8} C ${x+28} ${y+30} ${t.x-29} ${t.y-21} ${t.x} ${t.y}`,family)}<title>Pigtail → {sp.pigtailTerminal}</title></g>})()}
        {nut(x,y)}
        <title>Wire-nut splice · {sp.members.length} conductors{sp.pigtailTerminal?` · pigtail to ${sp.pigtailTerminal}`:""}</title>
      </g>;
    })}
  </svg>;
}

export default function Device({ device, wireMode, selectedTerminal, selected, onSelect, onTerminalClick, onStartDrag, onCableStart, onCableDestination, cableSource, wiringCables=[] }: Props) {
  void selectedTerminal; void onTerminalClick;
  const [expanded,setExpanded]=useState(false);
  const showWiredBox=wiringCables.length>0;
  const simpleReceptacle=device.symbol==="outlet"&&wiringCables.length===1&&
    wiringCables[0].type.includes("14/2")&&
    !(wiringCables[0].splices??[]).some(sp=>sp.deviceId===device.id);
  const isExpanded=expanded&&showWiredBox;

  const wallMounted = ["outlet", "gfci", "switch-single", "switch-three-way", "dimmer"].includes(device.symbol);
  return <div className="device-component" title={`${device.name} — ${device.type}. Select to inspect or install.`} onMouseDown={e => { e.stopPropagation(); onSelect(device.id); if (wireMode) onCableDestination(device.id); else if(!expanded) onStartDrag(device.id); }}
    style={{position:"absolute",left:device.x,top:device.y,width:isExpanded?390:150,height:isExpanded?390:150,boxSizing:"border-box",border:selected?"2px solid #00c9f3":"2px solid transparent",borderRadius:8,boxShadow:isExpanded?"0 14px 36px #0009, 0 0 0 3px #00c9f3":"none",background:isExpanded?"#c9d0d1":"transparent",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:wireMode?"crosshair":"grab",userSelect:"none",zIndex:isExpanded?45:10}}>
    {!showWiredBox&&wallMounted && <div title="Electrical device box" style={{position:"absolute",top:10,left:18,width:114,height:120,background:"#174e87",border:"4px solid #12375c",borderRadius:9,boxShadow:"inset 0 0 0 3px #4680ad, 2px 4px 7px #0005"}}/>}
    <div style={{position:"relative",zIndex:1,transform:isExpanded?"scale(2.45)":"none",filter:"drop-shadow(1px 3px 2px #0005)",pointerEvents:"none"}}>{simpleReceptacle?<SimpleReceptacleWiring device={device} cable={wiringCables[0]}/>:showWiredBox?<WiredBox device={device} cables={wiringCables}/>:<DeviceFace device={device}/>}</div>
    {showWiredBox&&<button type="button" title={isExpanded?"Collapse wiring view":"Expand wiring on wall"} onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();setExpanded(v=>!v);onSelect(device.id);}} style={{position:"absolute",top:2,right:2,zIndex:50,background:"#13516c",color:"#fff",border:"2px solid #7edcf0",borderRadius:5,padding:"4px 8px",fontSize:isExpanded?16:12,cursor:"pointer"}}>{isExpanded?"− Close":"⤢"}</button>}
    {isExpanded&&<div style={{position:"absolute",bottom:5,left:12,right:12,textAlign:"center",fontSize:13,color:"#183c4c",fontWeight:700,pointerEvents:"none"}}>Saved wiring · {wiringCables.length} cable(s) · Click − Close to return to wall</div>}
    <div style={{position:"absolute",top:isExpanded?8:130,left:isExpanded?12:-8,width:isExpanded?320:166,textAlign:"center",fontSize:12,fontWeight:700,color:"#17212c",textShadow:"0 1px #ffffff",pointerEvents:"none"}}>{device.name}</div>
    <button type="button" aria-label={`Start cable from ${device.name}`} title="Wire Tool: select cable source"
      onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();if(wireMode && !cableSource) onCableStart(device.id); else if(wireMode) onCableDestination(device.id); else onCableStart(device.id)}}
      style={{position:"absolute",left:-9,top:isExpanded?190:61,width:20,height:20,padding:0,borderRadius:"50%",
        border:"2px solid #173b4d",background:cableSource?"#00e6ff":"#a2a8ad",
        boxShadow:cableSource?"0 0 0 4px #00e6ff55":"none",zIndex:30,cursor:"crosshair"}}/>
  </div>;
}
