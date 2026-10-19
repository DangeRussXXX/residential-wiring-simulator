NOVA Residential Wiring Simulator — Update 41
Complete project based on your uploaded ZIP.

Changes:
- The project's wallCables is the shared source of saved cable-end connections.
- Wall workspace synchronizes project edits made elsewhere, including the panel.
- Both cable editors save terminal assignments through the same record-update path.
- Wall editor opens the device end; panel editor opens the breaker end.
- Both show connection counts for each end.
- Existing wire nuts, splices, blueprint mode, devices, and saved cable IDs retained.
- Corrected TypeScript build errors found in the uploaded source.

Install:
1. Back up your current folder and browser data.
2. Extract this ZIP into a new folder and open it in VS Code.
3. Run npm install, then npm run dev.
4. Test panel-to-switch cable from both panel and wall.

Validation: TypeScript (tsc -b) PASSED. Vite bundle could not be built in this environment because uploaded node_modules lacked a Linux-native rolldown dependency. Run npm install and npm run build on your computer.

Scope: Older panelWires/endToEndCircuits remain preserved, but aren't merged into the newer wallCables model. Connecting one cable end does not automatically terminate its other end.
