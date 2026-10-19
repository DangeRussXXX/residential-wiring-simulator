NOVA Residential Wiring Simulator — Update 49
Open-box wall wiring redesign

CHANGES
- Replaced the floating/above-device wire-nut overlay with a junction-box style drawing placed alongside the mounted device, within the wall canvas.
- Cable splice conductors enter the open-box area separately, with upright orange connectors.
- Saved pigtails route back toward the device terminal region.
- Individually capped conductors display their own wire nuts.
- Existing direct-terminal wiring remains in the cable rendering; it does not gain a wire nut.
- The right-hand editor and saved project wiring records remain unchanged.

LIMITATIONS
- Junction-box and terminal coordinates are schematic, not a manufacturer-accurate mechanical assembly.
- This is a visual redesign only, not an electrical compliance or voltage solver.
- Some dense multi-splice boxes may still need additional layout tuning.

VALIDATION
- TypeScript compilation: passed (tsc -b).
- Full Vite/browser visual check: not performed.

INSTALL
Back up your current project and saved browser data. Extract the ZIP into a new folder, run npm install and npm run dev. Verify your saved cables and splices before replacing your working version.
