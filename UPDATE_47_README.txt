NOVA Residential Wiring Simulator — Update 47: Wall-Visible Pigtails

This is the complete project based on Update 46.

NEW
- Saved splices and pigtails now appear as enlarged device-box wiring details on the framed wall.
- Upright wire nuts, separately routed black/white/red/ground conductors, and an independent pigtail path.
- The detail is derived from actual saved splice members, not generated decorative connections.
- Hover on each conductor for its cable's source/destination; pigtail hover shows its saved terminal ID.
- Only devices with saved splices show the enlarged wiring detail; other devices remain unchanged.
- Blueprint Mode hides the box-detail overlay.

IMPORTANT LIMITATIONS
- This is an enlarged training overlay above the device, not a scaled physical box model.
- Each detail shows up to three saved splices, with a count if more exist.
- The wiring geometry in the detail is illustrative; conductor labels, terminations, and connection safety still require verification in the Device Wiring editor.
- Existing cable/splice data is unchanged.
- TypeScript check: PASS. Full Vite bundle and runtime interaction: NOT VERIFIED.

INSTALL
1. Back up the project and saved browser data.
2. Extract this ZIP to a separate folder.
3. Run npm install and npm run dev.
4. Open a wall containing a saved splice/pigtail; check the box detail above its device.
