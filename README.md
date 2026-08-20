# ContraDrivers Web v0.7.0 — AAA Vertical Slice

Playable WebGL racing prototype built for GitHub Pages.

## Core systems
- Continuous `aX+bY` vehicle Switch with Smoothstep morphing.
- Fixed-step action handling at 120 Hz under a 60 FPS render target.
- Speed-dependent steering, drift/handbrake, off-road grip, Heroic Assist.
- Traffic Director with near misses and same-direction traffic checking.
- Police Heat / pursuit escalation with roadblocks.
- 3-level Nitro + Rhythm Drive.
- Time Control and charge/release Ram.
- Aggressive AI rivals and takedowns.
- Speed-reactive cinematic camera.
- Track Maker with pan, zoom, elevation, ramps, tunnels, checkpoints, undo/redo, local save and playtest.
- Procedural/instanced scenery for a lightweight Pages build.

## Run
Serve the repository over HTTP (GitHub Pages does this automatically). `index.html` is the entry point.

## Research
See `docs/AAA_DESIGN_RESEARCH.md` for the public development/design references and how their lessons were translated into original ContraDrivers systems.

No proprietary assets or code from referenced games are included.
