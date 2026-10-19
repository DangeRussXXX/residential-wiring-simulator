NOVA Residential Wiring Simulator — Update 52: Simple Receptacle Wiring

This is a complete project ZIP based on Update 51.

CHANGES
- For a standard receptacle with exactly one 14/2 cable and no saved splice, display a simplified integrated wiring view.
- Cable enters from the TOP of the box; outer jacket stops at box entry.
- Only individual black, white and bare ground conductors appear inside.
- Wires connect directly to the brass, silver and green terminal indicators ONLY when a matching termination exists in the saved cable record.
- Unconnected conductors stay loose; individually capped conductors show a cap.
- No extra wire nuts or pigtails are invented.
- Existing routing and saved connections are unchanged.
- Other device types and multi-cable/splice views retain their previous appearance for now.

IMPORTANT: This is a visual training diagram, not an electrical-code or safety verification. The right-side wiring editor remains authoritative.

VALIDATION: TypeScript check passed (tsc -p tsconfig.app.json --noEmit). Browser rendering was not tested.

INSTALL: Back up your project and browser data. Extract to a separate folder, then run npm install and npm run dev.
