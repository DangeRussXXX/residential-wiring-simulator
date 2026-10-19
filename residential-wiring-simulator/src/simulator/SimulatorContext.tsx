import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
import type { ElectricalDevice } from "../electrical/types";
import type { Connection } from "../electrical/connections";

type ScopeData = { devices: ElectricalDevice[]; connections: Connection[] };
type ContextValue = {
  devices: ElectricalDevice[];
  setDevices: Dispatch<SetStateAction<ElectricalDevice[]>>;
  connections: Connection[];
  setConnections: Dispatch<SetStateAction<Connection[]>>;
  selectedDevice: ElectricalDevice | null;
  setSelectedDevice: Dispatch<SetStateAction<ElectricalDevice | null>>;
  workspaceScope: string;
  setWorkspaceScope: (scope: string) => void;
  clearWorkspaceScopes: () => void;
};
const KEY = "rws-workspaces-v2";
const Context = createContext<ContextValue | null>(null);
function readScopes(): Record<string, ScopeData> {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "{}");
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch { return {}; }
}
export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState("SERVICE");
  const [scopes, setScopes] = useState<Record<string, ScopeData>>(readScopes);
  const [selection, setSelection] = useState<Record<string, ElectricalDevice | null>>({});
  const current = scopes[scope] ?? { devices: [], connections: [] };
  function update<K extends keyof ScopeData>(key: K, action: SetStateAction<ScopeData[K]>) {
    setScopes(prev => {
      const before = prev[scope] ?? { devices: [], connections: [] };
      const nextValue = typeof action === "function" ? (action as (p: ScopeData[K]) => ScopeData[K])(before[key]) : action;
      const next = { ...prev, [scope]: { ...before, [key]: nextValue } };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  }
  const setDevices: ContextValue["setDevices"] = action => update("devices", action);
  const setConnections: ContextValue["setConnections"] = action => update("connections", action);
  const setSelectedDevice: ContextValue["setSelectedDevice"] = action => setSelection(prev => {
    const old = prev[scope] ?? null;
    return { ...prev, [scope]: typeof action === "function" ? action(old) : action };
  });
  const clearWorkspaceScopes = () => { setScopes({}); setSelection({}); localStorage.removeItem(KEY); };
  return <Context.Provider value={{ devices: current.devices, setDevices, connections: current.connections, setConnections, selectedDevice: selection[scope] ?? null, setSelectedDevice, workspaceScope: scope, setWorkspaceScope: setScope, clearWorkspaceScopes }}>{children}</Context.Provider>;
}
export function useSimulator() {
  const context = useContext(Context);
  if (!context) throw new Error("useSimulator must be inside SimulatorProvider");
  return context;
}
