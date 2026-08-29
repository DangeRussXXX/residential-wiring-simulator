// Residential Wiring Simulator v2.5
// Core electrical data types
//
// Master definitions used throughout:
//
// - devices
// - circuits
// - breakers
// - panels
// - wires
// - simulation modes
//
// IMPORTANT:
// Breaker-specific types such as BreakerType,
// BreakerStatus, BreakerBusLeg, and BreakerLoadTerminal
// belong to breaker.ts.
//
// This file contains the shared electrical data model.

import type {
  BreakerPanel
} from "./breakerPanel";

import type {
  Breaker
} from "./breaker";


// ============================================================
// VOLTAGE DEFINITIONS
// ============================================================

export type Voltage =
  | 120
  | 240;


// ============================================================
// BREAKER POLES
// ============================================================
//
// Shared because panel/device/circuit models may need to
// describe whether something uses a single-pole or
// double-pole breaker.
//
// 1 = single pole / 120V
// 2 = double pole / 240V
//

export type BreakerPoles =
  | 1
  | 2;


// ============================================================
// WIRE DEFINITIONS
// ============================================================

export type WireGauge =
  | "#14"
  | "#12"
  | "#10"
  | "#8";


export interface Wire {

  /**
   * Optional wire identifier.
   */
  id?: string;


  /**
   * Conductor gauge.
   */
  gauge?: WireGauge;


  /**
   * Wire length.
   */
  length?: number;


  /**
   * Device/terminal where the wire begins.
   */
  fromDevice: string;

  fromTerminal: string;


  /**
   * Device/terminal where the wire ends.
   */
  toDevice: string;

  toTerminal: string;


  /**
   * Optional visual wire color.
   */
  color?: string;

}


// ============================================================
// ELECTRICAL LOAD
// ============================================================

export interface ElectricalLoad {

  /**
   * Load in watts.
   */
  watts: number;


  /**
   * Whether the load is continuous.
   */
  continuous?: boolean;

}


// ============================================================
// CIRCUIT DEFINITION
// ============================================================

export interface Circuit {

  /**
   * Unique circuit identifier.
   */
  id: string;


  /**
   * Human-readable circuit name.
   */
  name: string;


  /**
   * Nominal circuit voltage.
   */
  voltage: Voltage;


  /**
   * Breaker protecting the circuit.
   */
  breaker: Breaker;


  /**
   * Primary wire definition for compatibility
   * with the current simulator.
   *
   * The long-term electrical graph may replace
   * this with multiple conductor segments.
   */
  wire: Wire;


  /**
   * Devices connected to this circuit.
   */
  devices: ElectricalDevice[];


  // ----------------------------------------------------------
  // PANEL OWNERSHIP
  // ----------------------------------------------------------
  //
  // Identifies which electrical panel owns this circuit.
  //
  // Examples:
  //
  // panel-100
  // panel-200
  //

  panelId?: string;


  // ----------------------------------------------------------
  // BREAKER OWNERSHIP
  // ----------------------------------------------------------
  //
  // Identifies the breaker feeding this circuit.
  //

  breakerId?: string;

}


// ============================================================
// DEVICE TERMINAL
// ============================================================

export interface DeviceTerminal {

  /**
   * Unique terminal identifier.
   */
  id: string;


  /**
   * Human-readable terminal name.
   */
  name: string;


  /**
   * Electrical terminal category.
   */
  type:
    | "hot"
    | "neutral"
    | "ground"
    | "load"
    | "traveler"
    | "control";


  /**
   * Terminal position relative to the device.
   */
  x: number;

  y: number;


  /**
   * Optional terminal side.
   */
  side?:
    | "left"
    | "right"
    | "top"
    | "bottom";

}


// ============================================================
// DEVICE TYPES
// ============================================================
//
// The simulator currently contains both the newer
// title-case device names and some legacy lowercase names.
//
// They are intentionally retained for compatibility.
//
// New components should preferably use the title-case forms.
//

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

  // ----------------------------------------------------------
  // Legacy component names
  // ----------------------------------------------------------

  | "breaker"
  | "switch"
  | "light"
  | "receptacle"
  | "motor"
  | "appliance"

  // ----------------------------------------------------------
  // Compatibility fallback
  // ----------------------------------------------------------

  | string;


// ============================================================
// ELECTRICAL DEVICE
// ============================================================

export interface ElectricalDevice {

  /**
   * Unique device identifier.
   */
  id: string;


  /**
   * Human-readable device name.
   */
  name: string;


  /**
   * Workspace/display symbol.
   */
  symbol: string;


  /**
   * Device category.
   */
  type: DeviceType;


  // ----------------------------------------------------------
  // GENERAL INFORMATION
  // ----------------------------------------------------------

  description?: string;


  // ----------------------------------------------------------
  // ELECTRICAL PROPERTIES
  // ----------------------------------------------------------

  /**
   * Electrical load represented by the device.
   */
  load?: ElectricalLoad;


  /**
   * Nominal device voltage.
   */
  voltage?: Voltage;


  /**
   * Device/circuit amperage.
   */
  amperage?: number;


  /**
   * Number of poles when applicable.
   */
  poles?: BreakerPoles;


  // ----------------------------------------------------------
  // BREAKER PROPERTIES
  // ----------------------------------------------------------

  /**
   * Breaker rating associated with the device.
   */
  breakerSize?: number;


  /**
   * Main breaker rating for a panel device.
   */
  mainBreaker?: number;


  // ----------------------------------------------------------
  // PANEL OWNERSHIP
  // ----------------------------------------------------------
  //
  // Identifies the electrical panel associated with
  // this device/circuit.
  //
  // Examples:
  //
  // panel-100
  // panel-200
  //

  panelId?: string;


  // ----------------------------------------------------------
  // BREAKER OWNERSHIP
  // ----------------------------------------------------------
  //
  // Identifies the breaker feeding this device/circuit.
  //

  breakerId?: string;


  // ----------------------------------------------------------
  // FULL BREAKER PANEL MODEL
  // ----------------------------------------------------------
  //
  // Normally populated only for:
  //
  // - Breaker Panel
  // - Sub Panel
  //
  // The panel model contains the physical breaker-slot
  // arrangement and service information.
  //

  panel?: BreakerPanel;


  // ----------------------------------------------------------
  // SIMULATION VALUES
  // ----------------------------------------------------------

  /**
   * Whether this device/circuit is currently tripped.
   */
  tripped?: boolean;


  /**
   * Calculated electrical load in watts.
   */
  calculatedLoad?: number;


  /**
   * Calculated current in amperes.
   */
  calculatedAmps?: number;


  /**
   * Compatibility list of connected device IDs.
   *
   * The long-term electrical model should resolve
   * connectivity through the electrical graph.
   */
  connectedDevices?: string[];


  // ----------------------------------------------------------
  // WORKSPACE POSITION
  // ----------------------------------------------------------

  x: number;

  y: number;


  /**
   * Electrical terminals displayed on the device.
   */
  terminals: DeviceTerminal[];

}


// ============================================================
// SIMULATION MODES
// ============================================================

export type SimulationMode =

  | "APPRENTICE"
  | "ENGINEERING"
  | "HYBRID";