// Residential Wiring Simulator v2.6
// Electrical Component Catalog
//
// Responsibilities:
// - Defines components available to the simulator
// - Defines electrical properties
// - Defines terminal layouts
//
// This file contains catalog/data definitions only.
// It does NOT contain React/UI code.
// It does NOT perform circuit simulation.

import type {
  ElectricalDevice,
  BreakerPoles,
  Voltage
} from "./types";


// ============================================================
// COMPATIBILITY TYPE
// ============================================================
//
// ElectricalDeviceType is not exported by types.ts.
//
// Derive it directly from ElectricalDevice so this catalog
// always stays synchronized with the project's actual device
// type definition.
//

type ElectricalDeviceType =
  ElectricalDevice["type"];


// ============================================================
// CATALOG TYPES
// ============================================================

export type ComponentCategory =
  | "Power"
  | "Distribution"
  | "Protection"
  | "Lighting"
  | "Receptacles"
  | "Switches"
  | "Loads"
  | "HVAC"
  | "Appliances"
  | "Controls"
  | "Other";


export interface ComponentTerminalDefinition {

  id: string;

  label: string;

  type:
    | "LINE"
    | "LOAD"
    | "NEUTRAL"
    | "GROUND"
    | "HOT"
    | "CONTROL";

  x: number;

  y: number;

}


export interface ComponentElectricalDefinition {

  watts?: number;

  amps?: number;

  voltage?: Voltage;

  poles?: BreakerPoles;

}


export interface ComponentCatalogItem {

  name: string;

  category: ComponentCategory;

  symbol: string;

  type: ElectricalDeviceType;

  terminals: ComponentTerminalDefinition[];

  electrical?: ComponentElectricalDefinition;

}


// ============================================================
// TERMINAL HELPERS
// ============================================================

function terminal(
  id: string,
  label: string,
  type: ComponentTerminalDefinition["type"],
  x: number,
  y: number
): ComponentTerminalDefinition {

  return {
    id,
    label,
    type,
    x,
    y
  };

}


// ============================================================
// COMPONENT CATALOG
// ============================================================

export const componentCatalog:
  ComponentCatalogItem[] = [

  // ==========================================================
  // POWER / SERVICE
  // ==========================================================

  {
    name: "Service Entrance",
    category: "Power",
    symbol: "⚡",
    type: "Service Entrance",

    terminals: [

      terminal(
        "l1",
        "L1",
        "HOT",
        0,
        25
      ),

      terminal(
        "l2",
        "L2",
        "HOT",
        0,
        50
      ),

      terminal(
        "neutral",
        "Neutral",
        "NEUTRAL",
        0,
        75
      ),

      terminal(
        "ground",
        "Ground",
        "GROUND",
        0,
        100
      )

    ],

    electrical: {
      voltage: 240
    }

  },


  // ==========================================================
  // BREAKER PANELS
  // ==========================================================

  {
    name: "Breaker Panel",
    category: "Distribution",
    symbol: "▣",
    type: "Breaker Panel",

    terminals: [

      terminal(
        "line-l1",
        "L1",
        "LINE",
        0,
        25
      ),

      terminal(
        "line-l2",
        "L2",
        "LINE",
        0,
        50
      ),

      terminal(
        "neutral",
        "Neutral",
        "NEUTRAL",
        0,
        75
      ),

      terminal(
        "ground",
        "Ground",
        "GROUND",
        0,
        100
      )

    ],

    electrical: {
      voltage: 240
    }

  },


  {
    name: "Sub Panel",
    category: "Distribution",
    symbol: "▣",
    type: "Sub Panel",

    terminals: [

      terminal(
        "line-l1",
        "L1",
        "LINE",
        0,
        25
      ),

      terminal(
        "line-l2",
        "L2",
        "LINE",
        0,
        50
      ),

      terminal(
        "neutral",
        "Neutral",
        "NEUTRAL",
        0,
        75
      ),

      terminal(
        "ground",
        "Ground",
        "GROUND",
        0,
        100
      )

    ],

    electrical: {
      voltage: 240
    }

  },


  // ==========================================================
  // BREAKERS
  // ==========================================================

  {
    name: "15A Breaker",
    category: "Protection",
    symbol: "▭",
    type: "Breaker",

    terminals: [

      terminal(
        "line",
        "Line",
        "LINE",
        0,
        30
      ),

      terminal(
        "load",
        "Load",
        "LOAD",
        100,
        30
      )

    ],

    electrical: {
      amps: 15,
      voltage: 120,
      poles: 1
    }

  },


  {
    name: "20A Breaker",
    category: "Protection",
    symbol: "▭",
    type: "Breaker",

    terminals: [

      terminal(
        "line",
        "Line",
        "LINE",
        0,
        30
      ),

      terminal(
        "load",
        "Load",
        "LOAD",
        100,
        30
      )

    ],

    electrical: {
      amps: 20,
      voltage: 120,
      poles: 1
    }

  },


  {
    name: "30A Double Pole Breaker",
    category: "Protection",
    symbol: "▭",
    type: "Breaker",

    terminals: [

      terminal(
        "line-l1",
        "L1",
        "LINE",
        0,
        25
      ),

      terminal(
        "line-l2",
        "L2",
        "LINE",
        0,
        55
      ),

      terminal(
        "load-l1",
        "Load L1",
        "LOAD",
        100,
        25
      ),

      terminal(
        "load-l2",
        "Load L2",
        "LOAD",
        100,
        55
      )

    ],

    electrical: {
      amps: 30,
      voltage: 240,
      poles: 2
    }

  },


  // ==========================================================
  // RECEPTACLES
  // ==========================================================

  {
    name: "Receptacle",
    category: "Receptacles",
    symbol: "▯",
    type: "Receptacle",

    terminals: [

      terminal(
        "hot",
        "Hot",
        "HOT",
        0,
        25
      ),

      terminal(
        "neutral",
        "Neutral",
        "NEUTRAL",
        0,
        50
      ),

      terminal(
        "ground",
        "Ground",
        "GROUND",
        0,
        75
      )

    ],

    electrical: {
      watts: 1800,
      voltage: 120
    }

  },


  {
    name: "GFCI Receptacle",
    category: "Protection",
    symbol: "G",
    type: "GFCI Receptacle",

    terminals: [

      terminal(
        "line-hot",
        "Line Hot",
        "HOT",
        0,
        20
      ),

      terminal(
        "line-neutral",
        "Line Neutral",
        "NEUTRAL",
        0,
        45
      ),

      terminal(
        "load-hot",
        "Load Hot",
        "LOAD",
        100,
        20
      ),

      terminal(
        "load-neutral",
        "Load Neutral",
        "NEUTRAL",
        100,
        45
      ),

      terminal(
        "ground",
        "Ground",
        "GROUND",
        50,
        80
      )

    ],

    electrical: {
      watts: 1800,
      voltage: 120
    }

  },


  // ==========================================================
  // SWITCHES
  // ==========================================================

  {
    name: "Single Pole Switch",
    category: "Switches",
    symbol: "S",
    type: "Switch",

    terminals: [

      terminal(
        "line",
        "Line",
        "LINE",
        0,
        30
      ),

      terminal(
        "load",
        "Load",
        "LOAD",
        100,
        30
      )

    ],

    electrical: {
      watts: 0,
      voltage: 120
    }

  },


  {
    name: "Three Way Switch",
    category: "Switches",
    symbol: "3W",
    type: "Switch",

    terminals: [

      terminal(
        "common",
        "Common",
        "LINE",
        0,
        30
      ),

      terminal(
        "traveler-1",
        "Traveler 1",
        "CONTROL",
        100,
        20
      ),

      terminal(
        "traveler-2",
        "Traveler 2",
        "CONTROL",
        100,
        50
      )

    ],

    electrical: {
      watts: 0,
      voltage: 120
    }

  },


  // ==========================================================
  // LIGHTING
  // ==========================================================

  {
    name: "Light",
    category: "Lighting",
    symbol: "💡",
    type: "Light",

    terminals: [

      terminal(
        "hot",
        "Hot",
        "HOT",
        0,
        25
      ),

      terminal(
        "neutral",
        "Neutral",
        "NEUTRAL",
        0,
        50
      ),

      terminal(
        "ground",
        "Ground",
        "GROUND",
        0,
        75
      )

    ],

    electrical: {
      watts: 60,
      voltage: 120
    }

  },


  {
    name: "LED Light",
    category: "Lighting",
    symbol: "💡",
    type: "Light",

    terminals: [

      terminal(
        "hot",
        "Hot",
        "HOT",
        0,
        25
      ),

      terminal(
        "neutral",
        "Neutral",
        "NEUTRAL",
        0,
        50
      ),

      terminal(
        "ground",
        "Ground",
        "GROUND",
        0,
        75
      )

    ],

    electrical: {
      watts: 12,
      voltage: 120
    }

  },


  // ==========================================================
  // LOADS
  // ==========================================================

  {
    name: "Motor",
    category: "Loads",
    symbol: "M",
    type: "Motor",

    terminals: [

      terminal(
        "hot",
        "Hot",
        "HOT",
        0,
        25
      ),

      terminal(
        "neutral",
        "Neutral",
        "NEUTRAL",
        0,
        50
      ),

      terminal(
        "ground",
        "Ground",
        "GROUND",
        0,
        75
      )

    ],

    electrical: {
      watts: 1200,
      voltage: 120
    }

  },


  // ==========================================================
  // APPLIANCES
  // ==========================================================

  {
    name: "Water Heater",
    category: "Appliances",
    symbol: "WH",
    type: "Appliance",

    terminals: [

      terminal(
        "l1",
        "L1",
        "HOT",
        0,
        25
      ),

      terminal(
        "l2",
        "L2",
        "HOT",
        0,
        50
      ),

      terminal(
        "ground",
        "Ground",
        "GROUND",
        0,
        75
      )

    ],

    electrical: {
      watts: 4500,
      voltage: 240,
      poles: 2
    }

  },


  {
    name: "Electric Range",
    category: "Appliances",
    symbol: "R",
    type: "Appliance",

    terminals: [

      terminal(
        "l1",
        "L1",
        "HOT",
        0,
        20
      ),

      terminal(
        "l2",
        "L2",
        "HOT",
        0,
        45
      ),

      terminal(
        "neutral",
        "Neutral",
        "NEUTRAL",
        0,
        70
      ),

      terminal(
        "ground",
        "Ground",
        "GROUND",
        0,
        95
      )

    ],

    electrical: {
      watts: 8000,
      voltage: 240,
      poles: 2
    }

  },


  {
    name: "Dryer",
    category: "Appliances",
    symbol: "D",
    type: "Appliance",

    terminals: [

      terminal(
        "l1",
        "L1",
        "HOT",
        0,
        20
      ),

      terminal(
        "l2",
        "L2",
        "HOT",
        0,
        45
      ),

      terminal(
        "neutral",
        "Neutral",
        "NEUTRAL",
        0,
        70
      ),

      terminal(
        "ground",
        "Ground",
        "GROUND",
        0,
        95
      )

    ],

    electrical: {
      watts: 5000,
      voltage: 240,
      poles: 2
    }

  },


  // ==========================================================
  // HVAC
  // ==========================================================

  {
    name: "HVAC",
    category: "HVAC",
    symbol: "HV",
    type: "HVAC",

    terminals: [

      terminal(
        "l1",
        "L1",
        "HOT",
        0,
        25
      ),

      terminal(
        "l2",
        "L2",
        "HOT",
        0,
        50
      ),

      terminal(
        "ground",
        "Ground",
        "GROUND",
        0,
        75
      )

    ],

    electrical: {
      watts: 4000,
      voltage: 240,
      poles: 2
    }

  },


  // ==========================================================
  // CONTROLS
  // ==========================================================

  {
    name: "Thermostat",
    category: "Controls",
    symbol: "T",
    type: "Thermostat",

    terminals: [

      terminal(
        "power",
        "Power",
        "CONTROL",
        0,
        30
      ),

      terminal(
        "control",
        "Control",
        "CONTROL",
        100,
        30
      )

    ],

    /*
     * The current project Voltage type does not include 24V.
     *
     * Keep the catalog compatible with the existing Voltage type
     * rather than forcing an invalid value into the ElectricalDevice
     * model.
     *
     * The thermostat's 24V behavior can be added later when the
     * project's Voltage type is expanded to support 24V.
     */

    electrical: {
      watts: 5,
      voltage: 120
    }

  },


  // ==========================================================
  // OTHER
  // ==========================================================

  {
    name: "Junction Box",
    category: "Other",
    symbol: "J",
    type: "Junction Box",

    terminals: [

      terminal(
        "hot",
        "Hot",
        "HOT",
        0,
        25
      ),

      terminal(
        "neutral",
        "Neutral",
        "NEUTRAL",
        0,
        50
      ),

      terminal(
        "ground",
        "Ground",
        "GROUND",
        0,
        75
      )

    ]

  }

];


// ============================================================
// LOOKUP HELPERS
// ============================================================

export function getCatalogComponent(
  name: string
): ComponentCatalogItem | undefined {

  return componentCatalog.find(
    component =>
      component.name === name
  );

}


export function getCatalogComponentsByCategory(
  category: ComponentCategory
): ComponentCatalogItem[] {

  return componentCatalog.filter(
    component =>
      component.category === category
  );

}


export function getComponentCategories(): ComponentCategory[] {

  return [
    ...new Set(
      componentCatalog.map(
        component =>
          component.category
      )
    )
  ];

}