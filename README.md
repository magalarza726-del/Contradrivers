# ContraDrivers Open World v0.8.2

Audited and refactored WebGL open-world driving prototype built for GitHub Pages.

## Tri-City Metro
- 8 km × 8 km world: **64 km²**.
- Roughly **360 km of generated roads** at the current world seed/layout.
- Downtown grid, port/industrial district, suburbs, secondary city, airport and mountain roads.
- Perimeter interstate, cross-city expressways, bridges, coast road and mountain bypass.
- Deterministic **500 m chunk streaming** around the player.
- Instanced buildings and vegetation for a browser-oriented open world.

## Gameplay
- Continuous `aX+bY` vehicle Switch.
- Nitro Base / Remix / Turbo and Rhythm Drive.
- Time Control with real-time duration and grey presentation treatment.
- Charge/release RAM with camera pullback and short forward lunge.
- Free-roam traffic, near misses and traffic checking.
- Toggleable police pursuit with a pool of up to 14 units.
- 12 world activities and a waypoint map.
- Detailed procedural vehicle archetypes and 3D garage showroom.

## v0.8.2 audit/refactor
Production no longer depends on the v0.8.1 prototype monkey-patch layer. GitHub Pages loads one explicit entrypoint, `game.js`, and only an allowlisted set of production assets is deployed.

Key fixes include:
- corrected A/left and D/right steering sign;
- Time Control reserve measured in real seconds rather than slowed simulation time;
- Heat increments normalized by `dt` so they do not depend on monitor refresh rate;
- per-contact collision locks to prevent damage/Nitro/score from firing at 120 Hz while cars overlap;
- actual heading comparison for same-direction traffic;
- traffic spawning around the player's location on a road instead of arbitrary distant points on the same road;
- HUD/minimap throttling and pooled Rhythm DOM nodes;
- crash-stop behavior that prevents a fatal error from being executed again every animation frame;
- persistent settings that only write when values actually change;
- shared vehicle geometries and safer resource disposal.

See `docs/CODE_AUDIT_v0.8.2.md` for the complete audit.

## Production graph
- `index.html`
- `game.js`
- `game-data.js`
- `styles.css`
- `styles-v082.css`
- `src/core.js`
- `src/vehicle.js`
- `src/directors.js`
- `src/openworld.js`
- `src/settings.js`
- `src/vehicle-factory.js`
- `src/openworld-ui.js`
- `src/openworld-runtime.js`

The Pages workflow builds a `dist/` artifact containing only these runtime assets.

## Controls
- W/S: accelerate / brake-reverse
- A/D: left / right
- Space: handbrake
- E: Switch
- Q: Time Control
- Alt: charge/release RAM
- N: Base Nitro
- M: Remix Nitro
- J/K/L/I: Rhythm Drive
- Tab: full world map / waypoint
- F: start nearby activity
- C: camera
- R: reposition
- Esc: pause

## QA
GitHub Actions checks JavaScript syntax for the production graph and runs regression contracts from `tools/static-check.mjs` before/alongside deployment.

## Research
See `docs/OPEN_WORLD_RESEARCH_v0.8.md` for the public design references and how their lessons were translated into original ContraDrivers systems.

No proprietary assets or source code from referenced games are included.
