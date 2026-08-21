# ContraDrivers Open World v0.8.3

Audited WebGL open-world driving prototype built for GitHub Pages.

## Tri-City Metro
- 8 km × 8 km world: **64 km²**.
- Roughly **360 km of generated roads**, plus new stunt/tunnel links.
- Downtown, port/industrial district, suburbs, airport, mountains and regional highways.
- Deterministic **500 m chunk streaming** around the player.
- Instanced buildings and vegetation for browser performance.
- **6 drivable ramps** and **3 transitable tunnels**.

## v0.8.3 driving fixes
- Browser-verified steering convention: **A / Left turns left; D / Right turns right**.
- Removed the handbrake bug that multiplied yaw on every fixed-physics substep.
- Space now uses a bounded drift yaw target instead of exponential rotation.
- Holding Space without steering actively damps yaw rather than making the car spin.
- Handbrake adds controlled lateral slip and modest speed loss.
- Ramp exits switch the car to an airborne state with vertical velocity and gravity.
- Landing from a meaningful jump rewards score and Nitro.

## World features
### Ramps
- Nova Launch — near the initial downtown area.
- Airport Launch.
- Cobalto Dock Jump.
- Sunset Stunt.
- Vega Rail Jump.
- Gold Coast Launch.

### Tunnels
- Nova Central Tunnel — close to the initial spawn area.
- Airport Service Tunnel.
- Gold Coast Tunnel.

Tunnel geometry includes road surface, side walls, ceiling, portals and interior lighting. Ramp geometry includes raised roadway, rails, supports and launch markings.

## Core gameplay
- Continuous `aX+bY` vehicle Switch.
- Nitro Base / Remix / Turbo and Rhythm Drive.
- Time Control measured in real seconds.
- Charge/release RAM.
- Free-roam traffic, near misses and traffic checking.
- Toggleable police pursuit with up to 14 units.
- 12 world activities and waypoint map.
- Procedural vehicle archetypes and 3D garage showroom.

## Production graph
GitHub Pages deploys only the allowlisted production runtime, including:
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
- `src/world-features.js`
- `src/openworld-runtime.js`

## Controls
- W/S: accelerate / brake-reverse
- A/D: left / right
- Space: handbrake / controlled drift
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
GitHub Actions checks syntax for the complete production graph and runs regression contracts from `tools/static-check.mjs` before deployment. v0.8.3 explicitly guards steering sign, bounded handbrake yaw, six ramp definitions, three tunnels, renderer integration and ballistic jump physics.

No proprietary assets or source code from referenced games are included.
