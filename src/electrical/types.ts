// Residential Wiring Simulator v2.3
// Core electrical data types
//
// Master definitions used throughout:
// - devices
// - circuits
// - breakers
// - wires
// - simulation modes



// --------------------------------
// Voltage definitions
// --------------------------------


export type Voltage =

  | 120

  | 240;





// --------------------------------
// Breaker definitions
// --------------------------------


export type BreakerPoles =

  | 1

  | 2;







export type BreakerType =

  | "STANDARD"

  | "AFCI"

  | "GFCI"

  | "DUAL_FUNCTION";







// Individual circuit breaker

export interface Breaker {


  id:string;


  amperage:number;


  voltage:Voltage;


  poles:BreakerPoles;



  breakerType:BreakerType;



  // Circuit assigned to breaker

  circuitId?:string;



  // Electrical state

  energized:boolean;


  tripped:boolean;


  tripReason?:string;


}









// --------------------------------
// Wire definitions
// --------------------------------


export type WireGauge =

  | "#14"

  | "#12"

  | "#10"

  | "#8";








export interface Wire {


  id?:string;


  gauge?:WireGauge;


  length?:number;



  fromDevice:string;


  fromTerminal:string;



  toDevice:string;


  toTerminal:string;



  color?:string;


}









// --------------------------------
// Electrical load
// --------------------------------


export interface ElectricalLoad {


  watts:number;


  continuous?:boolean;


}









// --------------------------------
// Circuit definition
// --------------------------------


export interface Circuit {


  id:string;


  name:string;



  voltage:Voltage;



  breaker:Breaker;



  wire:Wire;



  devices:ElectricalDevice[];


}









// --------------------------------
// Device terminal
// --------------------------------


export interface DeviceTerminal {


  id:string;


  name:string;



  type:

    | "hot"

    | "neutral"

    | "ground"

    | "load"

    | "traveler"

    | "control";



  x:number;


  y:number;



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


  id:string;


  name:string;


  type:DeviceType;



  description?:string;



  // Electrical properties

  load?:ElectricalLoad;



  voltage?:Voltage;


  amperage?:number;


  poles?:BreakerPoles;



  // Breaker panel properties

  breakerSize?:number;


  mainBreaker?:number;



  // Simulation values

  tripped?:boolean;


  calculatedLoad?:number;


  calculatedAmps?:number;



  connectedDevices?:string[];



  // Position on workspace

  x:number;


  y:number;



  terminals:DeviceTerminal[];


}









// --------------------------------
// Simulation modes
// --------------------------------


export type SimulationMode =


  | "APPRENTICE"


  | "ENGINEERING"


  | "HYBRID";