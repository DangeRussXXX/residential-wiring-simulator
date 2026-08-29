// Residential Wiring Simulator v2.5
// Simulator Context
//
// Responsibilities:
// - Global simulator device state
// - Global electrical connection state
// - Currently selected device
// - Keeping selected device synchronized with devices
//
// Panel-specific electrical data remains inside the
// ElectricalDevice.panel model.
//
// This allows multiple independent panels to coexist:
//
//   Panel A → device.panel
//   Panel B → device.panel
//
// without creating a single global/default panel.

import {
  createContext,
  useContext,
  useState
} from "react";

import type {
  ReactNode
} from "react";

import type {
  ElectricalDevice
} from "../electrical/types";

import type {
  Connection
} from "../electrical/connections";


// ============================================================
// SIMULATOR CONTEXT TYPE
// ============================================================

type SimulatorContextType = {

  // ----------------------------------------------------------
  // DEVICES
  // ----------------------------------------------------------

  devices:
    ElectricalDevice[];

  setDevices:
    React.Dispatch<
      React.SetStateAction<ElectricalDevice[]>
    >;


  // ----------------------------------------------------------
  // ELECTRICAL CONNECTIONS
  // ----------------------------------------------------------

  connections:
    Connection[];

  setConnections:
    React.Dispatch<
      React.SetStateAction<Connection[]>
    >;


  // ----------------------------------------------------------
  // SELECTED DEVICE
  // ----------------------------------------------------------

  selectedDevice:
    ElectricalDevice | null;

  setSelectedDevice:
    React.Dispatch<
      React.SetStateAction<ElectricalDevice | null>
    >;

};


// ============================================================
// CONTEXT
// ============================================================

const SimulatorContext =
  createContext<
    SimulatorContextType | null
  >(null);


// ============================================================
// PROVIDER
// ============================================================

export function SimulatorProvider({
  children
}: {
  children: ReactNode;
}) {

  // ----------------------------------------------------------
  // DEVICE STATE
  // ----------------------------------------------------------

  const [
    devices,
    setDevices
  ] = useState<ElectricalDevice[]>([]);


  // ----------------------------------------------------------
  // CONNECTION STATE
  // ----------------------------------------------------------

  const [
    connections,
    setConnections
  ] = useState<Connection[]>([]);


  // ----------------------------------------------------------
  // SELECTED DEVICE STATE
  // ----------------------------------------------------------

  const [
    selectedDevice,
    setSelectedDevice
  ] = useState<ElectricalDevice | null>(null);


  // ----------------------------------------------------------
  // PROVIDER
  // ----------------------------------------------------------

  return (

    <SimulatorContext.Provider
      value={{
        devices,
        setDevices,

        connections,
        setConnections,

        selectedDevice,
        setSelectedDevice
      }}
    >

      {children}

    </SimulatorContext.Provider>

  );

}


// ============================================================
// USE SIMULATOR
// ============================================================

export function useSimulator(): SimulatorContextType {

  const context =
    useContext(
      SimulatorContext
    );


  if (!context) {

    throw new Error(
      "useSimulator must be used inside SimulatorProvider"
    );

  }


  return context;

}