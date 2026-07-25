import {
  createContext,
  useContext,
  useState
} from "react";


import type {
  ReactNode
} from "react";


import type {
  ElectricalDevice
} from "../electrical/types";


import type {
  Connection
} from "../electrical/connections";




type SimulatorContextType = {


  devices:
  ElectricalDevice[];


  setDevices:
  React.Dispatch<
    React.SetStateAction<ElectricalDevice[]>
  >;



  connections:
  Connection[];



  setConnections:
  React.Dispatch<
    React.SetStateAction<Connection[]>
  >;



  selectedDevice:
  ElectricalDevice|null;



  setSelectedDevice:
  React.Dispatch<
    React.SetStateAction<ElectricalDevice|null>
  >;


};







const SimulatorContext =

createContext<SimulatorContextType | null>(null);









export function SimulatorProvider(
{
children
}:{
children:ReactNode
}

){



const [devices,setDevices] =

useState<ElectricalDevice[]>([]);





const [connections,setConnections] =

useState<Connection[]>([]);





const [selectedDevice,setSelectedDevice] =

useState<ElectricalDevice|null>(null);







return (

<SimulatorContext.Provider

value={{

devices,

setDevices,

connections,

setConnections,

selectedDevice,

setSelectedDevice

}}

>

{children}

</SimulatorContext.Provider>

);


}









export function useSimulator(){


const context =

useContext(SimulatorContext);



if(!context){

throw new Error(

"useSimulator must be inside SimulatorProvider"

);

}



return context;


}