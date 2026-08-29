// Residential Wiring Simulator v2.5
// Electrical connection system
//
// Responsibilities:
//
// - Physical wire connections
// - Wire properties
// - Installation methods
// - Conductor information
// - Electrical connection state
// - Circuit/breaker/panel integration
//
// IMPORTANT:
//
// A Connection represents a physical electrical connection.
//
// The electrical hierarchy is:
//
//   Panel
//      ↓
//   Breaker
//      ↓
//   Circuit
//      ↓
//   Wiring
//      ↓
//   Devices
//
// The connection itself does not own the breaker or panel.
// Optional IDs allow the simulation engine to associate a
// physical connection with the appropriate circuit.

// ============================================================
// IMPORTS
// ============================================================

import type {
  WireGauge
} from "./types";


// ============================================================
// CONNECTION STATUS
// ============================================================

export type ConnectionStatus =
  | "CONNECTED"
  | "OPEN"
  | "FAULT";


// ============================================================
// CABLE TYPES
// ============================================================

export type CableType =
  | "14/2 NM-B"
  | "12/2 NM-B"
  | "10/2 NM-B"
  | "14/3 NM-B"
  | "12/3 NM-B";


// ============================================================
// INSTALLATION METHOD
// ============================================================

export type InstallationMethod =
  | "NM-B"
  | "CONDUIT"
  | "MC";


// ============================================================
// WIRE COLOR
// ============================================================

export type WireColor =
  | "BLACK"
  | "RED"
  | "WHITE"
  | "GREEN";


// ============================================================
// WIRE PROPERTIES
// ============================================================

export interface WireProperties {

  /**
   * Conductor gauge.
   */
  gauge: WireGauge;


  /**
   * Number of conductors contained in the cable.
   *
   * Examples:
   *
   * 14/2 → 2 insulated conductors
   * 14/3 → 3 insulated conductors
   */
  conductors: number;


  /**
   * Cable type.
   */
  cableType: CableType;


  /**
   * Physical wire/cable length.
   */
  length: number;


  /**
   * Maximum current rating represented by this
   * connection.
   */
  ampacity: number;


  /**
   * Primary conductor color.
   */
  color: WireColor;

}


// ============================================================
// DEFAULT WIRE PROPERTIES
// ============================================================
//
// Creates the standard wire configuration used when a new
// connection is created.
//
// The returned object exactly matches WireProperties.
//

export function createDefaultWireProperties(): WireProperties {

  return {

    gauge:
      "#14",

    conductors:
      2,

    cableType:
      "14/2 NM-B",

    length:
      0,

    ampacity:
      15,

    color:
      "BLACK"

  };

}


// ============================================================
// TERMINAL CONNECTION POINT
// ============================================================

export interface ConnectionPoint {

  /**
   * Device containing the terminal.
   */
  deviceId: string;


  /**
   * Terminal identifier on that device.
   */
  terminalId: string;

}


// ============================================================
// ELECTRICAL CONNECTION
// ============================================================
//
// Represents a physical conductor/cable connection between
// two device terminals.
//
// Example:
//
//   Panel breaker load terminal
//          ↓
//       Cable
//          ↓
//   Receptacle hot terminal
//
// Neutral and ground are represented through their respective
// device terminals/conductor connections rather than being
// stored as breaker properties.
//

export interface Connection {

  /**
   * Unique connection identifier.
   */
  id: string;


  /**
   * Starting connection point.
   */
  from: ConnectionPoint;


  /**
   * Ending connection point.
   */
  to: ConnectionPoint;


  // ----------------------------------------------------------
  // WIRE INFORMATION
  // ----------------------------------------------------------

  /**
   * Installed cable type.
   */
  cable: CableType;


  /**
   * Physical/electrical wire properties.
   */
  wire: WireProperties;


  // ----------------------------------------------------------
  // PHYSICAL INSTALLATION
  // ----------------------------------------------------------

  /**
   * Installation method.
   */
  installationMethod: InstallationMethod;


  // ----------------------------------------------------------
  // CONNECTION STATE
  // ----------------------------------------------------------

  /**
   * Physical/electrical state of the connection.
   */
  status: ConnectionStatus;


  /**
   * Whether the connection is currently energized.
   *
   * This is a simulation value and should be calculated
   * from the upstream electrical source whenever possible.
   */
  energized: boolean;


  // ----------------------------------------------------------
  // CALCULATED VALUES
  // ----------------------------------------------------------

  /**
   * Calculated voltage drop across this connection.
   */
  voltageDrop?: number;


  /**
   * Calculated current through this connection.
   */
  current?: number;


  /**
   * Optional calculated/overridden cable length.
   */
  length?: number;


  // ----------------------------------------------------------
  // ELECTRICAL OWNERSHIP
  // ----------------------------------------------------------
  //
  // These IDs associate the physical connection with the
  // logical electrical hierarchy.
  //
  // panelId:
  //   Which panel ultimately supplies this connection.
  //
  // circuitId:
  //   Which circuit this connection belongs to.
  //
  // breakerId:
  //   Which breaker supplies the circuit.
  //
  // These are references only. The panel, circuit, and breaker
  // remain the owners of their respective electrical models.
  //

  panelId?: string;

  circuitId?: string;

  breakerId?: string;

}


// ============================================================
// DEFAULT CONNECTION FACTORY
// ============================================================
//
// Provides a safe starting connection object.
//
// This is intentionally separate from
// createDefaultWireProperties() so callers can create either
// wire data or a complete connection.
//

export function createDefaultConnection(
  id: string,
  from: ConnectionPoint,
  to: ConnectionPoint
): Connection {

  const wire =
    createDefaultWireProperties();


  return {

    id,

    from,

    to,

    cable:
      wire.cableType,

    wire,

    installationMethod:
      "NM-B",

    status:
      "CONNECTED",

    energized:
      false

  };

}