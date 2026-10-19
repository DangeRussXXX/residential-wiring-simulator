import { useState } from "react";
import { createServiceProject, type DisconnectArrangement, type ServiceProject, type ServiceRoute } from "./projectWorkflow";
export default function ServiceSetup({ onCreate }: { onCreate: (project: ServiceProject) => void }) {
  const [name, setName] = useState("My Residential Project");
  const [route, setRoute] = useState<ServiceRoute>("UNDERGROUND");
  const [amperage, setAmperage] = useState(200);
  const [arrangement, setArrangement] = useState<DisconnectArrangement>("SEPARATE");
  const field = { background: "#101c28", color: "#f2f8ff", border: "1px solid #34586d", padding: "11px", borderRadius: 7, width: "100%" };
  return <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "#0a111b", overflowY: "auto", color: "#eef8ff", padding: "35px 16px" }}>
    <div style={{ maxWidth: 740, margin: "0 auto", background: "#14212e", border: "1px solid #257e9c", borderRadius: 14, padding: 28 }}>
      <div style={{ color: "#66d9f7", letterSpacing: 2, fontSize: 12 }}>RESIDENTIAL WIRING SIMULATOR · STEP 1</div>
      <h1 style={{ marginBottom: 8 }}>⚡ Configure Electrical Service</h1>
      <p style={{ color: "#a5bdcc" }}>Start at the utility service, then add rooms, circuits, and detached buildings.</p>
      <label style={{ display: "block", marginTop: 18, marginBottom: 6 }}>Project name</label>
      <input aria-label="Project name" value={name} onChange={e => setName(e.target.value)} style={field}/>
      <h3>Service entrance</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
        {(["UNDERGROUND", "OVERHEAD"] as const).map(value => <button key={value} type="button" onClick={() => setRoute(value)} aria-pressed={route === value} style={{ ...field, cursor: "pointer", border: route === value ? "2px solid #62ddff" : field.border, textAlign: "left" }}>
          <strong>{value === "UNDERGROUND" ? "⬇ Underground service" : "⬆ Overhead service"}</strong><div style={{ color: "#a9bdcb", fontSize: 12, marginTop: 6 }}>{value === "UNDERGROUND" ? "Utility lateral to service meter" : "Service drop and weatherhead to meter"}</div>
        </button>)}
      </div>
      <h3>Service rating</h3>
      <select aria-label="Service rating" value={amperage} onChange={e => setAmperage(Number(e.target.value))} style={field}>{[100, 200, 320, 400].map(value => <option key={value} value={value}>{value}A</option>)}</select>
      <h3>Disconnect arrangement</h3>
      <select aria-label="Disconnect arrangement" value={arrangement} onChange={e => setArrangement(e.target.value as DisconnectArrangement)} style={field}>
        <option value="SEPARATE">Separate service disconnect + distribution panel</option><option value="MAIN_BREAKER">Main breaker inside service panel</option>
      </select>
      <div style={{ padding: 14, background: "#0b1823", borderRadius: 8, marginTop: 20, color: "#b6d1df" }}>Selected: {route.toLowerCase()} · {amperage}A · 120/240V single-phase · {arrangement === "SEPARATE" ? "separate disconnect and panel" : "main-breaker panel"}</div>
      <p style={{ fontSize: 12, color: "#a5bdcc" }}>Training model only. Utility requirements, grounding/bonding, service equipment ratings and conductor sizing require site-specific design and code verification.</p>
      <button type="button" onClick={() => onCreate(createServiceProject(name, route, amperage, arrangement))} style={{ ...field, background: "#087eaa", border: "none", fontWeight: 800, cursor: "pointer", marginTop: 8 }}>Create Project & Open Service →</button>
    </div>
  </div>;
}
