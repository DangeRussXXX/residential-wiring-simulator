 import { useState } from "react";

type Component = {
  id: number;
  type: string;
  x: number;
  y: number;
};

function App() {
  const [components, setComponents] = useState<Component[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  function addComponent(type: string) {
    const newComponent = {
      id: Date.now(),
      type: type,
      x: 50,
      y: 50
    };

    setComponents([...components, newComponent]);
  }

  function startDrag(id: number) {
    setDraggingId(id);
  }

  function moveComponent(event: React.MouseEvent) {
    if (draggingId === null) return;

    const workspace = event.currentTarget.getBoundingClientRect();

    const x = event.clientX - workspace.left;
    const y = event.clientY - workspace.top;

    setComponents(
      components.map((component) =>
        component.id === draggingId
          ? {
              ...component,
              x: x,
              y: y
            }
          : component
      )
    );
  }

  function stopDrag() {
    setDraggingId(null);
  }

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>

      <h1>Residential Wiring Simulator</h1>

      <p>
        Version 0.4 - Drag and Drop Components
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
        onMouseMove={moveComponent}
        onMouseUp={stopDrag}
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
            onMouseDown={() => startDrag(component.id)}
            style={{
              position: "absolute",
              left: component.x,
              top: component.y,
              border: "2px solid black",
              backgroundColor: "white",
              padding: "15px",
              cursor: "grab",
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