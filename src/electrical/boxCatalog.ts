export type ElectricalBoxType = { id: string; name: string; category: string; gangs: number; volume?: number; note: string };
export const electricalBoxes: ElectricalBoxType[] = [
  {id:"new-1",name:"1-Gang New-Work Box",category:"Device Boxes",gangs:1,volume:18,note:"Stud-mounted device box"},
  {id:"new-2",name:"2-Gang New-Work Box",category:"Device Boxes",gangs:2,volume:32,note:"Two-device stud-mounted box"},
  {id:"new-3",name:"3-Gang New-Work Box",category:"Device Boxes",gangs:3,volume:46,note:"Three-device stud-mounted box"},
  {id:"new-4",name:"4-Gang New-Work Box",category:"Device Boxes",gangs:4,volume:60,note:"Four-device stud-mounted box"},
  {id:"old-1",name:"1-Gang Old-Work Box",category:"Remodel Boxes",gangs:1,volume:18,note:"Cut-in drywall mounting"},
  {id:"old-2",name:"2-Gang Old-Work Box",category:"Remodel Boxes",gangs:2,volume:32,note:"Cut-in drywall mounting"},
  {id:"old-3",name:"3-Gang Old-Work Box",category:"Remodel Boxes",gangs:3,volume:46,note:"Cut-in drywall mounting"},
  {id:"old-4",name:"4-Gang Old-Work Box",category:"Remodel Boxes",gangs:4,volume:60,note:"Cut-in drywall mounting"},
  {id:"metal-1",name:"1-Gang Metal Device Box",category:"Metal Boxes",gangs:1,volume:18,note:"Metal device box"},
  {id:"metal-2",name:"2-Gang Metal Device Box",category:"Metal Boxes",gangs:2,volume:30,note:"Metal device box"},
  {id:"metal-3",name:"3-Gang Metal Device Box",category:"Metal Boxes",gangs:3,volume:45,note:"Metal device box"},
  {id:"metal-4",name:"4-Gang Metal Device Box",category:"Metal Boxes",gangs:4,volume:60,note:"Metal device box"},
  {id:"round",name:"4-Inch Round Fixture Box",category:"Ceiling & Fixture Boxes",gangs:0,note:"For listed fixtures"},
  {id:"octagon",name:"4-Inch Octagon Box",category:"Ceiling & Fixture Boxes",gangs:0,note:"For fixtures and splices"},
  {id:"fan",name:"Fan-Rated Ceiling Box",category:"Ceiling & Fixture Boxes",gangs:0,note:"Use listed fan-support hardware"},
  {id:"square-4",name:"4-Inch Square Junction Box",category:"Junction Boxes",gangs:0,note:"For accessible splices"},
  {id:"square-411",name:"4-11/16-Inch Square Box",category:"Junction Boxes",gangs:0,note:"Larger junction box"},
  {id:"weather-1",name:"1-Gang Weatherproof Box",category:"Weatherproof Boxes",gangs:1,note:"Requires appropriate covers and fittings"},
  {id:"weather-2",name:"2-Gang Weatherproof Box",category:"Weatherproof Boxes",gangs:2,note:"Requires appropriate covers and fittings"},
  {id:"floor",name:"Floor Receptacle Box",category:"Specialty Boxes",gangs:1,note:"Listed floor assembly required"},
  {id:"masonry",name:"Masonry Device Box",category:"Specialty Boxes",gangs:1,note:"For masonry installation"}
];
export type InstalledBox = { id:string; boxTypeId:string; x:number; y:number; deviceIds:string[] };
