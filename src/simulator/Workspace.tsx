import {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef
} from "react";

import Device from "../components/Device";

import type {
  ElectricalDevice as DeviceType,
  Wire
} from "../electrical/types";


export type WorkspaceHandle = {
  addDevice: (type: string) => void;
};



const Workspace = forwardRef<WorkspaceHandle>(
function Workspace(_, ref) {


  const [devices, setDevices] =
    useState<DeviceType[]>([]);


  const [wires, setWires] =
    useState<Wire[]>([]);


  const [wireMode, setWireMode] =
    useState(false);


  const [wireColor, setWireColor] =
    useState("black");


  const [selectedTerminal, setSelectedTerminal] =
    useState<{
      deviceId: string;
      terminalId: string;
    } | null>(null);



  const [selectedDevice, setSelectedDevice] =
    useState<DeviceType | null>(null);



  const [dragging, setDragging] =
    useState<string | null>(null);



  const svgRef =
    useRef<SVGSVGElement | null>(null);





  function createDevice(type: string) {


    let terminals: any[] = [];



    if (type === "Breaker Panel") {

      terminals = [
        {
          id: "hot",
          name: "Main Hot",
          type: "hot",
          x: 10,
          y: 40
        },
        {
          id: "neutral",
          name: "Neutral",
          type: "neutral",
          x: 120,
          y: 40
        },
        {
          id: "ground",
          name: "Ground",
          type: "ground",
          x: 65,
          y: 75
        }
      ];

    }



    if (type === "Switch") {

      terminals = [
        {
          id: "line",
          name: "Line Hot",
          type: "hot",
          x: 0,
          y: 38
        },
        {
          id: "load",
          name: "Switch Leg",
          type: "load",
          x: 130,
          y: 38
        },
        {
          id: "ground",
          name: "Ground",
          type: "ground",
          x: 65,
          y: 75
        }
      ];

    }



    if (type === "Light") {

      terminals = [
        {
          id: "hot",
          name: "Light Hot",
          type: "load",
          x: 0,
          y: 38
        },
        {
          id: "neutral",
          name: "Neutral",
          type: "neutral",
          x: 130,
          y: 38
        },
        {
          id: "ground",
          name: "Ground",
          type: "ground",
          x: 65,
          y: 75
        }
      ];

    }



    if (type === "Receptacle") {

      terminals = [
        {
          id: "hot",
          name: "Hot",
          type: "hot",
          x: 0,
          y: 35
        },
        {
          id: "neutral",
          name: "Neutral",
          type: "neutral",
          x: 130,
          y: 35
        },
        {
          id: "ground",
          name: "Ground",
          type: "ground",
          x: 65,
          y: 75
        }
      ];

    }




    if (type === "GFCI") {

      terminals = [
        {
          id: "lineHot",
          name: "Line Hot",
          type: "hot",
          x: 0,
          y: 25
        },
        {
          id: "lineNeutral",
          name: "Line Neutral",
          type: "neutral",
          x: 130,
          y: 25
        },
        {
          id: "loadHot",
          name: "Load Hot",
          type: "load",
          x: 0,
          y: 55
        },
        {
          id: "loadNeutral",
          name: "Load Neutral",
          type: "neutral",
          x: 130,
          y: 55
        },
        {
          id: "ground",
          name: "Ground",
          type: "ground",
          x: 65,
          y: 80
        }
      ];

    }





    const device: DeviceType = {

      id: crypto.randomUUID(),

      name: type,

      type,

      load: {
        watts: 0
      },

      x: 150,

      y: 120,

      terminals

    };



    setDevices(prev => [
      ...prev,
      device
    ]);

  }





  useImperativeHandle(ref, () => ({

    addDevice: createDevice

  }));







  function selectDevice(id: string) {

    const device =
      devices.find(d => d.id === id);


    setSelectedDevice(device || null);

  }







  function getTerminalPosition(
    deviceId: string,
    terminalId: string
  ) {


    const device =
      devices.find(d => d.id === deviceId);



    const terminal =
      device?.terminals.find(
        t => t.id === terminalId
      );



    if (!device || !terminal)
      return null;



    return {

      x: device.x + terminal.x,

      y: device.y + terminal.y

    };

  }







  function terminalClick(
    deviceId: string,
    terminalId: string
  ) {


    if (!wireMode)
      return;



    if (!selectedTerminal) {


      setSelectedTerminal({

        deviceId,

        terminalId

      });


      return;

    }





    const wire: Wire = {

      id: crypto.randomUUID(),

      fromDevice:
        selectedTerminal.deviceId,

      fromTerminal:
        selectedTerminal.terminalId,

      toDevice:
        deviceId,

      toTerminal:
        terminalId,

      color: wireColor

    };



    setWires(prev => [

      ...prev,

      wire

    ]);



    setSelectedTerminal(null);

  }







  function startDrag(id: string) {

    if (!wireMode) {

      setDragging(id);

    }

  }







  function moveBoard(
    e: React.MouseEvent<HTMLDivElement>
  ) {


    if (!dragging)
      return;



    const rect =
      e.currentTarget.getBoundingClientRect();



    setDevices(prev =>

      prev.map(d =>

        d.id === dragging

        ?

        {

          ...d,

          x:
            e.clientX -
            rect.left -
            75,


          y:
            e.clientY -
            rect.top -
            45

        }

        :

        d

      )

    );

  }







  function clearWorkspace() {

    setDevices([]);

    setWires([]);

    setSelectedTerminal(null);

    setSelectedDevice(null);

  }







  return (

    <div>


      <div
        style={{
          display:"flex",
          gap:"10px",
          marginBottom:"10px"
        }}
      >

        <button
          onClick={() =>
            setWireMode(!wireMode)
          }
        >
          {
            wireMode
            ? "Exit Wire"
            : "Wire Tool"
          }
        </button>



        <select
          value={wireColor}
          onChange={e =>
            setWireColor(e.target.value)
          }
        >

          <option value="black">
            Hot
          </option>

          <option value="red">
            Load
          </option>

          <option value="white">
            Neutral
          </option>

          <option value="green">
            Ground
          </option>

        </select>



        <button onClick={clearWorkspace}>
          Clear
        </button>


      </div>





      <div

        className="training-board"

        onMouseMove={moveBoard}

        onMouseUp={() =>
          setDragging(null)
        }

        style={{

          width:"100%",

          height:"calc(100vh - 170px)",

          minHeight:"700px",

          overflow:"auto",

          background:"#d7dbe0",

          border:"2px solid #555",

          borderRadius:"8px",

          position:"relative"

        }}

      >



        <div

          style={{

            width:"2000px",

            height:"1200px",

            position:"relative"

          }}

        >



          <svg

            ref={svgRef}

            style={{

              position:"absolute",

              left:0,

              top:0,

              width:"2000px",

              height:"1200px",

              pointerEvents:"none"

            }}

          >

            {
              wires.map(w => {

                const start =
                  getTerminalPosition(
                    w.fromDevice,
                    w.fromTerminal
                  );


                const end =
                  getTerminalPosition(
                    w.toDevice,
                    w.toTerminal
                  );


                if (!start || !end)
                  return null;



                return (

                  <line

                    key={w.id}

                    x1={start.x}

                    y1={start.y}

                    x2={end.x}

                    y2={end.y}

                    stroke={w.color}

                    strokeWidth="5"

                  />

                );

              })
            }

          </svg>





          {
            devices.map(d => (

              <Device

                key={d.id}

                device={d}

                wireMode={wireMode}

                selectedTerminal={
                  selectedTerminal
                  ?
                  `${selectedTerminal.deviceId}-${selectedTerminal.terminalId}`
                  :
                  null
                }

                selected={
                  selectedDevice?.id === d.id
                }

                onSelect={selectDevice}

                onTerminalClick={terminalClick}

                onStartDrag={startDrag}

              />

            ))
          }



        </div>


      </div>


    </div>

  );

});


export default Workspace;