import type { ProjectArea } from "./projectWorkflow";
export type WallSide = "NORTH" | "EAST" | "SOUTH" | "WEST";
export const WALLS: WallSide[] = ["NORTH", "EAST", "SOUTH", "WEST"];
export default function RoomLayout({ area, onOpenWall }: { area: ProjectArea; onOpenWall: (wall: WallSide) => void }) {
  return <section style={{ padding: 20, color: "#eaf7ff", maxWidth: 1200, margin: "0 auto" }}>
    <div style={{ fontSize: 24, color: "#68dafa", letterSpacing: 2 }}>ROOM LAYOUT · FOUR WALLS</div>
    <h2 style={{ margin: "8px 0", fontSize: 32 }}>{area.name}</h2>
    <p style={{ color: "#afc3d0", fontSize: 24, lineHeight: 1.45 }}>Choose a wall to open its framing workspace. Each wall keeps its own devices and connections.</p>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(110px, 150px) minmax(240px, 1fr) minmax(110px, 150px)", gridTemplateRows: "100px minmax(330px, 380px) 100px", gap: 12, maxWidth: 900, margin: "24px auto" }}>
      <div/><WallButton side="NORTH" onOpenWall={onOpenWall}/><div/>
      <WallButton side="WEST" onOpenWall={onOpenWall}/>
      <div style={{ border: "2px solid #b99062", background: "repeating-linear-gradient(90deg,#253541 0px,#253541 31px,#2e4050 32px,#2e4050 33px)", borderRadius: 6, display: "grid", placeItems: "center", textAlign: "center", padding: 12 }}>
        <div><div style={{ fontSize: 56 }}>🏠</div><strong style={{ fontSize: 28 }}>{area.name}</strong><div style={{ color: "#b8cad4", fontSize: 24, marginTop: 12 }}>Click a wall to begin rough-in wiring</div></div>
      </div>
      <WallButton side="EAST" onOpenWall={onOpenWall}/>
      <div/><WallButton side="SOUTH" onOpenWall={onOpenWall}/><div/>
    </div>
    <p style={{ color: "#9fb4c3", fontSize: 24, lineHeight: 1.45 }}>Initial room footprint is schematic. Adjustable room dimensions and doors/windows will be added later.</p>
  </section>;
}
function WallButton({ side, onOpenWall }: { side: WallSide; onOpenWall: (wall: WallSide) => void }) {
  return <button onClick={() => onOpenWall(side)} style={{ background: "linear-gradient(140deg,#805b35,#b88b58)", border: "2px solid #dfb47c", borderRadius: 6, color: "#fff", fontWeight: 800, cursor: "pointer", minWidth: 0, fontSize: 24, padding: 10 }}>{side}<div style={{ fontSize: 20, marginTop: 8, fontWeight: 400 }}>Open wall →</div></button>;
}
