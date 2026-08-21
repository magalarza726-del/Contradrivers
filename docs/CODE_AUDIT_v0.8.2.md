# ContraDrivers v0.8.2 — Auditoría integral de código

Fecha: 2026-08-21

## Alcance

Se auditó el runtime WebGL de mundo abierto, incluyendo entrypoints, estado de UI, física, Time Control, RAM, tráfico, persecución, render, streaming, persistencia, HUD, gestión de memoria, CI y despliegue de GitHub Pages.

## Hallazgos críticos y correcciones

### 1. Múltiples runtimes y monkey patches
La v0.8.1 cargaba `openworld-upgrades.js` antes de `openworld-app.js` y sobrescribía prototipos de clases en ejecución. Esto hacía difícil saber qué implementación era realmente activa.

**Corrección:** v0.8.2 usa un único entrypoint (`game.js`) y clases explícitas en `src/openworld-runtime.js`. Pages no publica los módulos intermedios.

### 2. Dirección izquierda/derecha invertida
`InputManager` ya entrega A/izquierda = -1 y D/derecha = +1. La capa v0.8.1 negaba ese valor por segunda vez.

**Corrección:** `PlayerVehicle` usa directamente `input.axes.steer`. CI rechaza una regresión que vuelva a introducir `-input.axes.steer`.

### 3. Duración incorrecta de Time Control
La reserva de Time Control se drenaba con el `dt` ralentizado. Una habilidad de 4 s podía durar mucho más de 4 s de tiempo real.

**Corrección:** el movimiento utiliza `simDt`, mientras que la reserva, RAM y Switch usan reloj real. La duración configurada vuelve a representar segundos reales.

### 4. Heat dependiente del framerate
Incrementos de Heat por impactos/RAM se aplicaban por frame y no por segundo.

**Corrección:** los incrementos están multiplicados por `dt`, por lo que 60 Hz y 144 Hz producen el mismo crecimiento temporal esperado.

### 5. Colisiones repetidas a 120 Hz
Mientras dos coches seguían solapados, la interacción con tráfico podía repetirse en varios fixed steps consecutivos, multiplicando daño, puntos y Nitro.

**Corrección:** cada coche de tráfico mantiene `contactLock`, evitando múltiples resoluciones para el mismo contacto continuo.

### 6. Detección incorrecta de tráfico en el mismo sentido
Se asumía que `dir > 0` significaba “mismo sentido que el jugador”, algo falso cuando el jugador circula en sentido opuesto.

**Corrección:** se compara el producto punto de los vectores forward de ambos vehículos.

### 7. Spawn de tráfico poco coherente
Un coche podía elegirse en una carretera cercana y después aparecer aleatoriamente en un extremo lejano de esa carretera.

**Corrección:** se proyecta la posición del jugador sobre la carretera elegida y se genera tráfico a una distancia controlada alrededor de esa posición.

### 8. HUD y minimapa demasiado costosos
El minimapa inspeccionaba cientos de kilómetros de red vial cada frame y Rhythm Drive recreaba elementos DOM continuamente.

**Corrección:** HUD a 30 Hz, minimapa a 10 Hz, streaming a ~6.7 Hz y pool fijo de ocho nodos DOM para notas de Rhythm.

### 9. Runtime continuaba después de un error fatal
Un fallo dentro del loop podía volver a ejecutarse en el siguiente `requestAnimationFrame`.

**Corrección:** `crashed=true` corta definitivamente la programación de nuevos frames y muestra el stack una sola vez.

### 10. Estado UI implícito
Garaje, guía, pausa y mapa podían dejar `state` y pantalla visible desincronizados.

**Corrección:** `state`/`previousState`, `closeOverlay()`, `cleanupSession()` y `OpenWorldUI.show()` centralizan transiciones.

### 11. Escrituras redundantes de settings
Con policía desactivada, una ruta podía intentar persistir repetidamente el mismo estado.

**Corrección:** `SettingsStore.set()` no escribe ni emite eventos si el valor sanitizado no cambió.

### 12. Gestión de memoria de vehículos/showroom
Cada reconstrucción de un vehículo creaba geometrías equivalentes y la destrucción no distinguía recursos compartidos.

**Corrección:** `vehicle-factory.js` reutiliza geometría base/caché de ruedas y `disposeObject3D()` no destruye recursos marcados como compartidos.

## Refactor de arquitectura

### Grafo de producción v0.8.2

- `index.html`
- `game.js` — entrypoint y state machine
- `game-data.js`
- `styles.css`
- `styles-v082.css`
- `src/core.js`
- `src/vehicle.js`
- `src/directors.js`
- `src/openworld.js` — blueprint/render base
- `src/settings.js` — configuración persistente
- `src/vehicle-factory.js` — modelos procedurales
- `src/openworld-ui.js` — HUD/pantallas
- `src/openworld-runtime.js` — jugador, tráfico, cámara y policía

El workflow de Pages publica solamente este conjunto.

## CI / regresiones

`tools/static-check.mjs` verifica:

- IDs críticos únicos y presentes.
- Versión v0.8.2 y entrypoint `game.js`.
- Imports locales resolubles.
- Ausencia de dependencias hacia bootstrap/upgrades/intermedios.
- Ausencia de monkey patches en el runtime de producción.
- Dirección sin negación accidental.
- Drenaje de Time Control con reloj real.
- Heat escalado por `dt`.
- `contactLock` de tráfico.
- detección de dirección con producto punto.
- pool DOM de Rhythm.
- filtro gris de Time Control.
- fábrica de vehículos y pool de 14 policías.
- rechazo de ternarios ambiguos tipo `?.<número>`.

## Riesgos residuales

- El mundo sigue usando geometría procedural simple y no colisión física rígida completa contra edificios/barreras.
- La IA policial es persecución heurística, no navegación completa por grafo con PIT/roadblock táctico.
- No existe todavía un benchmark automatizado WebGL en navegador real dentro de CI.
- La verificación visual final debe hacerse en el deployment real de GitHub Pages y en más de un navegador/GPU.

Estos puntos son limitaciones conocidas, no errores ocultos; deben tratarse en siguientes iteraciones de producción.
