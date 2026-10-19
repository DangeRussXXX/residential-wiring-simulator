UPDATE 44 — PIGTAIL SPACING & WIRE DESTINATION LABELS

Based on the Update 42 complete project, with Update 43 high-contrast CableWiringPanel and the Update 44 visual cleanup.

- Splice connectors use more vertical separation; conductor approaches and pigtail paths are curved to reduce overlap.
- Removed duplicate instructional text and inline wire-color labels.
- Each conductor now has a labeled destination/termination card identifying its cable route and saved connections at both ends.
- Pigtails show the joined conductor routes and the device terminal fed.
- Existing saved cable, cap, splice, and pigtail records remain unchanged.

INSTALL: Back up your working project, extract to a new folder, run npm install and npm run dev.

VERIFICATION: TypeScript compilation passed (tsc -b). Complete Vite build and UI runtime not verified.

NOTE: Wiring labels reflect saved logical records. These visuals do not validate connector listing, box fill, conductor suitability, or electrical safety.
