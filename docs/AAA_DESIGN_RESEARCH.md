# ContraDrivers v0.7.0 — AAA Design Research

This vertical slice does **not** copy proprietary code, maps, cars, audio, art, or hidden formulas from other games. It translates publicly documented design principles into original ContraDrivers systems.

## Need for Speed Undercover — action driving as a pillar

Public interviews describe Undercover as an attempt to combine NFS action racing with the energy of a large action movie. Black Box described three pillars: Heroic Driving, highway battles, and the undercover arc. The team also spoke about hundreds of tunable handling “levers,” aggressive cops, and an open world made of distinct cities/regions linked by a large highway network. The lesson for ContraDrivers is not to chase realism for its own sake: expose a stable physical base, then add assistive layers that allow readable, intentional action at extreme speed.

Applied:
- speed-dependent steering instead of constant steering authority;
- Heroic Assist stabilizes countersteer and extreme maneuvers rather than teleporting the car;
- highway/road-class beats alter traffic and intensity;
- Heat director creates pressure and roadblocks;
- Time Control is a separate tactical layer, not ordinary braking.

Sources:
- EA press release, 2008: https://ir.ea.com/press-releases/press-release-details/2008/The-Chase-Is-On-In-Need-for-Speed-Undercover/default.aspx
- GameSpot Q&A: https://www.gamespot.com/articles/need-for-speed-undercover-qanda-return-of-the-fuzz/1100-6198476/
- WorthPlaying developer interview: https://worthplaying.com/article/2008/8/15/interviews/53926-need-for-speed-undercover-all-developer-interview/
- 3DJuegos Jesse Abney interview: https://www.3djuegos.com/juegos/need-for-speed-undercover/noticias/need-for-speed-undercover-entrevista-e-impresiones-jugables-081014-975

## Driver: San Francisco — technology in service of driving

Reflections repeatedly described the decision to build proprietary rendering/physics to hold a 60 FPS target in a dense city, and a condensed San Francisco with recognizable landmarks and intentionally varied road types rather than a literal street-for-street copy. Shift was prototyped before the story was built around it. Interviews also emphasize heavy, tail-out, cinematic handling.

Applied:
- 120 Hz fixed physics under a 60 FPS render target;
- a camera rig that adds speed FOV, look-ahead, pullback and controlled impact shake;
- vehicle archetypes prioritize distinct weight/control identities;
- track districts are compressed around recognizable driving functions: hills, ring roads, port/interstate, tunnels;
- ContraDrivers keeps Switch as the defining mechanic and lets other systems reinforce it.

Sources:
- 3DJuegos Martin Edmondson interview: https://www.3djuegos.com/juegos/driver-san-francisco/noticias/driver-san-francisco-entrevista-a-martin-edmonson-100706-2187
- GameWatcher interview: https://www.gamewatcher.com/interviews/driver-san-francisco-interview/11332
- Game Informer Afterwords: https://gameinformer.com/b/features/archive/2011/09/14/afterwords-with-driver-san-francisco.aspx
- GamingBolt interview: https://gamingbolt.com/driver-san-francisco-exclusive-interview-with-ubisoft-reflections

## Asphalt / Asphalt Nitro — density, spectacle, and mobile clarity

Direct public postmortems for Asphalt Nitro itself are scarce. Nitro was positioned as a very lightweight Asphalt experience, while Gameloft’s official retrospective material for the franchise documents the underlying design lineage: visually differentiated locations, traction-changing surfaces, shortcuts, off-road routes, jumps, dynamic cameras, aggressive opponents, and nitro rewarded by stunts. Gameloft’s vehicle-art material also describes receiving/retopologizing high-resolution manufacturer models for game use, emphasizing silhouette accuracy and detail efficiency.

Applied:
- scenery uses instancing and compact procedural geometry rather than unique heavy assets everywhere;
- ramps/shortcuts are gameplay economy: they create nitro, risk, and route choice;
- road surfaces alter grip;
- three-stage ContraDrivers Nitro has different roles rather than being one bigger bar;
- gamepad/keyboard input is normalized so the same handling model remains readable across devices.

Sources:
- Gameloft Asphalt 5 retrospective: https://www.gameloft.com/blog/players/establishing-legend-asphalt-5
- Gameloft Asphalt 6 retrospective: https://www.gameloft.com/blog/players/asphalt-memories-asphalt-6-adrenaline
- Gameloft Asphalt 8 overview: https://www.gameloft.com/blog/players/everything-about-asphalt-8-in-one-minute
- Gameloft vehicle art: https://www.gameloft.com/blog/players/lead-vehicle-artist

## Burnout Revenge — build tracks for the core verb

Criterion explicitly said its older flowing tracks did not always support aggressive battling, so Revenge tracks were designed for fighting: jumps, multiple paths, shortcuts, hard stops, choke points, vertical takedowns, and traffic deliberately tuned to create near-misses and crashes. The team also described an iterative “design, build, play” culture and made aggression part of progression, not optional decoration.

Applied:
- traffic is a designed system, not random moving obstacles;
- same-direction traffic can be “checked” when the player has enough momentum/mass;
- oncoming traffic remains dangerous;
- near misses and checks feed Nitro;
- AI collision/takedown rewards reinforce aggression;
- LevelBeatDirector classifies sections as FLOW / HIGH SPEED / TECHNICAL / TUNNEL PRESSURE / STUNT so intensity can be tuned around the core verb.

Sources:
- GameSpot Burnout Revenge Designer Diary #2: https://www.gamespot.com/articles/burnout-revenge-designer-diary-2/1100-6132334/
- GameSpot Burnout Revenge Q&A: https://www.gamespot.com/articles/burnout-revenge-qanda/1100-6128158/
- GameSpot earlier Q&A: https://www.gamespot.com/articles/burnout-revenge-qanda/1100-6121774/

## ContraDrivers synthesis

The project now follows six production rules:

1. **One defining mechanic:** Switch remains the center. Everything else changes the value of when/why to Switch.
2. **Readable action physics:** believable momentum, deliberately assisted control.
3. **Tracks are combat choreography:** each sector has a purpose and alternates intensity.
4. **Traffic is authored gameplay:** density and direction produce decisions.
5. **Spectacle must preserve input clarity:** camera and effects communicate speed without hiding the road.
6. **Performance is a feature:** fixed-step simulation, instancing, capped pixel ratio, pooled traffic, procedural lightweight assets.

A literal commercial AAA game would still require a multidisciplinary team, licensed assets, original audio, production art, QA matrices, platform certification, accessibility localization, online infrastructure, and months/years of iteration. v0.7.0 is designed as a high-quality browser **vertical slice** and architecture foundation.
