import { useState } from "react";
import type { ElectricalDevice } from "../electrical/types";
import { UnifiedBoxWiring, type CableRecord, type CableEnd } from "../simulator/CableWiringPanel";

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
  onWiringTerminate?: (cableId:string,end:CableEnd,conductor:string,terminal:string)=>void;
  allWiringCables?: CableRecord[];
  wiringFace?: "rear"|"front";
  onWiringFaceChange?: (face:"rear"|"front")=>void;
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
/** Compact wall wiring uses the SAME saved terminations as the detailed diagram.
 * Wires terminate at a screw only when an actual saved terminal exists. */
function CompactWiredDevice({device,cables}:{device:ElectricalDevice;cables:CableRecord[]}) {
  const shown=[...cables].sort((a,b)=>Number(b.from==="__panel_p1__")-Number(a.from==="__panel_p1__")).slice(0,3);
  const isSwitch=["switch-single","switch-three-way","dimmer"].includes(device.symbol);
  const isGfci=device.symbol==="gfci";
  const isLight=device.symbol.startsWith("light");
  const colors:Record<string,string>={black:"#111c24",white:"#fffdf2",red:"#d23e46",ground:"#bd7942"};
  // Rear terminal diagram: screw locations are shared by the conductor paths.
  // Device faces are intentionally hidden in wiring mode, not wired through.
  const screws:Record<string,[number,number]>={
    hot:[128,62],neutral:[105,62],ground:[116,102],
    "line-hot":[128,51],"line-neutral":[105,51],"load-hot":[128,82],"load-neutral":[105,82],
    line:[128,52],load:[128,84],"traveler-1":[105,52],"traveler-2":[105,84]
  };
  const applicable=isGfci?["line-hot","line-neutral","load-hot","load-neutral","ground"]:
    isSwitch?["line","load","traveler-1","traveler-2","ground"]:["hot","neutral","ground"];
  const resolve=(value:string):string|undefined=>{
    const v=value.toLowerCase();
    if(applicable.includes(v))return v;
    return applicable.find(id=>v.includes(id)) ?? applicable.find(id=>v.includes("ground")?id==="ground":v.includes("neutral")?id.includes("neutral"):v.includes("hot")||v.includes("brass")?id.includes("hot")||id==="line":false);
  };
  const splices=cables.flatMap(c=>c.splices??[]).filter((sp,i,all)=>sp.deviceId===device.id&&all.findIndex(other=>other.id===sp.id)===i);
  const entries=shown.flatMap((c,ci)=>{
    const side=c.from===device.id?"from":"to";
    const conductors=c.type.includes("/3")?["black","red","white","ground"]:["black","white","ground"];
    return conductors.map((color,i)=>({c,ci,color,i,terminal:c.ends?.[side]?.[color]??null}));
  });
  return <svg viewBox="0 0 150 126" width="150" height="126" role="img" aria-label={`${device.name}: ${cables.length} cables, saved wiring connections`}>
    <rect x="4" y="17" width="142" height="105" rx="7" fill="#c5d1d5" stroke="#577789" strokeWidth="2.5"/>
    <rect x="9" y="22" width="132" height="94" rx="5" fill="#e8edeb" stroke="#9baeb7"/>
    {/* Rear/side wiring terminal board instead of a receptacle front face. */}
    <rect x="95" y="30" width="44" height="84" rx="6" fill="#a8bac2" stroke="#5d7d8c" strokeWidth="2"/>
    <rect x="100" y="35" width="34" height="74" rx="4" fill="#e6e1d4" stroke="#8a9da5" strokeWidth="1.5"/>
    {isSwitch ? <g><rect x="112" y="59" width="10" height="23" rx="2" fill="#657984"/><path d="M115 61 L120 61 V77 L115 79 Z" fill="#d9e1e3"/></g>:
      isLight ? <g><circle cx="117" cy="74" r="13" fill="#fff1c5" stroke="#ac9e76"/><circle cx="117" cy="74" r="5" fill="#d8c486"/></g>:
      <g><rect x="111" y="59" width="12" height="24" rx="2" fill="#c5d0d3" stroke="#718b97"/>{isGfci&&<text x="117" y="75" fontSize="5" textAnchor="middle" fill="#384c58">GFCI</text>}</g>}
    <text x="117" y="42" fontSize="5.5" fontWeight="bold" textAnchor="middle" fill="#2b4757">REAR</text>
    {shown.map((c,ci)=>{const x=23+ci*23;return <g key={c.id}>
      <path d={`M ${x} -2 V 37`} stroke="#4e626b" strokeWidth="11"/>
      <path d={`M ${x} -2 V 37`} stroke={c.type.includes("MC")?"#b4bec3":"#f1e9d9"} strokeWidth="7"/>
      <rect x={x-7} y="17" width="14" height="7" rx="2" fill="#8298a3" stroke="#456273"/>
    </g>})}
    {entries.map(({c,ci,color,i,terminal})=>{
      const x=23+ci*23;
      const splice=terminal?.startsWith("splice:")?splices.find(sp=>sp.id===terminal.slice(7)):undefined;
      const targetId=terminal&&!splice&&terminal!=="cap"?resolve(terminal):undefined;
      const t=targetId?screws[targetId]:undefined;
      const spIndex=splice?splices.indexOf(splice):-1;
      const ex=t?.[0]??(splice?60+spIndex*13:terminal==="cap"?51+ci*12:42+ci*16+i*7);
      const ey=t?.[1]??(splice?86+spIndex*5:terminal==="cap"?100:75+i*8);
      const path=`M ${x} 37 C ${x} 54 ${ex-15} ${ey-18} ${ex} ${ey}`;
      return <g key={`${c.id}-${color}`}>
        <path d={path} stroke="#617985" strokeWidth="5" fill="none" strokeLinecap="round"/>
        <path d={path} stroke={colors[color]} strokeWidth="3" fill="none" strokeLinecap="round"/>
        {!t&&!splice&&terminal!=="cap"&&<circle cx={ex} cy={ey} r="2.5" fill={colors[color]} stroke="#566e78" strokeWidth="1"/>}
        {terminal==="cap"&&<path d={`M ${ex-4} ${ey+3} L ${ex-3} ${ey-5} Q ${ex} ${ey-11} ${ex+3} ${ey-5} L ${ex+4} ${ey+3} Z`} fill="#e89b37" stroke="#a96a26"/>}
        <title>{color}: {terminal??"unconnected"}</title>
      </g>;
    })}
    {splices.map((sp,i)=>{const x=60+i*13,y=86+i*5;return <g key={sp.id}>
      <path d={`M ${x-5} ${y+2} L ${x-4} ${y-5} Q ${x} ${y-11} ${x+4} ${y-5} L ${x+5} ${y+2} Z`} fill="#f2a33b" stroke="#ac6c29"/>
      {sp.pigtailTerminal&&(()=>{const id=resolve(sp.pigtailTerminal);const t=id?screws[id]:undefined;return t?<path d={`M ${x+4} ${y} Q ${x+20} ${y+14} ${t[0]} ${t[1]}`} stroke={colors[sp.members[0]?.conductor??"black"]} strokeWidth="3" fill="none"/>:null})()}
    </g>})}
    {applicable.map(id=>{const [x,y]=screws[id];return <g key={id}><circle cx={x} cy={y} r="3.8" fill={id==="ground"?"#3bb887":id.includes("neutral")?"#dce4e9":"#d9a247"} stroke="#425966" strokeWidth="1"/><path d={`M ${x-2} ${y} H ${x+2}`} stroke="#435966" strokeWidth="1.3"/><title>{id} terminal</title></g>})}
    {cables.length>3&&<text x="11" y="115" fontSize="9" fill="#25495b">+{cables.length-3} cables · expand</text>}
  </svg>;
}

void CompactWiredDevice;

export default function Device({ device, wireMode, selectedTerminal, selected, onSelect, onTerminalClick, onStartDrag, onCableStart, onCableDestination, cableSource, wiringCables=[], onWiringTerminate, allWiringCables=[], wiringFace="rear", onWiringFaceChange }: Props) {
  void selectedTerminal; void onTerminalClick;
  const [expanded,setExpanded]=useState(false);
  const face=wiringFace;
  const showWiredBox=wiringCables.length>0;
  // Keep the wall footprint fixed. The detailed wiring is available on demand,
  // without moving the device or obscuring neighboring boxes.
  const wallWidth = expanded && showWiredBox ? 760 : showWiredBox ? 260 : 190;
  const wallHeight = expanded && showWiredBox ? 535 : showWiredBox ? 228 : 180;
  const isExpanded=expanded&&showWiredBox;

  const wallMounted = ["outlet", "gfci", "switch-single", "switch-three-way", "dimmer"].includes(device.symbol);
  return <div className="device-component" title={`${device.name} — ${device.type}. Select to inspect or install.`} onMouseDown={e => { e.stopPropagation(); onSelect(device.id); if (wireMode) onCableDestination(device.id); else if(!expanded) onStartDrag(device.id); }}
    style={{position:"absolute",left:device.x,top:device.y,width:wallWidth,height:wallHeight,boxSizing:"border-box",border:selected?"2px solid #00c9f3":"2px solid transparent",borderRadius:8,boxShadow:isExpanded?"0 14px 36px #0009, 0 0 0 3px #00c9f3":"none",background:isExpanded?"#c9d0d1":"transparent",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:wireMode?"crosshair":"grab",userSelect:"none",zIndex:isExpanded?45:10}}>
    {!showWiredBox&&wallMounted && <div title="Electrical device box" style={{position:"absolute",top:10,left:18,width:114,height:120,background:"#174e87",border:"4px solid #12375c",borderRadius:9,boxShadow:"inset 0 0 0 3px #4680ad, 2px 4px 7px #0005"}}/>}
    <div style={{position:"relative",zIndex:1,transform:"none",filter:"drop-shadow(1px 3px 2px #0005)",pointerEvents:isExpanded?"auto":"none"}}>
      {isExpanded ? (()=>{return <div style={{width:720,height:440,pointerEvents:"auto",overflow:"auto"}} onPointerDown={e=>e.stopPropagation()} onMouseDown={e=>e.stopPropagation()}>
          <UnifiedBoxWiring device={device} allCables={allWiringCables.length?allWiringCables:wiringCables} front={face==="front"} onTerminate={onWiringTerminate??(()=>{})}/>
          {wiringCables.length>1&&<div style={{fontSize:12,color:"#245269"}}>All {wiringCables.length} cables shown together</div>}
        </div>})() :
        showWiredBox ? <div title="Readable wall wiring preview — expand to edit all connections" style={{width:250,height:208,overflow:"hidden",position:"relative",background:"#587586",border:"2px solid #69889a",borderRadius:8,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:240,height:202,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{transform:"scale(1.6)",transformOrigin:"center center",width:150,height:126,flexShrink:0}}>
              <CompactWiredDevice device={device} cables={wiringCables}/>
            </div>
          </div>
        </div> : <DeviceFace device={device}/>}
    </div>
    {showWiredBox&&<button type="button" title={`Flip to ${face==="rear"?"front":"rear"} view`} aria-label={`Flip ${device.name} to ${face==="rear"?"front":"rear"} view`} onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();onWiringFaceChange?.(face==="rear"?"front":"rear");onSelect(device.id);}} style={{position:"absolute",top:2,right:isExpanded?94:36,zIndex:51,background:"#13516c",color:"#fff",border:"2px solid #7edcf0",borderRadius:5,padding:isExpanded?"4px 8px":"2px 5px",fontSize:isExpanded?12:10,cursor:"pointer"}}>↻ {isExpanded?(face==="rear"?"Front":"Rear"):""}</button>}
    {showWiredBox&&<button type="button" title={isExpanded?"Collapse wiring view":"Expand wiring on wall"} onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();setExpanded(v=>!v);onSelect(device.id);}} style={{position:"absolute",top:2,right:2,zIndex:50,background:"#13516c",color:"#fff",border:"2px solid #7edcf0",borderRadius:5,padding:"4px 8px",fontSize:isExpanded?16:12,cursor:"pointer"}}>{isExpanded?"− Close":"⤢"}</button>}
    {isExpanded&&<div style={{position:"absolute",bottom:5,left:12,right:12,textAlign:"center",fontSize:13,color:"#183c4c",fontWeight:700,pointerEvents:"none"}}>Same shared box diagram as the right panel · Click − Close to return to wall</div>}
    <div style={{position:"absolute",top:isExpanded?wallHeight-27:showWiredBox?205:164,left:isExpanded?8:-8,width:isExpanded?wallWidth-16:showWiredBox?260:190,textAlign:"center",fontSize:12,fontWeight:700,color:"#17212c",textShadow:"0 1px #ffffff",pointerEvents:"none"}}>{device.name}</div>
    <button type="button" aria-label={`Start cable from ${device.name}`} title="Wire Tool: select cable source"
      onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();if(wireMode && !cableSource) onCableStart(device.id); else if(wireMode) onCableDestination(device.id); else onCableStart(device.id)}}
      style={{position:"absolute",left:-9,top:isExpanded?Math.round(wallHeight/2):showWiredBox?105:75,width:20,height:20,padding:0,borderRadius:"50%",
        border:"2px solid #173b4d",background:cableSource?"#00e6ff":"#a2a8ad",
        boxShadow:cableSource?"0 0 0 4px #00e6ff55":"none",zIndex:30,cursor:"crosshair"}}/>
  </div>;
}
