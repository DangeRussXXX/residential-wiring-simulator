export type TerminalType =
  | "hot"
  | "neutral"
  | "ground"
  | "load";


export type Terminal = {

  id:string;

  name:string;

  type:TerminalType;

  x:number;

  y:number;

};



export type Device = {

  id:string;

  name:string;

  x:number;

  y:number;

  terminals:Terminal[];

};



export type Wire = {

  id:string;

  fromDevice:string;

  fromTerminal:string;

  toDevice:string;

  toTerminal:string;

  color:string;

};