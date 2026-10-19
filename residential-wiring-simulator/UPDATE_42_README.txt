UPDATE 42 — PIGTAILS & FEED-THROUGH SPLICES

Based on the Update 41 complete project.

What's changed:
- In Device Wiring > Splices & Pigtails, select two or more loose conductors from cables entering the same device box.
- Choose a compatible device terminal under Pigtail to device.
- Create splice + pigtail stores one connector with all selected cable conductors and a pigtail-to-terminal assignment.
- The wiring illustration shows the conductor bundle converging on one connector and the pigtail leaving the connector to its device terminal.
- Remove splice removes the splice and pigtail link together.
- A validation message appears for incompatible conductor families, occupied pigtail terminals, or previously terminated wires.
- Splice/pigtail data persists through the existing shared project wallCables records.

Example: two cables entering a receptacle box: select incoming BLACK and outgoing BLACK, choose Hot / brass screw, then Create splice + pigtail.
For a switch controlling a light, do not splice the switched-hot to the always-hot feed. The switched hot must remain connected to the switch load terminal.

Notes:
- The pigtail is represented inside the wiring editor, not as a separately movable device on the wall.
- The drawing is a training schematic; connector listing, conductor size/count, box fill, grounding and code compliance are not verified.
- Existing project data is preserved; make a backup first.
- TypeScript compilation passed. Complete Vite bundle/runtime was not verified.

Install:
1. Back up current project and browser-saved data.
2. Extract this full project ZIP to a new folder.
3. Run npm install, then npm run dev.
4. Route the incoming and outgoing cables to the same device box, open Splices & Pigtails, select their black conductors, choose the pigtail destination, and click Create splice + pigtail.
