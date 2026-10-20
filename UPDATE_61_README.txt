NOVA RESIDENTIAL WIRING SIMULATOR — UPDATE 61
LIVE SYNCHRONIZED REAR-TERMINAL WIRING

WHAT CHANGED
- One shared LiveWiringDiagram SVG renders the right wiring panel AND the
  expanded wall box. Both read the SAME saved CableRecord termination data.
- Click a wire and then its screw, or drag the wire endpoint onto a screw.
  Compatible terminal assignments save immediately and reflect in both views.
- Existing cable jacket, conductor colors, terminal screw art, wire nuts,
  saved caps and splice records are preserved in the shared drawing.
- Expanded wall box can cycle through multiple cables attached to that device.
- The compact wall view stays small, retaining the previously aligned top-entry
  cable routing and saved-terminal indications.
- Project Explorer and Component Library remain on the right side.

NOTES
- Only the expanded wall view and the right panel share the full interactive
  terminal artwork. Compact view stays schematic to avoid overlap.
- Wire dragging snaps to an eligible terminal within the SVG hit area.
- Splices/caps are edited with the existing right-side tools; they are drawn
  by the shared diagram.
- Wire placement is a teaching visualization, not a substitute for verifying
  electrical wiring against manufacturer markings and applicable codes.

VERIFICATION
- TypeScript TSX syntax parsing passed for the three edited files.
- Full build / browser testing NOT verified: project dependencies were unavailable.
- Back up your project and saved browser data before replacing files.

INSTALL
Extract into a new folder, run npm install, npm run build, npm run dev.
