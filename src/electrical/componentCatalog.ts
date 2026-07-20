// Residential Wiring Simulator v2.3
// Master Electrical Component Catalog

import type { DeviceType, DeviceTerminal } from "./types";


export interface ComponentDefinition {

  name:string;

  type:DeviceType;

  category:string;

  description:string;


  electrical?:{

    voltage?:number;

    watts?:number;

    amps?:number;

    poles?:number;

  };


  terminals:DeviceTerminal[];


  symbol:string;

}





export const componentCatalog:ComponentDefinition[] = [



//
// SERVICE EQUIPMENT
//

{
name:"100A Breaker Panel",
type:"Breaker Panel",
category:"Panels",
description:"Residential 100 amp main service panel",

electrical:{
voltage:240,
amps:100,
poles:2
},

terminals:[
{
  id:"hotA",
  name:"Hot A",
  type:"hot",
  x:10,
  y:35
},
{
  id:"hotB",
  name:"Hot B",
  type:"hot",
  x:10,
  y:65
},
{
  id:"neutral",
  name:"Neutral",
  type:"neutral",
  x:130,
  y:35
},
{
  id:"ground",
  name:"Ground",
  type:"ground",
  x:65,
  y:85
}
],

symbol:"breaker-panel"

},



{
name:"200A Breaker Panel",
type:"Breaker Panel",
category:"Panels",
description:"Residential 200 amp main service panel",

electrical:{
voltage:240,
amps:200,
poles:2
},

terminals:[
{
 id:"hotA",
 name:"Hot A",
 type:"hot",
 x:10,
 y:35
},

{
 id:"hotB",
 name:"Hot B",
 type:"hot",
 x:10,
 y:65
},

{
 id:"neutral",
 name:"Neutral",
 type:"neutral",
 x:130,
 y:35
},

{
 id:"ground",
 name:"Ground",
 type:"ground",
 x:65,
 y:85
}
],

symbol:"breaker-panel"

},



{
name:"Sub Panel",
type:"Sub Panel",
category:"Panels",
description:"Secondary distribution panel",

electrical:{
voltage:240,
amps:100,
poles:2
},

terminals:[
{
  id:"hotA",
  name:"Hot A",
  type:"hot",
  x:10,
  y:35
},
{
  id:"hotB",
  name:"Hot B",
  type:"hot",
  x:10,
  y:65
},
{
  id:"neutral",
  name:"Neutral",
  type:"neutral",
  x:130,
  y:35
},
{
  id:"ground",
  name:"Ground",
  type:"ground",
  x:65,
  y:85
}
],

symbol:"sub-panel"

},



//
// SWITCHES
//

{
name:"Single Pole Switch",
type:"Switch",
category:"Switches",
description:"Standard 120V lighting switch",

electrical:{
voltage:120
},

terminals:[
{
  id:"line",
  name:"Line Hot",
  type:"hot",
  x:0,
  y:40
},
{
  id:"load",
  name:"Switch Leg",
  type:"load",
  x:130,
  y:40
},
{
  id:"ground",
  name:"Ground",
  type:"ground",
  x:65,
  y:80
}
],

symbol:"switch-single"

},



{
name:"3-Way Switch",
type:"3-Way Switch",
category:"Switches",
description:"Three way traveler switch",

electrical:{
voltage:120
},

terminals:[
{
  id:"common",
  name:"Common",
  type:"hot",
  x:0,
  y:40
},
{
  id:"traveler1",
  name:"Traveler 1",
  type:"traveler",
  x:130,
  y:25
},
{
  id:"traveler2",
  name:"Traveler 2",
  type:"traveler",
  x:130,
  y:55
},
{
  id:"ground",
  name:"Ground",
  type:"ground",
  x:65,
  y:85
}
],

symbol:"switch-three-way"

},



{
name:"Dimmer Switch",
type:"Dimmer",
category:"Switches",
description:"Variable lighting control",

electrical:{
voltage:120
},

terminals:[
{
  id:"line",
  name:"Line Hot",
  type:"hot",
  x:0,
  y:40
},
{
  id:"load",
  name:"Dimmed Load",
  type:"load",
  x:130,
  y:40
},
{
  id:"ground",
  name:"Ground",
  type:"ground",
  x:65,
  y:80
}
],

symbol:"dimmer"

},



//
// LIGHTING
//

{
name:"Ceiling Light",
type:"Light",
category:"Lighting",
description:"Standard ceiling fixture",

electrical:{
voltage:120,
watts:100
},

terminals:[
{
  id:"hot",
  name:"Light Hot",
 type:"hot",
  x:0,
  y:40
},
{
  id:"neutral",
  name:"Neutral",
  type:"neutral",
  x:130,
  y:40
},
{
  id:"ground",
  name:"Ground",
  type:"ground",
  x:65,
  y:80
}
],

symbol:"light-ceiling"

},



{
name:"Recessed Light",
type:"Light",
category:"Lighting",
description:"Recessed can light",

electrical:{
voltage:120,
watts:15
},

terminals:[
{
  id:"hot",
  name:"Light Hot",
  type:"load",
  x:0,
  y:40
},
{
  id:"neutral",
  name:"Neutral",
  type:"neutral",
  x:130,
  y:40
},
{
  id:"ground",
  name:"Ground",
  type:"ground",
  x:65,
  y:80
}
],

symbol:"light-recessed"

},



//
// RECEPTACLES
//

{
name:"Duplex Receptacle",
type:"Receptacle",
category:"Receptacles",
description:"Standard 120V duplex outlet",

electrical:{
voltage:120
},

terminals:[
{
  id:"hot",
  name:"Hot",
  type:"hot",
  x:0,
  y:35
},
{
  id:"neutral",
  name:"Neutral",
  type:"neutral",
  x:130,
  y:35
},
{
  id:"ground",
  name:"Ground",
  type:"ground",
  x:65,
  y:80
}
],

symbol:"outlet"

},



{
name:"GFCI Receptacle",
type:"GFCI",
category:"Safety",
description:"Ground fault protected receptacle",

electrical:{
voltage:120
},

terminals:[
{
  id:"lineHot",
  name:"Line Hot",
  type:"hot",
  x:0,
  y:25
},
{
  id:"lineNeutral",
  name:"Line Neutral",
  type:"neutral",
  x:130,
  y:25
},
{
  id:"loadHot",
  name:"Load Hot",
  type:"load",
  x:0,
  y:55
},
{
  id:"loadNeutral",
  name:"Load Neutral",
  type:"neutral",
  x:130,
  y:55
},
{
  id:"ground",
  name:"Ground",
  type:"ground",
  x:65,
  y:85
}
],

symbol:"gfci"

},



//
// APPLIANCES
//

{
name:"Electric Range",
type:"Appliance",
category:"Appliances",

description:"240V electric cooking appliance",

electrical:{
voltage:240,
watts:12000
},

terminals:[
{
  id:"hotA",
  name:"Hot A",
  type:"hot",
  x:10,
  y:35
},
{
  id:"hotB",
  name:"Hot B",
  type:"hot",
  x:10,
  y:65
},
{
  id:"neutral",
  name:"Neutral",
  type:"neutral",
  x:130,
  y:35
},
{
  id:"ground",
  name:"Ground",
  type:"ground",
  x:65,
  y:85
}
],

symbol:"range"

},



{
name:"Water Heater",
type:"Appliance",
category:"Appliances",

description:"240V electric water heater",

electrical:{
voltage:240,
watts:4500
},

terminals:[
{
 id:"hotA",
 name:"Hot A",
 type:"hot",
 x:10,
 y:25
},
{
 id:"hotB",
 name:"Hot B",
 type:"hot",
 x:10,
 y:55
},
{
 id:"neutral",
 name:"Neutral",
 type:"neutral",
 x:130,
 y:40
},
{
 id:"ground",
 name:"Ground",
 type:"ground",
 x:65,
 y:85
}
],

symbol:"water-heater"

},



//
// MOTORS
//

{
name:"Exhaust Fan",
type:"Motor",
category:"Motors",

description:"Bathroom ventilation fan",

electrical:{
voltage:120,
watts:50
},

terminals:[
{
 id:"hot",
 name:"Hot",
 type:"hot",
 x:0,
 y:40
},
{
 id:"neutral",
 name:"Neutral",
 type:"neutral",
 x:130,
 y:40
},
{
 id:"ground",
 name:"Ground",
 type:"ground",
 x:65,
 y:80
}
],

symbol:"fan"

},



{
name:"HVAC Condenser",
type:"Motor",
category:"Motors",

description:"Outdoor air conditioning unit",

electrical:{
voltage:240,
amps:30
},

terminals:[
{
  id:"hotA",
  name:"Hot A",
  type:"hot",
  x:10,
  y:35
},
{
  id:"hotB",
  name:"Hot B",
  type:"hot",
  x:10,
  y:65
},
{
  id:"neutral",
  name:"Neutral",
  type:"neutral",
  x:130,
  y:35
},
{
  id:"ground",
  name:"Ground",
  type:"ground",
  x:65,
  y:85
}
],

symbol:"hvac"

}



];