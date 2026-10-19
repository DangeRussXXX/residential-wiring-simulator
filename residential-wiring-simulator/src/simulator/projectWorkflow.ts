import type { CableRecord } from "./CableWiringPanel";
import type { SwitchLightConnection } from "./SwitchedLightLab";
export type ServiceRoute = "UNDERGROUND" | "OVERHEAD";
export type DisconnectArrangement = "SEPARATE" | "MAIN_BREAKER";
export type ProjectArea = { id: string; name: string; buildingId: string; kind: "ROOM" | "AREA" };
export type ProjectBuilding = { id: string; name: string; kind: "MAIN" | "DETACHED"; panelId?: string };
export type CircuitAssignment = { slot: number; name: string; areaIds: string[]; destinations?: { areaId: string; wall: "NORTH" | "SOUTH" | "EAST" | "WEST"; cable: "14/2 NM-B" | "12/2 NM-B" | "14/3 NM-B" | "12/3 NM-B" }[] };
export type PanelWire = { id: string; slot: number; cable: "14/2 NM-B" | "14/3 NM-B" | "12/2 NM-B" | "12/3 NM-B"; conductor: "black" | "red" | "white" | "bare"; terminal: string | null; };
export type EndToEndCircuit = {
  slot: number;
  areaId: string;
  wall: "NORTH" | "SOUTH" | "EAST" | "WEST";
  receptacleId: string;
  cable: "14/2 NM-B";
  roomHot: "brass" | "silver" | "green" | null;
  roomNeutral: "brass" | "silver" | "green" | null;
  roomGround: "brass" | "silver" | "green" | null;
};
export type ServiceProject = {
  version: 1;
  distributionPanel?: import("../electrical/breakerPanel").BreakerPanel;
  circuitAssignments?: CircuitAssignment[];
  panelWires?: PanelWire[];
  wallCables?: CableRecord[];
  endToEndCircuits?: EndToEndCircuit[];
  switchedLightCircuits?: SwitchLightConnection[];
  distributionMain?: { installed: boolean; amperage: number; closed: boolean };
  id: string;
  name: string;
  service: { route: ServiceRoute; amperage: number; voltage: "120/240"; arrangement: DisconnectArrangement; mainDisconnectClosed: boolean; meterLocation: string };
  buildings: ProjectBuilding[];
  areas: ProjectArea[];
  activeAreaId: string | null;
};
const KEY = "rws-service-project-v1";
export function createServiceProject(name: string, route: ServiceRoute, amperage: number, arrangement: DisconnectArrangement): ServiceProject {
  const buildingId = crypto.randomUUID();
  return { version: 1, id: crypto.randomUUID(), name: name.trim() || "New Electrical Project",
    service: { route, amperage, voltage: "120/240", arrangement, mainDisconnectClosed: true, meterLocation: "Exterior" },
    buildings: [{ id: buildingId, name: "Main House", kind: "MAIN" }], areas: [], activeAreaId: null };
}
export function loadServiceProject(): ServiceProject | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const project: ServiceProject = JSON.parse(raw);
    return project?.version === 1 && Array.isArray(project.buildings) && Array.isArray(project.areas) ? project : null;
  } catch { return null; }
}
export function saveServiceProject(project: ServiceProject): void { localStorage.setItem(KEY, JSON.stringify(project)); }
export function clearServiceProject(): void { localStorage.removeItem(KEY); }
