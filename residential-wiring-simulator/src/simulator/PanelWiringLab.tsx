import { useState } from "react";
import type { PanelWire, ServiceProject } from "./projectWorkflow";

const styles = {
  card: { background: "#111f2d", border: "1px solid #3a6a83", borderRadius: 10, padding: 14 } as React.CSSProperties,
  button: { background: "#18465d", color: "#e8f9ff", border: "1px solid #428ca9", padding: "8px 11px", borderRadius: 6, cursor: "pointer" } as React.CSSProperties,
};
const wireColors: Record<PanelWire["conductor"], string> = { black: "#252525", red: "#d94242", white: "#f2f2e9", bare: "#bb864b" };
const names: Record<PanelWire["conductor"], string> = { black: "Black — ungrounded", red: "Red — ungrounded", white: "White — neutral", bare: "Bare — equipment ground" };
type Cable = PanelWire["cable"];
const conductors = (cable: Cable): PanelWire["conductor"][] => cable.includes("/3") ? ["black", "red", "white", "bare"] : ["black", "white", "bare"];
const validTerminal = (wire: PanelWire, terminal: string, poles: number) => {
  if (wire.conductor === "white") return terminal.startsWith("neutral-");
  if (wire.conductor === "bare") return terminal.startsWith("ground-");
  if (wire.conductor === "black") return terminal === `breaker-${wire.slot}-hot-a`;
  return poles === 2 && terminal === `breaker-${wire.slot}-hot-b`;
};
export default function PanelWiringLab({ project, selectedSlot, onChange }: { project: ServiceProject; selectedSlot: number; onChange: (p: ServiceProject) => void }) {
  const [cable, setCable] = useState<Cable>("14/2 NM-B");
  const [selectedWire, setSelectedWire] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("Select a conductor, then click its terminal inside the panel.");
  const [showHints, setShowHints] = useState(true);
  const [inspection, setInspection] = useState<string[]>([]);
  const breaker = project.distributionPanel?.breakers.find(s => s.slot === selectedSlot)?.breaker;
  const wires = project.panelWires ?? [];
  const active = wires.filter(w => w.slot === selectedSlot);
  const selected = wires.find(w => w.id === selectedWire);
  const destinations = project.circuitAssignments?.find(a => a.slot === selectedSlot)?.destinations ?? [];
  const setWires = (next: PanelWire[]) => onChange({ ...project, panelWires: next });
  const createCable = () => {
    if (!breaker) return;
    const old = wires.filter(w => w.slot !== selectedSlot);
    const fresh = conductors(cable).map(conductor => ({ id: `${selectedSlot}-${conductor}`, slot: selectedSlot, cable, conductor, terminal: null } as PanelWire));
    setWires([...old, ...fresh]); setSelectedWire(null); setInspection([]);
    setFeedback(`${cable} created. Select a conductor to terminate. Existing terminations for this breaker were reset.`);
  };
  const terminate = (terminal: string) => {
    if (!selected) { setFeedback("Select a conductor first."); return; }
    const occupied = wires.some(w => w.id !== selected.id && w.terminal === terminal);
    if (occupied) { setFeedback("That training terminal is occupied. Choose an unused terminal."); return; }
    setWires(wires.map(w => w.id === selected.id ? { ...w, terminal } : w));
    setInspection([]); setFeedback(`${names[selected.conductor]} connected to ${terminal.replaceAll("-", " ")}. Run inspection to check it.`);
    setSelectedWire(null);
  };
  const inspect = () => {
    const issues: string[] = [];
    if (!breaker) issues.push("Install and select a breaker first.");
    if (!active.length) issues.push("Add a cable to this breaker.");
    for (const wire of active) {
      if (!wire.terminal) issues.push(`${names[wire.conductor]} is not terminated.`);
      else if (!validTerminal(wire, wire.terminal, breaker?.poles ?? 1)) issues.push(`${names[wire.conductor]} is connected to an incorrect terminal (${wire.terminal}).`);
    }
    if (breaker?.poles === 1 && active.some(w => w.conductor === "red")) issues.push("Red conductor is unused in this one-pole exercise. Cap and isolate it in a future conductor-management lesson; do not land it on this breaker.");
    if (breaker?.poles === 2 && !active.some(w => w.conductor === "red")) issues.push("This two-pole exercise requires a second ungrounded conductor (choose a /3 cable). This is a simplified training rule, not a general cable-selection rule.");
    if (!destinations.length) issues.push("No room/wall destination assigned yet. This does not prevent panel practice.");
    setInspection(issues.length ? issues : ["PASS: All modeled conductors have suitable terminal types. This does not establish real-world installation compliance or circuit continuity."]);
  };
  const terminalButton = (id: string, x: number, y: number, label: string, color: string) => {
    const occupant = wires.find(w => w.terminal === id);
    return <g key={id} onClick={() => terminate(id)} style={{ cursor: "pointer" }} role="button" tabIndex={0} aria-label={`Connect selected conductor to ${label}`} onKeyDown={e => { if (e.key === "Enter") terminate(id); }}>
      <circle cx={x} cy={y} r={11} fill={occupant ? wireColors[occupant.conductor] : "#d6b98a"} stroke={selected ? "#69f1ff" : "#a9b9c4"} strokeWidth={selected ? 3 : 1.8}/>
      <circle cx={x} cy={y} r={3.2} fill="#3c3a37"/>
      <text x={x} y={y-16} textAnchor="middle" fontSize="10" fill={color}>{label}</text>
    </g>;
  };
  return <section style={{ ...styles.card, marginTop: 16 }}>
    <h2 style={{ margin: "0 0 6px", color: "#69dbff" }}>Panel Wiring Lab — Breaker #{selectedSlot}</h2>
    <p style={{ fontSize: 12, color: "#c4d6e2" }}>Virtual de-energized practice: select a conductor and click a specific breaker, neutral, or equipment-ground terminal. These are training-only terminations, not actual electrical connections.</p>
    {!breaker ? <p style={{ color: "#ffd18a" }}>Select an installed breaker in the directory above to begin.</p> : <>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <label>New cable <select value={cable} onChange={e => setCable(e.target.value as Cable)} style={{ ...styles.button, marginLeft: 7 }}>{["14/2 NM-B", "14/3 NM-B", "12/2 NM-B", "12/3 NM-B"].map(x => <option key={x}>{x}</option>)}</select></label>
        <button style={styles.button} onClick={createCable}>{active.length ? "Replace training cable" : "Add training cable"}</button>
        <label><input type="checkbox" checked={showHints} onChange={e => setShowHints(e.target.checked)}/> Show terminal hints</label>
        <button style={styles.button} onClick={inspect}>Inspect terminations</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(290px, 1.2fr) minmax(230px, 1fr)", gap: 14, alignItems: "start" }}>
        <div style={{ ...styles.card, padding: 7, overflowX: "auto" }}>
          <svg viewBox="0 0 510 560" style={{ display: "block", width: "100%", minWidth: 300 }} role="img" aria-label="Interactive downstream distribution panel with feeder lugs, bus stabs, branch breakers, isolated neutral and equipment-ground terminal bars">
            <rect x="17" y="10" width="476" height="535" rx="11" fill="#737d84" stroke="#c1cbd2" strokeWidth="5"/>
            <rect x="32" y="26" width="446" height="502" rx="6" fill="#202932" stroke="#465766" strokeWidth="3"/>
            <text x="255" y="48" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#e3edf2">DOWNSTREAM DISTRIBUTION PANEL</text>
            <text x="255" y="65" textAnchor="middle" fontSize="11" fill="#a4c8dc">Feeder lugs and isolated neutral / ground bars</text>
            <path d="M195 107 V476" stroke="#a45d51" strokeWidth="15"/><path d="M312 107 V476" stroke="#647eb4" strokeWidth="15"/>
            <rect x="152" y="85" width="87" height="45" rx="5" fill="#303a43" stroke="#8196a5"/><rect x="270" y="85" width="87" height="45" rx="5" fill="#303a43" stroke="#8196a5"/>
            <text x="195" y="103" textAnchor="middle" fontSize="11" fill="white">FEEDER L1</text><text x="313" y="103" textAnchor="middle" fontSize="11" fill="white">FEEDER L2</text>
            <circle cx="195" cy="119" r="10" fill="#d6b98a" stroke="#8697a2" strokeWidth="2"/><circle cx="313" cy="119" r="10" fill="#d6b98a" stroke="#8697a2" strokeWidth="2"/>
            {Array.from({ length: 8 }, (_, i) => <g key={i}>
              <rect x="213" y={165+i*40} width="84" height="33" rx="3" fill="#101820" stroke="#7d8d99"/>
              <rect x="239" y={171+i*40} width="32" height="20" rx="2" fill="#3f4e5b"/>
              <text x="255" y={185+i*40} fontSize="10" textAnchor="middle" fill="#d5e5ef">{i*2+1} / {i*2+2}</text>
            </g>)}
            <rect x="66" y="158" width="82" height="329" rx="5" fill="#364650" stroke="#b4c5cf"/>
            <text x="107" y="177" fontSize="11" fill="white" textAnchor="middle">NEUTRAL</text>
            <rect x="362" y="158" width="82" height="329" rx="5" fill="#364650" stroke="#b4c5cf"/>
            <text x="403" y="177" fontSize="11" fill="white" textAnchor="middle">GROUND</text>
            {Array.from({length:8},(_,i) => <g key={i}>
              {terminalButton(`neutral-${i+1}`,107,208+i*36,showHints?`N${i+1}`:"", "#f3f5f7")}
              {terminalButton(`ground-${i+1}`,403,208+i*36,showHints?`G${i+1}`:"", "#b8f1c4")}
            </g>)}
            <rect x="160" y="213" width="189" height="88" rx="6" fill="#0e151c" stroke="#93b6ca" strokeWidth="2"/>
            <text x="255" y="232" fontSize="13" textAnchor="middle" fill="#e5f7ff">SELECTED BREAKER #{selectedSlot}</text>
            <text x="255" y="248" fontSize="11" textAnchor="middle" fill="#9bc6dd">{breaker.amperage}A · {breaker.poles}-pole · {breaker.breakerType}</text>
            <rect x="238" y="255" width="35" height="22" rx="3" fill="#546a7b" stroke="#cad9e2"/>
            {terminalButton(`breaker-${selectedSlot}-hot-a`,196,285,showHints?"LOAD A":"", "#ffc5b5")}
            {breaker.poles === 2 && terminalButton(`breaker-${selectedSlot}-hot-b`,312,285,showHints?"LOAD B":"", "#ffc5b5")}
            <rect x="242" y="486" width="26" height="22" rx="5" fill="#9daab1" stroke="#cad8df"/>
            {active.map((w,i) => {
              const target = w.terminal;
              const y = target?.startsWith("neutral-") ? 208+(Number(target.split("-")[1])-1)*36 : target?.startsWith("ground-") ? 208+(Number(target.split("-")[1])-1)*36 : 285;
              const x = target?.startsWith("neutral-") ? 107 : target?.startsWith("ground-") ? 403 : target?.endsWith("hot-a") ? 196 : 312;
              const startX = 249 + (i-(active.length-1)/2)*6;
              return <path key={w.id} d={target ? `M ${startX} 498 L ${startX} ${Math.min(478, y+25)} L ${x} ${Math.min(478, y+25)} L ${x} ${y}` : `M ${startX} 498 L ${startX} ${460-i*12}`} stroke={wireColors[w.conductor]} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{pointerEvents:"none"}} />;
            })}
            <text x="255" y="518" textAnchor="middle" fontSize="10" fill="#a6d0e4">CLICK TERMINAL AFTER SELECTING A CONDUCTOR</text>
          </svg>
        </div>
        <div style={{ ...styles.card, display: "grid", gap: 9 }}>
          <strong style={{ color: "#7be4ff" }}>Cable conductors</strong>
          {active.length === 0 ? <p style={{ color: "#aac2d0", fontSize: 13 }}>Add a training cable to reveal its individual conductors.</p> : active.map(w => <button key={w.id} onClick={() => setSelectedWire(w.id)} style={{ ...styles.button, textAlign: "left", borderColor: selectedWire === w.id ? "#70efff" : "#376981", background: selectedWire === w.id ? "#135e7c" : "#183443", display: "flex", gap: 9, alignItems: "center" }}><span style={{ width: 13, height: 32, borderRadius: 6, background: wireColors[w.conductor], border: "1px solid #8496a2" }}/><span><strong>{names[w.conductor]}</strong><br/><small>{w.terminal ? `→ ${w.terminal.replaceAll("-", " ")}` : "Not terminated"}</small></span></button>)}
          <div style={{ color: "#d7ebf5", fontSize: 12, borderTop: "1px solid #315369", paddingTop: 10 }}>{feedback}</div>
          {active.some(w => w.terminal) && <button style={styles.button} onClick={() => {setWires(wires.map(w => w.slot === selectedSlot ? {...w, terminal:null} : w));setInspection([]);setSelectedWire(null);setFeedback("All selected-circuit terminations cleared.");}}>Disconnect all conductors</button>}
          <strong style={{ color: "#7be4ff", marginTop: 8 }}>Inspection results</strong>
          {inspection.length ? inspection.map((x,i) => <div key={i} style={{ color: x.startsWith("PASS") ? "#83efad" : "#ffd2a0", fontSize: 12 }}>{x}</div>) : <small style={{ color: "#a6c0ce" }}>Run inspection after wiring. It checks only this exercise's modeled terminals.</small>}
        </div>
      </div>
      <p style={{ fontSize: 12, color: "#ffcf94", marginBottom: 0 }}>Training-only simplified panel: bus arrangement, breaker fit, neutral terminal limits, torque, feeder sizing, bonding and code compliance are NOT validated. Feeder lugs are display-only for now. No real service wiring or energization is simulated.</p>
    </>}
  </section>;
}
