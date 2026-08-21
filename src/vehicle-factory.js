import * as THREE from 'three';
import {lerp} from './core.js';

export const CAR_DESIGNS=Object.freeze({
  aureus_v12:{type:'supercar',w:1.96,h:1.08,l:4.62,wheel:.37},
  pocket_comet:{type:'compact',w:1.58,h:1.48,l:2.82,wheel:.29},
  beetle_nova:{type:'beetle',w:1.72,h:1.50,l:3.38,wheel:.32},
  siegebolt:{type:'armored',w:2.42,h:1.92,l:5.18,wheel:.49},
  iron_mule:{type:'pickup',w:2.02,h:1.72,l:5.04,wheel:.42},
  metro_king:{type:'sedan',w:1.86,h:1.48,l:4.55,wheel:.34},
  formula_zero:{type:'formula',w:1.92,h:.88,l:4.84,wheel:.36},
  cargo_ram:{type:'van',w:2.02,h:2.34,l:5.14,wheel:.37},
  turbo_harvester:{type:'harvester',w:2.48,h:2.55,l:4.82,wheel:.54},
  wild_trail:{type:'suv',w:2.04,h:1.94,l:4.58,wheel:.43},
});

const fallback={type:'sedan',w:1.85,h:1.45,l:4.35,wheel:.34};
export const designFor=v=>CAR_DESIGNS[v?.id]||fallback;

const shared={
  box:new THREE.BoxGeometry(1,1,1),
  sphere:new THREE.SphereGeometry(1,18,10),
};
for(const g of Object.values(shared))g.userData.shared=true;
const wheelGeoCache=new Map();
function wheelGeometry(radius,width,segments=16){const key=`${radius.toFixed(3)}:${width.toFixed(3)}:${segments}`;if(!wheelGeoCache.has(key)){const g=new THREE.CylinderGeometry(radius,radius,width,segments);g.userData.shared=true;wheelGeoCache.set(key,g)}return wheelGeoCache.get(key)}

const paint=color=>new THREE.MeshPhysicalMaterial({color,metalness:.62,roughness:.25,clearcoat:.88,clearcoatRoughness:.14});
const dark=()=>new THREE.MeshStandardMaterial({color:0x07090b,metalness:.62,roughness:.29});
const glass=()=>new THREE.MeshPhysicalMaterial({color:0x07131d,metalness:.15,roughness:.07,transparent:true,opacity:.78,clearcoat:1,clearcoatRoughness:.04});
const light=color=>new THREE.MeshBasicMaterial({color,toneMapped:false});

function box(group,name,size,pos,material,{rot=[0,0,0],painted=false}={}){const m=new THREE.Mesh(shared.box,material);m.name=name||'';m.scale.set(...size);m.position.set(...pos);m.rotation.set(...rot);m.userData.paint=painted;group.add(m);return m}
function sphere(group,name,size,pos,material,{painted=false}={}){const m=new THREE.Mesh(shared.sphere,material);m.name=name;m.scale.set(...size);m.position.set(...pos);m.userData.paint=painted;group.add(m);return m}
function wheel(group,x,z,r,width=.24,detail=1){const tire=new THREE.Mesh(wheelGeometry(r,width,detail?18:10),new THREE.MeshStandardMaterial({color:0x040506,roughness:.94}));tire.rotation.z=Math.PI/2;tire.position.set(x,r,z);group.add(tire);const rim=new THREE.Mesh(wheelGeometry(r*.58,width+.012,detail?14:8),new THREE.MeshStandardMaterial({color:0x252b31,metalness:.92,roughness:.17}));rim.rotation.z=Math.PI/2;rim.position.copy(tire.position);group.add(rim)}
function lights(g,w,h,l){box(g,'headL',[w*.26,.05,.05],[-w*.29,h*.43,l*.493],light(0xeef9ff));box(g,'headR',[w*.26,.05,.05],[w*.29,h*.43,l*.493],light(0xeef9ff));box(g,'tail',[w*.72,.055,.05],[0,h*.32,-l*.503],light(0xff2f2b))}

export function createDetailedCar(vehicle,color=vehicle.color,detail=1){
  const d=designFor(vehicle),g=new THREE.Group(),body=paint(color),trim=dark(),window=glass(),{w,h,l,wheel:r,type}=d;
  g.userData.vehicle=vehicle;g.userData.design=d;g.userData.baseDimensions={w,h,l};g.userData.ramVisualZ=1;
  const wx=w*.47,wz=l*.31;
  if(type==='supercar'){
    box(g,'body',[w*.94,h*.32,l*.60],[0,r+h*.16,0],body,{painted:true});box(g,'nose',[w*.90,h*.18,l*.42],[0,r+h*.08,l*.30],body,{rot:[-.06,0,0],painted:true});box(g,'cabin',[w*.61,h*.33,l*.34],[0,r+h*.42,-l*.06],window,{rot:[.045,0,0]});box(g,'roof',[w*.47,.05,l*.22],[0,r+h*.60,-l*.09],trim);box(g,'splitter',[w*.94,.04,l*.13],[0,r*.58,l*.51],trim);box(g,'diffuser',[w*.84,.05,l*.12],[0,r*.56,-l*.52],trim);box(g,'intakeL',[.12,h*.20,l*.28],[-w*.47,r+h*.19,-l*.02],trim);box(g,'intakeR',[.12,h*.20,l*.28],[w*.47,r+h*.19,-l*.02],trim);
  }else if(type==='compact'){
    box(g,'body',[w*.94,h*.42,l*.82],[0,r+h*.20,0],body,{painted:true});box(g,'cabin',[w*.78,h*.43,l*.52],[0,r+h*.54,-l*.05],window);box(g,'roof',[w*.70,.07,l*.43],[0,r+h*.78,-l*.08],body,{painted:true});box(g,'bumper',[w*.92,.10,l*.08],[0,r*.64,l*.48],trim);
  }else if(type==='beetle'){
    sphere(g,'body',[w*.50,h*.43,l*.48],[0,r+h*.38,-l*.02],body,{painted:true});sphere(g,'cabin',[w*.40,h*.31,l*.31],[0,r+h*.55,l*.02],window);box(g,'bumper',[w*.80,.07,l*.09],[0,r*.64,l*.49],trim);
  }else if(type==='armored'){
    box(g,'body',[w*.96,h*.48,l*.78],[0,r+h*.22,0],body,{painted:true});box(g,'armor',[w*.86,h*.42,l*.42],[0,r+h*.61,-l*.05],body,{painted:true});box(g,'cabin',[w*.60,h*.24,l*.28],[0,r+h*.83,l*.02],window);box(g,'ramPlate',[w*1.02,h*.34,.16],[0,r+h*.18,l*.51],trim);box(g,'roofGuard',[w*.76,.10,l*.34],[0,r+h*.98,-l*.03],trim);
  }else if(type==='pickup'){
    box(g,'body',[w*.94,h*.31,l*.92],[0,r+h*.13,0],body,{painted:true});box(g,'cab',[w*.84,h*.52,l*.43],[0,r+h*.48,l*.18],body,{painted:true});box(g,'cabin',[w*.68,h*.32,l*.31],[0,r+h*.65,l*.20],window);box(g,'bed',[w*.82,h*.25,l*.39],[0,r+h*.28,-l*.29],trim);box(g,'bedL',[.06,h*.28,l*.40],[-w*.43,r+h*.37,-l*.29],body,{painted:true});box(g,'bedR',[.06,h*.28,l*.40],[w*.43,r+h*.37,-l*.29],body,{painted:true});
  }else if(type==='formula'){
    box(g,'body',[w*.32,h*.28,l*.70],[0,r+h*.16,0],body,{painted:true});box(g,'nose',[w*.18,h*.18,l*.42],[0,r+h*.09,l*.34],body,{painted:true});box(g,'cabin',[w*.30,h*.25,l*.22],[0,r+h*.38,-l*.03],window);box(g,'frontWing',[w*.95,.05,l*.15],[0,r*.54,l*.48],trim);box(g,'rearWing',[w*.90,.07,l*.15],[0,r+h*.43,-l*.48],trim);box(g,'sideL',[w*.23,h*.20,l*.34],[-w*.29,r+h*.13,-l*.06],body,{painted:true});box(g,'sideR',[w*.23,h*.20,l*.34],[w*.29,r+h*.13,-l*.06],body,{painted:true});
  }else if(type==='van'){
    box(g,'body',[w*.95,h*.73,l*.84],[0,r+h*.36,-l*.05],body,{painted:true});box(g,'nose',[w*.88,h*.34,l*.25],[0,r+h*.18,l*.40],body,{painted:true});box(g,'cabin',[w*.72,h*.33,l*.22],[0,r+h*.63,l*.31],window);box(g,'rearDoor',[w*.72,h*.54,.05],[0,r+h*.40,-l*.475],trim);
  }else if(type==='harvester'){
    box(g,'body',[w*.92,h*.38,l*.80],[0,r+h*.18,-l*.05],body,{painted:true});box(g,'engine',[w*.72,h*.46,l*.38],[0,r+h*.45,-l*.24],body,{painted:true});box(g,'cab',[w*.66,h*.62,l*.35],[0,r+h*.72,l*.18],body,{painted:true});box(g,'cabin',[w*.56,h*.40,l*.28],[0,r+h*.82,l*.20],window);box(g,'frontTool',[w*1.08,.16,l*.18],[0,r*.54,l*.51],trim);
  }else if(type==='suv'){
    box(g,'body',[w*.94,h*.42,l*.88],[0,r+h*.18,0],body,{painted:true});box(g,'upper',[w*.82,h*.48,l*.56],[0,r+h*.55,-l*.06],body,{painted:true});box(g,'cabin',[w*.68,h*.34,l*.44],[0,r+h*.70,-l*.04],window);box(g,'rack',[w*.62,.07,l*.44],[0,r+h*.94,-l*.06],trim);const spare=new THREE.Mesh(new THREE.TorusGeometry(r*.58,.09,8,16),trim);spare.rotation.y=Math.PI/2;spare.position.set(0,r+h*.34,-l*.52);g.add(spare);
  }else{
    box(g,'body',[w*.94,h*.36,l*.86],[0,r+h*.16,0],body,{painted:true});box(g,'cabin',[w*.72,h*.42,l*.46],[0,r+h*.50,-l*.04],window);box(g,'roof',[w*.66,.06,l*.38],[0,r+h*.72,-l*.05],body,{painted:true});if(vehicle.id==='metro_king')box(g,'taxiSign',[w*.28,.12,l*.12],[0,r+h*.86,-l*.08],light(0xffd632));
  }
  const xs=type==='formula'?[-w*.46,w*.46]:[-wx,wx],zs=type==='formula'?[-l*.33,l*.33]:[-wz,wz];for(const x of xs)for(const z of zs)wheel(g,x,z,r,detail?.25:.20,detail);lights(g,w,h,l);return g;
}

export function morphDetailedCar(mesh,a,b,t){const base=mesh?.userData?.baseDimensions;if(!base)return;const da=designFor(a),db=designFor(b),ramZ=mesh.userData.ramVisualZ||1;mesh.scale.set(lerp(da.w,db.w,t)/base.w,lerp(da.h,db.h,t)/base.h,(lerp(da.l,db.l,t)/base.l)*ramZ);const c=new THREE.Color(a.color).lerp(new THREE.Color(b.color),t);mesh.traverse(o=>{if(o.userData?.paint&&o.material?.color)o.material.color.copy(c)})}

export function disposeObject3D(root){if(!root)return;root.traverse(o=>{if(o.geometry&&!o.geometry.userData?.shared)o.geometry.dispose?.();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.())})}
