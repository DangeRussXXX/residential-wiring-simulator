import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { ServiceProject } from "./projectWorkflow";
import type { ElectricalDevice } from "../electrical/types";

type PlanRoom = { name: string; x: number; y: number; w: number; h: number; kind?: "garage" | "utility" };
type Point = { x: number; y: number };
type SymbolPlacement = { room: string; deviceId: string; x: number; y: number };
type SavedPlan = { rooms: PlanRoom[]; panel: Point; symbols: SymbolPlacement[]; grid: number };
type EditorMode = "navigate" | "move" | "resize" | "place" | "panel";
type Drag = { kind: "move" | "resize" | "panel"; room?: string; origin: Point; initial: PlanRoom | Point; pointerId: number };

const defaults: PlanRoom[] = [
  { name: "2-Car Garage", x: 20, y: 20, w: 290, h: 290, kind: "garage" },
  { name: "Utility / Laundry", x: 310, y: 20, w: 160, h: 115, kind: "utility" },
  { name: "Kitchen", x: 470, y: 20, w: 220, h: 175 },
  { name: "Living Room", x: 690, y: 20, w: 290, h: 240 },
  { name: "Hallway", x: 310, y: 195, w: 380, h: 65 },
  { name: "Bathroom 1", x: 310, y: 135, w: 160, h: 60 },
  { name: "Bedroom 1", x: 20, y: 310, w: 280, h: 210 },
  { name: "Bedroom 2", x: 300, y: 310, w: 220, h: 210 },
  { name: "Bathroom 2", x: 520, y: 310, w: 160, h: 210 },
  { name: "Bedroom 3", x: 680, y: 260, w: 300, h: 260 },
];
const defaultPanel = { x: 335, y: 75 };
const WIDTH = 1000;
const HEIGHT = 545;
const keyFor = (id: string) => `rws-blueprint-editor-v1:${id}`;
const snap = (n: number, grid: number) => Math.round(n / grid) * grid;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const control: React.CSSProperties = { border: "1px solid #4185a6", borderRadius: 6, padding: "8px 12px", background: "#174158", color: "#e7faff", cursor: "pointer" };

function readRoomDevices(projectId: string, areaId: string): ElectricalDevice[] {
  try {
    const store = JSON.parse(localStorage.getItem("rws-workspaces-v2") || "{}") as Record<string, { devices?: ElectricalDevice[] }>;
    const devices = (["NORTH", "SOUTH", "EAST", "WEST"] as const).flatMap(w => store[`${projectId}:${areaId}:${w}`]?.devices ?? []);
    return Array.from(new Map(devices.map(d => [d.id, d])).values());
  } catch { return []; }
}
function loadPlan(id: string): SavedPlan {
  const initial = { rooms: defaults.map(r => ({ ...r })), panel: { ...defaultPanel }, symbols: [], grid: 20 };
  try {
    const raw = localStorage.getItem(keyFor(id));
    if (!raw) return initial;
    const saved = JSON.parse(raw) as Partial<SavedPlan>;
    const known = new Map((saved.rooms ?? []).filter(r => r && typeof r.name === "string").map(r => [r.name, r]));
    return {
      rooms: defaults.map(r => {
        const found = known.get(r.name);
        return found && [found.x, found.y, found.w, found.h].every(Number.isFinite)
          ? { ...r, x: clamp(found.x, 0, WIDTH - 40), y: clamp(found.y, 0, HEIGHT - 40), w: clamp(found.w, 40, WIDTH), h: clamp(found.h, 40, HEIGHT) }
          : { ...r };
      }),
      panel: saved.panel && Number.isFinite(saved.panel.x) && Number.isFinite(saved.panel.y) ? saved.panel : initial.panel,
      symbols: Array.isArray(saved.symbols) ? saved.symbols.filter(s => s && typeof s.room === "string" && typeof s.deviceId === "string" && Number.isFinite(s.x) && Number.isFinite(s.y)) : [],
      grid: [10, 20, 40].includes(saved.grid ?? 0) ? saved.grid! : 20,
    };
  } catch { return initial; }
}

type Props = { project: ServiceProject; onChange: (p: ServiceProject) => void; onOpenRoom: (areaId: string) => void; onOpenPanel: () => void };
export default function WholeHouseBlueprint({ project, onChange, onOpenRoom, onOpenPanel }: Props) {
  const [plan, setPlan] = useState<SavedPlan>(() => loadPlan(project.id));
  const [mode, setMode] = useState<EditorMode>("navigate");
  const [selectedCircuit, setSelectedCircuit] = useState<number | null>(null);
  const [showRuns, setShowRuns] = useState(true);
  const [showSymbols, setShowSymbols] = useState(true);
  const [showAll, setShowAll] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState("2-Car Garage");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const latestRef = useRef(plan);
  latestRef.current = plan;

  useEffect(() => { setPlan(loadPlan(project.id)); setSelectedDevice(""); setMode("navigate"); }, [project.id]);
  useEffect(() => {
    try { localStorage.setItem(keyFor(project.id), JSON.stringify(plan)); }
    catch { setNotice("Blueprint could not be saved in this browser. Check available storage."); }
  }, [plan, project.id]);
  // Room-wall workspaces write their own storage; refresh the device list when the tab regains focus.
  useEffect(() => {
    const refresh = () => setRevision(n => n + 1);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  const main = project.buildings.find(b => b.kind === "MAIN");
  const aliases = (name: string) => name === "Bedroom 1" ? ["bedroom1", "bedroom"] : name === "2-Car Garage" ? ["2cargarage", "garage"] : [normalize(name)];
  const lookup = (name: string) => project.areas.find(a => a.buildingId === main?.id && aliases(name).includes(normalize(a.name)));
  const assignments = project.circuitAssignments ?? [];
  const routes = assignments.flatMap(a => (a.destinations ?? []).map(d => ({ ...d, slot: a.slot, name: a.name })));
  const visible = routes.filter(r => selectedCircuit === null || r.slot === selectedCircuit);
  const byArea = (id: string) => visible.filter(r => r.areaId === id);
  const circuitSlots = Array.from(new Set(assignments.map(a => a.slot))).sort((a, b) => a - b);
  const unmatched = project.areas.filter(a => a.buildingId === main?.id && !plan.rooms.some(r => aliases(r.name).includes(normalize(a.name))));
  const routeTargets = plan.rooms.flatMap(room => { const area = lookup(room.name); return area ? byArea(area.id).map(route => ({ room, route })) : []; });
  const roomDevices = useMemo(() => {
    const result: Record<string, ElectricalDevice[]> = {};
    for (const room of plan.rooms) {
      const area = lookup(room.name);
      result[room.name] = area ? readRoomDevices(project.id, area.id).filter(d => ["Switch", "Light", "Receptacle"].includes(d.type)) : [];
    }
    return result;
    // revision intentionally invalidates the browser-storage snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, plan.rooms, revision]);
  const chosenDevices = roomDevices[selectedRoom] ?? [];
  const chosenDevice = chosenDevices.find(d => d.id === selectedDevice) ?? chosenDevices[0];

  function addTemplate() {
    if (!main) return;
    const existing = new Set(project.areas.filter(a => a.buildingId === main.id).map(a => normalize(a.name)));
    const missing = plan.rooms.filter(r => !aliases(r.name).some(alias => existing.has(alias))).map(r => ({ id: crypto.randomUUID(), name: r.name, buildingId: main.id, kind: "ROOM" as const }));
    if (missing.length) { onChange({ ...project, areas: [...project.areas, ...missing] }); setNotice(`Added ${missing.length} missing rooms to Project Explorer.`); }
    else setNotice("All template rooms already exist in Project Explorer.");
  }
  function svgPoint(e: ReactPointerEvent<SVGElement>): Point {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    // The SVG uses the default xMidYMid meet aspect-ratio fit.
    const scale = Math.min(rect.width / WIDTH, rect.height / HEIGHT);
    const left = rect.left + (rect.width - WIDTH * scale) / 2;
    const top = rect.top + (rect.height - HEIGHT * scale) / 2;
    return { x: (e.clientX - left) / scale, y: (e.clientY - top) / scale };
  }
  function startDrag(e: ReactPointerEvent<SVGElement>, kind: Drag["kind"], room?: PlanRoom) {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    dragRef.current = { kind, room: room?.name, origin: svgPoint(e), initial: room ? { ...room } : { ...latestRef.current.panel }, pointerId: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onDrag(e: ReactPointerEvent<SVGElement>) {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const pt = svgPoint(e), dx = pt.x - d.origin.x, dy = pt.y - d.origin.y;
    setPlan(old => {
      if (d.kind === "panel") {
        const p = d.initial as Point;
        return { ...old, panel: { x: clamp(snap(p.x + dx, old.grid), 30, WIDTH - 30), y: clamp(snap(p.y + dy, old.grid), 30, HEIGHT - 30) } };
      }
      const base = d.initial as PlanRoom;
      return { ...old, rooms: old.rooms.map(r => {
        if (r.name !== d.room) return r;
        if (d.kind === "move") return { ...r, x: clamp(snap(base.x + dx, old.grid), 0, WIDTH - base.w), y: clamp(snap(base.y + dy, old.grid), 0, HEIGHT - base.h) };
        return { ...r, w: clamp(snap(base.w + dx, old.grid), 40, WIDTH - base.x), h: clamp(snap(base.h + dy, old.grid), 40, HEIGHT - base.y) };
      }) };
    });
  }
  function endDrag(e: ReactPointerEvent<SVGElement>) {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  }
  function placeSymbol(e: ReactPointerEvent<SVGElement>, room: PlanRoom) {
    if (mode !== "place" || !chosenDevice || selectedRoom !== room.name) return;
    e.preventDefault(); e.stopPropagation();
    const pt = svgPoint(e);
    const x = clamp(snap(pt.x, plan.grid), room.x + 10, room.x + room.w - 10);
    const y = clamp(snap(pt.y, plan.grid), room.y + 10, room.y + room.h - 10);
    setPlan(old => ({ ...old, symbols: [...old.symbols.filter(s => !(s.room === room.name && s.deviceId === chosenDevice.id)), { room: room.name, deviceId: chosenDevice.id, x, y }] }));
    setNotice(`Placed ${chosenDevice.name || chosenDevice.type} in ${room.name}. Blueprint position saved; physical wall wiring unchanged.`);
  }
  function resetPlan() {
    if (!window.confirm("Reset room positions, panel position and blueprint symbol placements? Wall wiring and circuit assignments will NOT be deleted.")) return;
    setPlan({ rooms: defaults.map(r => ({ ...r })), panel: { ...defaultPanel }, symbols: [], grid: 20 });
    setNotice("Blueprint layout reset. Wall workspaces and circuit assignments preserved.");
  }
  const collisions = plan.rooms.flatMap((a, i) => plan.rooms.slice(i + 1).filter(b => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 5 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 5).map(b => `${a.name} / ${b.name}`));
  return <div style={{ color: "#dff3ff", maxWidth: 1440, margin: "auto" }}>
    <h2 style={{ margin: "0 0 6px", color: "#8be9ff" }}>🏠 Whole-House Electrical Blueprint · Grid Editor</h2>
    <p style={{ color: "#b1cfde", fontSize: 13 }}>Update 21: move and resize schematic rooms, reposition P1 and place symbols for existing wall devices. Edits save locally per project. Home runs are plan references, not verified cable paths.</p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 12, alignItems: "center" }}>
      <button style={control} onClick={addTemplate}>+ Add Missing Template Rooms</button>
      <button style={control} onClick={onOpenPanel}>Open Distribution Panel</button>
      <label style={{ fontSize: 13 }}>Edit mode <select style={control} value={mode} onChange={e => setMode(e.target.value as EditorMode)}>
        <option value="navigate">Open rooms</option><option value="move">Move rooms</option><option value="resize">Resize rooms</option><option value="place">Place device symbol</option><option value="panel">Move panel P1</option>
      </select></label>
      <label style={{ fontSize: 13 }}>Grid <select style={control} value={plan.grid} onChange={e => setPlan(p => ({ ...p, grid: Number(e.target.value) }))}><option value={10}>Fine · 10</option><option value={20}>Standard · 20</option><option value={40}>Coarse · 40</option></select></label>
      <button style={control} onClick={resetPlan}>Reset blueprint</button>
    </div>
    {mode === "place" && <div style={{ display: "flex", flexWrap: "wrap", gap: 9, alignItems: "center", marginBottom: 12, padding: 10, background: "#12344a", borderRadius: 7 }}>
      <label>Room <select style={control} value={selectedRoom} onChange={e => { setSelectedRoom(e.target.value); setSelectedDevice(""); }}>
        {plan.rooms.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
      </select></label>
      <label>Saved wall device <select style={control} value={chosenDevice?.id ?? ""} onChange={e => setSelectedDevice(e.target.value)}>
        {chosenDevices.length === 0 && <option value="">No saved switch/light/receptacle</option>}
        {chosenDevices.map(d => <option key={d.id} value={d.id}>{d.name || d.type} · {d.type}</option>)}
      </select></label>
      <span style={{ fontSize: 12, color: "#b1d5e6" }}>{chosenDevice ? `Click within ${selectedRoom} to place the symbol. Click again to reposition.` : "Create a device in that room's wall workspace first, then return here."}</span>
      <button style={control} onClick={() => setRevision(n => n + 1)}>Refresh devices</button>
    </div>}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 12, alignItems: "center" }}>
      <label style={{ fontSize: 13 }}>Circuit <select style={control} value={selectedCircuit ?? "ALL"} onChange={e => setSelectedCircuit(e.target.value === "ALL" ? null : Number(e.target.value))}><option value="ALL">All circuits</option>{circuitSlots.map(n => <option key={n} value={n}>#{n} — {assignments.find(a => a.slot === n)?.name || "Unnamed"}</option>)}</select></label>
      <label><input type="checkbox" checked={showRuns} onChange={e => setShowRuns(e.target.checked)} /> Home runs</label>
      <label><input type="checkbox" checked={showSymbols} onChange={e => setShowSymbols(e.target.checked)} /> Device symbols</label>
      <label><input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} /> Unassigned rooms</label>
    </div>
    <div style={{ fontSize: 12, color: "#9bd4ed", marginBottom: 7 }} aria-live="polite">{mode === "move" ? "Drag any room to move it; positions snap to the selected grid." : mode === "resize" ? "Drag the square handle at the lower-right of a room to resize it." : mode === "panel" ? "Drag P1 to a new grid location." : mode === "place" ? "Select a saved wall device above, then click its room to place the blueprint symbol." : "Click any existing room to open its wall workspace."} {notice}</div>
    <div style={{ overflowX: "auto", background: "#09233a", border: "1px solid #317c9f", borderRadius: 10, padding: 12 }}>
      <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: "100%", minWidth: 680, display: "block", touchAction: "none" }} role="img" aria-label="Editable single-story electrical blueprint with attached two-car garage">
        <defs><pattern id="bp-grid" width={plan.grid} height={plan.grid} patternUnits="userSpaceOnUse"><path d={`M${plan.grid} 0H0V${plan.grid}`} fill="none" stroke="#397391" strokeWidth=".65" opacity=".65" /></pattern><marker id="bp-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#ffc56b" strokeWidth="1.2" /></marker></defs>
        <rect width={WIDTH} height={HEIGHT} fill="url(#bp-grid)" />
        {plan.rooms.map(room => {
          const area = lookup(room.name);
          const active = !!area && byArea(area.id).length > 0;
          const faded = !showAll && !active;
          const devices = roomDevices[room.name] ?? [];
          const placed = plan.symbols.filter(s => s.room === room.name && devices.some(d => d.id === s.deviceId));
          const unplaced = devices.filter(d => !placed.some(s => s.deviceId === d.id));
          return <g key={room.name} opacity={faded ? .3 : 1}>
            <rect x={room.x} y={room.y} width={room.w} height={room.h} fill={room.kind === "garage" ? "#163d4c" : active ? "#174461" : "#103047"} stroke={selectedRoom === room.name && mode === "place" ? "#ffe0a2" : active ? "#a6ecff" : "#7db3ce"} strokeWidth="3" />
            {room.kind === "garage" && room.w >= 140 && room.h >= 120 && <><rect x={room.x + 10} y={room.y + 10} width={(room.w - 30) / 2} height={Math.min(70, room.h * .25)} fill="none" stroke="#7196a8" strokeDasharray="8 4" /><rect x={room.x + 20 + (room.w - 30) / 2} y={room.y + 10} width={(room.w - 30) / 2} height={Math.min(70, room.h * .25)} fill="none" stroke="#7196a8" strokeDasharray="8 4" /></>}
            <text x={room.x + room.w / 2} y={room.y + room.h / 2 - 7} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#effaff" pointerEvents="none">{room.name}</text>
            <text x={room.x + room.w / 2} y={room.y + room.h / 2 + 13} textAnchor="middle" fontSize="10" fill={area ? "#91e4fd" : "#ffcc88"} pointerEvents="none">{area ? `${byArea(area.id).length} assigned home run(s)` : "Template room · not added"}</text>
            {showSymbols && [...placed.map(s => ({ device: devices.find(d => d.id === s.deviceId)!, x: s.x, y: s.y })), ...unplaced.slice(0, 16).map((d, i) => ({ device: d, x: room.x + 20 + (i % 5) * Math.max(25, Math.min(42, (room.w - 35) / 5)), y: room.y + room.h - 22 - Math.floor(i / 5) * 22 }))].map(({ device: d, x, y }, i) => <g key={`${d.id}-${i}`} pointerEvents="none"><circle cx={clamp(x, room.x + 8, room.x + room.w - 8)} cy={clamp(y, room.y + 8, room.y + room.h - 8)} r="8" stroke="#b5ecff" strokeWidth="1.4" fill="#11334b" /><text x={clamp(x, room.x + 8, room.x + room.w - 8)} y={clamp(y, room.y + 8, room.y + room.h - 8) + 3.5} textAnchor="middle" fill="#e8f9ff" fontSize="9">{d.type === "Switch" ? "S" : d.type === "Light" ? "L" : "R"}</text></g>)}
            <rect x={room.x + 3} y={room.y + 3} width={room.w - 6} height={room.h - 6} fill="transparent" style={{ cursor: mode === "move" ? "grab" : mode === "place" ? "crosshair" : mode === "navigate" && area ? "pointer" : "default" }} onPointerDown={e => { if (mode === "move") startDrag(e, "move", room); else if (mode === "place") placeSymbol(e, room); }} onPointerMove={onDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onClick={() => { if (mode === "navigate" && area) onOpenRoom(area.id); }}><title>{mode === "move" ? `Move ${room.name}` : mode === "place" ? `Place device in ${room.name}` : `Open ${room.name} wall workspaces`}</title></rect>
            {mode === "resize" && <rect x={room.x + room.w - 15} y={room.y + room.h - 15} width="14" height="14" rx="2" fill="#ffce7a" stroke="#122b3d" strokeWidth="2" style={{ cursor: "nwse-resize" }} onPointerDown={e => startDrag(e, "resize", room)} onPointerMove={onDrag} onPointerUp={endDrag} onPointerCancel={endDrag}><title>Resize {room.name}</title></rect>}
          </g>;
        })}
        {showRuns && routeTargets.map(({ room, route }, i) => {
          const sx = room.x + room.w / 2, sy = room.y + room.h / 2, offset = (i % 5 - 2) * 6, midx = sx + (plan.panel.x - sx) * .55;
          return <g key={`${route.slot}-${room.name}-${route.wall}-${i}`} pointerEvents="none"><path d={`M${sx} ${sy + offset} L${midx} ${sy + offset} L${midx} ${plan.panel.y + offset} L${plan.panel.x} ${plan.panel.y + offset}`} stroke="#ffca72" strokeWidth={selectedCircuit === route.slot ? 3.3 : 1.7} strokeDasharray="8 5" fill="none" markerEnd="url(#bp-arrow)" opacity=".87" /><rect x={sx - 44} y={sy + offset - 22} width="88" height="17" rx="3" fill="#082136" stroke="#b88946" strokeWidth=".5" /><text x={sx} y={sy + offset - 10} textAnchor="middle" fontSize="10" fill="#ffe3a5">HR #{route.slot} · {route.cable.replace(" NM-B", "")}</text></g>;
        })}
        <g style={{ cursor: mode === "panel" ? "grab" : "pointer" }} onPointerDown={e => { if (mode === "panel") startDrag(e, "panel"); }} onPointerMove={onDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onClick={() => { if (mode !== "panel") onOpenPanel(); }}>
          <rect x={plan.panel.x - 31} y={plan.panel.y - 27} width="62" height="54" rx="5" fill="#143746" stroke="#ffd38a" strokeWidth="3" /><text x={plan.panel.x} y={plan.panel.y - 3} textAnchor="middle" fill="#fff0c6" fontSize="12" fontWeight="bold" pointerEvents="none">P1</text><text x={plan.panel.x} y={plan.panel.y + 12} textAnchor="middle" fill="#fff0c6" fontSize="10" pointerEvents="none">PANEL</text><title>{mode === "panel" ? "Drag distribution panel P1" : "Open Main Distribution Panel"}</title>
        </g>
        <text x="18" y="537" fill="#9bbbd0" fontSize="10" pointerEvents="none">SCHEMATIC CONCEPT • Grid units are drawing units, not measured feet • No voltage or cable-path calculations</text>
      </svg>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 12, fontSize: 12, color: "#c5dbe8" }}><span>▱ Editable room outline</span><span style={{ color: "#ffd08a" }}>⇢ Dashed gold = home run to P1</span><span>Ⓢ Switch · Ⓛ Light · Ⓡ Receptacle</span><span>Positions saved in this browser per project</span></div>
    {collisions.length > 0 && <p style={{ color: "#ffd08a", fontSize: 12 }}>Layout note: {collisions.length} overlapping room pair(s). Overlap is allowed while drafting; adjust rooms in Move/Resize mode.</p>}
    <div style={{ marginTop: 14, background: "#112d40", padding: 14, borderRadius: 9, border: "1px solid #315d74" }}>
      <strong>Project circuits and home runs</strong>
      {visible.length === 0 ? <p style={{ fontSize: 13, color: "#b3cedd" }}>No home runs assigned yet. Open Main Distribution Panel → Circuit Routing & Wiring, then assign a breaker to a room and wall.</p> :
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 9 }}>{visible.map((r, i) => {
          const area = project.areas.find(a => a.id === r.areaId);
          return <div key={`${r.slot}-${r.areaId}-${r.wall}-${i}`} style={{ border: "1px solid #476c83", borderRadius: 6, padding: 9, fontSize: 12, minWidth: 200 }}><strong>HR #{r.slot} → P1</strong><div>{area?.name || "Unknown area"} / {r.wall}</div><div>{r.cable} · {project.distributionPanel?.breakers.find(b => b.slot === r.slot)?.breaker?.amperage ?? "—"}A breaker</div></div>;
        })}</div>}
      {unmatched.length > 0 && <p style={{ fontSize: 12, color: "#ffd69a" }}>Existing rooms outside the starter template: {unmatched.map(a => a.name).join(", ")}. They remain available in Project Explorer.</p>}
      <p style={{ fontSize: 12, color: "#a9c4d4", marginBottom: 0 }}>Grid size is schematic, not a verified 12-inch scale. Moving rooms or placing symbols does not alter electrical connections, circuit assignments, or actual wall device coordinates. Saved blueprint positions are local to this browser and project.</p>
    </div>
  </div>;
}
