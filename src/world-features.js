import * as THREE from 'three';
import {terrainHeight} from './openworld.js';

export const WORLD_FEATURE_VERSION='0.8.3';

const RAMP_STYLE=Object.freeze({width:12,lanes:2,speed:28,color:0x555b60});
const TUNNEL_STYLE=Object.freeze({width:18,lanes:2,speed:30,color:0x2f3438});

const RAMP_DEFS=Object.freeze([
  {id:'airport-launch-ramp',name:'Airport Launch',district:'airport',points:[[1880,-3480,0],[1970,-3480,0],[2040,-3480,2.5],[2100,-3480,6.5],[2160,-3480,11.5]]},
  {id:'cobalto-dock-ramp',name:'Cobalto Dock Jump',district:'harbor',points:[[-3450,-1710,0],[-3370,-1690,0],[-3300,-1670,3],[-3240,-1650,7],[-3185,-1632,10.5]]},
  {id:'sunset-stunt-ramp',name:'Sunset Stunt',district:'suburbs',points:[[2670,1170,0],[2740,1140,0],[2800,1110,2.8],[2860,1080,6.8],[2920,1050,10.2]]},
  {id:'vega-rail-ramp',name:'Vega Rail Jump',district:'westside',points:[[-3260,1300,0],[-3190,1325,0],[-3125,1350,3.2],[-3065,1375,7.2],[-3010,1400,10.8]]},
  {id:'gold-coast-ramp',name:'Gold Coast Launch',district:'mountains',points:[[1280,2700,0],[1340,2725,0],[1400,2750,3],[1460,2775,7],[1515,2800,11]]},
]);

const TUNNEL_DEFS=Object.freeze([
  {id:'nova-central-tunnel',name:'Nova Central Tunnel',district:'downtown',height:7.6,points:[[-1370,-590,0],[-900,-590,0],[-450,-590,0],[0,-590,0],[450,-590,0],[900,-590,0],[1370,-590,0]]},
  {id:'airport-service-tunnel',name:'Airport Service Tunnel',district:'airport',height:7.2,points:[[1650,-2700,0],[2100,-2700,0],[2550,-2700,0],[3000,-2700,0],[3450,-2700,0]]},
  {id:'gold-coast-tunnel',name:'Gold Coast Tunnel',district:'mountains',height:8.2,points:[[-1350,2220,0],[-900,2200,0],[-450,2190,0],[0,2200,0],[450,2220,0],[900,2240,0],[1350,2260,0]]},
]);

function makeRoad(def,feature){
  const style=feature==='ramp'?RAMP_STYLE:TUNNEL_STYLE;
  const points=def.points.map(([x,z,lift=0])=>new THREE.Vector3(x,terrainHeight(x,z)+.1+lift,z));
  const road={
    id:def.id,
    feature,
    featureName:def.name,
    points,
    cls:feature==='ramp'?'service':'arterial',
    district:def.district,
    loop:false,
    width:style.width,
    lanes:style.lanes,
    speed:style.speed,
    color:style.color,
    tunnelHeight:def.height||0,
    cum:[0],
    length:0,
  };
  for(let i=1;i<points.length;i++){
    road.length+=points[i].distanceTo(points[i-1]);
    road.cum.push(road.length);
  }
  return road;
}

export function installWorldFeatures(blueprint){
  if(blueprint.worldFeatureVersion===WORLD_FEATURE_VERSION)return blueprint;
  const existing=new Set(blueprint.roads.map(r=>r.id));
  for(const def of RAMP_DEFS)if(!existing.has(def.id))blueprint.roads.push(makeRoad(def,'ramp'));
  for(const def of TUNNEL_DEFS)if(!existing.has(def.id))blueprint.roads.push(makeRoad(def,'tunnel'));
  blueprint.indexSegments();
  blueprint.worldFeatureVersion=WORLD_FEATURE_VERSION;
  blueprint.featureCounts={ramps:RAMP_DEFS.length,tunnels:TUNNEL_DEFS.length};
  return blueprint;
}

function frame(a,b){
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,planar=Math.hypot(dx,dz)||1;
  return{
    mid:a.clone().lerp(b,.5),
    yaw:Math.atan2(dx,dz),
    pitch:Math.atan2(dy,planar),
    length:Math.hypot(planar,dy),
    right:new THREE.Vector3(dz/planar,0,-dx/planar),
  };
}

function beam(group,a,b,width,height,offsetX,offsetY,material){
  const f=frame(a,b),mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,f.length+1.2),material);
  mesh.position.copy(f.mid).addScaledVector(f.right,offsetX);
  mesh.position.y+=offsetY;
  mesh.rotation.order='YXZ';
  mesh.rotation.y=f.yaw;
  mesh.rotation.x=-f.pitch;
  group.add(mesh);
  return mesh;
}

function addTunnel(group,road){
  const wallMat=new THREE.MeshStandardMaterial({color:0x4a5054,roughness:.91,metalness:.03});
  const roofMat=new THREE.MeshStandardMaterial({color:0x353b3f,roughness:.88,metalness:.05});
  const stripeMat=new THREE.MeshBasicMaterial({color:0xffd46a,toneMapped:false});
  const h=road.tunnelHeight||7.5,half=road.width*.5+.45;
  for(let i=1;i<road.points.length;i++){
    const a=road.points[i-1],b=road.points[i];
    beam(group,a,b,.55,h,-half,h*.5,wallMat);
    beam(group,a,b,.55,h,half,h*.5,wallMat);
    beam(group,a,b,road.width+1.5,.55,0,h,roofMat);
    if(i%2===1)beam(group,a,b,.16,.07,-road.width*.28,h-.35,stripeMat);
    if(i%2===1)beam(group,a,b,.16,.07,road.width*.28,h-.35,stripeMat);
  }
  for(const endpoint of [0,road.points.length-1]){
    const p=road.points[endpoint],q=road.points[endpoint===0?1:road.points.length-2],yaw=Math.atan2(p.x-q.x,p.z-q.z),portal=new THREE.Group();
    const sideGeo=new THREE.BoxGeometry(.7,h+.8,.8),topGeo=new THREE.BoxGeometry(road.width+2,.75,.85);
    const left=new THREE.Mesh(sideGeo,wallMat),right=new THREE.Mesh(sideGeo,wallMat),top=new THREE.Mesh(topGeo,wallMat);
    left.position.set(-half,h*.5,0);right.position.set(half,h*.5,0);top.position.set(0,h+.15,0);
    portal.add(left,right,top);portal.position.copy(p);portal.rotation.y=yaw;group.add(portal);
  }
  for(let i=1;i<road.points.length-1;i+=2){
    const p=road.points[i],light=new THREE.PointLight(0xffd886,1.25,42,1.8);light.position.set(p.x,p.y+h-.65,p.z);group.add(light);
  }
}

function addRamp(group,road){
  const railMat=new THREE.MeshStandardMaterial({color:0xd9dde0,roughness:.5,metalness:.62});
  const supportMat=new THREE.MeshStandardMaterial({color:0x292e32,roughness:.9,metalness:.15});
  const markerMat=new THREE.MeshBasicMaterial({color:0xffa53a,toneMapped:false});
  const half=road.width*.5+.28;
  for(let i=1;i<road.points.length;i++){
    const a=road.points[i-1],b=road.points[i];
    beam(group,a,b,.18,.28,-half,.34,railMat);
    beam(group,a,b,.18,.28,half,.34,railMat);
  }
  for(let i=1;i<road.points.length;i++){
    const p=road.points[i],ground=terrainHeight(p.x,p.z),height=Math.max(0,p.y-ground-.15);
    if(height<1.5)continue;
    const support=new THREE.Mesh(new THREE.BoxGeometry(.45,height,.45),supportMat);
    support.position.set(p.x,ground+height*.5,p.z);group.add(support);
  }
  const a=road.points.at(-2),b=road.points.at(-1),f=frame(a,b);
  for(const t of [.25,.5,.75]){
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(road.width*.78,.045,.75),markerMat);
    stripe.position.copy(a).lerp(b,t);stripe.position.y+=.08;stripe.rotation.order='YXZ';stripe.rotation.y=f.yaw;stripe.rotation.x=-f.pitch;group.add(stripe);
  }
}

export function buildWorldFeatureGeometry(renderer,blueprint){
  const previous=renderer.staticRoot.getObjectByName('world-features-v083');
  if(previous)return previous;
  const root=new THREE.Group();root.name='world-features-v083';
  for(const road of blueprint.roads){
    if(road.feature==='tunnel')addTunnel(root,road);
    else if(road.feature==='ramp')addRamp(root,road);
  }
  renderer.staticRoot.add(root);
  return root;
}

export function rampLaunchInfo(near,position,heading,speed){
  const road=near?.road;
  if(!road||road.feature!=='ramp'||near.i!==road.points.length-2||Math.abs(speed)*3.6<70)return null;
  const a=road.points.at(-2),b=road.points.at(-1),dx=b.x-a.x,dz=b.z-a.z,planar=Math.hypot(dx,dz)||1;
  const fx=Math.sin(heading),fz=Math.cos(heading),alignment=(fx*dx+fz*dz)/planar;
  const distance=Math.hypot(position.x-b.x,position.z-b.z);
  if(alignment<.58||distance>20)return null;
  const slope=(b.y-a.y)/planar;
  return{road,end:b,slope,alignment};
}
