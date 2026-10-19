NOVA RESIDENTIAL WIRING SIMULATOR — UPDATE 48
INLINE DEVICE WIRING

Based on Update 47.

- Removed the separate floating BOX WIRING overlay.
- Saved wire-nut splices now appear directly over their device, with upright nuts and separated conductors.
- Saved pigtails run from a splice to the device terminal indicator.
- Individually capped wires now show an upright orange cap on their own conductor.
- Existing direct-to-terminal conductors continue to display without a wire nut.
- All graphics read existing wallCables terminations and splices; no extra simulated connections are created.

Limitations:
- The wall is a schematic and does not yet render fully scaled physical junction boxes.
- The device-side terminal positions on the wall are approximate; the detailed right-side wiring editor remains authoritative.
- This update does not add new wiring actions or alter saved data.
- TypeScript check: PASSED (tsc -b).
- Vite runtime/build and browser appearance: NOT VERIFIED.

Install: back up your project and browser data; extract ZIP into a separate folder; npm install; npm run dev.
