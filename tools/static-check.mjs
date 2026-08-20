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
for(const f of files){if(!fs.existsSync(path.join(root,f)))fail('Falta '+f)}
if(!process.exitCode)ok('Módulos runtime presentes');

const imports=[...app.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g)].map(m=>m[1]);
for(const imp of imports){if(!fs.existsSync(path.join(root,imp)))fail('Import roto: '+imp)}
if(!process.exitCode)ok('Imports locales resolubles');

const data=read('game-data.js');
if(!data.includes('export const VEHICLES=')||!data.includes('export const TRACKS='))fail('game-data.js no exporta VEHICLES/TRACKS');else ok('Catálogos de juego exportados');
if(!html.includes('v0.7.0')||!read('src/config.js').includes("version:'0.7.0'"))fail('Versión inconsistente');else ok('Versión v0.7.0 consistente');

if(process.exitCode)process.exit(process.exitCode);
console.log('ContraDrivers static QA: PASS');
