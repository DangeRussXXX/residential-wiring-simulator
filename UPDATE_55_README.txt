Update 55 — Compact wall-device top-entry repair

- Corrects the compact wall-device drawing that Update 54 did not change.
- Cable jackets and exposed conductors now originate at the top of the compact device box.
- Existing terminal assignments, caps and splices are used to choose conductor endpoints.
- All compact device types use the same renderer, avoiding the old one-cable receptacle shortcut.
- Expanded wall and right-hand wiring views retain the Update 54 top-entry routing.

Verification: Source inspection completed. Build was NOT verified: dependencies were not present and npm ci did not finish within the available time. Test locally with npm ci && npm run build and npm run dev.

Note: Compact drawing remains a schematic; device terminal geometry may need further refinement.
