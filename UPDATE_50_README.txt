NOVA Residential Wiring Simulator — Update 50: Integrated Open Device Box

Replaces Update 49's overlapping, detached gray-box wiring overlay with one
integrated wall-mounted device rendering.

- For devices with installed cables, the device and open electrical box render
  together in one 150x122 illustration at the device's saved position.
- Draws saved direct-to-terminal wires without wire nuts.
- Draws individually capped conductors with their own upright orange caps.
- Draws splice members entering upright wire nuts; saved pigtails connect from
  those nuts toward the device's mapped terminal.
- Supports GFCI LINE and LOAD terminal groups, ground screw, switch and light
  illustrations; preserves saved wire records and right-side wiring editor.
- The old detached open-box overlay is removed.

LIMITATIONS: Visual schematic only. Wall-device terminal coordinates are
approximate and device-specific wiring is not a full 3D/physical model.
The detailed right-hand wiring editor remains authoritative. The wall graphic
does not simulate voltage or verify electrical-code compliance.

VERIFICATION: TypeScript check passed. Browser runtime not visually tested.
INSTALL: Back up the current project and browser project data; extract this
full ZIP in a new folder; run npm install then npm run dev.
