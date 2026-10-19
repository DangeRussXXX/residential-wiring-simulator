import type { ServiceProject } from "./projectWorkflow";
export default function ServiceOverview({ project, onChange }: { project: ServiceProject; onChange: (next: ServiceProject) => void }) {
  const { service } = project;
  const node = (title: string, sub: string) => <div style={{ padding: 12, border: "1px solid #347c96", background: "#101d2b", borderRadius: 8, textAlign: "center", minWidth: 150 }}><strong>{title}</strong><div style={{ fontSize: 12, color: "#a8c5d6", marginTop: 5 }}>{sub}</div></div>;
  return <section style={{ background: "#15232f", border: "1px solid #277c97", borderRadius: 10, padding: 14, marginBottom: 12 }}>
    <h3 style={{ color: "#6fddff", marginTop: 0 }}>⚡ Service Distribution · {service.amperage}A</h3>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
      {node("Utility", service.route === "UNDERGROUND" ? "Underground lateral" : "Overhead service drop")}
      <span>→</span>{node("Meter", service.meterLocation)}<span>→</span>
      {node(service.arrangement === "SEPARATE" ? "Service Disconnect" : "Main Breaker", `${service.amperage}A · ${service.mainDisconnectClosed ? "CLOSED" : "OPEN"}`)}<span>→</span>
      {node("Distribution Panel", "L1 · L2 · Neutral · Ground")}
    </div>
    <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <button type="button" onClick={() => onChange({ ...project, service: { ...service, mainDisconnectClosed: !service.mainDisconnectClosed } })} style={{ background: service.mainDisconnectClosed ? "#ad5a36" : "#247b59", padding: "9px 14px", borderRadius: 6, border: 0, color: "white", cursor: "pointer" }}>{service.mainDisconnectClosed ? "Open main disconnect" : "Close main disconnect"}</button>
      <strong style={{ color: service.mainDisconnectClosed ? "#9de6af" : "#f2b38c" }}>{service.mainDisconnectClosed ? "Downstream supply: ON (conceptual)" : "Downstream supply: OFF (conceptual)"}</strong>
    </div>
    <p style={{ color: "#9db5c3", fontSize: 12, marginBottom: 0 }}>This is a project service map, not a live circuit solver. Opening the simulated disconnect does not yet alter the existing circuit engine. Service conductors may remain energized upstream of the disconnect. Separate downstream panels require neutral/ground isolation and correct feeder bonding design.</p>
  </section>;
}
