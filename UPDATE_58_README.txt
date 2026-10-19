NOVA Update 58 — Compact wall terminal synchronization

Replaced the compact wall renderer's decorative loose wire stubs with conductor paths derived from the saved cable ends (from/to), matching the expanded view's data source.
Connected conductors route to device-specific terminal coordinates; unassigned conductors remain loose; capped ends and splice markers appear only for saved records. Correct compact device face for light, switch, GFCI and receptacle. Compact size unchanged.

Known limitations: 3 cables visible in compact mode (expand for up to 4). Very crowded cable/wire configurations may overlap. Splice members depend on matching saved splice end IDs. Terminal diagram is illustrative and should not be used to validate safe electrical work.

Verification: code source inspected and changed. Build NOT verified: local dependencies absent (vite/client and @types/node). Run npm install && npm run build before deployment.
