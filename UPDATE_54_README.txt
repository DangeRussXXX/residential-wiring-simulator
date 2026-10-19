NOVA Residential Wiring Simulator — Update 54: Top-Entry Wiring

Changes
- Device Wiring right panel: cable jacket enters from the TOP, and conductor
  paths branch from the top into the actual terminal/splice positions.
- Expanded wall device wiring: cable entries are clustered above the device,
  with individual wires continuing to saved terminals.
- Preserves existing cable IDs, terminal assignments, splices, device placement,
  and home-run data.

The compact wall box already has top-entry cables; this update aligns the
expanded wiring diagram and the right-side editor with that routing.
The diagrams are educational schematics, not proof of electrical safety.

Verification: TypeScript build check PASSED (tsc -b). Browser appearance not
visually tested. Back up project and browser data before replacing.

Installation: unzip full project to a new folder; npm install; npm run dev.
