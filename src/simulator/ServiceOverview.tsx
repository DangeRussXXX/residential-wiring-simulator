import CableWiringPanel, {PANEL_SOURCE_ID} from "./CableWiringPanel";
import EndToEndCircuitLab from "./EndToEndCircuitLab";
import RealisticPanel from "./RealisticPanel";
import ServiceConnectionView from "./ServiceConnectionView";
import BreakerWiringPopup from "./BreakerWiringPopup";
import { useState } from "react";
import type { ServiceProject } from "./projectWorkflow";
import { createBreakerPanel, installBreaker, removeBreaker } from "../electrical/breakerPanel";
import { createBreaker, type BreakerType } from "../electrical/breaker";

const frame: React.CSSProperties = { background: "#101b27", border: "1px solid #316681", borderRadius: 12, padding: 18, marginBottom: 14 };
const button: React.CSSProperties = { background: "#163c52", border: "1px solid #397b99", color: "#e7f7ff", borderRadius: 6, padding: "8px 12px", cursor: "pointer" };
const field: React.CSSProperties = { background: "#0b1824", color: "white", border: "1px solid #397b99", borderRadius: 5, padding: 8, maxWidth: "100%" };

export default function ServiceOverview({ project, onChange, onOpenDestination }: { project: ServiceProject; onChange: (next: ServiceProject) => void; onOpenDestination?: (areaId: string, wall: "NORTH" | "SOUTH" | "EAST" | "WEST") => void }) {
  const panelSections = ["connections", "install", "selected", "routing", "labs", "circuits"] as const;
  type SectionId = typeof panelSections[number];
  const [expanded, setExpanded] = useState<Record<SectionId, boolean>>({ connections: false, install: false, selected: true, routing: true, labs: false, circuits: false });
  const toggle = (id: SectionId) => setExpanded(p => ({...p, [id]: !p[id]}));
  const sectionHeader = (id: SectionId, label: string) => <button type="button" aria-expanded={expanded[id]} onClick={() => toggle(id)} style={{...button, width:"100%", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#12283a", padding:"12px 14px", fontWeight:700, fontSize:17, color:"#7fe3ff"}}><span>{label}</span><span aria-hidden="true">{expanded[id] ? "▾" : "▸"}</span></button>;
  const accordion = (id: SectionId, label: string, content: React.ReactNode) => <section style={{...frame,padding:10}}>{sectionHeader(id,label)}{expanded[id] && <div style={{padding:"14px 6px 4px"}}>{content}</div>}</section>;
  const [panelView, setPanelView] = useState<"realistic" | "schematic">("realistic");
  const [slot, setSlot] = useState(1);
  const [draggedBreaker, setDraggedBreaker] = useState<{ amps: number; poles: 1 | 2; kind: BreakerType } | null>(null);
  const [amps, setAmps] = useState(15);
  const [poles, setPoles] = useState<1 | 2>(1);
  const [kind, setKind] = useState<BreakerType>("STANDARD");
  const [selected, setSelected] = useState(1);
  const [wiringPopup, setWiringPopup] = useState<null | "wire" | "inspect">(null);
  const [selectedWallCable,setSelectedWallCable]=useState<string>("");
  const panel = project.distributionPanel ?? createBreakerPanel(`distribution-${project.id}`, "Main Distribution Panel", project.service.amperage, 24);
  const slots = panel.breakers;
  const unifiedHomeRuns=(project.wallCables??[]).filter(c=>c.from===PANEL_SOURCE_ID);
  const activeUnifiedCable=unifiedHomeRuns.find(c=>c.id===selectedWallCable)??unifiedHomeRuns.find(c=>c.breakerSlot===selected)??null;
  const visualUnifiedWires=unifiedHomeRuns.flatMap(c=>Object.entries(c.ends?.from??{}).flatMap(([wire,terminal])=>{
    if(!terminal||!c.breakerSlot)return [];
    const mapped=terminal==="breaker-hot"?`breaker-${c.breakerSlot}-hot-a`:terminal==="neutral-bar"?"neutral-1":terminal==="ground-bar"?"ground-1":null;
    if(!mapped)return [];
    return [{id:`unified-${c.id}-${wire}`,slot:c.breakerSlot,cable:c.type as "14/2 NM-B",conductor:(wire==="ground"?"bare":wire) as "black"|"white"|"red"|"bare",terminal:mapped}];
  }));
  const distributionMain = project.distributionMain;
  const installMain = (rating: number) => {
    if (rating > project.service.amperage) { window.alert("This training model does not allow a distribution main rating above the configured service rating."); return; }
    onChange({...project, distributionMain: {installed:true, amperage:rating, closed:true}});
  };
  const removeMain = () => onChange({...project, distributionMain: undefined});
  const active = slots.find(s => s.slot === selected);
  const assignments = project.circuitAssignments ?? [];
  const assignment = assignments.find(a => a.slot === selected);
  const saveAssignment = (name: string, areaIds: string[] = assignment?.areaIds ?? []) => onChange({ ...project, distributionPanel: panel, circuitAssignments: [...assignments.filter(a => a.slot !== selected), { ...assignment, slot: selected, name, areaIds }] });
  const saveDestination = (areaId: string, wall: "NORTH" | "SOUTH" | "EAST" | "WEST", cable: "14/2 NM-B" | "12/2 NM-B" | "14/3 NM-B" | "12/3 NM-B") => {
    const destinations = [...(assignment?.destinations ?? []).filter(d => !(d.areaId === areaId && d.wall === wall)), {areaId, wall, cable}];
    onChange({...project, distributionPanel: panel, circuitAssignments: [...assignments.filter(a => a.slot !== selected), { ...assignment, slot: selected, name: assignment?.name ?? "", areaIds: [...new Set([...(assignment?.areaIds ?? []),areaId])], destinations }]});
  };
  const installAt = (position: number, rating: number, poleCount: 1 | 2, protection: BreakerType) => {
    const target = slots.find(s => s.slot === position);
    if (!target || target.installed) { window.alert("That breaker position is occupied."); return; }
    // In this generic training panel, two-pole devices use the next modeled position.
    // Manufacturer-specific physical stab/phase compatibility is not modeled yet.
    if (poleCount === 2 && (!slots.find(s => s.slot === position + 1) || slots.find(s => s.slot === position + 1)?.installed)) {
      window.alert("This two-pole training breaker needs two free modeled positions."); return;
    }
    const breaker = createBreaker(`breaker-${project.id}-${position}`, position, rating, poleCount, protection);
    const next = installBreaker(panel, breaker);
    if (poleCount === 2) next.breakers = next.breakers.map(s => s.slot === position + 1 ? { ...s, installed: true, occupiedBy: breaker.id, breaker: null } : s);
    onChange({ ...project, distributionPanel: next });
    setSelected(position);
    setSlot(position);
  };
  const install = () => installAt(slot, amps, poles, kind);
  const breakerCatalog = ([15,20,25,30,40,50,60,70,80,90,100] as const).flatMap(rating =>
    (["STANDARD","AFCI","GFCI","DUAL_FUNCTION"] as BreakerType[]).flatMap(protection =>
      ([1,2] as const).filter(p => !(p === 1 && rating > 60)).map(poleCount => ({amps:rating, poles:poleCount, kind:protection}))
    )
  );
  const remove = () => {
    if (!active?.breaker) return;
    let next = removeBreaker(panel, selected);
    next = { ...next, breakers: next.breakers.map(s => s.occupiedBy === active.breaker?.id ? { ...s, installed: false, occupiedBy: undefined, breaker: null } : s) };
    onChange({ ...project, distributionPanel: next, circuitAssignments: assignments.filter(a => a.slot !== selected), panelWires: (project.panelWires ?? []).filter(w => w.slot !== selected) });
  };
  const changeBreakerState = (position: number, status: "ON" | "OFF" | "TRIPPED") => {
    const target = slots.find(s => s.slot === position)?.breaker;
    if (!target) return;
    if (target.status === "TRIPPED" && status === "ON") return;
    onChange({...project, distributionPanel:{...panel, breakers:slots.map(s=>s.slot===position&&s.breaker?{...s,breaker:{...s.breaker,status,energized:status==="ON",tripped:status==="TRIPPED"}}:s)}});
  };
  return <div style={{ color: "#e9f7ff", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
    <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",marginBottom:14}}>
      <h2 style={{margin:0,color:"#79e2ff"}}>⚡ Service & Panel Workspace</h2>
      <div role="group" aria-label="Panel view" style={{display:"flex",gap:8}}>
        <button type="button" aria-pressed={panelView==="schematic"} style={{...button,background:panelView==="schematic"?"#17658b":"#142c3b"}} onClick={()=>setPanelView("schematic")}>Schematic View</button>
        <button type="button" aria-pressed={panelView==="realistic"} style={{...button,background:panelView==="realistic"?"#17658b":"#142c3b"}} onClick={()=>setPanelView("realistic")}>Realistic Panel View</button>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"minmax(400px, 1.6fr) minmax(360px, .85fr)",gap:16,alignItems:"start",width:"100%"}} className="nova-service-grid">
      <div style={{minWidth:0,alignSelf:"start"}}>
        <h3 style={{color:"#79e2ff",margin:"0 0 10px"}}>Main Distribution Panel</h3>
        {panelView === "realistic" ? <RealisticPanel
          slots={slots}
          selected={selected}
          assignments={assignments}
          onSelect={setSelected}
          onDropBreaker={(position) => {
            if (draggedBreaker) {
              installAt(position, draggedBreaker.amps, draggedBreaker.poles, draggedBreaker.kind);
              setDraggedBreaker(null);
            }
          }}
          canDrop={!!draggedBreaker}
          mainBreaker={distributionMain}
          panelWires={[...(project.panelWires ?? []),...visualUnifiedWires]}
          onBreakerState={changeBreakerState}
          onMainDrop={(rating) => installMain(rating)}
        /> :         <div style={{ background: "#25313b", padding: 14, border: "3px solid #63717c", borderRadius: 10 }}>
          <div style={{ background: "#151e28", padding: 12, textAlign: "center", marginBottom: 10, borderRadius: 6 }}><strong>MAIN DISTRIBUTION</strong><div style={{ fontSize: 12, color: "#8cb8cb" }}>Feeder: L1 · L2 · Neutral · Equipment Ground</div></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {slots.map(s => <button key={s.slot} onClick={() => setSelected(s.occupiedBy ? (slots.find(x => x.breaker?.id === s.occupiedBy)?.slot ?? s.slot) : s.slot)} onDragOver={e => { if (draggedBreaker) e.preventDefault(); }}
              onDrop={e => { e.preventDefault(); if (draggedBreaker) { installAt(s.slot, draggedBreaker.amps, draggedBreaker.poles, draggedBreaker.kind); setDraggedBreaker(null); } }}
              style={{ ...button, textAlign: "left", minHeight: 66, background: selected === s.slot ? "#155a79" : s.installed ? "#202b34" : "#121c25", borderColor: selected === s.slot ? "#69ddff" : "#465764" }}>
              <div style={{ color: "#94b4c4", fontSize: 11 }}>POSITION {s.slot}</div>
              <strong>{s.breaker ? `${s.breaker.amperage}A · ${s.breaker.poles}P` : s.occupiedBy ? "2-pole continuation" : "EMPTY"}</strong>
              {s.breaker && <div style={{ fontSize: 11, color: "#b2d9e8", overflowWrap: "anywhere" }}>{assignments.find(a => a.slot === s.slot)?.name || "Unassigned circuit"}</div>}
            </button>)}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}><div style={{ ...button, flex: 1, textAlign: "center" }}>NEUTRAL BAR (isolated)</div><div style={{ ...button, flex: 1, textAlign: "center" }}>GROUND BAR</div></div>
        </div>}

      </div>
      <div style={{minWidth:0,display:"flex",flexDirection:"column",gap:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6}}>
          <strong style={{color:"#79e2ff",fontSize:18}}>Service & Breaker Controls</strong>
          <div style={{display:"flex",gap:8}}>
            <button style={button} onClick={()=>setExpanded(()=>Object.fromEntries(panelSections.map(id=>[id,true])) as Record<SectionId,boolean>)}>Show All</button>
            <button style={button} onClick={()=>setExpanded(()=>Object.fromEntries(panelSections.map(id=>[id,false])) as Record<SectionId,boolean>)}>Hide All</button>
          </div>
        </div>
        {accordion("connections", "Service Connections · Lugs & Feeder", <ServiceConnectionView project={project} />)}

    {accordion("install", "Breaker Library · Drag into Empty Slots", <>
      <div style={{border:"1px solid #376a84",padding:12,borderRadius:8,marginBottom:12}}>
        <strong style={{color:"#8be4ff"}}>Main Breaker Library — Dedicated Main Position</strong>
        <p style={{fontSize:12,color:"#b6cfdd"}}>Optional distribution-panel main breaker. This is separate from your existing upstream 200A service disconnect. Select a rating or drag the main-breaker card to the dedicated MAIN position on the realistic panel.</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {[60,100,125,150,200].filter(r=>r<=project.service.amperage).map(r=><button key={r} type="button" draggable onDragStart={e=>{e.dataTransfer.setData("application/x-nova-main-breaker",String(r));e.dataTransfer.setData("text/plain",`Main breaker ${r}A`);}} onClick={()=>installMain(r)} style={button}>▣ {r}A · 2-pole MAIN</button>)}
        </div>
        {distributionMain?.installed && <div style={{marginTop:10,fontSize:12}}>Installed: {distributionMain.amperage}A · {distributionMain.closed?"CLOSED":"OPEN"} <button type="button" style={{...button,marginLeft:8}} onClick={()=>onChange({...project,distributionMain:{...distributionMain,closed:!distributionMain.closed}})}>Toggle simulated handle</button> <button type="button" style={{...button,marginLeft:8}} onClick={removeMain}>Remove main</button></div>}
      </div>
      <p style={{fontSize:12,color:"#b2cbd8",marginTop:0}}>Drag a breaker onto an empty position at left. You can also select a breaker below, choose a position, and click Install (keyboard/touch alternative). These are generic training models; panel listing and physical bus compatibility are not yet verified.</p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
        <label>Position <select style={field} value={slot} onChange={e=>setSlot(Number(e.target.value))}>{slots.filter(s=>!s.installed).map(s=><option key={s.slot} value={s.slot}>{s.slot}</option>)}</select></label>
        <button style={button} onClick={install}>Install selected breaker</button>
      </div>
      <div style={{maxHeight:320,overflowY:"auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:7}}>
        {breakerCatalog.map(item=><button type="button" key={`${item.amps}-${item.poles}-${item.kind}`} draggable
          onDragStart={e=>{setDraggedBreaker(item); e.dataTransfer.effectAllowed="copy";e.dataTransfer.setData("text/plain",`${item.amps}A ${item.poles}P ${item.kind}`);}}
          onDragEnd={()=>setDraggedBreaker(null)}
          onClick={()=>{setAmps(item.amps);setPoles(item.poles);setKind(item.kind);}}
          style={{...button,textAlign:"left",background:amps===item.amps&&poles===item.poles&&kind===item.kind?"#155a79":"#142938",display:"flex",gap:9,alignItems:"center"}}>
          <span aria-hidden="true" style={{background:"#293843",border:"2px solid #8fa6b5",borderRadius:4,padding:"8px 5px",fontSize:11,whiteSpace:"nowrap"}}>▣ {item.poles}P</span>
          <span><strong>{item.amps}A</strong><br/><span style={{fontSize:11}}>{item.kind.replace("_"," ")}</span></span>
        </button>)}
      </div>
    </>)}
    {accordion("selected", `Selected Breaker · Position ${selected}`, <>          <h3 style={{ color: "#86e1ff" }}>Selected position {selected}</h3>
          {active?.breaker ? <>
            <div style={{ marginBottom: 12 }}>{active.breaker.amperage}A · {active.breaker.poles}-pole · {active.breaker.breakerType}</div>
            <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",marginBottom:12}}>
              <strong>Breaker: {active.breaker.status}</strong>
              <button style={button} disabled={active.breaker.status==="TRIPPED"} onClick={()=>changeBreakerState(selected,"ON")}>ON</button>
              <button style={button} onClick={()=>changeBreakerState(selected,"OFF")}>OFF / RESET</button>
              <button style={button} onClick={()=>changeBreakerState(selected,"TRIPPED")}>Simulate TRIP</button>
              <small style={{color:"#9fc3d5"}}>After a trip, move to OFF before ON.</small>
            </div>
            <label style={{ display: "block", marginBottom: 10 }}>Circuit name <input style={{ ...field, width: "100%", display: "block", marginTop: 5 }} value={assignment?.name ?? ""} placeholder="e.g. Bedroom 1 receptacles" onChange={e => saveAssignment(e.target.value)} /></label>
            <strong style={{ display: "block", marginBottom: 8 }}>Areas served (directory labels)</strong>
            {project.areas.length ? project.areas.map(area => <label key={area.id} style={{ display: "block", marginBottom: 8 }}><input type="checkbox" checked={assignment?.areaIds.includes(area.id) ?? false} onChange={e => saveAssignment(assignment?.name ?? "", e.target.checked ? [...(assignment?.areaIds ?? []), area.id] : (assignment?.areaIds ?? []).filter(id => id !== area.id))}/> {area.name}</label>) : <p style={{ color: "#9db5c3" }}>Add a room to assign an area to this breaker.</p>}
            <button style={{ ...button, borderColor: "#a45d5d", color: "#ffc4c4" }} onClick={remove}>Remove breaker</button>
          </> : <p style={{ color: "#b3c5cf" }}>Select an installed breaker position to name its circuit and associate rooms.</p>}
        </>)}
    <section style={{...frame,padding:10}}>
      <h3 style={{color:"#8beaff",margin:"0 0 10px"}}>🔌 Home-Run Connections · Shared Wiring</h3>
      {unifiedHomeRuns.length===0?<p style={{fontSize:16}}>No new-style home runs yet. Open a wall and use Start Home Run from Panel P1.</p>:<>
        <label style={{display:"block",fontSize:17,marginBottom:10}}>Select home run
          <select style={{...field,display:"block",width:"100%",fontSize:17}} value={activeUnifiedCable?.id??""} onChange={e=>setSelectedWallCable(e.target.value)}>
            {unifiedHomeRuns.map(c=><option key={c.id} value={c.id}>Breaker #{c.breakerSlot??"?"} → {c.toName??"Device"} · {c.type}</option>)}
          </select>
        </label>
        {activeUnifiedCable&&<CableWiringPanel key={activeUnifiedCable.id} cable={activeUnifiedCable} devices={[]}
          allCables={project.wallCables??[]} onChangeCables={next=>onChange({...project,wallCables:next})}
          onChange={next=>onChange({...project,wallCables:(project.wallCables??[]).map(c=>c.id===next.id?next:c)})}
          onRemove={()=>{
            if(!window.confirm("Remove this home run from the wall and panel?"))return;
            onChange({...project,wallCables:(project.wallCables??[]).filter(c=>c.id!==activeUnifiedCable.id)});
            setSelectedWallCable("");
          }}/>} 
        <p style={{fontSize:14,color:"#a7c8d6"}}>Panel terminations here also appear on the realistic breaker panel. Switch terminations remain visible on the wall.</p>
      </>}
    </section>
    {accordion("routing", `Circuit Routing & Wiring · Breaker #${selected}`, <>
      {!active?.breaker ? <p>Select an installed breaker first.</p> : <>            <div style={{borderTop:"1px solid #35566a",margin:"14px 0",paddingTop:12}}>
              <strong style={{display:"block",color:"#81e5ff",marginBottom:8}}>Circuit destinations — room / wall</strong>
              <p style={{fontSize:12,color:"#b3c9d5"}}>Assign a room and wall, then start initial wiring below. Once the cable exists, edit or troubleshoot it beside the route. The realistic panel will display saved connections.</p>
              {project.areas.length ? project.areas.map(area => <div key={area.id} style={{border:"1px solid #2f4e62",padding:8,marginBottom:8,borderRadius:6}}>
                <strong>{area.name}</strong>
                {(["NORTH","SOUTH","EAST","WEST"] as const).map(wall => {
                  const d=assignment?.destinations?.find(x=>x.areaId===area.id&&x.wall===wall);
                  return <div key={wall} style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginTop:6,fontSize:12}}>
                    <span style={{minWidth:56}}>{wall}</span>
                    <select style={field} value={d?.cable ?? "14/2 NM-B"} onChange={e=>saveDestination(area.id,wall,e.target.value as "14/2 NM-B" | "12/2 NM-B" | "14/3 NM-B" | "12/3 NM-B")}>
                      {["14/2 NM-B","12/2 NM-B","14/3 NM-B","12/3 NM-B"].map(c=><option key={c}>{c}</option>)}
                    </select>
                    <button style={button} onClick={()=>saveDestination(area.id,wall,d?.cable ?? "14/2 NM-B")}>{d?"Update route":"Add route"}</button>
                    {d&&<button style={button} onClick={()=>onOpenDestination?.(area.id,wall)}>Open wall →</button>}
                    {d&&(project.panelWires??[]).some(w=>w.slot===selected)&&<>
                      <button style={button} onClick={()=>setWiringPopup("wire")}>Wire / Edit</button>
                      <button style={button} onClick={()=>setWiringPopup("inspect")}>Troubleshoot</button>
                    </>}
                  </div>;
                })}
              </div>) : <p>Add a room in Project Explorer first.</p>}
            </div>
</>}
      {active?.breaker && <div style={{borderTop:"1px solid #35566a",paddingTop:12}}>
        <strong style={{color:"#81e5ff"}}>Breaker #{selected} · Virtual conductors</strong>
        <p style={{fontSize:12,color:"#b3c9d5"}}>Start with a cable, then use Wire / Edit or Troubleshoot. No separate miniature panel.</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {(project.panelWires??[]).some(w=>w.slot===selected)?<>
            <button style={button} onClick={()=>setWiringPopup("wire")}>Wire / Edit</button>
            <button style={button} onClick={()=>setWiringPopup("inspect")}>Troubleshoot</button>
          </>:<button style={button} onClick={()=>setWiringPopup("wire")}>Start initial wiring</button>}
        </div>
      </div>}
    </>)}

    {accordion("labs", "Wiring Labs · Training Exercises", <>
      <EndToEndCircuitLab project={project} onChange={onChange} />
      <h3 style={{color:"#84e4ff",marginTop:0}}>Practice: 120V Branch Circuit</h3>
      <p>Select a breaker, add a training cable in <strong>Circuit Routing & Wiring</strong>, then open Wire / Edit to terminate each conductor. Use Troubleshoot to inspect the exercise.</p>
      <p style={{fontSize:12,color:"#aac7d7"}}>Training-only: panel feeder and room wiring are not electrically connected to the solver yet. Never use this display as instructions for working on energized service equipment.</p>
      <button style={button} onClick={()=>setExpanded(p=>({...p,routing:true}))}>Open Circuit Routing & Wiring ↓</button>
    </>)}
    {accordion("circuits", "Project Circuit Directory", <><h3 style={{ marginTop: 0, color: "#86e1ff" }}>Project Circuit Directory</h3>
      {slots.filter(s => s.breaker).length === 0 ? <p>No breakers installed yet.</p> : slots.filter(s => s.breaker).map(s => <div key={s.slot} style={{ padding: "9px 0", borderBottom: "1px solid #2e4b5c" }}><strong>#{s.slot} · {s.breaker?.amperage}A</strong> — {assignments.find(a => a.slot === s.slot)?.name || "Unassigned"}<div style={{ fontSize: 12, color: "#99b9c8" }}>{(assignments.find(a => a.slot === s.slot)?.areaIds ?? []).map(id => project.areas.find(a => a.id === id)?.name).filter(Boolean).join(", ") || "No rooms assigned"}</div></div>)}
    </>)}
      </div>
    </div>
    {wiringPopup&&<BreakerWiringPopup key={`${selected}-${wiringPopup}`} project={project} slot={selected} mode={wiringPopup} onChange={onChange} onClose={()=>setWiringPopup(null)} />}
    <style>{`@media (max-width: 1050px) { .nova-service-grid { grid-template-columns: minmax(0,1fr) !important; } }`}</style>
  </div>;
}
