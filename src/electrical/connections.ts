// Residential Wiring Simulator v2.5
// Electrical connection system
//
// Handles:
// - physical wire connections
// - wire properties
// - installation methods
// - conductor information
// - future breaker/circuit integration


import type {
  WireGauge
} from "./types";


export function createDefaultWireProperties(){

return {

gauge:"#14" as WireGauge,

cableType:"14/2 NM-B",

installation:"NM-B",

color:"BLACK",

length:0,

energized:false,

current:0,

voltage:120

};

}

export type ConnectionStatus =
  | "CONNECTED"
  | "OPEN"
  | "FAULT";





// ----------------------------------
// Cable Types
// ----------------------------------

export type CableType =
  | "14/2 NM-B"
  | "12/2 NM-B"
  | "10/2 NM-B"
  | "14/3 NM-B"
  | "12/3 NM-B";





// ----------------------------------
// Wire Properties
// ----------------------------------


// WireGauge is imported from ./types
// Supported sizes:
// "#14"
// "#12"
// "#10"
// "#8"



export type InstallationMethod =
  | "NM-B"
  | "CONDUIT"
  | "MC";



export type WireColor =
  | "BLACK"
  | "RED"
  | "WHITE"
  | "GREEN";





export interface WireProperties {


  // conductor size

  gauge:WireGauge;



  // number of conductors

  conductors:number;



  // cable type

  cableType:CableType;



  // physical length

  length:number;



  // maximum current rating

  ampacity:number;



  // conductor color

  color:WireColor;



}








// ----------------------------------
// Terminal Connection Point
// ----------------------------------

export interface ConnectionPoint {


  deviceId:string;


  terminalId:string;


}









// ----------------------------------
// Electrical Connection
// ----------------------------------

export interface Connection {


  id:string;



  from:ConnectionPoint;



  to:ConnectionPoint;





  // Wire information

  cable:CableType;



  wire:WireProperties;





  // Physical installation

  installationMethod:InstallationMethod;





  // Connection state

  status:ConnectionStatus;





  // Simulation engine

  energized:boolean;





  // Optional calculated values

  voltageDrop?:number;



  current?:number;



  length?:number;



  // Future v2.5 breaker integration

  circuitId?:string;



  breakerId?:string;


}