 import { useState } from "react";

type Component = {
  id: number;
  type: string;
};

function App() {

  const [components, setComponents] = useState<Component[]>([]);

  function addComponent(type: string) {
    const newComponent = {
      id: Date.now(),
      type: type
    };

    setComponents([...components, newComponent]);
  }

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>

      <h1>Residential Wiring Simulator</h1>

      <p>
        Version 0.2 - Component Placement
      </p>

      <hr />

      <h2>Components</h2>

      <button onClick={() => addComponent("Breaker Panel")}>
        Breaker Panel
      </button>

      <button onClick={() => addComponent("Light")}
        style={{marginLeft:"10px"}}>
        Light
      </button>

      <button onClick={() => addComponent("Switch")}
        style={{marginLeft:"10px"}}>
        Switch
      </button>

      <button onClick={() => addComponent("Receptacle")}
        style={{marginLeft:"10px"}}>
        Receptacle
      </button>


      <h2>Workspace</h2>

      <div
        style={{
          height:"400px",
          border:"2px solid black",
          backgroundColor:"#f5f5f5",
          padding:"20px"
        }}
      >

        {components.map((component) => (

          <div
            key={component.id}
            style={{
              border:"1px solid black",
              backgroundColor:"white",
              padding:"10px",
              margin:"10px",
              width:"150px"
            }}
          >

            {component.type}

          </div>

        ))}

      </div>

    </div>
  );
}

export default App;