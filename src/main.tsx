import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import {
  SimulatorProvider,
} from "./simulator/SimulatorContext";


import "./index.css";


ReactDOM
  .createRoot(
    document.getElementById("root")!
  )
  .render(

    <React.StrictMode>

      <SimulatorProvider>

        <App />

      </SimulatorProvider>

    </React.StrictMode>

  );