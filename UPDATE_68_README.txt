NOVA RESIDENTIAL WIRING SIMULATOR — UPDATE 68
Based on user's original Update 67 archive; existing file structure retained.

New wall tools in Workspace:
- Crowbar Unnail / Reposition: unfastens an installed device without deleting it or its wiring. Drag device to reposition, then hammer again.
- Separate Delete Component button with confirmation; deletes attached cable and wiring records.
- Selected cable start and destination selectors: reroute existing cables between devices and Panel P1. Changing an end intentionally clears the changed end's terminations and all splices to avoid stale electrical assignments.
- Undo/Redo buttons in Device Installation: up to 40 checkpoints per wall, currently covering hammering, unnailing, component deletion, cable rerouting, and cable deletion.
- Update 67's shared wall and panel wiring editor remains in place.

IMPORTANT LIMITATIONS
- Undo/Redo is session-local and only records the actions listed above, not every existing editor operation, cable creation, or drag movement.
- Dragged devices can be repositioned after unnailing; cable route drawing still follows device endpoints (no independent intermediate bend handles).
- npm ci --offline failed due to uncached zod-validation-error 4.0.2; no successful TypeScript compile or browser smoke test has been performed. Test with npm ci && npm run build on an internet-connected machine before deployment.
- This is a training simulator; do not use its simplified models as instructions for energized wiring.
