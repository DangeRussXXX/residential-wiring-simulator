// src/simulator/simulatorState.ts


// ===============================
// Types
// ===============================

export type ComponentType =
  | "BreakerPanel"
  | "Breaker"
  | "Outlet"
  | "Switch"
  | "Light"
  | "JunctionBox"
  | "GFCI"
  | "Appliance";


export type Room = {
  id: string;
  name: string;
};


export type ElectricalComponent = {
  id: string;

  type: ComponentType;

  name: string;

  roomId?: string;

  x: number;
  y: number;


  // Electrical properties

  voltage?: number;

  amperage?: number;

  wattage?: number;


  breakerId?: string;


  // Simulation

  enabled: boolean;

  fault?: boolean;
};



export type Wire = {

  id: string;

  from: string;

  to: string;


  gauge:
    | "14 AWG"
    | "12 AWG"
    | "10 AWG"
    | "8 AWG";


  length: number;


  energized: boolean;

};



export type Breaker = {

  id: string;

  name: string;

  amperage: number;


  currentLoad: number;


  tripped: boolean;

};



export type SimulatorProject = {

  id: string;

  name: string;

  version: string;

  created: string;


  rooms: Room[];

  components: ElectricalComponent[];

  wires: Wire[];

  breakers: Breaker[];


  simulationRunning: boolean;

};




// ===============================
// Initial State
// ===============================


export const defaultSimulatorState:
SimulatorProject = {

  id:
    crypto.randomUUID(),


  name:
    "Untitled Residential Project",


  version:
    "1.0",


  created:
    new Date().toISOString(),



  rooms: [
    {
      id:
        "living-room",

      name:
        "Living Room",
    }
  ],



  components: [],



  wires: [],



  breakers: [],



  simulationRunning:
    false,

};




// ===============================
// State Manager
// ===============================


let simulatorState:
SimulatorProject =
{
  ...defaultSimulatorState
};



// ===============================
// Get State
// ===============================


export function getSimulatorState()
: SimulatorProject {

  return simulatorState;

}




// ===============================
// Replace Entire Project
// ===============================


export function loadSimulatorState(
  project: SimulatorProject
) {

  simulatorState =
  {
    ...project
  };

}




// ===============================
// Reset Project
// ===============================


export function resetSimulator()
{

  simulatorState =
  {
    ...defaultSimulatorState,

    id:
      crypto.randomUUID(),

    created:
      new Date().toISOString(),

  };

}




// ===============================
// Project Info
// ===============================


export function renameProject(
  name:string
){

  simulatorState.name =
    name;

}




// ===============================
// Rooms
// ===============================


export function addRoom(
  name:string
){

  const room:Room =
  {
    id:
      crypto.randomUUID(),

    name,

  };


  simulatorState.rooms.push(room);


  return room;

}




export function removeRoom(
  id:string
){

  simulatorState.rooms =
    simulatorState.rooms.filter(
      room =>
        room.id !== id
    );

}




// ===============================
// Components
// ===============================


export function addComponent(
  component:
  Omit<ElectricalComponent,"id">
){

  const newComponent:
  ElectricalComponent =
  {

    id:
      crypto.randomUUID(),

    ...component,

  };


  simulatorState.components.push(
    newComponent
  );


  return newComponent;

}





export function removeComponent(
  id:string
){

  simulatorState.components =
    simulatorState.components.filter(
      component =>
        component.id !== id
    );


  // remove attached wires

  simulatorState.wires =
    simulatorState.wires.filter(
      wire =>
        wire.from !== id &&
        wire.to !== id
    );

}




export function updateComponent(
  id:string,

  changes:
  Partial<ElectricalComponent>
){

  const component =
    simulatorState.components.find(
      c =>
        c.id === id
    );


  if(component)
  {

    Object.assign(
      component,
      changes
    );

  }

}




// ===============================
// Wiring
// ===============================


export function addWire(
  wire:
  Omit<Wire,"id">
){

  const newWire:
  Wire =
  {

    id:
      crypto.randomUUID(),

    ...wire

  };


  simulatorState.wires.push(
    newWire
  );


  return newWire;

}




export function removeWire(
  id:string
){

  simulatorState.wires =
    simulatorState.wires.filter(
      wire =>
        wire.id !== id
    );

}




// ===============================
// Breakers
// ===============================


export function addBreaker(
  breaker:
  Omit<Breaker,"id">
){

  const newBreaker:
  Breaker =
  {

    id:
      crypto.randomUUID(),

    ...breaker

  };


  simulatorState.breakers.push(
    newBreaker
  );


  return newBreaker;

}





export function tripBreaker(
  id:string
){

  const breaker =
    simulatorState.breakers.find(
      b =>
        b.id === id
    );


  if(breaker)
  {
    breaker.tripped =
      true;
  }

}





export function resetBreaker(
  id:string
){

  const breaker =
    simulatorState.breakers.find(
      b =>
        b.id === id
    );


  if(breaker)
  {
    breaker.tripped =
      false;

    breaker.currentLoad =
      0;
  }

}




// ===============================
// Simulation
// ===============================


export function startSimulation()
{

  simulatorState.simulationRunning =
    true;

}




export function stopSimulation()
{

  simulatorState.simulationRunning =
    false;

}




export function toggleSimulation()
{

  simulatorState.simulationRunning =
    !simulatorState.simulationRunning;

}




// ===============================
// Electrical Calculations
// ===============================


export function calculateTotalLoad()
{

  return simulatorState.components
    .reduce(
      (
        total,
        component
      ) =>
      total +
      (component.wattage || 0),

      0
    );

}




export function calculateCurrent(
  voltage:number = 120
){

  const watts =
    calculateTotalLoad();


  return watts / voltage;

}





// ===============================
// Save Export
// ===============================


export function exportProject()
:
SimulatorProject {

  return JSON.parse(
    JSON.stringify(
      simulatorState
    )
  );

}




// ===============================
// Import Project
// ===============================


export function importProject(
  project:
  SimulatorProject
){

  simulatorState =
  JSON.parse(
    JSON.stringify(
      project
    )
  );

}