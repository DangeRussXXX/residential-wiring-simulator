import type { MenuItem } from "./MenuBar";

export const menuData: MenuItem[] = [
  {
    label: "File",
    items: [
      "New Project",
      "Open...",
      "Save",
      "Save As...",
      "---",
      "Import",
      "Export",
      "Print",
      "---",
      "Settings",
    ],
  },

  {
    label: "Edit",
    items: [
      "Undo",
      "Redo",
      "---",
      "Cut",
      "Copy",
      "Paste",
      "Delete",
    ],
  },

  {
    label: "View",
    items: [
      "Zoom In",
      "Zoom Out",
      "Reset Zoom",
      "---",
      "Show Grid",
      "Snap To Grid",
      "Fullscreen",
    ],
  },

  {
    label: "Circuit",
    items: [
      "Run Simulation",
      "Validate Wiring",
      "Calculate Load",
      "---",
      "Trip Breaker",
      "Reset Breaker",
      "---",
      "Generate Report",
    ],
  },

  {
    label: "Simulation",
    items: [
      "Start",
      "Pause",
      "Stop",
      "---",
      "Voltage Overlay",
      "Current Flow",
      "Thermal View",
      "Fault Finder",
    ],
  },

  {
    label: "Tools",
    items: [
      "Selection Tool",
      "Wire Tool",
      "Delete Wire",
      "---",
      "Inspector",
      "Properties",
    ],
  },

  {
    label: "Lessons",
    items: [
      "Beginner",
      "Intermediate",
      "Advanced",
      "---",
      "Code Challenges",
    ],
  },

  {
    label: "Help",
    items: [
      "Documentation",
      "Keyboard Shortcuts",
      "---",
      "About",
      "Check for Updates",
    ],
  },
];