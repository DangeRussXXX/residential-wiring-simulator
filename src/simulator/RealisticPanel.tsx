import type { BreakerSlot } from "../electrical/breakerPanel";
import type { CircuitAssignment } from "./projectWorkflow";

type Props = {
  slots: BreakerSlot[];
  selected: number;
  assignments: CircuitAssignment[];
  onSelect: (slot: number) => void;
  onDropBreaker: (slot: number) => void;
  canDrop: boolean;
  mainBreaker?: { installed: boolean; amperage: number; closed: boolean };
  onMainDrop: (rating: number) => void;
};

/** Visual training model. Physical bus placement and manufacturer listing are not represented. */
export default function RealisticPanel({ slots, selected, assignments, onSelect, onDropBreaker, canDrop, mainBreaker, onMainDrop }: Props) {
  const rows = Math.ceil(slots.length / 2);
  const height = 365 + rows * 49;
  return <div style={{background:"#0b141e",border:"2px solid #526879",borderRadius:12,padding:10,overflowX:"auto"}}>
    <div style={{textAlign:"center",color:"#9ce8ff",fontWeight:700,marginBottom:8}}>DISTRIBUTION PANEL — INTERIOR TRAINING VIEW</div>
    <svg viewBox={`0 0 600 ${height}`} role="img" aria-label="Interactive simulated distribution panel with feeder terminals, breakers, neutral and ground bars" style={{width:"100%",height:"auto",minWidth:300,maxHeight:"80vh"}}>
      <defs>
        <linearGradient id="novaPanelSteel" x1="0" x2="1"><stop stopColor="#5a6269"/><stop offset=".15" stopColor="#303a42"/><stop offset=".85" stopColor="#252f37"/><stop offset="1" stopColor="#747d84"/></linearGradient>
        <linearGradient id="novaBreakerFace" x1="0" x2="1"><stop stopColor="#10151b"/><stop offset=".5" stopColor="#303941"/><stop offset="1" stopColor="#0a1016"/></linearGradient>
      </defs>
      <rect x="7" y="7" width="586" height={height-14} rx="14" fill="url(#novaPanelSteel)" stroke="#9caab5" strokeWidth="6"/>
      <rect x="24" y="25" width="552" height={height-50} rx="7" fill="#1a252e" stroke="#6e7e88" strokeWidth="3"/>
      {Array.from({length:5},(_,i)=><g key={i}><circle cx={62+i*115} cy="41" r="13" fill="#101921" stroke="#8a969d" strokeWidth="3"/><circle cx={62+i*115} cy={height-40} r="13" fill="#101921" stroke="#8a969d" strokeWidth="3"/></g>)}
      <text x="300" y="66" textAnchor="middle" fill="#dceaf4" fontSize="17" fontWeight="bold">DOWNSTREAM DISTRIBUTION PANEL</text>
      <text x="300" y="83" textAnchor="middle" fill="#a9c3d3" fontSize="11">Feeder from separate service disconnect · L1 / L2 / N / G</text>
      <g aria-label="Incoming feeder conductors">
        <path d="M 205 36 V 142" fill="none" stroke="#20272b" strokeWidth="16"/><path d="M 395 36 V 142" fill="none" stroke="#cf3035" strokeWidth="15"/>
        <path d="M 114 36 V 187 H 75 V 275" fill="none" stroke="#e3e4e2" strokeWidth="12"/>
        <path d="M 488 36 V 187 H 525 V 275" fill="none" stroke="#b27d4e" strokeWidth="10"/>
      </g>
      <rect x="177" y="109" width="56" height="53" rx="5" fill="#263742" stroke="#99acb7"/><rect x="367" y="109" width="56" height="53" rx="5" fill="#263742" stroke="#99acb7"/>
      <text x="205" y="124" textAnchor="middle" fill="#ffb4a4" fontSize="13">L1</text><text x="395" y="124" textAnchor="middle" fill="#adc7ff" fontSize="13">L2</text>
      {[205,395].map(x=><g key={x}><circle cx={x} cy="145" r="12" fill="#c1a477" stroke="#e5d0a4" strokeWidth="2"/><path d={`M ${x-6} 145 H ${x+6}`} stroke="#5a4934" strokeWidth="3"/></g>)}
      <g role="button" tabIndex={0} aria-label={mainBreaker?.installed?`Installed ${mainBreaker.amperage} amp distribution main breaker`:'Empty optional main breaker location'} style={{cursor:"pointer"}}
        onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const rating=Number(e.dataTransfer.getData("application/x-nova-main-breaker"));if(rating>0)onMainDrop(rating);}}
        onKeyDown={e=>{if(e.key==="Enter")e.preventDefault();}}>
        <rect x="237" y="113" width="126" height="84" rx="8" fill={mainBreaker?.installed?"#111a22":"#25333c"} stroke={mainBreaker?.installed?"#9ccbe0":"#698392"} strokeWidth="3" strokeDasharray={mainBreaker?.installed?undefined:"6 4"}/>
        <text x="300" y="135" fill="#e9f6ff" fontSize="13" fontWeight="bold" textAnchor="middle">{mainBreaker?.installed?`${mainBreaker.amperage}A MAIN`:'MAIN POSITION'}</text>
        <rect x="279" y="145" width="42" height="32" rx="5" fill={mainBreaker?.installed?"#465968":"#1b2730"} stroke="#9eacb5"/>
        <text x="300" y="166" fill="white" fontSize="12" textAnchor="middle">{mainBreaker?.installed?(mainBreaker.closed?"ON":"OFF"):"EMPTY"}</text>
      </g>
      <path d="M 205 162 V 215 H 248 V 294" fill="none" stroke="#a55b46" strokeWidth="14"/>
      <path d="M 395 162 V 215 H 352 V 294" fill="none" stroke="#718ac0" strokeWidth="14"/>
      <rect x="241" y="293" width="14" height={height-342} fill="#a55b46" opacity=".88"/>
      <rect x="345" y="293" width="14" height={height-342} fill="#718ac0" opacity=".88"/>
      <text x="75" y="262" textAnchor="middle" fontSize="12" fill="#e6f6ff">NEUTRAL</text>
      <text x="525" y="262" textAnchor="middle" fontSize="12" fill="#e6f6ff">GROUND</text>
      <rect x="50" y="274" width="50" height={height-319} rx="5" fill="#8d979a" stroke="#d5dbda" strokeWidth="2"/>
      <rect x="500" y="274" width="50" height={height-319} rx="5" fill="#8d979a" stroke="#d5dbda" strokeWidth="2"/>
      <text x="75" y="159" textAnchor="middle" fontSize="12" fill="#e6f6ff">NEUTRAL</text>
      <text x="525" y="159" textAnchor="middle" fontSize="12" fill="#e6f6ff">GROUND</text>
      {Array.from({length:rows},(_,i)=>[75,525].map((x,j)=><g key={`${i}-${j}`}><circle cx={x} cy={309+i*49} r="10" fill="#b7c3c4" stroke="#e7eded" strokeWidth="2"/><path d={`M ${x-5} ${309+i*49} H ${x+5}`} stroke="#44515b" strokeWidth="3"/></g>))}
      {slots.map((item)=>{
        const i=item.slot-1, left=i%2===0, row=Math.floor(i/2);
        const x=left?135:306, y=285+row*49, width=159, heightB=43;
        const owner=item.occupiedBy ? slots.find(v=>v.breaker?.id===item.occupiedBy) : null;
        const breaker=item.breaker ?? owner?.breaker;
        const installed=!!breaker;
        const label=breaker ? `${breaker.amperage}A ${breaker.poles}P` : "EMPTY";
        const isSelected=selected===item.slot || (owner?.slot===selected);
        return <g key={item.slot} role="button" tabIndex={0} aria-label={`Position ${item.slot}: ${installed?label:"empty"}`} onClick={()=>onSelect(owner?.slot??item.slot)}
          onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onSelect(owner?.slot??item.slot);}}}
          onDragOver={e=>{if(canDrop&&!installed)e.preventDefault();}}
          onDrop={e=>{e.preventDefault();if(!installed)onDropBreaker(item.slot);}}
          style={{cursor:"pointer",outline:"none"}}>
          <rect x={x} y={y} width={width} height={heightB} rx="4" fill={installed?"url(#novaBreakerFace)":"#101a23"} stroke={isSelected?"#55e0ff":"#637b8a"} strokeWidth={isSelected?3:1.4} strokeDasharray={installed?"":"5 4"}/>
          {installed && <><rect x={left?x+104:x+10} y={y+5} width="40" height="33" rx="3" fill="#050a0e" stroke="#52616c"/>
            <rect x={left?x+118:x+24} y={y+9} width="15" height="22" rx="3" fill="#6b7781" stroke="#a7b3bd"/>
            <rect x={left?x+7:x+147} y={y+5} width="5" height="33" fill="#2b4152"/>
          </>}
          <text x={left?x+15:x+57} y={y+17} fill={installed?"#f2f7fb":"#71899a"} fontSize="12" fontWeight="bold">{label}</text>
          <text x={left?x+15:x+57} y={y+32} fill="#a5bfcd" fontSize="10">POS {item.slot}</text>
          {installed&&breaker&&<title>{`Position ${item.slot}: ${label}, ${breaker.breakerType}. ${assignments.find(a=>a.slot===(owner?.slot??item.slot))?.name??"Unassigned"}`}</title>}
        </g>;
      })}
      <text x="300" y={height-18} textAnchor="middle" fill="#a9c8d9" fontSize="11">Select a position • Drag a training breaker into an empty slot</text>
    </svg>
    <p style={{fontSize:12,color:"#b6cbd6",margin:"8px 0 0"}}>Incoming L1, L2, neutral, and equipment-ground conductors are illustrated. Optional main breaker is a training-only component. Illustrated practice view, not a manufacturer-accurate panel. The actual feeder and bus connections are not electrically simulated here. Select a breaker, then open “Wire to Breaker” for individual terminal practice.</p>
  </div>;
}
