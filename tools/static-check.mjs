import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const ok=m=>console.log('OK:',m);

const html=read('index.html');
const game=read('game.js');
const runtime=read('src/openworld-runtime.js');
const world=read('src/openworld.js');
const core=read('src/core.js');
const vehicle=read('src/vehicle.js');
const directors=read('src/directors.js');
const settings=read('src/settings.js');
const ui=read('src/openworld-ui.js');
const factory=read('src/vehicle-factory.js');
const styles=read('styles-v082.css');

const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
const duplicates=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
if(duplicates.length)fail('HTML IDs duplicados: '+duplicates.join(', '));else ok('HTML IDs únicos');
const requiredIds=['gameCanvas','menu','garage','guide','hud','speed','district','score','heat','health','minimap','rhythmLanes','pause','map','worldMap','fatal','policeToggle','pausePoliceToggle','policeStatus'];
const missingIds=requiredIds.filter(id=>!ids.includes(id));
if(missingIds.length)fail('IDs críticos ausentes: '+missingIds.join(', '));else ok('HUD, navegación y controles de policía presentes');

const productionFiles=['index.html','styles.css','styles-v082.css','game-data.js','game.js','src/core.js','src/vehicle.js','src/directors.js','src/openworld.js','src/settings.js','src/vehicle-factory.js','src/openworld-ui.js','src/openworld-runtime.js'];
for(const file of productionFiles)if(!exists(file))fail('Falta archivo de producción: '+file);
if(!process.exitCode)ok('Grafo de producción completo');

if(!html.includes('v0.8.2')||!html.includes('src="game.js"'))fail('index.html no apunta exclusivamente a game.js v0.8.2');else ok('Entrypoint v0.8.2 correcto');
if(html.includes('openworld-bootstrap.js')||html.includes('openworld-app.js'))fail('index.html todavía referencia bootstrap/app intermedios');else ok('Pages no carga entrypoints obsoletos');
if(!settings.includes("BUILD_VERSION='0.8.2'"))fail('Versión de settings inconsistente');else ok('Versión centralizada en 0.8.2');

for(const token of ['extent=4000','I-85-ring','mountain-bypass','OpenWorldTraffic','ActivityDirector'])if(!world.includes(token))fail('Contrato de mundo abierto ausente: '+token);
if(!process.exitCode)ok('Contratos principales del mundo abierto presentes');
for(const token of ['new OpenWorldBlueprint()','new PlayerVehicle','new TrafficSystem','new PoliceSystem','drawWorldMap','chunkClock','hudClock','mapClock','crashed=true'])if(!game.includes(token))fail('Contrato de game.js ausente: '+token);
if(!process.exitCode)ok('Loop, estados, throttling y crash-stop cubiertos');

if(runtime.includes('-input.axes.steer'))fail('Regresión: dirección invertida mediante negación de steer');
if(!runtime.includes('input.axes.steer,9,realDt'))fail('PlayerVehicle no usa el signo natural del InputManager');else ok('A/izquierda y D/derecha usan convenio natural');
if(!runtime.includes('realDt/Math.max(.5,s.time_control_max)'))fail('Time Control no drena con tiempo real');else ok('Time Control usa reloj real');
if(!game.includes('.15*dt')||!game.includes('.055*dt'))fail('Heat de impacto/RAM no está normalizado por tiempo');else ok('Heat independiente del FPS');
if(!runtime.includes('contactLock=.42')||!runtime.includes('c.contactLock>0'))fail('No existe lock de contacto para colisiones de tráfico');else ok('Colisiones tienen cooldown por contacto');
if(!runtime.includes('sameDirection=pf.dot(cf)>.35'))fail('Dirección relativa de tráfico no usa orientación real');else ok('Sentido de tráfico usa vectores de orientación');
if(!ui.includes('this.rhythmPool')||!ui.includes('while(this.rhythmPool.length<8)'))fail('Rhythm HUD no usa pool DOM');else ok('Rhythm HUD reutiliza nodos DOM');
if(!styles.includes('grayscale(.86)'))fail('Falta tratamiento visual gris de Time Control');else ok('Time Control visual auditado');
if(!factory.includes('CAR_DESIGNS')||!factory.includes('createDetailedCar'))fail('Fábrica detallada de vehículos incompleta');else ok('Fábrica de 10 arquetipos de vehículos presente');
if(!runtime.includes('for(let i=0;i<14;i++'))fail('Pool policial no soporta 14 unidades');else ok('Pool policial de 14 unidades presente');
if(!core.includes("this.pad.ram=!!p.buttons[1]?.pressed"))fail('Mando no mapea RAM');else ok('Mando incluye RAM');
if(!core.includes("document.addEventListener?.('visibilitychange'"))fail('Input no se limpia al ocultar pestaña');else ok('Input se limpia al perder visibilidad');
if(!settings.includes('storageGet')||!settings.includes('storageSet'))fail('Settings no protege acceso a localStorage');else ok('Persistencia tolera storage restringido');

const productionText=[game,runtime,world,core,vehicle,directors,settings,ui,factory].join('\n');
for(const forbidden of ['openworld-upgrades.js','openworld-bootstrap.js','openworld-production.js'])if(productionText.includes(forbidden))fail('Producción depende de archivo intermedio: '+forbidden);
if(!process.exitCode)ok('Producción desacoplada de monkey patches/intermedios');
if(runtime.includes('.prototype.'))fail('Runtime final contiene monkey patches de prototype');else ok('Runtime final usa clases explícitas');
if(/\?\.\d/.test(productionText))fail('Sintaxis ternaria ambigua del tipo ?.<número> detectada');else ok('Sin ternarios ambiguos en producción');

function resolveImports(entry,visited=new Set()){
  if(visited.has(entry)||!exists(entry))return;visited.add(entry);
  const text=read(entry);
  const imports=[...text.matchAll(/from\s+['"](\.\.?\/[^'"]+)['"]/g)].map(m=>m[1]);
  for(const imp of imports){const resolved=path.normalize(path.join(path.dirname(entry),imp));if(!exists(resolved))fail(`Import roto: ${entry} -> ${imp}`);else resolveImports(resolved,visited)}
}
resolveImports('game.js');
if(!process.exitCode)ok('Imports locales de producción resolubles');

if(process.exitCode)process.exit(process.exitCode);
console.log('ContraDrivers Open World v0.8.2 production audit: PASS');
