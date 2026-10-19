import Terminal from "./Terminal";
import type { ElectricalDevice } from "../electrical/types";

type Props = {
  device: ElectricalDevice;
  wireMode: boolean;
  selectedTerminal: string | null;
  selected: boolean;
  onSelect: (id: string) => void;
  onTerminalClick: (deviceId: string, terminalId: string) => void;
  onStartDrag: (id: string) => void;
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

export default function Device({ device, wireMode, selectedTerminal, selected, onSelect, onTerminalClick, onStartDrag }: Props) {
  const wallMounted = ["outlet", "gfci", "switch-single", "switch-three-way", "dimmer"].includes(device.symbol);
  return <div className="device-component" onMouseDown={e => { e.stopPropagation(); onSelect(device.id); if (!wireMode) onStartDrag(device.id); }}
    style={{position:"absolute",left:device.x,top:device.y,width:150,height:150,boxSizing:"border-box",border:selected?"2px solid #00c9f3":"2px solid transparent",borderRadius:8,boxShadow:selected?"0 0 0 3px #00c9f355":"none",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:wireMode?"crosshair":"grab",userSelect:"none",zIndex:10}}>
    {wallMounted && <div title="Electrical device box" style={{position:"absolute",top:10,left:18,width:114,height:120,background:"#174e87",border:"4px solid #12375c",borderRadius:9,boxShadow:"inset 0 0 0 3px #4680ad, 2px 4px 7px #0005"}}/>}
    <div style={{position:"relative",zIndex:1,filter:"drop-shadow(1px 3px 2px #0005)"}}><DeviceFace device={device}/></div>
    <div style={{position:"absolute",top:130,left:-8,width:166,textAlign:"center",fontSize:12,fontWeight:700,color:"#17212c",textShadow:"0 1px #ffffff",pointerEvents:"none"}}>{device.name}</div>
    {device.terminals.map(t => <Terminal key={t.id} terminal={t} selected={selectedTerminal===`${device.id}-${t.id}`} onClick={()=>onTerminalClick(device.id,t.id)}/>)}
  </div>;
}
