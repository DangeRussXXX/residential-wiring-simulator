import { useEffect, useRef, useState } from "react";
import type { BreakerSlot } from "../electrical/breakerPanel";
import type { CircuitAssignment, PanelWire } from "./projectWorkflow";
import type { BreakerStatus } from "../electrical/breaker";

type Props = {
  slots: BreakerSlot[];
  selected: number;
  assignments: CircuitAssignment[];
  onSelect: (slot: number) => void;
  onDropBreaker: (slot: number) => void;
  canDrop: boolean;
  panelWires: PanelWire[];
  onBreakerState: (slot: number, status: BreakerStatus) => void;
  mainBreaker?: { installed: boolean; amperage: number; closed: boolean };
  onMainDrop: (rating: number) => void;
};

type PartInfo = { title: string; what: string; purpose: string; tip: string };
const PARTS: Record<string, PartInfo> = {
  entry: { title: "Cable Entry / Knockout", what: "A location where a feeder or cable enters an electrical enclosure.", purpose: "A listed fitting or connector protects and secures conductors at the enclosure entry.", tip: "A bare knockout hole is not an acceptable finished cable entry. The proper fitting depends on the wiring method." },
  l1wire: { title: "L1 Feeder Conductor", what: "The first ungrounded conductor of a typical 120/240V single-phase feeder.", purpose: "Supplies one leg of the distribution equipment.", tip: "In a nominal split-phase system, L1-to-neutral is 120V and L1-to-L2 is 240V." },
  l2wire: { title: "L2 Feeder Conductor", what: "The second ungrounded conductor of a typical 120/240V single-phase feeder.", purpose: "Supplies the opposite leg of the distribution equipment.", tip: "L2-to-neutral is nominally 120V. Color alone is not proof of conductor identity." },
  neutralwire: { title: "Feeder Neutral", what: "The insulated grounded conductor in a four-wire feeder.", purpose: "Provides the intended return path for line-to-neutral loads.", tip: "In this downstream distribution panel, the neutral is isolated from the enclosure and equipment-ground bar." },
  groundwire: { title: "Equipment-Grounding Conductor", what: "The feeder's equipment-grounding conductor.", purpose: "Bonds non-current-carrying metal parts and provides an effective ground-fault current path.", tip: "It is not a normal load-current return conductor." },
  l1lug: { title: "L1 Feeder Lug", what: "A terminal for the first ungrounded feeder conductor.", purpose: "Connects L1 to the panel's distribution system.", tip: "Terminals have specific conductor type, size, and torque requirements determined by the equipment listing." },
  l2lug: { title: "L2 Feeder Lug", what: "A terminal for the second ungrounded feeder conductor.", purpose: "Connects L2 to the panel's distribution system.", tip: "Both feeder lugs may remain energized even when downstream branch breakers are off." },
  neutral: { title: "Isolated Neutral Bar", what: "A terminal bar for grounded neutral conductors.", purpose: "Provides neutral terminations for branch circuits and the incoming feeder neutral.", tip: "Because this is downstream of a separate service disconnect, neutrals must remain isolated from equipment grounds here." },
  ground: { title: "Equipment-Ground Bar", what: "A terminal bar for equipment-grounding conductors.", purpose: "Connects branch-circuit equipment grounds to the feeder equipment-grounding path and enclosure bonding system.", tip: "Grounding and neutral terminals are not interchangeable in this downstream panel." },
  l1bus: { title: "L1 Bus / Distribution Path", what: "A simplified depiction of the L1 power distribution path.", purpose: "Supplies compatible breaker positions from the feeder connection.", tip: "Actual bus-stab arrangement and breaker compatibility vary by listed panel model." },
  l2bus: { title: "L2 Bus / Distribution Path", what: "A simplified depiction of the L2 power distribution path.", purpose: "Supplies compatible breaker positions from the feeder connection.", tip: "This drawing is conceptual; physical phase placement is not manufacturer-accurate." },
  main: { title: "Optional Distribution Main Breaker", what: "A dedicated main breaker location in this virtual downstream distribution panel.", purpose: "When installed in suitable equipment, a main breaker provides a local means to disconnect panel loads and overcurrent protection as designed.", tip: "Your project already has a separate upstream service disconnect. An additional main breaker is optional only if the selected equipment supports it." },
};

/** Visual training model. Physical bus placement and manufacturer listing are not represented. */
export default function RealisticPanel({ slots, selected, assignments, onSelect, onDropBreaker, canDrop, mainBreaker, onMainDrop, panelWires, onBreakerState }: Props) {
  const [infoEnabled, setInfoEnabled] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panMode, setPanMode] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const panStart = useRef<{x:number;y:number;left:number;top:number}|null>(null);
  const clampZoom = (value:number) => Math.max(0.35, Math.min(3, value));
  // Default to fitting the panel's WIDTH to its workspace, not the
  // fixed 600px SVG width. Leave zoom and pan under user control afterward.
  const [autoWidth, setAutoWidth] = useState(true);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !autoWidth) return;
    const resize = () => {
      const usable = viewport.clientWidth - 2;
      if (usable > 0) {
        setZoom(clampZoom(usable / 600));
        viewport.scrollLeft = 0;
        viewport.scrollTop = 0;
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [autoWidth]);

  const setPanelZoom = (value:number) => {
    setAutoWidth(false);
    const viewport = viewportRef.current;
    const next = clampZoom(value);
    if (viewport) {
      const old = zoom;
      const centerX = viewport.scrollLeft + viewport.clientWidth / 2;
      const centerY = viewport.scrollTop + viewport.clientHeight / 2;
      // Scroll after React paints the new SVG dimensions.
      requestAnimationFrame(() => {
        viewport.scrollLeft = centerX * next / old - viewport.clientWidth / 2;
        viewport.scrollTop = centerY * next / old - viewport.clientHeight / 2;
      });
    }
    setZoom(next);
  };
  const fitPanel = () => {
    setAutoWidth(false);
    const viewport = viewportRef.current;
    if (!viewport) return;
    const next = clampZoom(Math.min(viewport.clientWidth / 600, viewport.clientHeight / (365 + Math.ceil(slots.length / 2) * 49)));
    setZoom(next);
    requestAnimationFrame(() => { viewport.scrollLeft = 0; viewport.scrollTop = 0; });
  };
  const [activeInfo, setActiveInfo] = useState<PartInfo | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => { if (timer.current !== null) { clearTimeout(timer.current); timer.current = null; } };
  const hideInfo = () => { clearTimer(); setActiveInfo(null); };
  const hoverInfo = (part: PartInfo) => { clearTimer(); setActiveInfo(null); if (infoEnabled) timer.current = setTimeout(() => setActiveInfo(part), 3000); };
  const toggleInfo = (part: PartInfo) => { clearTimer(); if (infoEnabled) setActiveInfo(current => current?.title === part.title ? null : part); };
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current); }, []);
  const infoEvents = (key: string) => ({
    onMouseEnter: () => hoverInfo(PARTS[key]),
    onMouseLeave: hideInfo,
    onFocus: () => hoverInfo(PARTS[key]),
    onBlur: hideInfo,
    onClick: () => toggleInfo(PARTS[key]),
  });
  const rows = Math.ceil(slots.length / 2);
  const height = 365 + rows * 49;
  return <div className="nova-panel-viewport-shell" style={{position:"relative",background:"#122b3a",border:"2px solid #3b8ba6",borderRadius:12,padding:10,minWidth:0}}>
    <div className="nova-panel-zoom-toolbar" aria-label="Electrical panel view controls">
      <button type="button" onClick={()=>setPanelZoom(zoom/1.25)} aria-label="Zoom out">−</button>
      <span aria-live="polite">{Math.round(zoom*100)}%</span>
      <button type="button" onClick={()=>setPanelZoom(zoom*1.25)} aria-label="Zoom in">+</button>
      <button type="button" onClick={()=>{setAutoWidth(true);const viewport=viewportRef.current;if(viewport){viewport.scrollLeft=0;viewport.scrollTop=0;}}}>Fill Width</button>
      <button type="button" onClick={fitPanel}>Fit</button>
      <button type="button" onClick={()=>setPanelZoom(1)}>100%</button>
      <button type="button" aria-pressed={panMode} onClick={()=>setPanMode(v=>!v)} className={panMode?"nova-panel-pan-active":""}>Pan {panMode?"ON":"OFF"}</button>
    </div>
    <div ref={viewportRef} className="nova-panel-viewport" style={{height:"calc(100dvh - 194px)",minHeight:420,overflow:"auto",cursor:panMode?"grab":"auto",touchAction:panMode?"none":"auto"}}
      onWheel={e=>{if(e.ctrlKey){e.preventDefault();setPanelZoom(zoom*(e.deltaY>0?0.9:1.1));}}}
      onPointerDown={e=>{if(!panMode||e.button!==0)return;panStart.current={x:e.clientX,y:e.clientY,left:e.currentTarget.scrollLeft,top:e.currentTarget.scrollTop};e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault();}}
      onPointerMove={e=>{if(!panMode||!panStart.current)return;e.currentTarget.scrollLeft=panStart.current.left-(e.clientX-panStart.current.x);e.currentTarget.scrollTop=panStart.current.top-(e.clientY-panStart.current.y);}}
      onPointerUp={e=>{panStart.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
      onPointerCancel={()=>{panStart.current=null;}}>
    <svg viewBox={`0 0 600 ${height}`} role="img" aria-label="Interactive simulated distribution panel with feeder terminals, breakers, neutral and ground bars" style={{display:"block",width:600*zoom,height:height*zoom,maxWidth:"none",pointerEvents:panMode?"none":"auto"}}>
      <defs>
        <linearGradient id="novaPanelSteel" x1="0" x2="1"><stop stopColor="#5a6269"/><stop offset=".15" stopColor="#303a42"/><stop offset=".85" stopColor="#252f37"/><stop offset="1" stopColor="#747d84"/></linearGradient>
        <linearGradient id="novaBreakerFace" x1="0" x2="1"><stop stopColor="#10151b"/><stop offset=".5" stopColor="#303941"/><stop offset="1" stopColor="#0a1016"/></linearGradient>
      </defs>
      <rect x="7" y="7" width="586" height={height-14} rx="14" fill="url(#novaPanelSteel)" stroke="#8ab5c7" strokeWidth="6"/>
      <rect x="24" y="25" width="552" height={height-50} rx="7" fill="#203c4c" stroke="#5b9cb7" strokeWidth="3"/>
      {Array.from({length:5},(_,i)=><g key={i}><circle cx={62+i*115} cy="41" r="13" fill="#101921" stroke="#8a969d" strokeWidth="3"/><circle cx={62+i*115} cy={height-40} r="13" fill="#101921" stroke="#8a969d" strokeWidth="3"/></g>)}

      <g aria-label="Incoming feeder conductors">
        <path d="M 205 36 V 142" fill="none" stroke="#20272b" strokeWidth="16"/><path d="M 395 36 V 142" fill="none" stroke="#cf3035" strokeWidth="15"/>
        <path d="M 114 36 V 187 H 75 V 275" fill="none" stroke="#e3e4e2" strokeWidth="12"/>
        <path d="M 488 36 V 187 H 525 V 275" fill="none" stroke="#b27d4e" strokeWidth="10"/>
      </g>
      <g {...infoEvents("entry")} role="button" tabIndex={0} aria-label="Cable entry points — component information" style={{cursor:"help"}}>
        {[114,205,395,488].map(x=><circle key={x} cx={x} cy="36" r="18" fill="transparent" stroke="transparent" strokeWidth="3"/>)}
      </g>
      <g {...infoEvents("l1wire")} role="button" tabIndex={0} aria-label="L1 feeder conductor — component information" style={{cursor:"help"}}><path d="M 205 57 V 108" stroke="transparent" strokeWidth="24"/></g>
      <g {...infoEvents("l2wire")} role="button" tabIndex={0} aria-label="L2 feeder conductor — component information" style={{cursor:"help"}}><path d="M 395 57 V 108" stroke="transparent" strokeWidth="24"/></g>
      <g {...infoEvents("neutralwire")} role="button" tabIndex={0} aria-label="Feeder neutral conductor — component information" style={{cursor:"help"}}><path d="M 114 64 V 187 H 75 V 255" stroke="transparent" strokeWidth="22" fill="none"/></g>
      <g {...infoEvents("groundwire")} role="button" tabIndex={0} aria-label="Feeder equipment grounding conductor — component information" style={{cursor:"help"}}><path d="M 488 64 V 187 H 525 V 255" stroke="transparent" strokeWidth="22" fill="none"/></g>
      <rect x="177" y="109" width="56" height="53" rx="5" fill="#263742" stroke="#99acb7"/><rect x="367" y="109" width="56" height="53" rx="5" fill="#263742" stroke="#99acb7"/>
      <text x="205" y="124" textAnchor="middle" fill="#ffb4a4" fontSize="13">L1</text><text x="395" y="124" textAnchor="middle" fill="#adc7ff" fontSize="13">L2</text>
      {[205,395].map(x=><g key={x} {...infoEvents(x===205?"l1lug":"l2lug")} role="button" tabIndex={0} aria-label={`${x===205?"L1":"L2"} feeder lug — component information`} style={{cursor:"help"}}><circle cx={x} cy="145" r="12" fill="#c1a477" stroke="#e5d0a4" strokeWidth="2"/><path d={`M ${x-6} 145 H ${x+6}`} stroke="#5a4934" strokeWidth="3"/></g>)}
      <g {...infoEvents("main")} role="button" tabIndex={0} aria-label={mainBreaker?.installed?`Installed ${mainBreaker.amperage} amp distribution main breaker`:'Empty optional main breaker location'} style={{cursor:"pointer"}}
        onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const rating=Number(e.dataTransfer.getData("application/x-nova-main-breaker"));if(rating>0)onMainDrop(rating);}}
        onKeyDown={e=>{if(e.key==="Enter")e.preventDefault();}}>
        <rect x="237" y="113" width="126" height="84" rx="8" fill={mainBreaker?.installed?"#111a22":"#25333c"} stroke={mainBreaker?.installed?"#9ccbe0":"#698392"} strokeWidth="3" strokeDasharray={mainBreaker?.installed?undefined:"6 4"}/>
        <text x="300" y="135" fill="#e9f6ff" fontSize="13" fontWeight="bold" textAnchor="middle">{mainBreaker?.installed?`${mainBreaker.amperage}A MAIN`:'MAIN POSITION'}</text>
        <rect x="279" y="145" width="42" height="32" rx="5" fill={mainBreaker?.installed?"#465968":"#1b2730"} stroke="#9eacb5"/>
        <text x="300" y="166" fill="white" fontSize="12" textAnchor="middle">{mainBreaker?.installed?(mainBreaker.closed?"ON":"OFF"):"EMPTY"}</text>
      </g>
      <g role="button" tabIndex={0} aria-label={`Component Info ${infoEnabled?"ON":"OFF"}. Activate to toggle.`} onClick={()=>{setInfoEnabled(v=>!v);hideInfo();}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setInfoEnabled(v=>!v);hideInfo();}}} style={{cursor:"pointer"}}>
        <rect x="247" y="184" width="106" height="23" rx="5" fill="#142a39" stroke="#4c8da9"/>
        <rect x="255" y="190" width="11" height="11" rx="2" fill={infoEnabled?"#57d7ff":"#1b2a34"} stroke="#9fd9ef"/>
        {infoEnabled&&<path d="M257 195 l3 3 l5 -6" fill="none" stroke="#07222d" strokeWidth="2"/>}
        <text x="272" y="199" fontSize="10" fill="#d7efff">Info {infoEnabled?"ON":"OFF"}</text>
      </g>
      <path d="M 205 162 V 215 H 248 V 294" fill="none" stroke="#a55b46" strokeWidth="14"/>
      <path d="M 395 162 V 215 H 352 V 294" fill="none" stroke="#718ac0" strokeWidth="14"/>
      <g {...infoEvents("l1bus")} role="button" tabIndex={0} aria-label="L1 bus — component information" style={{cursor:"help"}}><path d="M 248 300 V 450" stroke="transparent" strokeWidth="30"/></g>
      <g {...infoEvents("l2bus")} role="button" tabIndex={0} aria-label="L2 bus — component information" style={{cursor:"help"}}><path d="M 352 300 V 450" stroke="transparent" strokeWidth="30"/></g>
      <rect x="241" y="293" width="14" height={height-342} fill="#a55b46" opacity=".88"/>
      <rect x="345" y="293" width="14" height={height-342} fill="#718ac0" opacity=".88"/>
      <text x="105" y="267" textAnchor="start" fontSize="13" fontWeight="bold" fill="#8ceaff">NEUTRAL</text>
      <text x="494" y="267" textAnchor="end" fontSize="13" fontWeight="bold" fill="#8ceaff">GROUND</text>
      <rect x="50" y="274" width="50" height={height-319} rx="5" fill="#8d979a" stroke="#d5dbda" strokeWidth="2"/>
      <rect x="500" y="274" width="50" height={height-319} rx="5" fill="#8d979a" stroke="#d5dbda" strokeWidth="2"/>
      <g {...infoEvents("neutral")} role="button" tabIndex={0} aria-label="Isolated neutral bar — component information" style={{cursor:"help"}}><rect x="48" y="270" width="54" height={height-311} fill="transparent"/></g>
      <g {...infoEvents("ground")} role="button" tabIndex={0} aria-label="Equipment ground bar — component information" style={{cursor:"help"}}><rect x="498" y="270" width="54" height={height-311} fill="transparent"/></g>
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
          onMouseEnter={()=>hoverInfo({title:installed?`Branch Breaker — Position ${item.slot}`:`Empty Breaker Position ${item.slot}`,what:installed?`${label} ${breaker?.breakerType.replaceAll("_"," ")??""} training breaker.`:"An unoccupied position in the simulated distribution panel.",purpose:installed?"A compatible installed branch breaker protects its assigned branch circuit against modeled overcurrent conditions.":"A compatible breaker may be installed here using the breaker library.",tip:installed?`Circuit: ${assignments.find(a=>a.slot===(owner?.slot??item.slot))?.name||"Unassigned"}. This graphic does not verify panel listing or wiring correctness.`:"Only breakers listed for the actual panel may be installed in real equipment."})}
          onMouseLeave={hideInfo}
          onFocus={()=>hoverInfo({title:`Breaker Position ${item.slot}`,what:installed?`${label} installed breaker.`:"Empty breaker position.",purpose:installed?"Branch-circuit overcurrent protection.":"Available modeled position.",tip:"Verify equipment listing and correct bus positions for real equipment."})}
          onBlur={hideInfo}
          style={{cursor:"pointer",outline:"none"}}>
          <rect x={x} y={y} width={width} height={heightB} rx="4" fill={installed?"url(#novaBreakerFace)":"#101a23"} stroke={isSelected?"#55e0ff":"#637b8a"} strokeWidth={isSelected?3:1.4} strokeDasharray={installed?"":"5 4"}/>
          {installed && <><rect x={left?x+104:x+10} y={y+5} width="40" height="33" rx="3" fill="#050a0e" stroke="#52616c"/>
            <rect x={left?x+118:x+24} y={y+9} width="15" height="22" rx="3" fill="#6b7781" stroke="#a7b3bd"/>
            <rect x={left?x+7:x+147} y={y+5} width="5" height="33" fill="#2b4152"/>
          </>}
          {installed&&item.breaker&&<g role="button" tabIndex={0} aria-label={`Operate breaker ${item.slot}, currently ${item.breaker.status}`} style={{cursor:"pointer"}}
            onClick={e=>{e.stopPropagation();onBreakerState(item.slot,item.breaker!.status==="ON"?"OFF":item.breaker!.status==="OFF"?"ON":"OFF");}}
            onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();onBreakerState(item.slot,item.breaker!.status==="ON"?"OFF":item.breaker!.status==="OFF"?"ON":"OFF");}}}>
            <rect x={left?x+111:x+15} y={y+3} width="32" height="37" rx="3" fill="#101b25" stroke="#83a1b5"/>
            <rect x={left?x+120:x+24} y={item.breaker.status==="ON"?y+7:item.breaker.status==="OFF"?y+23:y+15} width="14" height="12" rx="2" fill={item.breaker.status==="TRIPPED"?"#f7a55c":"#bbc9d2"} stroke="#d7e1e7"/>
            <text x={left?x+127:x+31} y={y+39} fontSize="7" fill={item.breaker.status==="TRIPPED"?"#ffb57b":"#c9d9e2"} textAnchor="middle">{item.breaker.status==="TRIPPED"?"TRIP":item.breaker.status}</text>
          </g>}
          <text x={left?x+15:x+57} y={y+17} fill={installed?"#f2f7fb":"#71899a"} fontSize="12" fontWeight="bold">{label}</text>
          <text x={left?x+15:x+57} y={y+32} fill="#a5bfcd" fontSize="10">POS {item.slot}</text>
          {installed&&breaker&&<title>{`Position ${item.slot}: ${label}, ${breaker.breakerType}. ${assignments.find(a=>a.slot===(owner?.slot??item.slot))?.name??"Unassigned"}`}</title>}
        </g>;
      })}
      {/* Branch cables enter via top knockouts, follow enclosure edges, and terminate at their saved destinations. */}
      {panelWires.filter(w=>w.terminal && slots.some(s=>s.slot===w.slot&&s.breaker)).map(wire=>{
        const index=wire.slot-1, left=index%2===0, row=Math.floor(index/2);
        const y=285+row*49;
        const neutral=wire.terminal?.startsWith("neutral-"), ground=wire.terminal?.startsWith("ground-");
        const hot=wire.terminal?.startsWith("breaker-");
        const terminalNum=Number(wire.terminal?.split("-")[1]??1);
        const terminalRow=Math.max(1,Math.min(rows,Number.isFinite(terminalNum)?terminalNum:1));
        const endX=neutral?75:ground?525:left?282:318;
        const endY=neutral||ground?309+(terminalRow-1)*49:y+22;
        const color=wire.conductor==="black"?"#15191c":wire.conductor==="red"?"#df484e":wire.conductor==="white"?"#f0f1ed":"#b7804b";
        const valid=wire.conductor==="white"?neutral:wire.conductor==="bare"?ground:wire.terminal===`breaker-${wire.slot}-hot-${wire.conductor==="red"?"b":"a"}`;
        const circuitIndex=Math.floor(index/2);
        const entryX=left?114:486;
        const entryY=43;
        const outerX=left?112+Math.min(15,circuitIndex*2):488-Math.min(15,circuitIndex*2);
        const laneX=left?119+Math.min(14,circuitIndex*2):481-Math.min(14,circuitIndex*2);
        const offset=wire.conductor==="black"?0:wire.conductor==="red"?4:wire.conductor==="white"?8:12;
        const corridorX=left?laneX+offset:laneX-offset;
        const approachY=hot?y+12:endY;
        const targetX=hot?(left?282:318):endX;
        const targetY=hot?y+22:endY;
        const path=`M ${entryX} ${entryY} L ${outerX} 70 L ${corridorX} 94 L ${corridorX} ${approachY} Q ${corridorX} ${targetY} ${corridorX+(targetX>corridorX?9:-9)} ${targetY} L ${targetX} ${targetY}`;
        return <g key={wire.id} aria-label={`${wire.conductor} wire from top entry for breaker ${wire.slot} to ${wire.terminal}`}>
          <path d={path} stroke="#0c1318" strokeWidth="8" fill="none" strokeLinejoin="round" strokeLinecap="round" pointerEvents="none"/>
          <path d={path} stroke={color} strokeWidth="4.5" fill="none" strokeLinejoin="round" strokeLinecap="round" pointerEvents="none"/>
          <circle cx={targetX} cy={targetY} r="5" fill={valid?"#9df1c3":"#ff805f"} stroke="#17202a" strokeWidth="2" pointerEvents="none"/>
          {!valid&&<text x={targetX+7} y={targetY-7} fill="#ff9a80" fontSize="12">!</text>}
          <title>{`Breaker #${wire.slot}: ${wire.conductor} → ${wire.terminal}${valid?"":" (check termination)"}`}</title>
        </g>;
      })}

    </svg>
    </div>
    {infoEnabled && activeInfo && <div role="status" aria-live="polite" style={{position:"fixed",right:24,bottom:24,margin:0,width:"min(360px,95%)",background:"#0c2638",border:"2px solid #38bde8",borderRadius:10,boxShadow:"0 8px 28px #000a",padding:14,zIndex:20,color:"#edf8ff",fontSize:13}}>
      <div style={{display:"flex",alignItems:"start",justifyContent:"space-between",gap:8}}><strong style={{color:"#6ee6ff",fontSize:15}}>{activeInfo.title}</strong><button type="button" aria-label="Close component information" onClick={hideInfo} style={{background:"transparent",color:"#fff",border:"1px solid #5a8ba3",borderRadius:4,cursor:"pointer"}}>✕</button></div>
      <p style={{margin:"9px 0 5px"}}><b>What is it?</b> {activeInfo.what}</p>
      <p style={{margin:"5px 0"}}><b>What does it do?</b> {activeInfo.purpose}</p>
      <p style={{margin:"5px 0 0",color:"#b6e3f5"}}><b>Classroom tip:</b> {activeInfo.tip}</p>
    </div>}
  </div>;
}
