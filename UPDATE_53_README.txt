NOVA Residential Wiring Simulator — Update 53
Expanded wiring view: larger, separate conductor paths, and top-entry cables.

Changes:
- Replaced the 2.45x zoom of the tiny schematic with a purpose-built 500x345 expanded electrical box drawing.
- Device stays at its saved stud and height; expanding does not change placement.
- Cable jackets route to the TOP of the box in the framed wall view.
- Removed duplicate conductor squiggles previously drawn over the device by the wall cable renderer.
- Expanded view shows up to four cable entries and saved black, white, red, and ground assignments; direct connections, loose conductors, caps, and saved splices/pigtails.
- Different terminal positions for receptacle, GFCI, switch, and light.
- Close returns to compact wall view.
- Preserves saved wiring records.

LIMITATIONS: 2D teaching schematic; not an electrical code or safety verifier. Uncommon terminal IDs may need further mapping. TypeScript project check passed; browser appearance not tested.

INSTALL: Back up project and browser data; extract ZIP to a new folder; npm install; npm run dev.
