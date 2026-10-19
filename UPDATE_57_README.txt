NOVA Residential Wiring Simulator — Update 57

- Wall devices remain compact (150 x 150 footprint) to prevent overlaps.
- Existing expand button opens the detailed wiring diagram on the wall.
- Compact device symbols show top-entering cable jacket and short continuous conductor ends.
  They intentionally do not show terminal connections at tiny scale; expand to see saved
  terminal, splice, and cap destinations.
- Expanded view starts conductor paths at the jacket endpoint and moves cable-count
  label below the wiring, away from the cable entry.
- Existing project records and connection logic are unchanged.

Installation: Extract into a NEW folder and copy/replace files into the working
project (or run from the extracted project). Run npm install, npm run build,
then npm run dev. Save a backup of your project and browser storage first.

Build verification: dependencies unavailable in this environment; build not confirmed.
