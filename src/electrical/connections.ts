// Residential Wiring Simulator v2.3
// Electrical connection system
//
// Handles physical wire connections


export type ConnectionStatus =
  | "CONNECTED"
  | "OPEN"
  | "FAULT";



export type CableType =
  | "14/2 NM-B"
  | "12/2 NM-B"
  | "10/2 NM-B"
  | "14/3 NM-B"
  | "12/3 NM-B";





export interface ConnectionPoint {

  deviceId:string;

  terminalId:string;

}






export interface Connection {


  id:string;


  from:ConnectionPoint;


  to:ConnectionPoint;



  cable:CableType;



  status:ConnectionStatus;



  // Physical installation

  installationMethod?:
    | "NM-B"
    | "CONDUIT"
    | "MC";



  // Used by animation engine

  energized:boolean;



  length?:number;


}