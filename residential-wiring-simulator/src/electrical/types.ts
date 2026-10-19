// Residential Wiring Simulator v2.5
// Core electrical data types
//
// Shared definitions used throughout:
//
// - devices
// - circuits
// - breakers
// - panels
// - wires
// - simulation modes
//
// Breaker-specific definitions remain in breaker.ts.
// Panel-specific definitions remain in breakerPanel.ts.

import type {
  BreakerPanel,
} from "./breakerPanel";

import type {
  Breaker,
} from "./breaker";


// ============================================================
// VOLTAGE
// ============================================================

export type Voltage =
  | 120
  | 240;


// ============================================================
// BREAKER POLES
// ============================================================
//
// 1 = single pole / 120V
// 2 = double pole / 240V

export type BreakerPoles =
  | 1
  | 2;


// ============================================================
// WIRE
// ============================================================

export type WireGauge =
  | "#14"
  | "#12"
  | "#10"
  | "#8";


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


// ============================================================
// ELECTRICAL LOAD
// ============================================================

export interface ElectricalLoad {

  watts: number;

  continuous?: boolean;

}


// ============================================================
// CIRCUIT
// ============================================================

export interface Circuit {

  id: string;

  name: string;

  voltage: Voltage;

  breaker: Breaker;

  wire: Wire;

  devices: ElectricalDevice[];

  panelId?: string;

  breakerId?: string;

}


// ============================================================
// DEVICE TERMINAL
// ============================================================

export interface DeviceTerminal {

  id: string;

  name: string;

  type:
    | "hot"
    | "neutral"
    | "ground"
    | "load"
    | "traveler"
    | "control";

  x: number;

  y: number;

  side?:
    | "left"
    | "right"
    | "top"
    | "bottom";

}


// ============================================================
// DEVICE TYPES
// ============================================================

export type DeviceType =

  | "Breaker Panel"
  | "Sub Panel"

  | "Switch"
  | "3-Way Switch"
  | "Dimmer"

  | "Light"
  | "Receptacle"
  | "GFCI"

  | "Appliance"
  | "Motor"

  // Legacy names
  | "breaker"
  | "switch"
  | "light"
  | "receptacle"
  | "motor"
  | "appliance"

  // Compatibility fallback
  | string;


// ============================================================
// ELECTRICAL DEVICE
// ============================================================

export interface ElectricalDevice {

  id: string;

  name: string;

  symbol: string;

  type: DeviceType;

  description?: string;

  load?: ElectricalLoad;

  voltage?: Voltage;

  amperage?: number;

  poles?: BreakerPoles;

  breakerSize?: number;

  mainBreaker?: number;

  panelId?: string;

  breakerId?: string;

  panel?: BreakerPanel;

  tripped?: boolean;

  calculatedLoad?: number;

  calculatedAmps?: number;

  connectedDevices?: string[];

  x: number;

  y: number;

  terminals: DeviceTerminal[];

}


// ============================================================
// SIMULATION MODES
// ============================================================

export type SimulationMode =

  | "APPRENTICE"
  | "ENGINEERING"
  | "HYBRID";