# ContraDrivers Open World v0.8.0

Playable WebGL open-world driving prototype built for GitHub Pages.

## Tri-City Metro
- 8 km × 8 km world: **64 km²**.
- Roughly **360 km of generated roads** at the current world seed/layout.
- Dense downtown grid, port/industrial district, suburbs, secondary city, airport and mountain roads.
- Perimeter interstate, cross-city expressways, bridges, coast road and mountain bypass.
- Deterministic **500 m chunk streaming** around the player.
- Instanced buildings and vegetation to keep draw calls manageable in a browser.

## Gameplay
- Continuous `aX+bY` vehicle Switch.
- Nitro Base / Remix / Turbo and Rhythm Drive.
- Time Control and charge/release Ram.
- Free-roam traffic and traffic checking.
- Police Heat and pursuit units.
- 12 world activities and a waypoint map.
- Speed-reactive chase camera.
- World scale uses actual metres, avoiding the compressed-track speed bug from earlier vertical slices.

## Controls
- W/S: accelerate / brake-reverse
- A/D: left / right
- Space: handbrake
- E: Switch
- Q: Time Control
- Alt: Ram
- N: Base Nitro
- M: Remix Nitro
- J/K/L/I: Rhythm Drive
- Tab: full world map / waypoint
- F: start nearby activity
- C: camera
- R: reposition
- Esc: pause

## Research
See `docs/OPEN_WORLD_RESEARCH_v0.8.md` for the public references and how their design lessons were translated into original ContraDrivers systems.

No proprietary assets or source code from referenced games are included.
