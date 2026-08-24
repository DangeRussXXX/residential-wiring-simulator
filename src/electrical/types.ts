// Residential Wiring Simulator v2.5
// Core electrical data types
//
// Master definitions used throughout:
// - devices
// - circuits
// - breakers
// - panels
// - wires
// - simulation modes

import type {
  BreakerPanel
} from "./breakerPanel";

import type {
  Breaker
} from "./breaker";


// --------------------------------
// Voltage definitions
// --------------------------------

export type Voltage =
  | 120
  | 240;


// --------------------------------
// Breaker poles
// --------------------------------

export type BreakerPoles =
  | 1
  | 2;


// --------------------------------
// Breaker type
// --------------------------------

export type BreakerType =
  | "STANDARD"
  | "AFCI"
  | "GFCI"
  | "DUAL_FUNCTION";


// --------------------------------
// Wire definitions
// --------------------------------

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


// --------------------------------
// Electrical load
// --------------------------------

export interface ElectricalLoad {

  watts: number;

  continuous?: boolean;

}


// --------------------------------
// Circuit definition
// --------------------------------

export interface Circuit {

  id: string;

  name: string;

  voltage: Voltage;

  breaker: Breaker;

  wire: Wire;

  devices: ElectricalDevice[];

  // --------------------------------
  // PANEL OWNERSHIP
  // --------------------------------
  //
  // Identifies which electrical panel
  // owns this circuit.
  //
  // Example:
  //
  // panel-100
  // panel-200
  //

  panelId?: string;


  // --------------------------------
  // BREAKER OWNERSHIP
  // --------------------------------
  //
  // Identifies the breaker slot/device
  // that feeds this circuit.
  //

  breakerId?: string;

}


// --------------------------------
// Device terminal
// --------------------------------

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


// --------------------------------
// Device types
// --------------------------------

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

  | "breaker"

  | "switch"

  | "light"

  | "receptacle"

  | "motor"

  | "appliance"

  | string;


// --------------------------------
// Electrical device
// --------------------------------

export interface ElectricalDevice {

  id: string;

  name: string;

  symbol: string;

  type: DeviceType;


  // --------------------------------
  // General information
  // --------------------------------

  description?: string;


  // --------------------------------
  // Electrical properties
  // --------------------------------

  load?: ElectricalLoad;

  voltage?: Voltage;

  amperage?: number;

  poles?: BreakerPoles;


  // --------------------------------
  // Breaker properties
  // --------------------------------

  breakerSize?: number;

  mainBreaker?: number;


  // --------------------------------
  // PANEL OWNERSHIP
  // --------------------------------
  //
  // If this device belongs to a circuit
  // fed from a particular panel, this
  // identifies that panel.
  //
  // Example:
  //
  // panelId: "panel-100"
  //
  // or
  //
  // panelId: "panel-200"
  //

  panelId?: string;


  // --------------------------------
  // BREAKER OWNERSHIP
  // --------------------------------
  //
  // Identifies the breaker feeding this
  // device/circuit.
  //

  breakerId?: string;


  // --------------------------------
  // Full breaker panel model
  // --------------------------------
  //
  // Only normally populated for:
  //
  // Breaker Panel
  // Sub Panel
  //

  panel?: BreakerPanel;


  // --------------------------------
  // Simulation values
  // --------------------------------

  tripped?: boolean;

  calculatedLoad?: number;

  calculatedAmps?: number;

  connectedDevices?: string[];


  // --------------------------------
  // Workspace position
  // --------------------------------

  x: number;

  y: number;

  terminals: DeviceTerminal[];

}


// --------------------------------
// Simulation modes
// --------------------------------

export type SimulationMode =

  | "APPRENTICE"

  | "ENGINEERING"

  | "HYBRID";