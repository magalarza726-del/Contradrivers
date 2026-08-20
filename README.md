# ContraDrivers Web v0.7.1 — AAA Vertical Slice

Playable WebGL racing prototype built for GitHub Pages.

## v0.7.1 physics/world hotfix

This build fixes four integration problems exposed by real browser QA:

- Vehicles now sit on the road instead of using the old ~0.46-unit root offset.
- Player, rivals, police and civilian traffic use continuous fractional spline motion and local segment lengths instead of sample-index speed multipliers.
- Physical speed remains in m/s / km/h for handling, HUD and impacts, while a calibrated world-motion scale maps it to the compressed arcade city.
- Steering direction is explicitly normalized so A/Left turns visually left and D/Right visually right.
- Vehicles follow road pitch on hills.
- Procedural scenery reserves a clearance corridor around the main road and shortcuts so buildings cannot spawn across the driving line.
- Vehicle body/cabin geometry is vertically recalculated during Switch so very tall or very low vehicle pairs do not visually sink through the road.

## Core systems

- Continuous `aX+bY` vehicle Switch with Smoothstep morphing.
- Fixed-step action handling at 120 Hz under a 60 FPS render target.
- Speed-dependent steering, drift/handbrake, off-road grip and Heroic Assist.
- Traffic Director with near misses and same-direction traffic checking.
- Police Heat / pursuit escalation with roadblocks.
- 3-level Nitro + Rhythm Drive.
- Time Control and charge/release Ram.
- Aggressive AI rivals and takedowns.
- Speed-reactive cinematic camera.
- Track Maker with pan, zoom, elevation, ramps, tunnels, checkpoints, undo/redo, local save and playtest.
- Procedural/instanced scenery for a lightweight Pages build.

## Run

Serve the repository over HTTP. GitHub Pages does this automatically and `index.html` is the entry point.

## QA

`.github/workflows/ci.yml` checks JavaScript syntax and `tools/static-check.mjs` enforces runtime contracts, including the v0.7.1 motion scale, ride height, steering sign, continuous spline pose and the absence of the legacy discrete-motion constants.

## Research

See `docs/AAA_DESIGN_RESEARCH.md` for the public development/design references and how their lessons were translated into original ContraDrivers systems.

No proprietary assets or code from referenced games are included.
