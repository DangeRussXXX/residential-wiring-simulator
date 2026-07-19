import { useState } from "react";

type Terminal = {
  name: string;
  x: number;
  y: number;
};

type Component = {
  id: number;
  type: string;
  x: number;
  y: number;
  terminals: Terminal[];
};

function App() {
  const [components, setComponents] = useState<Component[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  function addComponent(type: string) {
    const newComponent: Component = {
      id: Date.now(),
      type: type,
      x: 50,
      y: 50,
      terminals: [
        {
          name: "Hot",
          x: 10,
          y: 55
        },
        {
          name: "Neutral",
          x: 90,
          y: 55
        }
      ]
    };

    setComponents([...components, newComponent]);
  }

  function startDrag(id: number) {
    setDraggingId(id);
  }

  function moveComponent(event: React.MouseEvent<HTMLDivElement>) {
    if (draggingId === null) return;

    const workspace = event.currentTarget.getBoundingClientRect();

    const x = event.clientX - workspace.left - 40;
    const y = event.clientY - workspace.top - 20;

    setComponents(
      components.map((component) =>
        component.id === draggingId
          ? {
              ...component,
              x,
              y
            }
          : component
      )
    );
  }

  function stopDrag() {
    setDraggingId(null);
  }

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial"
      }}
    >
      <h1>Residential Wiring Simulator</h1>

      <p>
        Version 0.5 - Electrical Terminals
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
              width: "100px",
              height: "50px",
              border: "2px solid black",
              backgroundColor: "white",
              cursor: "grab",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >

            {component.type}

            {component.terminals.map((terminal) => (
              <div
                key={terminal.name}
                title={terminal.name}
                style={{
                  position: "absolute",
                  left: terminal.x,
                  top: terminal.y,
                  width: "10px",
                  height: "10px",
                  backgroundColor: "red",
                  borderRadius: "50%",
                  border: "1px solid black"
                }}
              />
            ))}

          </div>

        ))}

      </div>

    </div>
  );
}

export default App;