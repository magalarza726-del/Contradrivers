import * as THREE from 'three';
import {clamp,lerp,smoothstep,expSmoothing,wrap,TAU} from './core.js';

const ROAD_STYLE={
  highway:{width:26,lanes:4,color:0x30363b,speed:42},
  arterial:{width:18,lanes:3,color:0x373c40,speed:31},
  street:{width:11,lanes:2,color:0x404448,speed:20},
  service:{width:8,lanes:1,color:0x4b4c49,speed:14},
  mountain:{width:12,lanes:2,color:0x3d4140,speed:22},
  bridge:{width:22,lanes:3,color:0x343b41,speed:34},
};

const DISTRICTS=[
  {id:'downtown',name:'Nova Centro',x0:-1500,x1:1500,z0:-1250,z1:1250,color:0x284256},
  {id:'harbor',name:'Puerto Cobalto',x0:-3800,x1:-1600,z0:-2100,z1:700,color:0x39454c},
  {id:'suburbs',name:'Sunset Hills',x0:1550,x1:3800,z0:-1700,z1:1550,color:0x4e5b4c},
  {id:'westside',name:'Distrito Vega',x0:-3700,x1:-1650,z0:900,z1:2450,color:0x334b58},
  {id:'mountains',name:'Gold Coast Mountains',x0:-3800,x1:3800,z0:1600,z1:3900,color:0x53604b},
  {id:'airport',name:'Bahía Aeropuerto',x0:1200,x1:3900,z0:-3900,z1:-1900,color:0x4a4d4f},
];

function hash2(x,z,seed=1337){let h=(Math.imul(x|0,374761393)^Math.imul(z|0,668265263)^seed)>>>0;h=(h^(h>>>13))*1274126177>>>0;return (h^(h>>>16))>>>0;}
function rngFrom(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
function v3(x,z,y=0){return new THREE.Vector3(x,y,z);}
function distancePointSegment2D(px,pz,a,b){const vx=b.x-a.x,vz=b.z-a.z,wx=px-a.x,wz=pz-a.z,l2=vx*vx+vz*vz||1;const t=clamp((wx*vx+wz*vz)/l2,0,1),x=a.x+vx*t,z=a.z+vz*t;return{distance:Math.hypot(px-x,pz-z),t,x,z};}

export function terrainHeight(x,z){
  let y=0;
  if(z>1500){const k=(z-1500)/2400;y+=18*k+34*Math.sin((x+600)/820)*k+13*Math.sin(z/430)*k;}
  if(x<-2500&&z>400)y+=8*Math.sin((z+800)/500);
  if(z<-2300&&x>900)y-=2.5;
  return y;
}

function districtAt(x,z){for(const d of DISTRICTS)if(x>=d.x0&&x<=d.x1&&z>=d.z0&&z<=d.z1)return d;return {id:'outskirts',name:'Outskirts',color:0x435045};}

function roundedRect(cx,cz,hx,hz,r,step=120){const pts=[];const corners=[[cx+hx-r,cz+hz-r,0],[cx-hx+r,cz+hz-r,Math.PI/2],[cx-hx+r,cz-hz+r,Math.PI],[cx+hx-r,cz-hz+r,Math.PI*1.5]];for(const [x,z,a0] of corners){for(let a=0;a<=Math.PI/2+.001;a+=Math.PI/2/Math.max(3,Math.round(r/step))){pts.push([x+Math.cos(a0+a)*r,z+Math.sin(a0+a)*r]);}}return pts;}

export class OpenWorldBlueprint{
  constructor(){this.extent=4000;this.chunkSize=500;this.roads=[];this.segments=[];this.spatial=new Map();this.activities=[];this.landmarks=[];this.generate();}
  addRoad(id,points,cls='street',district='mixed',loop=false){const style=ROAD_STYLE[cls]||ROAD_STYLE.street;const pts=points.map(p=>v3(p[0],p[1],terrainHeight(p[0],p[1])+.08));const road={id,points:pts,cls,district,loop,width:style.width,lanes:style.lanes,speed:style.speed,color:style.color,cum:[0],length:0};for(let i=1;i<pts.length;i++){road.length+=pts[i].distanceTo(pts[i-1]);road.cum.push(road.length);}if(loop){road.length+=pts[0].distanceTo(pts.at(-1));road.cum.push(road.length);}this.roads.push(road);return road;}
  addGrid(prefix,x0,x1,z0,z1,stepX,stepZ,cls='street',district='mixed'){
    let n=0;for(let x=x0;x<=x1+.01;x+=stepX)this.addRoad(`${prefix}-v${n++}`,[[x,z0],[x,z1]],cls,district);
    n=0;for(let z=z0;z<=z1+.01;z+=stepZ)this.addRoad(`${prefix}-h${n++}`,[[x0,z],[x1,z]],cls,district);
  }
  generate(){
    this.addRoad('I-85-ring',roundedRect(0,0,3600,3300,520,110),'highway','regional',true);
    this.addRoad('I-20-east-west',[[-3650,-250],[-2300,-220],[-1200,-120],[0,-40],[1200,-80],[2400,-120],[3650,-180]],'highway','regional');
    this.addRoad('I-5-north-south',[[250,-3650],[210,-2450],[130,-1200],[40,0],[50,1250],[130,2450],[240,3650]],'highway','regional');
    this.addRoad('bay-express',[[-3500,-1450],[-2700,-1250],[-1800,-900],[-900,-650],[0,-600],[950,-900],[1900,-1500],[3000,-2350],[3650,-2700]],'highway','regional');

    this.addGrid('downtown',-1450,1450,-1200,1200,190,190,'street','downtown');
    for(let x=-1400;x<=1400;x+=570)this.addRoad(`dt-arterial-x${x}`,[[x,-1300],[x,1350]],'arterial','downtown');
    for(let z=-1140;z<=1140;z+=570)this.addRoad(`dt-arterial-z${z}`,[[-1550,z],[1550,z]],'arterial','downtown');

    this.addGrid('harbor',-3650,-1700,-2050,650,310,270,'street','harbor');
    this.addRoad('harbor-arterial',[[-3700,-650],[-3150,-620],[-2550,-590],[-1700,-520]],'arterial','harbor');
    this.addRoad('dock-service',[[-3600,-1850],[-3200,-1680],[-2800,-1750],[-2350,-1590],[-1900,-1700]],'service','harbor');

    this.addGrid('suburb',1650,3650,-1650,1450,310,310,'street','suburbs');
    this.addRoad('sunset-boulevard',[[1550,-350],[2050,-250],[2550,-100],[3050,150],[3650,480]],'arterial','suburbs');
    this.addRoad('ridge-avenue',[[1750,1350],[2200,1200],[2700,1180],[3200,1320],[3700,1450]],'arterial','suburbs');

    this.addGrid('westside',-3600,-1700,900,2400,270,260,'street','westside');
    this.addRoad('vega-parkway',[[-3700,1650],[-3150,1550],[-2500,1600],[-1700,1780]],'arterial','westside');

    this.addGrid('airport',1450,3700,-3800,-2200,420,360,'service','airport');
    this.addRoad('airport-arterial',[[1200,-3050],[1800,-3000],[2400,-3050],[3100,-3100],[3800,-3000]],'arterial','airport');
    this.addRoad('runway-road',[[1550,-3600],[3650,-3600]],'highway','airport');

    for(let k=0;k<5;k++){const pts=[];for(let x=-3700;x<=3700;x+=180){const z=2050+k*330+Math.sin((x+k*280)/620)*180+Math.sin(x/210)*45;pts.push([x,z]);}this.addRoad(`mountain-eastwest-${k}`,pts,k===2?'arterial':'mountain','mountains');}
    for(let k=0;k<4;k++){const pts=[];for(let z=1650;z<=3750;z+=150){const x=-2700+k*1750+Math.sin((z+k*300)/390)*260;pts.push([x,z]);}this.addRoad(`mountain-switch-${k}`,pts,'mountain','mountains');}

    this.addRoad('coast-road',[[-3600,-2450],[-2800,-2700],[-1800,-2850],[-700,-3000],[500,-3150],[1500,-3300]],'arterial','regional');
    this.addRoad('golden-bridge',[[-1750,1350],[-1200,1500],[-650,1650],[-100,1780],[450,1880]],'bridge','regional');
    this.addRoad('bay-bridge',[[1300,350],[1900,180],[2550,50],[3250,-50],[3800,-120]],'bridge','regional');
    this.addRoad('mountain-bypass',[[-3500,2950],[-2500,3200],[-1300,3330],[0,3260],[1350,3380],[2500,3220],[3550,3000]],'highway','mountains');

    this.indexSegments();
    this.buildActivities();
    this.buildLandmarks();
  }
  indexSegments(){this.segments=[];this.spatial.clear();const cell=250;for(const road of this.roads){const count=road.loop?road.points.length:road.points.length-1;for(let i=0;i<count;i++){const a=road.points[i],b=road.points[(i+1)%road.points.length],seg={road,i,a,b,width:road.width,cls:road.cls,district:road.district};this.segments.push(seg);const minX=Math.floor((Math.min(a.x,b.x)-road.width)/cell),maxX=Math.floor((Math.max(a.x,b.x)+road.width)/cell),minZ=Math.floor((Math.min(a.z,b.z)-road.width)/cell),maxZ=Math.floor((Math.max(a.z,b.z)+road.width)/cell);for(let cx=minX;cx<=maxX;cx++)for(let cz=minZ;cz<=maxZ;cz++){const key=`${cx},${cz}`;if(!this.spatial.has(key))this.spatial.set(key,[]);this.spatial.get(key).push(seg);}}}}
  nearbySegments(x,z,rCells=1){const cell=250,cx=Math.floor(x/cell),cz=Math.floor(z/cell),out=[];for(let dx=-rCells;dx<=rCells;dx++)for(let dz=-rCells;dz<=rCells;dz++){const a=this.spatial.get(`${cx+dx},${cz+dz}`);if(a)out.push(...a);}return out;}
  nearestRoad(x,z){let best=null,bestD=Infinity;for(const seg of this.nearbySegments(x,z,2)){const q=distancePointSegment2D(x,z,seg.a,seg.b);if(q.distance<bestD){const y=lerp(seg.a.y,seg.b.y,q.t);const tx=seg.b.x-seg.a.x,tz=seg.b.z-seg.a.z,tl=Math.hypot(tx,tz)||1;bestD=q.distance;best={...seg,distance:q.distance,point:new THREE.Vector3(q.x,y,q.z),tangent:new THREE.Vector3(tx/tl,(seg.b.y-seg.a.y)/tl,tz/tl).normalize()};}}return best;}
  roadLengthKm(){return this.roads.reduce((s,r)=>s+r.length,0)/1000;}
  sampleRoad(road,distance){let d=distance;if(road.loop)d=((d%road.length)+road.length)%road.length;else d=clamp(d,0,road.length);let idx=0;while(idx<road.cum.length-1&&road.cum[idx+1]<d)idx++;if(idx>=road.points.length-1){if(road.loop){const a=road.points.at(-1),b=road.points[0],base=road.cum[road.points.length-1],len=a.distanceTo(b)||1,t=(d-base)/len;return{position:a.clone().lerp(b,t),heading:Math.atan2(b.x-a.x,b.z-a.z),index:idx};}idx=road.points.length-2;}const a=road.points[idx],b=road.points[idx+1],len=b.distanceTo(a)||1,t=(d-road.cum[idx])/len;return{position:a.clone().lerp(b,t),heading:Math.atan2(b.x-a.x,b.z-a.z),index:idx};}
  randomRoadNear(x,z,rng,radius=1200){const candidates=this.roads.filter(r=>r.points.some(p=>Math.hypot(p.x-x,p.z-z)<radius));return candidates.length?candidates[Math.floor(rng()*candidates.length)]:this.roads[Math.floor(rng()*this.roads.length)];}
  buildActivities(){const raw=[
    ['H1','Highway Battle',-3250,-150,'battle'],['H2','Interstate Pursuit',2850,-160,'pursuit'],['D1','Downtown Sprint',-900,850,'sprint'],['D2','Night Courier',1050,-720,'delivery'],
    ['P1','Dock Takedown',-3100,-1350,'takedown'],['P2','Container Run',-2150,-1750,'sprint'],['S1','Sunset Rush',2600,750,'sprint'],['S2','Suburban Escape',3350,-850,'pursuit'],
    ['M1','Mountain Descent',-2200,3020,'sprint'],['M2','Observatory Run',900,3450,'delivery'],['A1','Airport Velocity',2500,-3500,'battle'],['W1','Vega Loop',-2750,1700,'sprint']
  ];this.activities=raw.map((a,i)=>({id:a[0],name:a[1],position:v3(a[2],a[3],terrainHeight(a[2],a[3])),type:a[4],reward:5000+i*750}));}
  buildLandmarks(){this.landmarks=[
    {name:'Aureus Tower',x:-250,z:220,h:155,color:0x557fa1},{name:'Cobalto Cranes',x:-3150,z:-1550,h:70,color:0xc47e3a},{name:'Sunset Stadium',x:2850,z:1050,h:48,color:0xb9bfc5},
    {name:'Vega Arena',x:-2550,z:1950,h:58,color:0x6b7c8d},{name:'Observatory',x:1050,z:3380,h:45,color:0xd9d6c9},{name:'Airport Control',x:3200,z:-3300,h:80,color:0x8aa0aa}
  ];}
}

function createRoadGeometry(blueprint){const positions=[],colors=[],uvs=[],indices=[];let v=0;for(const road of blueprint.roads){const pts=road.points,count=road.loop?pts.length:pts.length-1;for(let i=0;i<count;i++){const a=pts[i],b=pts[(i+1)%pts.length],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1,rx=dz/l,rz=-dx/l,w=road.width*.5;positions.push(a.x+rx*w,a.y,a.z+rz*w,a.x-rx*w,a.y,a.z-rz*w,b.x+rx*w,b.y,b.z+rz*w,b.x-rx*w,b.y,b.z-rz*w);const c=new THREE.Color(road.color);for(let k=0;k<4;k++)colors.push(c.r,c.g,c.b);uvs.push(0,0,1,0,0,1,1,1);indices.push(v,v+1,v+2,v+1,v+3,v+2);v+=4;}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;}

function createTerrainGeometry(extent=4200,div=84){const pos=[],colors=[],idx=[];for(let iz=0;iz<=div;iz++)for(let ix=0;ix<=div;ix++){const x=-extent+2*extent*ix/div,z=-extent+2*extent*iz/div,y=terrainHeight(x,z)-.12;pos.push(x,y,z);const d=districtAt(x,z);const c=new THREE.Color(d.color);const shade=clamp(.82+y/180,.65,1.1);colors.push(c.r*shade,c.g*shade,c.b*shade);}for(let z=0;z<div;z++)for(let x=0;x<div;x++){const a=z*(div+1)+x,b=a+1,c=a+div+1,d=c+1;idx.push(a,c,b,b,c,d);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();return g;}

export class OpenWorldRenderer{
  constructor(canvas,blueprint){this.canvas=canvas;this.blueprint=blueprint;this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x6e9ab8);this.scene.fog=new THREE.Fog(0x6e9ab8,650,2300);this.camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.1,5000);this.root=new THREE.Group();this.staticRoot=new THREE.Group();this.chunkRoot=new THREE.Group();this.dynamicRoot=new THREE.Group();this.scene.add(this.root);this.root.add(this.staticRoot,this.chunkRoot,this.dynamicRoot);this.scene.add(new THREE.HemisphereLight(0xbfe2ff,0x243322,2.3));const sun=new THREE.DirectionalLight(0xffe5b7,3.2);sun.position.set(-900,1500,-600);this.scene.add(sun);this.chunks=new Map();this.buildStatic();this.resize();addEventListener('resize',()=>this.resize());}
  resize(){this.renderer.setSize(innerWidth,innerHeight,false);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
  makeCar(v,color=v.color,detail=1){const g=new THREE.Group(),bodyMat=new THREE.MeshStandardMaterial({color,roughness:.35,metalness:.5}),glass=new THREE.MeshStandardMaterial({color:0x102b3b,roughness:.16,metalness:.35}),rubber=new THREE.MeshStandardMaterial({color:0x050607,roughness:.9});const sx=v.visual_scale?.[0]||1.7,sy=Math.max(.38,v.visual_scale?.[1]||.65),sz=v.visual_scale?.[2]||3.4,bodyY=Math.max(.42,sy*.5+.12);const body=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),bodyMat);body.name='body';body.scale.set(sx,sy,sz);body.position.y=bodyY;g.add(body);const cabin=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),glass);cabin.name='cabin';cabin.scale.set(sx*.7,sy*.72,sz*.4);cabin.position.set(0,bodyY+sy*.58,-sz*.08);g.add(cabin);const wheelGeo=new THREE.CylinderGeometry(.32,.32,.26,detail?12:8);for(const xx of [-1,1])for(const zz of [-1,1]){const w=new THREE.Mesh(wheelGeo,rubber);w.rotation.z=Math.PI/2;w.position.set(xx*sx*.56,.29,zz*sz*.3);g.add(w);}const tail=new THREE.Mesh(new THREE.BoxGeometry(sx*.72,.06,.08),new THREE.MeshBasicMaterial({color:0xff352d}));tail.position.set(0,bodyY+.02,-sz*.505);g.add(tail);return g;}
  morphCar(mesh,a,b,t){const body=mesh.getObjectByName('body'),cab=mesh.getObjectByName('cabin');if(!body||!cab)return;const sx=lerp(a.visual_scale[0],b.visual_scale[0],t),sy=Math.max(.38,lerp(a.visual_scale[1],b.visual_scale[1],t)),sz=lerp(a.visual_scale[2],b.visual_scale[2],t),bodyY=Math.max(.42,sy*.5+.12);body.scale.set(sx,sy,sz);body.position.y=bodyY;cab.scale.set(sx*.7,sy*.72,sz*.4);cab.position.set(0,bodyY+sy*.58,-sz*.08);body.material.color.copy(new THREE.Color(a.color).lerp(new THREE.Color(b.color),t));}
  buildStatic(){const terrain=new THREE.Mesh(createTerrainGeometry(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));this.staticRoot.add(terrain);const road=new THREE.Mesh(createRoadGeometry(this.blueprint),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94,metalness:.02,side:THREE.DoubleSide}));road.position.y=.02;this.staticRoot.add(road);this.addLaneLines();for(const lm of this.blueprint.landmarks)this.addLandmark(lm);}
  addLaneLines(){const mat=new THREE.LineBasicMaterial({color:0xe5e7d9,transparent:true,opacity:.55}),pts=[];for(const road of this.blueprint.roads){if(!['highway','arterial','bridge'].includes(road.cls))continue;for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i];pts.push(new THREE.Vector3(a.x,a.y+.08,a.z),new THREE.Vector3(b.x,b.y+.08,b.z));}}const g=new THREE.BufferGeometry().setFromPoints(pts);this.staticRoot.add(new THREE.LineSegments(g,mat));}
  addLandmark(lm){const y=terrainHeight(lm.x,lm.z),g=new THREE.Group();const tower=new THREE.Mesh(new THREE.BoxGeometry(45,lm.h,45),new THREE.MeshStandardMaterial({color:lm.color,roughness:.48,metalness:.2}));tower.position.y=lm.h/2;g.add(tower);const beacon=new THREE.Mesh(new THREE.SphereGeometry(4,10,8),new THREE.MeshBasicMaterial({color:0x27c5ff}));beacon.position.y=lm.h+6;g.add(beacon);g.position.set(lm.x,y,lm.z);this.staticRoot.add(g);}
  updateChunks(position){const cs=this.blueprint.chunkSize,cx=Math.floor(position.x/cs),cz=Math.floor(position.z/cs),need=new Set();for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)need.add(`${cx+dx},${cz+dz}`);for(const key of need)if(!this.chunks.has(key)){const [x,z]=key.split(',').map(Number);const g=this.buildChunk(x,z);this.chunks.set(key,g);this.chunkRoot.add(g);}for(const [key,g] of [...this.chunks])if(!need.has(key)){this.chunkRoot.remove(g);g.traverse(o=>{o.geometry?.dispose?.();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose?.());});this.chunks.delete(key);}}
  buildChunk(cx,cz){const cs=this.blueprint.chunkSize,g=new THREE.Group(),rng=rngFrom(hash2(cx,cz)),district=districtAt((cx+.5)*cs,(cz+.5)*cs),max=district.id==='downtown'?70:district.id==='harbor'?45:district.id==='suburbs'?48:district.id==='mountains'?16:35,geo=new THREE.BoxGeometry(1,1,1),mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.82,metalness:.05}),mesh=new THREE.InstancedMesh(geo,mat,max),dummy=new THREE.Object3D(),col=new THREE.Color();let count=0;for(let i=0;i<max*3&&count<max;i++){const x=(cx+rng())*cs,z=(cz+rng())*cs;if(Math.abs(x)>this.blueprint.extent||Math.abs(z)>this.blueprint.extent)continue;const near=this.blueprint.nearestRoad(x,z);if(near&&near.distance<near.width*.5+10)continue;if(district.id==='mountains'&&rng()<.62)continue;const base=district.id==='downtown'?18:district.id==='harbor'?10:district.id==='suburbs'?7:district.id==='airport'?8:10,h=base+(district.id==='downtown'?rng()*115:rng()*32),w=10+rng()*28,d=10+rng()*30,y=terrainHeight(x,z);dummy.position.set(x,y+h/2,z);dummy.scale.set(w,h,d);dummy.rotation.y=Math.floor(rng()*4)*Math.PI/2;dummy.updateMatrix();mesh.setMatrixAt(count,dummy.matrix);col.setHSL((.52+rng()*.08)%1,.16,.28+rng()*.22);mesh.setColorAt(count,col);count++;}mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();g.add(mesh);
    const treeCount=district.id==='mountains'?85:district.id==='suburbs'?45:district.id==='downtown'?8:25,tgeo=new THREE.ConeGeometry(2.4,8,6),tmat=new THREE.MeshStandardMaterial({color:0x345535,roughness:1}),trees=new THREE.InstancedMesh(tgeo,tmat,treeCount);let tc=0;for(let i=0;i<treeCount*3&&tc<treeCount;i++){const x=(cx+rng())*cs,z=(cz+rng())*cs,near=this.blueprint.nearestRoad(x,z);if(near&&near.distance<near.width*.5+5)continue;dummy.position.set(x,terrainHeight(x,z)+4,z);const s=.6+rng()*1.3;dummy.scale.set(s,s,s);dummy.rotation.set(0,rng()*TAU,0);dummy.updateMatrix();trees.setMatrixAt(tc++,dummy.matrix);}trees.count=tc;trees.instanceMatrix.needsUpdate=true;trees.computeBoundingSphere();g.add(trees);return g;}
  render(){this.renderer.render(this.scene,this.camera);}
}

export class OpenWorldVehicle{
  constructor(mesh,blueprint,switchSystem,nitro,config={}){this.mesh=mesh;this.blueprint=blueprint;this.switch=switchSystem;this.nitro=nitro;this.config=config;this.position=new THREE.Vector3(0,0,0);this.heading=0;this.pitch=0;this.speed=0;this.lateral=0;this.yawRate=0;this.steer=0;this.throttle=0;this.brake=0;this.handbrake=false;this.timeReserve=1;this.timeActive=false;this.ramCharge=0;this.ramArmed=0;this.health=100;this.score=0;this.lastDistrict='';this.lastImpact=0;this.spawn();}
  spawn(x=0,z=-650){const near=this.blueprint.nearestRoad(x,z),p=near?.point||v3(x,z,terrainHeight(x,z));this.position.copy(p);this.position.y+=.055;this.heading=near?Math.atan2(near.tangent.x,near.tangent.z):0;this.speed=0;this.sync();}
  stats(){return this.switch.stats();}
  input(input,dt){this.steer=expSmoothing(this.steer,input.axes.steer,9,dt);this.throttle=input.axes.throttle;this.brake=input.axes.brake;this.handbrake=input.down('handbrake');if(input.pressedAction('switch'))this.switch.request();if(input.pressedAction('nitro'))this.nitro.base();if(input.pressedAction('remix'))this.nitro.remix();this.timeActive=input.down('time')&&this.timeReserve>.005;const s=this.stats();if(input.down('ram'))this.ramCharge=clamp(this.ramCharge+dt/Math.max(.1,s.ram_max_time),0,1);if(input.releasedAction('ram')){this.ramArmed=this.ramCharge;this.speed*=1+.035*this.ramCharge;this.ramCharge=0;}}
  update(dt){const s=this.stats(),[ns,na]=this.nitro.multipliers(s),max=(s.top_speed*ns)/3.6,kmh=Math.abs(this.speed)*3.6,tc=this.timeActive?s.time_control_control_multiplier:1;if(this.timeActive)this.timeReserve=Math.max(0,this.timeReserve-dt/Math.max(.5,s.time_control_max));else this.timeReserve=Math.min(1,this.timeReserve+dt*.08);const ramA=this.ramCharge?lerp(1,s.ram_acceleration_multiplier,this.ramCharge):1,ramS=this.ramCharge?lerp(1,s.ram_top_speed_multiplier,this.ramCharge):1,target=max*ramS,acc=(3.8+s.acceleration*.09)*na*ramA*(1-Math.pow(clamp(Math.abs(this.speed)/Math.max(1,target),0,1),1.65));if(this.throttle)this.speed+=acc*this.throttle*dt;if(this.brake){const force=(5+s.braking*.11)*this.brake;this.speed-=Math.sign(this.speed||1)*force*dt;if(Math.abs(this.speed)<.25)this.speed=-this.brake*2;}const drag=.22+.0022*kmh+.000012*kmh*kmh;this.speed-=Math.sign(this.speed)*Math.min(Math.abs(this.speed),drag*dt);this.speed=clamp(this.speed,-9,target*1.03);
    const n=clamp(Math.abs(this.speed)/Math.max(1,max),0,1),steerAvail=lerp(1,s.high_speed_steer,Math.pow(n,1.4)),steerAngle=this.steer*(Math.PI/180)*30*steerAvail*tc,near=this.blueprint.nearestRoad(this.position.x,this.position.z),onRoad=near&&near.distance<near.width*.62,grip=(s.grip||.85)*(onRoad?1:.42)*(this.handbrake?.36:1),wheelbase=2.4+s.mass/5500,desired=Math.tan(steerAngle)*this.speed/wheelbase*(.7+s.control/135);this.yawRate=expSmoothing(this.yawRate,desired,(2.8+s.steer_response*4.2)*grip,dt);if(this.handbrake&&kmh>65)this.yawRate*=1.25+Math.abs(this.steer)*.7;const slip=-this.yawRate*this.speed*.18*(1-grip*.38);this.lateral=expSmoothing(this.lateral,slip,(2+grip*6)*(this.handbrake?.48:1),dt);this.heading+=this.yawRate*dt;const f=new THREE.Vector3(Math.sin(this.heading),0,Math.cos(this.heading)),r=new THREE.Vector3(f.z,0,-f.x);this.position.addScaledVector(f,this.speed*dt).addScaledVector(r,this.lateral*dt);
    const ext=this.blueprint.extent-20;if(Math.abs(this.position.x)>ext||Math.abs(this.position.z)>ext){this.position.x=clamp(this.position.x,-ext,ext);this.position.z=clamp(this.position.z,-ext,ext);this.speed*=.35;}
    const nr=this.blueprint.nearestRoad(this.position.x,this.position.z),terrain=terrainHeight(this.position.x,this.position.z);let targetY=terrain+.055,targetPitch=0;if(nr&&nr.distance<nr.width*.72){targetY=nr.point.y+.055;targetPitch=Math.atan2(nr.tangent.y,Math.hypot(nr.tangent.x,nr.tangent.z));}else this.speed*=1-dt*.42;this.position.y=expSmoothing(this.position.y,targetY,18,dt);this.pitch=expSmoothing(this.pitch,targetPitch,10,dt);this.ramArmed=Math.max(0,this.ramArmed-dt*.16);this.lastImpact=Math.max(0,this.lastImpact-dt);this.sync();}
  sync(){this.mesh.position.copy(this.position);this.mesh.rotation.y=this.heading;this.mesh.rotation.x=-this.pitch;this.mesh.rotation.z=clamp(-this.lateral*.009,-.08,.08);}
}

export class OpenWorldTraffic{
  constructor(renderer,blueprint,vehicles,count=52){this.renderer=renderer;this.blueprint=blueprint;this.vehicles=vehicles;this.rng=rngFrom(9221);this.cars=[];for(let i=0;i<count;i++){const v=vehicles[(i*5+2)%vehicles.length],mesh=renderer.makeCar(v,['#d9d9d9','#335d85','#963e39','#d8b641','#3f6650'][i%5],0);mesh.scale.multiplyScalar(.86);renderer.dynamicRoot.add(mesh);this.cars.push({mesh,road:null,d:0,speed:13+this.rng()*18,dir:this.rng()<.16?-1:1,lane:this.rng()<.5?-.28:.28,mass:850+this.rng()*1500,nearLock:0});}}
  respawn(c,player){c.road=this.blueprint.randomRoadNear(player.position.x,player.position.z,this.rng,1450);c.d=this.rng()*c.road.length;c.speed=12+this.rng()*20;c.dir=this.rng()<.14?-1:1;c.lane=this.rng()<.5?-.28:.28;}
  update(dt,player){for(const c of this.cars){if(!c.road)this.respawn(c,player);c.d+=c.dir*c.speed*dt;if(!c.road.loop&&(c.d<0||c.d>c.road.length)){c.dir*=-1;c.d=clamp(c.d,0,c.road.length);}const p=this.blueprint.sampleRoad(c.road,c.d),pos=p.position,dx=pos.x-player.position.x,dz=pos.z-player.position.z;if(dx*dx+dz*dz>1900*1900){this.respawn(c,player);continue;}const tx=Math.sin(p.heading),tz=Math.cos(p.heading),rx=tz,rz=-tx;pos.x+=rx*c.lane*c.road.width*.32;pos.z+=rz*c.lane*c.road.width*.32;c.mesh.position.copy(pos);c.mesh.position.y+=.055;c.mesh.rotation.y=p.heading+(c.dir<0?Math.PI:0);c.nearLock=Math.max(0,c.nearLock-dt);}}
  interactions(player,nitro,audio){const s=player.stats(),f=new THREE.Vector3(Math.sin(player.heading),0,Math.cos(player.heading));for(const c of this.cars){const d=c.mesh.position.distanceTo(player.position);if(d>5.5)continue;if(d>2.8&&d<5.2&&c.nearLock<=0&&Math.abs(player.speed)*3.6>95){c.nearLock=2;nitro.reward('nearMiss',1);player.score+=60;continue;}if(d>2.7)continue;const to=c.mesh.position.clone().sub(player.position).setY(0).normalize(),front=f.dot(to),relative=Math.abs(player.speed-c.speed*c.dir),same=c.dir>0;if(same&&front>.1&&s.mass>c.mass*.55){const force=clamp((s.mass/c.mass)*relative/22,.12,1);c.speed+=force*5;player.speed*=1-.035*(1-force);nitro.reward('trafficCheck',.5+force);player.score+=Math.round(90+force*160);audio?.impact(.25+force*.3);}else{const dmg=(same?5:18)*(1+c.mass/2500)*clamp(relative/26,.4,1.7)*(1-s.resistance/190);player.health=Math.max(0,player.health-dmg);player.speed*=same?.9:.68;player.lastImpact=.5;audio?.impact(clamp(dmg/28,.2,1));}}
  }
}

export class OpenWorldCamera{
  constructor(camera){this.camera=camera;this.pos=new THREE.Vector3();this.look=new THREE.Vector3();this.fov=66;this.mode=0;}
  cycle(){this.mode=(this.mode+1)%3;}
  update(dt,p,nitro){const kmh=Math.abs(p.speed)*3.6,n=clamp(kmh/400,0,1),f=new THREE.Vector3(Math.sin(p.heading),0,Math.cos(p.heading)),r=new THREE.Vector3(f.z,0,-f.x);let target,look;if(this.mode===2){target=p.position.clone().add(new THREE.Vector3(0,1.2,0)).addScaledVector(f,.35);look=p.position.clone().add(new THREE.Vector3(0,.8,0)).addScaledVector(f,30);}else if(this.mode===1){target=p.position.clone().addScaledVector(f,-8.5).add(new THREE.Vector3(0,4.2,0));look=p.position.clone().add(new THREE.Vector3(0,.7,0)).addScaledVector(f,11);}else{target=p.position.clone().addScaledVector(f,-12-n*4.5).add(new THREE.Vector3(0,5.2+n*1.4,0)).addScaledVector(r,-p.steer*.55);look=p.position.clone().add(new THREE.Vector3(0,.75,0)).addScaledVector(f,10+n*12);}this.pos.lerp(target,1-Math.exp(-7*dt));this.look.lerp(look,1-Math.exp(-8*dt));this.camera.position.copy(this.pos);this.camera.lookAt(this.look);const tf=66+n*15+(nitro.mode===3?6:nitro.mode?2:0);this.fov=expSmoothing(this.fov,tf,4.5,dt);this.camera.fov=this.fov;this.camera.updateProjectionMatrix();}
}

export class ActivityDirector{
  constructor(blueprint){this.blueprint=blueprint;this.active=null;this.completed=new Set();this.time=0;this.target=null;this.message='';}
  nearest(position){let best=null,d=Infinity;for(const a of this.blueprint.activities){if(this.completed.has(a.id))continue;const q=position.distanceTo(a.position);if(q<d){d=q;best=a;}}return best?{activity:best,distance:d}:null;}
  start(activity,player){this.active=activity;this.time=0;const candidates=this.blueprint.activities.filter(a=>a.id!==activity.id),far=candidates.sort((a,b)=>b.position.distanceTo(activity.position)-a.position.distanceTo(activity.position));this.target=(far[Math.floor(Math.random()*Math.min(4,far.length))]||far[0])?.position.clone()||new THREE.Vector3();this.limit=activity.type==='delivery'?150:activity.type==='pursuit'?100:activity.type==='battle'?120:95;this.message=`${activity.name}: llega al objetivo`;player.score+=250;}
  update(dt,player){if(!this.active)return null;this.time+=dt;const d=player.position.distanceTo(this.target);if(d<45){const reward=Math.max(500,Math.round(this.active.reward*(1-this.time/this.limit*.45)));player.score+=reward;this.completed.add(this.active.id);const done={success:true,reward,name:this.active.name};this.active=null;return done;}if(this.time>this.limit){const done={success:false,reward:0,name:this.active.name};this.active=null;return done;}return null;}
}

export {DISTRICTS,districtAt};

export class OpenWorldPursuit{
  constructor(renderer,blueprint,vehicles){this.renderer=renderer;this.blueprint=blueprint;this.vehicles=vehicles;this.heat=0;this.units=[];for(let i=0;i<6;i++){const mesh=renderer.makeCar(vehicles[(i+4)%vehicles.length],i%2?0x15294f:0xe8e8e8,0);mesh.visible=false;renderer.dynamicRoot.add(mesh);this.units.push({mesh,position:new THREE.Vector3(),heading:0,speed:0,active:false,cool:0});}}
  aggression(a){this.heat=clamp(this.heat+a,0,1);}
  spawn(u,player,i){const f=new THREE.Vector3(Math.sin(player.heading),0,Math.cos(player.heading));u.position.copy(player.position).addScaledVector(f,-180-i*70).add(new THREE.Vector3((i%2?1:-1)*30,0,0));const road=this.blueprint.nearestRoad(u.position.x,u.position.z);if(road){u.position.copy(road.point);u.heading=Math.atan2(road.tangent.x,road.tangent.z);}else u.heading=player.heading;u.position.y+=.055;u.speed=Math.max(24,Math.abs(player.speed)*.82);u.active=true;u.mesh.visible=true;u.cool=1.2;}
  update(dt,player){const kmh=Math.abs(player.speed)*3.6;this.heat=clamp(this.heat+(kmh>210?(kmh-210)/500*.035*dt:-.018*dt),0,1);const wanted=Math.min(6,Math.floor(this.heat*6.4));for(let i=0;i<this.units.length;i++){const u=this.units[i];if(i<wanted&&!u.active)this.spawn(u,player,i);if(i>=wanted&&u.active&&this.heat<.12){u.active=false;u.mesh.visible=false;continue;}if(!u.active)continue;u.cool=Math.max(0,u.cool-dt);const dx=player.position.x-u.position.x,dz=player.position.z-u.position.z,target=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(target-u.heading),Math.cos(target-u.heading));u.heading+=clamp(delta,-1.1*dt,1.1*dt);const desired=Math.max(28,Math.abs(player.speed)*(1.02+.18*this.heat));u.speed=lerp(u.speed,desired,1-Math.exp(-.8*dt));u.position.x+=Math.sin(u.heading)*u.speed*dt;u.position.z+=Math.cos(u.heading)*u.speed*dt;const road=this.blueprint.nearestRoad(u.position.x,u.position.z);if(road&&road.distance<road.width*1.8){u.position.y=expSmoothing(u.position.y,road.point.y+.055,14,dt);}else u.position.y=expSmoothing(u.position.y,terrainHeight(u.position.x,u.position.z)+.055,14,dt);u.mesh.position.copy(u.position);u.mesh.rotation.y=u.heading;const dist=u.position.distanceTo(player.position);if(dist<3.1&&u.cool<=0){player.health=Math.max(0,player.health-(5+this.heat*10));player.speed*=.82;player.lastImpact=.6;u.cool=1;this.heat=clamp(this.heat+.04,0,1);}}
  }
}
