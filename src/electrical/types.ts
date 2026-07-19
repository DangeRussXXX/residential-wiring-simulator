// Residential Wiring Simulator v2.2
// Core electrical data types


export type Voltage = 120 | 240;


export type BreakerPoles = 1 | 2;


export type WireGauge =
  | "#14"
  | "#12"
  | "#10"
  | "#8";



export type DeviceType =
  | "breaker"
  | "switch"
  | "light"
  | "receptacle"
  | "motor"
  | "appliance"
  | string;



export type SimulationMode =
  | "APPRENTICE"
  | "ENGINEERING"
  | "HYBRID";



// Electrical device load information
export interface ElectricalLoad {

  watts: number;

  continuous?: boolean;

}



// Breaker information
export interface Breaker {

  id: string;

  amperage: number;

  voltage: Voltage;

  poles: BreakerPoles;

  tripped: boolean;

}



// Wire information
export interface Wire {

  id?: string;

  gauge?: WireGauge;

  length?: number;


  fromDevice: string;

  fromTerminal: string;

  toDevice: string;

  toTerminal: string;

  color?: string;

}



// Circuit information
export interface Circuit {

  id: string;

  name: string;

  voltage: Voltage;

  breaker: Breaker;

  wire: Wire;

  devices: ElectricalDevice[];

}



// Terminal information
export interface DeviceTerminal {

  id: string;

  name: string;

  type: string;

  x: number;

  y: number;

}



// Main device object
// Matches Workspace.tsx
export interface ElectricalDevice {

  id: string;

  name: string;


  // Allows your UI device names:
  // "Switch", "Light", "GFCI", etc.
  type: DeviceType;


  load?: ElectricalLoad;


  // Workspace positioning
  x: number;

  y: number;


  terminals: DeviceTerminal[];

}