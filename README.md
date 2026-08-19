# ContraDrivers Web v0.6.0

Versión **jugable directamente en GitHub Pages** de ContraDrivers. El runtime fue portado de Python/Ursina a JavaScript + WebGL para que la URL publicada abra el juego, no una página de descarga.

## Jugar

Una vez desplegado GitHub Pages, abre:

`https://magalarza726-del.github.io/Contradrivers/`

## Incluye

- Carrera 3D WebGL con tres circuitos.
- Switch continuo `aX+bY` con transición Smoothstep, duración y cooldown configurables.
- Garaje y selección de pareja de vehículos.
- Time Control.
- Embestida de carga y liberación.
- Rebufo.
- Nitro Base, Remix y Turbo.
- Sequence A / Sequence B con cuatro carriles rítmicos.
- Cinco rivales controlados por IA.
- Daño, resistencia y robustez.
- Rampas, túneles, atajos, elevación y distintos perfiles de carretera.
- HUD, minimapa, cámara y guía de controles.
- Track Maker web con pan, zoom, nodos arrastrables, elevación, checkpoints, rampas, túneles, Undo/Redo, guardado local, exportación JSON y playtest inmediato.

## Publicación

`.github/workflows/deploy-pages.yml` despliega la raíz del repositorio a GitHub Pages con cada push a `main`.

La aplicación usa Three.js como motor WebGL cargado desde jsDelivr. Los datos de vehículos, balance y circuitos están contenidos en `game-data.js`.

## Versión de escritorio

La edición Python/Ursina sigue existiendo como referencia de diseño y prototipo de escritorio, pero **esta rama web no necesita Python para jugar**.
