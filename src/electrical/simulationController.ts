// Residential Wiring Simulator v2.3
// Simulation controller
//
// Controls:
// - circuit testing
// - power flow execution
// - fault reporting
// - animation preparation


import type {
  CircuitGraph
} from "./circuitGraph";


import {
  calculatePowerFlow,
  type PowerFlowResult
} from "./powerFlow";


import {
  validateConnection,
  type ConnectionValidationResult
} from "./connectionValidator";



export type SimulationState =

  | "IDLE"
  | "TESTING"
  | "POWERING"
  | "FAILED"
  | "COMPLETE";





export interface SimulationAnimation {


  deviceId:string;


  connectionId:string;


  state:

    | "ENERGIZED"
    | "FAILED"
    | "OFF";


  delay:number;


}





export interface SimulationControllerResult {


  state:SimulationState;


  powerFlow:PowerFlowResult;


  validation:ConnectionValidationResult;


  animations:SimulationAnimation[];


}







export class SimulationController {



  private graph:CircuitGraph;





  constructor(
    graph:CircuitGraph
  ){

    this.graph = graph;

  }







  updateGraph(
    graph:CircuitGraph
  ){

    this.graph = graph;

  }







  testCircuit(
    sourceId:string
  ):SimulationControllerResult {



    const validationMessages =

      this.graph.connections.map(

        connection =>

          validateConnection(

            connection,

            this.graph.devices

          )

      );





    const failedConnections:string[]=[];




    validationMessages.forEach(

      (result,index)=>{


        if(!result.valid){

          failedConnections.push(

            this.graph.connections[index].id

          );

        }


      }

    );








    if(failedConnections.length > 0){


      return {


        state:"FAILED",



        powerFlow:{


          energizedDevices:[],


          energizedConnections:[],


          failedConnections


        },



        validation:{

          valid:false,

          messages:

            validationMessages.flatMap(

              result => result.messages

            )

        },



        animations:

          this.createFailureAnimation(

            failedConnections

          )


      };


    }








    const powerFlow =

      calculatePowerFlow(

        this.graph,

        sourceId

      );








    return {


      state:

        powerFlow.failedConnections.length

        ?

        "FAILED"

        :

        "COMPLETE",



      powerFlow,



      validation:{

        valid:true,

        messages:

          validationMessages.flatMap(

            result => result.messages

          )

      },



      animations:

        this.createPowerAnimation(

          powerFlow

        )



    };



  }









  private createPowerAnimation(

    flow:PowerFlowResult

  ):SimulationAnimation[]{



    const animations:

      SimulationAnimation[]=[];



    let delay=0;





    flow.energizedDevices.forEach(

      (id:string)=>{


        animations.push({


          deviceId:id,


          connectionId:"",


          state:"ENERGIZED",


          delay


        });



        delay +=250;


      }

    );








    flow.energizedConnections.forEach(

      (id:string)=>{


        animations.push({


          deviceId:"",


          connectionId:id,


          state:"ENERGIZED",


          delay


        });


        delay +=250;


      }

    );








    flow.failedConnections.forEach(

      (id:string)=>{


        animations.push({


          deviceId:"",


          connectionId:id,


          state:"FAILED",


          delay


        });



        delay +=250;


      }

    );





    return animations;


  }









  private createFailureAnimation(

    connections:string[]

  ):SimulationAnimation[]{



    return connections.map(

      (id,index)=>({


        deviceId:"",


        connectionId:id,


        state:"FAILED",


        delay:index * 300


      })


    );


  }



}