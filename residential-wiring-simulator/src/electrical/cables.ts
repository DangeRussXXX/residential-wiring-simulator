// Residential Wiring Simulator v2.3
// Cable and conductor system
// Foundation for circuit graph, wire tool, and NEC training logic


export type CableType =
  | "14/2 NM-B"
  | "12/2 NM-B"
  | "10/2 NM-B"
  | "14/3 NM-B"
  | "12/3 NM-B";



export type CableApplication =
  | "LIGHTING"
  | "RECEPTACLE"
  | "APPLIANCE"
  | "SWITCHING"
  | "MULTI_WIRE";



export type InstallationMethod =
  | "NM-B"
  | "MC"
  | "CONDUIT";




// Physical cable definition

export interface Cable {


  id:string;


  name:CableType;


  gauge:
    | "#14"
    | "#12"
    | "#10";



  conductors:number;


  groundIncluded:boolean;



  maxAmps:number;



  applications:CableApplication[];



  installationMethod:InstallationMethod;



  description:string;


}





// Available residential cable catalog

export const cableCatalog:Cable[] = [



//
// 14/2 NM-B
//

{
id:"14-2",

name:"14/2 NM-B",

gauge:"#14",

conductors:2,

groundIncluded:true,

maxAmps:15,

applications:[
  "LIGHTING",
  "RECEPTACLE"
],

installationMethod:
"NM-B",

description:
"15 amp general lighting and small load circuits"
},





//
// 12/2 NM-B
//

{
id:"12-2",

name:"12/2 NM-B",

gauge:"#12",

conductors:2,

groundIncluded:true,

maxAmps:20,

applications:[
  "LIGHTING",
  "RECEPTACLE"
],

installationMethod:
"NM-B",

description:
"20 amp receptacle and general purpose branch circuits"
},





//
// 10/2 NM-B
//

{
id:"10-2",

name:"10/2 NM-B",

gauge:"#10",

conductors:2,

groundIncluded:true,

maxAmps:30,

applications:[
  "APPLIANCE"
],

installationMethod:
"NM-B",

description:
"30 amp dedicated appliance circuits"
},





//
// 14/3 NM-B
//

{
id:"14-3",

name:"14/3 NM-B",

gauge:"#14",

conductors:3,

groundIncluded:true,

maxAmps:15,

applications:[
  "SWITCHING"
],

installationMethod:
"NM-B",

description:
"Three-way switching and lighting control circuits"
},





//
// 12/3 NM-B
//

{
id:"12-3",

name:"12/3 NM-B",

gauge:"#12",

conductors:3,

groundIncluded:true,

maxAmps:20,

applications:[
  "MULTI_WIRE",
  "SWITCHING"
],

installationMethod:
"NM-B",

description:
"Multi-wire branch circuits and advanced switching applications"
}



];