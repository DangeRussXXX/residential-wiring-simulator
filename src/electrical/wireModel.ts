// Residential Wiring Simulator v2.5
// Physical wire object


export type WireColor =
  | "BLACK"
  | "WHITE"
  | "GREEN"
  | "RED";


export interface WireTerminal {

  deviceId:string;

  terminalId:string;

}



export interface Wire {


id:string;


from:WireTerminal;


to:WireTerminal;



// Wire specification

gauge:
  | "#14"
  | "#12"
  | "#10"
  | "#8";



cableType:
  | "14/2 NM-B"
  | "12/2 NM-B"
  | "10/2 NM-B"
  | "14/3 NM-B"
  | "12/3 NM-B";



installation:
  | "NM-B"
  | "CONDUIT"
  | "MC";



// conductor appearance

color:WireColor;



// physical data

length:number;



// electrical state

energized:boolean;


current:number;


voltage:number;


}