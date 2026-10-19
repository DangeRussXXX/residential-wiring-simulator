NOVA Residential Wiring Simulator — Update 46
GFCI LINE/LOAD terminal layout and pigtail path cleanup

- GFCI rear view has FOUR separately selectable side terminal screws:
  LINE neutral (upper left, silver), LINE hot (upper right, brass),
  LOAD neutral (lower left, silver), LOAD hot (lower right, brass),
  plus green equipment-ground terminal.
- LINE and LOAD terminal IDs remain the same as earlier updates (brass, silver, load-hot, load-neutral), so existing saved assignments are preserved.
- Device artwork includes reset/test markings and a brief LINE/LOAD orientation note.
- Pigtail paths are routed with a distinct elbow toward their assigned terminal.
- Other device views and project state remain intact.

INSTALL:
1. Back up your project and browser-saved data.
2. Extract this ZIP into a separate folder.
3. npm install
4. npm run dev
5. Check GFCI rear view and existing saved LINE/LOAD connections.

CHECKS: TypeScript compilation passed using installed dependencies. Runtime visual inspection and full Vite bundle were not verified.
NOTE: Actual GFCI terminal positions vary by manufacturer. Follow the markings and instructions on the real device. Connecting downstream loads to GFCI LOAD terminals is a deliberate choice, not required for every outgoing cable.
