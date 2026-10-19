import type { ProjectArea } from "./projectWorkflow";
export type WallSide = "NORTH" | "EAST" | "SOUTH" | "WEST";
export const WALLS: WallSide[] = ["NORTH", "EAST", "SOUTH", "WEST"];
export default function RoomLayout({ area, onOpenWall }: { area: ProjectArea; onOpenWall: (wall: WallSide) => void }) {
  return <section style={{ padding: 20, color: "#eaf7ff", maxWidth: 1000, margin: "0 auto" }}>
    <div style={{ fontSize: 12, color: "#68dafa", letterSpacing: 2 }}>ROOM LAYOUT · FOUR WALLS</div>
    <h2 style={{ margin: "8px 0" }}>{area.name}</h2>
    <p style={{ color: "#afc3d0" }}>Choose a wall to open its framing workspace. Each wall keeps its own devices and connections.</p>
    <div style={{ display: "grid", gridTemplateColumns: "90px minmax(200px, 1fr) 90px", gridTemplateRows: "76px 300px 76px", gap: 9, maxWidth: 650, margin: "24px auto" }}>
      <div/><WallButton side="NORTH" onOpenWall={onOpenWall}/><div/>
      <WallButton side="WEST" onOpenWall={onOpenWall}/>
      <div style={{ border: "2px solid #b99062", background: "repeating-linear-gradient(90deg,#253541 0px,#253541 31px,#2e4050 32px,#2e4050 33px)", borderRadius: 6, display: "grid", placeItems: "center", textAlign: "center", padding: 12 }}>
        <div><div style={{ fontSize: 32 }}>🏠</div><strong>{area.name}</strong><div style={{ color: "#b8cad4", fontSize: 12, marginTop: 8 }}>Click a wall to begin rough-in wiring</div></div>
      </div>
      <WallButton side="EAST" onOpenWall={onOpenWall}/>
      <div/><WallButton side="SOUTH" onOpenWall={onOpenWall}/><div/>
    </div>
    <p style={{ color: "#9fb4c3", fontSize: 12 }}>Initial room footprint is schematic. Adjustable room dimensions and doors/windows will be added later.</p>
  </section>;
}
function WallButton({ side, onOpenWall }: { side: WallSide; onOpenWall: (wall: WallSide) => void }) {
  return <button onClick={() => onOpenWall(side)} style={{ background: "linear-gradient(140deg,#805b35,#b88b58)", border: "2px solid #dfb47c", borderRadius: 6, color: "#fff", fontWeight: 800, cursor: "pointer", minWidth: 0, fontSize: 12, padding: 5 }}>{side}<div style={{ fontSize: 10, marginTop: 4, fontWeight: 400 }}>Open wall →</div></button>;
}
