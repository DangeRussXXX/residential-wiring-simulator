import type { BreakerSlot } from "../electrical/breakerPanel";
import type { CircuitAssignment } from "./projectWorkflow";

type Props = {
  slots: BreakerSlot[];
  selected: number;
  assignments: CircuitAssignment[];
  onSelect: (slot: number) => void;
  onDropBreaker: (slot: number) => void;
  canDrop: boolean;
};

/** Visual training model. Physical bus placement and manufacturer listing are not represented. */
export default function RealisticPanel({ slots, selected, assignments, onSelect, onDropBreaker, canDrop }: Props) {
  const rows = Math.ceil(slots.length / 2);
  const height = 228 + rows * 49;
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
      <text x="300" y="70" textAnchor="middle" fill="#dceaf4" fontSize="17" fontWeight="bold">DOWNSTREAM DISTRIBUTION PANEL</text>
      <text x="300" y="88" textAnchor="middle" fill="#a9c3d3" fontSize="11">120/240V training model • separate upstream disconnect</text>
      <rect x="221" y="110" width="54" height="57" rx="5" fill="#263742" stroke="#99acb7"/>
      <rect x="325" y="110" width="54" height="57" rx="5" fill="#263742" stroke="#99acb7"/>
      <text x="248" y="125" textAnchor="middle" fill="#ffb4a4" fontSize="13">L1</text>
      <text x="352" y="125" textAnchor="middle" fill="#adc7ff" fontSize="13">L2</text>
      {[248,352].map((x,i)=><g key={i}><circle cx={x} cy="146" r="13" fill="#c1a477" stroke="#e5d0a4" strokeWidth="2"/><path d={`M ${x-6} 146 H ${x+6}`} stroke="#5a4934" strokeWidth="3"/></g>)}
      <rect x="241" y="166" width="14" height={height-215} fill="#a55b46" opacity=".88"/>
      <rect x="345" y="166" width="14" height={height-215} fill="#718ac0" opacity=".88"/>
      <rect x="50" y="170" width="50" height={height-215} rx="5" fill="#8d979a" stroke="#d5dbda" strokeWidth="2"/>
      <rect x="500" y="170" width="50" height={height-215} rx="5" fill="#8d979a" stroke="#d5dbda" strokeWidth="2"/>
      <text x="75" y="159" textAnchor="middle" fontSize="12" fill="#e6f6ff">NEUTRAL</text>
      <text x="525" y="159" textAnchor="middle" fontSize="12" fill="#e6f6ff">GROUND</text>
      {Array.from({length:rows},(_,i)=>[75,525].map((x,j)=><g key={`${i}-${j}`}><circle cx={x} cy={205+i*49} r="10" fill="#b7c3c4" stroke="#e7eded" strokeWidth="2"/><path d={`M ${x-5} ${205+i*49} H ${x+5}`} stroke="#44515b" strokeWidth="3"/></g>))}
      {slots.map((item)=>{
        const i=item.slot-1, left=i%2===0, row=Math.floor(i/2);
        const x=left?135:306, y=181+row*49, width=159, heightB=43;
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
    <p style={{fontSize:12,color:"#b6cbd6",margin:"8px 0 0"}}>Illustrated practice view, not a manufacturer-accurate panel. The actual feeder and bus connections are not electrically simulated here. Select a breaker, then open “Wire to Breaker” for individual terminal practice.</p>
  </div>;
}
