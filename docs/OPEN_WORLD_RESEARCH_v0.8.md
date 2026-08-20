# ContraDrivers v0.8.0 — Open World Research

## Target
Tri-City Metro is an original 8 km × 8 km driving world (64 km²) with roughly 360 km of generated road network. The goal is not literal replication of any real city. The layout is compressed and tuned for driving.

## Need for Speed Undercover
EA described Tri-City Bay as an open world with more than 80 miles of roads and a large highway system built specifically for high-speed highway battles. The useful lesson for ContraDrivers is road hierarchy: a perimeter interstate plus major cross-city spines should make the whole world legible and create obvious high-speed combat spaces.

Sources:
- https://ir.ea.com/press-releases/press-release-details/2008/The-Chase-Is-On-In-Need-for-Speed-Undercover/default.aspx
- https://www.gamespot.com/articles/tgs-2008-need-for-speed-undercover-updated-hands-on/1100-6199103/

## Driver: San Francisco
Ubisoft Reflections discussed an approximately 40 km² city, roughly 200 miles of roads, 60 FPS, dense traffic and proprietary technology. Martin Edmondson also explained that the team deliberately compressed San Francisco instead of copying it exactly because real-world distances hurt playability. The useful lesson is to preserve the driving identity of districts — hills, narrow streets, freeways, docks, dirt, landmarks — while shortening the spaces between them.

Sources:
- https://www.gamespot.com/articles/driver-san-francisco-hands-on-preview-mind-games/1100-6310470/
- https://www.3djuegos.com/juegos/driver-san-francisco/noticias/driver-san-francisco-entrevista-a-martin-edmonson-100706-2187
- https://www.playstationtrophies.org/news/news-1162-e3-2010-driver-san-francisco-interview-martin-edmondson-creative-director.html

## Grand Theft Auto
Rockstar's open-world design work on Liberty City emphasizes research, distinct neighborhoods, compressed geography and the removal of dead space. The city and missions are designed together rather than treating the map as background. ContraDrivers applies this by giving districts different road textures and placing activities on roads that fit their gameplay role.

Sources:
- https://www.rockstargames.com/newswire/article/o349k552514927/worldwide-grand-theft-auto-v-previews.html
- https://www.gta4.net/news/4044/ign-feature-building-a-brave-new-world/

## Burnout Paradise
Criterion built Paradise City specifically around Burnout handling. Their postmortem discussions emphasize iteration, backstreets, shortcuts and learning the city. The key lesson is that open-world racing needs route choice and memory to create skill, not just a large number of square kilometers.

Sources:
- https://careers.ea.com/ea-studios/criterion-games/games
- https://se7en.ws/burnout-paradise-the-making-of-paradise-city/?lang=en

## Browser architecture
Three.js documents InstancedMesh as a way to render many copies of the same geometry with fewer draw calls. ContraDrivers uses deterministic 500 m chunks and instanced buildings/vegetation around the player instead of keeping the entire city scene graph alive at once.

Source:
- https://threejs.org/docs/pages/InstancedMesh.html

## Resulting world structure
- 64 km² world extent.
- ~360 km road network at current generation parameters.
- Perimeter interstate and cross-city expressways.
- Nova Centro dense grid.
- Puerto Cobalto industrial/port grid.
- Sunset Hills suburb network.
- Distrito Vega secondary urban grid.
- Bahía Aeropuerto service/runway network.
- Gold Coast Mountains with winding elevation roads and switchbacks.
- Bridges, coast roads and bypass routes.
- 12 world activities.
- Streaming 5×5 neighborhood of 500 m chunks around the player.
- Instanced buildings and vegetation.
- Traffic, police heat, waypoint map, Nitro/Rhythm, Switch and Time Control.
