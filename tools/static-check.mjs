import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const ok=m=>console.log('OK:',m);
const html=read('index.html'),app=read('app.js');

const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
const duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
if(duplicates.length)fail('HTML IDs duplicados: '+[...new Set(duplicates)].join(', '));else ok('HTML IDs únicos');

const required=['gameCanvas','menu','garage','trackSelect','guide','maker','makerCanvas','raceHud','speedText','switchText','healthBar','heatBar','rhythmLanes','minimap','pause','result','fatal'];
const missing=required.filter(id=>!ids.includes(id));
if(missing.length)fail('IDs críticos ausentes: '+missing.join(', '));else ok('HUD/menús críticos presentes');

const files=['game-data.js','styles.css','src/config.js','src/core.js','src/world.js','src/vehicle.js','src/directors.js','src/presentation.js','src/maker.js'];
for(const f of files){if(!fs.existsSync(path.join(root,f)))fail('Falta '+f);}
if(!process.exitCode)ok('Módulos runtime presentes');

const imports=[...app.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g)].map(m=>m[1]);
for(const imp of imports){if(!fs.existsSync(path.join(root,imp)))fail('Import roto: '+imp);}
if(!process.exitCode)ok('Imports locales resolubles');

const data=read('game-data.js'),config=read('src/config.js'),world=read('src/world.js'),vehicle=read('src/vehicle.js'),directors=read('src/directors.js');
if(!data.includes('export const VEHICLES=')||!data.includes('export const TRACKS='))fail('game-data.js no exporta VEHICLES/TRACKS');else ok('Catálogos de juego exportados');
if(!html.includes('v0.7.1')||!config.includes("version:'0.7.1'"))fail('Versión inconsistente');else ok('Versión v0.7.1 consistente');

if(!config.includes('motion_scale:.28'))fail('Falta escala de movimiento calibrada');else ok('Escala de movimiento calibrada');
if(!config.includes('steering_sign:-1'))fail('Falta corrección explícita del signo de dirección');else ok('Dirección normalizada');
if(!config.includes('ride_height:.065'))fail('Falta altura de apoyo del vehículo');else ok('Altura de apoyo definida');

const legacyFloat=['position.y+=.48','roadTarget.y+.46'];
for(const token of legacyFloat)if(vehicle.includes(token))fail('Offset flotante legado en vehicle.js: '+token);
if(!process.exitCode)ok('Jugador sin offsets flotantes heredados');

for(const token of ['position.y+=.46','speed*dt*.22','speed*dt*.24'])if(directors.includes(token))fail('Movimiento discreto legado en directors.js: '+token);
for(const token of ['position.y+=.42','speed*dt*.24'])if(world.includes(token))fail('Movimiento/altura legado en world.js: '+token);
if(!process.exitCode)ok('IA, policía y tráfico sin factores mágicos de spline');

if(!world.includes('const x=wrap(index,n)')||!world.includes('frac=x-i0'))fail('pose() no interpola índices fraccionales');else ok('Spline con pose continua');
if(!world.includes('isClearOfRoad(position,extra=3)'))fail('No existe corredor de seguridad para escenario');else ok('Escenario respeta corredor vial');
if(!vehicle.includes('metresPerSecondToWorld(this.speed)'))fail('Jugador no usa escala perceptual de desplazamiento');else ok('Velocidad física separada de desplazamiento visual');

if(process.exitCode)process.exit(process.exitCode);
console.log('ContraDrivers static QA: PASS');
