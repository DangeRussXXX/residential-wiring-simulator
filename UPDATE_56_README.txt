NOVA Residential Wiring Simulator — Update 56

Wall devices with installed cables now show the same detailed terminal diagram used by
expanded wiring, instead of a separate small-box renderer. The diagram grows with the
number of attached cables (370, 430, or 480 pixels wide), with the wall-device center
anchored to its original placement. The expanded view stays available. Loose wire
ends are marked as unconnected. No stored wiring data or project models were changed.

LIMITATION: This update supports the existing diagram's maximum of four displayed
cables. More than four installed cables require a later diagram layout enhancement.
The right-side wiring panel is unchanged in this update.

Verification: full TypeScript/Vite build could not run in this environment because
node_modules dependencies are absent. Run npm install and npm run build locally.

Install: extract this ZIP into a NEW project directory, or copy its contents over
your working project folder. Confirm VS Code detects src/components/Device.tsx as
changed before committing. Back up the current project and browser data first.
