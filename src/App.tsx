 import { useState } from "react";

type Component = {
  id: number;
  type: string;
  x: number;
  y: number;
};

function App() {
  const [components, setComponents] = useState<Component[]>([]);

  function addComponent(type: string) {
    const newComponent = {
      id: Date.now(),
      type: type,
      x: Math.random() * 250,
      y: Math.random() * 200
    };

    setComponents([...components, newComponent]);
  }

  function moveComponent(id: number) {
    setComponents(
      components.map((component) => {
        if (component.id === id) {
          return {
            ...component,
            x: component.x + 20,
            y: component.y + 20
          };
        }

        return component;
      })
    );
  }

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>

      <h1>Residential Wiring Simulator</h1>

      <p>
        Version 0.3 - Component Movement
      </p>

      <hr />

      <h2>Components</h2>

      <button onClick={() => addComponent("Breaker Panel")}>
        Breaker Panel
      </button>

      <button
        onClick={() => addComponent("Light")}
        style={{ marginLeft: "10px" }}
      >
        Light
      </button>

      <button
        onClick={() => addComponent("Switch")}
        style={{ marginLeft: "10px" }}
      >
        Switch
      </button>

      <button
        onClick={() => addComponent("Receptacle")}
        style={{ marginLeft: "10px" }}
      >
        Receptacle
      </button>


      <h2>Workspace</h2>

      <div
        style={{
          height: "400px",
          border: "2px solid black",
          backgroundColor: "#f5f5f5",
          position: "relative",
          overflow: "hidden"
        }}
      >

        {components.map((component) => (

          <div
            key={component.id}
            onClick={() => moveComponent(component.id)}
            style={{
              position: "absolute",
              left: component.x,
              top: component.y,
              border: "2px solid black",
              backgroundColor: "white",
              padding: "15px",
              cursor: "pointer",
              userSelect: "none"
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