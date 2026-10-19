import { useState } from "react";
import type { ServiceProject } from "./projectWorkflow";
import { createBreakerPanel, installBreaker, removeBreaker } from "../electrical/breakerPanel";
import { createBreaker, type BreakerType } from "../electrical/breaker";

const frame: React.CSSProperties = { background: "#101b27", border: "1px solid #316681", borderRadius: 12, padding: 18, marginBottom: 14 };
const button: React.CSSProperties = { background: "#163c52", border: "1px solid #397b99", color: "#e7f7ff", borderRadius: 6, padding: "8px 12px", cursor: "pointer" };
const field: React.CSSProperties = { background: "#0b1824", color: "white", border: "1px solid #397b99", borderRadius: 5, padding: 8, maxWidth: "100%" };

export default function ServiceOverview({ project, onChange }: { project: ServiceProject; onChange: (next: ServiceProject) => void }) {
  const [slot, setSlot] = useState(1);
  const [amps, setAmps] = useState(15);
  const [poles, setPoles] = useState<1 | 2>(1);
  const [kind, setKind] = useState<BreakerType>("STANDARD");
  const [selected, setSelected] = useState(1);
  const panel = project.distributionPanel ?? createBreakerPanel(`distribution-${project.id}`, "Main Distribution Panel", project.service.amperage, 24);
  const slots = panel.breakers;
  const active = slots.find(s => s.slot === selected);
  const assignments = project.circuitAssignments ?? [];
  const assignment = assignments.find(a => a.slot === selected);
  const saveAssignment = (name: string, areaIds: string[] = assignment?.areaIds ?? []) => onChange({ ...project, distributionPanel: panel, circuitAssignments: [...assignments.filter(a => a.slot !== selected), { slot: selected, name, areaIds }] });
  const install = () => {
    if (slots.find(s => s.slot === slot)?.installed) { window.alert("That breaker position is already occupied."); return; }
    if (poles === 2 && (slot >= slots.length || slots.find(s => s.slot === slot + 1)?.installed)) { window.alert("Select two available adjacent positions for this conceptual two-pole breaker."); return; }
    const breaker = createBreaker(`breaker-${project.id}-${slot}`, slot, amps, poles, kind);
    const next = installBreaker(panel, breaker);
    // Reserve the second position. The electrical engine will receive physical bus-stab validation in a later update.
    if (poles === 2) next.breakers = next.breakers.map(s => s.slot === slot + 1 ? { ...s, installed: true, occupiedBy: breaker.id, breaker: null } : s);
    onChange({ ...project, distributionPanel: next }); setSelected(slot);
  };
  const remove = () => {
    if (!active?.breaker) return;
    let next = removeBreaker(panel, selected);
    next = { ...next, breakers: next.breakers.map(s => s.occupiedBy === active.breaker?.id ? { ...s, installed: false, occupiedBy: undefined, breaker: null } : s) };
    onChange({ ...project, distributionPanel: next, circuitAssignments: assignments.filter(a => a.slot !== selected) });
  };
  const node = (name: string, detail: string) => <div style={{ flex: 1, minWidth: 140, padding: 14, border: "1px solid #386b88", borderRadius: 8, textAlign: "center", background: "#0b1926" }}><strong>{name}</strong><div style={{ color: "#a4c7d7", fontSize: 12, marginTop: 6 }}>{detail}</div></div>;
  return <div style={{ color: "#e9f7ff", maxWidth: 1200, margin: "0 auto" }}>
    <section style={frame}>
      <h2 style={{ color: "#65dbff", marginTop: 0 }}>⚡ Electrical Service · {project.service.amperage}A</h2>
      <div style={{ display: "flex", alignItems: "stretch", gap: 8, flexWrap: "wrap" }}>
        {node("UTILITY", project.service.route === "UNDERGROUND" ? "Underground lateral" : "Overhead service drop")}
        {node("METER", project.service.meterLocation)}
        {node("SERVICE DISCONNECT", `${project.service.amperage}A · ${project.service.mainDisconnectClosed ? "CLOSED" : "OPEN"}`)}
        {node("DISTRIBUTION PANEL", "120/240V · L1 / L2 / N / G")}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
        <button style={button} onClick={() => onChange({ ...project, service: { ...project.service, mainDisconnectClosed: !project.service.mainDisconnectClosed } })}>{project.service.mainDisconnectClosed ? "Open simulated disconnect" : "Close simulated disconnect"}</button>
        <strong style={{ color: project.service.mainDisconnectClosed ? "#8bebb3" : "#ffc39b" }}>Downstream supply: {project.service.mainDisconnectClosed ? "ON" : "OFF"} (diagram only)</strong>
      </div>
      <p style={{ fontSize: 12, color: "#b1c4ce" }}>Training model: the disconnect display does not yet control the circuit solver. Upstream service conductors may remain energized. This is separate service disconnect equipment; the downstream distribution panel is modeled with isolated neutral and ground bars.</p>
    </section>
    <section style={frame}>
      <h2 style={{ marginTop: 0, color: "#65dbff" }}>Main Distribution Panel — Breaker Directory</h2>
      <p style={{ color: "#a8c6d3" }}>Install breakers here, not on bedroom walls. Circuit names and room assignments are saved with this project. Connections to actual wall conductors are a later phase.</p>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) minmax(260px, 1fr)", gap: 18 }}>
        <div style={{ background: "#25313b", padding: 14, border: "3px solid #63717c", borderRadius: 10 }}>
          <div style={{ background: "#151e28", padding: 12, textAlign: "center", marginBottom: 10, borderRadius: 6 }}><strong>MAIN DISTRIBUTION</strong><div style={{ fontSize: 12, color: "#8cb8cb" }}>Feeder: L1 · L2 · Neutral · Equipment Ground</div></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {slots.map(s => <button key={s.slot} onClick={() => setSelected(s.occupiedBy ? (slots.find(x => x.breaker?.id === s.occupiedBy)?.slot ?? s.slot) : s.slot)} style={{ ...button, textAlign: "left", minHeight: 66, background: selected === s.slot ? "#155a79" : s.installed ? "#202b34" : "#121c25", borderColor: selected === s.slot ? "#69ddff" : "#465764" }}>
              <div style={{ color: "#94b4c4", fontSize: 11 }}>POSITION {s.slot}</div>
              <strong>{s.breaker ? `${s.breaker.amperage}A · ${s.breaker.poles}P` : s.occupiedBy ? "2-pole continuation" : "EMPTY"}</strong>
              {s.breaker && <div style={{ fontSize: 11, color: "#b2d9e8", overflowWrap: "anywhere" }}>{assignments.find(a => a.slot === s.slot)?.name || "Unassigned circuit"}</div>}
            </button>)}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}><div style={{ ...button, flex: 1, textAlign: "center" }}>NEUTRAL BAR (isolated)</div><div style={{ ...button, flex: 1, textAlign: "center" }}>GROUND BAR</div></div>
        </div>
        <div>
          <h3 style={{ color: "#86e1ff", marginTop: 0 }}>Install a breaker</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            <label>Position <select style={field} value={slot} onChange={e => setSlot(Number(e.target.value))}>{slots.filter(s => !s.installed).map(s => <option key={s.slot} value={s.slot}>{s.slot}</option>)}</select></label>
            <label>Rating <select style={field} value={amps} onChange={e => setAmps(Number(e.target.value))}>{[15,20,25,30,40,50,60].map(n => <option key={n} value={n}>{n}A</option>)}</select></label>
            <label>Poles <select style={field} value={poles} onChange={e => setPoles(Number(e.target.value) as 1 | 2)}><option value={1}>1 pole</option><option value={2}>2 pole</option></select></label>
            <label>Protection <select style={field} value={kind} onChange={e => setKind(e.target.value as BreakerType)}><option value="STANDARD">Standard</option><option value="AFCI">AFCI</option><option value="GFCI">GFCI</option><option value="DUAL_FUNCTION">Dual function</option></select></label>
          </div>
          <button style={button} onClick={install}>+ Install in panel</button>
          <hr style={{ borderColor: "#395466", margin: "22px 0" }}/>
          <h3 style={{ color: "#86e1ff" }}>Selected position {selected}</h3>
          {active?.breaker ? <>
            <div style={{ marginBottom: 12 }}>{active.breaker.amperage}A · {active.breaker.poles}-pole · {active.breaker.breakerType}</div>
            <label style={{ display: "block", marginBottom: 10 }}>Circuit name <input style={{ ...field, width: "100%", display: "block", marginTop: 5 }} value={assignment?.name ?? ""} placeholder="e.g. Bedroom 1 receptacles" onChange={e => saveAssignment(e.target.value)} /></label>
            <strong style={{ display: "block", marginBottom: 8 }}>Areas served (directory labels)</strong>
            {project.areas.length ? project.areas.map(area => <label key={area.id} style={{ display: "block", marginBottom: 8 }}><input type="checkbox" checked={assignment?.areaIds.includes(area.id) ?? false} onChange={e => saveAssignment(assignment?.name ?? "", e.target.checked ? [...(assignment?.areaIds ?? []), area.id] : (assignment?.areaIds ?? []).filter(id => id !== area.id))}/> {area.name}</label>) : <p style={{ color: "#9db5c3" }}>Add a room to assign an area to this breaker.</p>}
            <button style={{ ...button, borderColor: "#a45d5d", color: "#ffc4c4" }} onClick={remove}>Remove breaker</button>
          </> : <p style={{ color: "#b3c5cf" }}>Select an installed breaker position to name its circuit and associate rooms.</p>}
        </div>
      </div>
    </section>
    <section style={frame}><h3 style={{ marginTop: 0, color: "#86e1ff" }}>Project Circuit Directory</h3>
      {slots.filter(s => s.breaker).length === 0 ? <p>No breakers installed yet.</p> : slots.filter(s => s.breaker).map(s => <div key={s.slot} style={{ padding: "9px 0", borderBottom: "1px solid #2e4b5c" }}><strong>#{s.slot} · {s.breaker?.amperage}A</strong> — {assignments.find(a => a.slot === s.slot)?.name || "Unassigned"}<div style={{ fontSize: 12, color: "#99b9c8" }}>{(assignments.find(a => a.slot === s.slot)?.areaIds ?? []).map(id => project.areas.find(a => a.id === id)?.name).filter(Boolean).join(", ") || "No rooms assigned"}</div></div>)}
    </section>
  </div>;
}
