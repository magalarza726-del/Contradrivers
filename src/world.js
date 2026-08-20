import * as THREE from 'three';
import {clamp,lerp,wrap,TAU} from './core.js';

function cardinal(p0,p1,p2,p3,t,tension=.58){
  const s=clamp(1-tension,0,1)*.5;
  const m1={x:(p2.x-p0.x)*s,y:(p2.y-p0.y)*s,z:(p2.z-p0.z)*s};
  const m2={x:(p3.x-p1.x)*s,y:(p3.y-p1.y)*s,z:(p3.z-p1.z)*s};
  const t2=t*t,t3=t2*t,h00=2*t3-3*t2+1,h10=t3-2*t2+t,h01=-2*t3+3*t2,h11=t3-t2;
  return new THREE.Vector3(
    h00*p1.x+h10*m1.x+h01*p2.x+h11*m2.x,
    h00*p1.y+h10*m1.y+h01*p2.y+h11*m2.y,
    h00*p1.z+h10*m1.z+h01*p2.z+h11*m2.z
  );
}

function sampleClosed(points,samples=6,tension=.58){
  const c=points.map(p=>new THREE.Vector3(+p[0],+p[1],+p[2])),out=[],source=[];
  for(let i=0;i<c.length;i++){
    for(let j=0;j<samples;j++){
      out.push(cardinal(c[wrap(i-1,c.length)],c[i],c[(i+1)%c.length],c[(i+2)%c.length],j/samples,tension));
      source.push(i);
    }
  }
  return{points:out,source,samples};
}

function sampleOpen(points,samples=5,tension=.64){
  const c=points.map(p=>new THREE.Vector3(+p[0],+p[1],+p[2]));
  if(c.length<2)return[];
  const out=[];
  for(let i=0;i<c.length-1;i++){
    const p0=i?c[i-1]:c[i],p1=c[i],p2=c[i+1],p3=i+2<c.length?c[i+2]:c[i+1];
    for(let j=0;j<samples;j++)out.push(cardinal(p0,p1,p2,p3,j/samples,tension));
  }
  out.push(c.at(-1).clone());
  return out;
}

export class TrackRuntime{
  constructor(track,motionScale=.28){
    this.track=track;
    this.motionScale=motionScale;
    const sm=track.route_smoothing||{};
    const s=sampleClosed(track.waypoints,Math.max(5,sm.samples_per_segment||6),sm.tension??.58);
    this.points=s.points;
    this.source=s.source;
    this.segmentLengths=[];
    this.lengths=[0];
    for(let i=0;i<this.points.length;i++){
      const len=this.points[(i+1)%this.points.length].distanceTo(this.points[i]);
      this.segmentLengths.push(Math.max(.05,len));
      this.lengths.push(this.lengths.at(-1)+len);
    }
    this.totalLength=this.lengths.at(-1);
    this.shortcutRuns=(track.alternate_roads||[]).map(r=>({meta:r,points:sampleOpen(r.points,r.samples_per_segment||5,r.tension??.64)}));
    this._lastNearest=0;
  }

  widthAtSource(source){
    let w=+this.track.width||14;
    for(const p of this.track.road_profiles||[]){
      const f=+p.from,t=+p.to;
      if((f<=t&&source>=f&&source<=t)||(f>t&&(source>=f||source<=t)))w=+p.width||w;
    }
    return w;
  }

  gripAtSource(source){
    let g=1;
    for(const s of this.track.surfaces||[]){
      const f=+s.from,t=+s.to;
      if((f<=t&&source>=f&&source<=t)||(f>t&&(source>=f||source<=t)))g=+s.grip||g;
    }
    return g;
  }

  classAtSource(source){
    let c='road';
    for(const p of this.track.road_profiles||[]){
      const f=+p.from,t=+p.to;
      if((f<=t&&source>=f&&source<=t)||(f>t&&(source>=f||source<=t)))c=p.class||c;
    }
    return c;
  }

  worldDistance(metres){return metres*this.motionScale;}

  metresPerSecondToWorld(speedMps){return speedMps*this.motionScale;}

  segmentLengthAt(index){
    return this.segmentLengths[wrap(Math.floor(index),this.segmentLengths.length)]||1;
  }

  advance(index,worldDistance){
    const n=this.points.length;
    const localLen=Math.max(.05,this.segmentLengthAt(index));
    return wrap(index+worldDistance/localLen,n);
  }

  pose(index,lane=0){
    const n=this.points.length;
    const x=wrap(index,n);
    const i0=Math.floor(x),frac=x-i0,i1=(i0+1)%n;
    const p0=this.points[i0],p1=this.points[i1];
    const p=p0.clone().lerp(p1,frac);
    let tan=p1.clone().sub(p0);
    if(tan.lengthSq()<1e-8)tan=this.points[(i1+1)%n].clone().sub(this.points[wrap(i0-1,n)]);
    tan.normalize();
    const planar=Math.max(1e-6,Math.hypot(tan.x,tan.z));
    const right=new THREE.Vector3(tan.z/planar,0,-tan.x/planar);
    const source=this.source[i0]??0,w=this.widthAtSource(source);
    return{
      position:p.addScaledVector(right,lane*w*.42),
      tangent:tan,
      right,
      width:w,
      heading:Math.atan2(tan.x,tan.z),
      pitch:Math.atan2(tan.y,planar),
      source,
      index:x
    };
  }

  nearest(position,hint=this._lastNearest,window=34){
    let best=wrap(Math.round(hint),this.points.length),bestD=Infinity,n=this.points.length;
    for(let o=-window;o<=window;o++){
      const i=wrap(best+o,n),p=this.points[i],dx=p.x-position.x,dz=p.z-position.z,d=dx*dx+dz*dz;
      if(d<bestD){bestD=d;best=i;}
    }
    this._lastNearest=best;
    return{index:best,distance:Math.sqrt(bestD),pose:this.pose(best)};
  }

  progress(index){return wrap(index,this.points.length)/this.points.length;}

  nearestShortcut(position){
    let best=null,bestD=Infinity;
    for(const run of this.shortcutRuns){
      const w=+run.meta.width||10;
      for(let i=0;i<run.points.length;i++){
        const p=run.points[i],dx=p.x-position.x,dz=p.z-position.z,d=dx*dx+dz*dz;
        if(d>=bestD)continue;
        const prev=run.points[Math.max(0,i-1)],next=run.points[Math.min(run.points.length-1,i+1)];
        const tan=next.clone().sub(prev).normalize(),planar=Math.max(1e-6,Math.hypot(tan.x,tan.z));
        bestD=d;
        best={
          position:p,
          width:w,
          grip:+run.meta.grip||.9,
          distance:Math.sqrt(d),
          tangent:tan,
          heading:Math.atan2(tan.x,tan.z),
          pitch:Math.atan2(tan.y,planar)
        };
      }
    }
    return best;
  }

  isClearOfRoad(position,extra=3){
    for(let i=0;i<this.points.length;i+=2){
      const p=this.points[i],dx=p.x-position.x,dz=p.z-position.z;
      const clearance=this.widthAtSource(this.source[i])*0.5+extra;
      if(dx*dx+dz*dz<clearance*clearance)return false;
    }
    for(const run of this.shortcutRuns){
      const clearance=(+run.meta.width||10)*0.5+extra;
      const c2=clearance*clearance;
      for(let i=0;i<run.points.length;i+=2){
        const p=run.points[i],dx=p.x-position.x,dz=p.z-position.z;
        if(dx*dx+dz*dz<c2)return false;
      }
    }
    return true;
  }
}

export class WorldRenderer{
  constructor(canvas,aaa){
    this.aaa=aaa;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,aaa.performance.pixel_ratio_cap||1.75));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.08;
    this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color('#081019');
    this.scene.fog=new THREE.Fog('#081019',90,420);
    this.camera=new THREE.PerspectiveCamera(64,innerWidth/innerHeight,.08,1200);
    this.root=new THREE.Group();
    this.roadRoot=new THREE.Group();
    this.sceneryRoot=new THREE.Group();
    this.dynamicRoot=new THREE.Group();
    this.fxRoot=new THREE.Group();
    this.scene.add(this.root);
    this.root.add(this.roadRoot,this.sceneryRoot,this.dynamicRoot,this.fxRoot);
    this.scene.add(new THREE.HemisphereLight('#b7dcff','#1a2115',2.05));
    const sun=new THREE.DirectionalLight('#ffe4b4',3.1);sun.position.set(-110,155,-80);this.scene.add(sun);
    this.trackRuntime=null;this.playerMesh=null;
    addEventListener('resize',()=>this.resize());
    this.resize();
  }

  resize(){
    this.renderer.setSize(innerWidth,innerHeight,false);
    this.camera.aspect=innerWidth/innerHeight;
    this.camera.updateProjectionMatrix();
  }

  disposeGroup(g){
    while(g.children.length){
      const o=g.children.pop();
      o.traverse?.(n=>{n.geometry?.dispose?.();if(n.material)(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>m.dispose?.())});
    }
  }

  clear(){
    [this.roadRoot,this.sceneryRoot,this.dynamicRoot,this.fxRoot].forEach(g=>this.disposeGroup(g));
    this.playerMesh=null;
  }

  makeCar(v,color=null,detail=1){
    const g=new THREE.Group();
    const bodyMat=new THREE.MeshStandardMaterial({color:color||v.color,roughness:.33,metalness:.52});
    const glass=new THREE.MeshStandardMaterial({color:'#0a2030',roughness:.15,metalness:.45});
    const rubber=new THREE.MeshStandardMaterial({color:'#050709',roughness:.86});
    const sx=v.visual_scale?.[0]||1.6,sy=Math.max(.35,v.visual_scale?.[1]||.6),sz=v.visual_scale?.[2]||3.2;
    const body=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),bodyMat);body.name='body';body.scale.set(sx,sy,sz);body.position.y=.45;g.add(body);
    const nose=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),bodyMat);nose.scale.set(sx*.86,sy*.38,sz*.34);nose.position.set(0,.67,sz*.27);g.add(nose);
    const cabin=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),glass);cabin.name='cabin';cabin.scale.set(sx*.72,sy*.75,sz*.38);cabin.position.set(0,.86,-sz*.08);g.add(cabin);
    const wheelGeo=new THREE.CylinderGeometry(.31,.31,.25,detail>0?14:8);
    for(const x of [-1,1])for(const z of [-1,1]){
      const w=new THREE.Mesh(wheelGeo,rubber);w.rotation.z=Math.PI/2;w.position.set(x*sx*.57,.28,z*sz*.31);g.add(w);
    }
    const tail=new THREE.Mesh(new THREE.BoxGeometry(sx*.72,.06,.08),new THREE.MeshBasicMaterial({color:'#ff372d'}));tail.position.set(0,.55,-sz*.505);g.add(tail);
    g.userData.vehicle=v;
    return g;
  }

  morphCar(mesh,a,b,t){
    const body=mesh?.getObjectByName('body'),cab=mesh?.getObjectByName('cabin');if(!body||!cab)return;
    const sx=lerp(a.visual_scale[0],b.visual_scale[0],t),sy=Math.max(.35,lerp(a.visual_scale[1],b.visual_scale[1],t)),sz=lerp(a.visual_scale[2],b.visual_scale[2],t);
    body.scale.set(sx,sy,sz);cab.scale.set(sx*.72,sy*.75,sz*.38);body.material.color.copy(new THREE.Color(a.color).lerp(new THREE.Color(b.color),t));
  }

  showMenu(v){
    this.clear();this.trackRuntime=null;this.scene.background.set('#071019');this.scene.fog.color.set('#071019');this.scene.fog.near=80;this.scene.fog.far=320;
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(500,500),new THREE.MeshStandardMaterial({color:'#101a21',roughness:.92}));floor.rotation.x=-Math.PI/2;this.roadRoot.add(floor);
    this.addSkyline(new THREE.Vector3(0,0,0),'menu',120,null);
    this.playerMesh=this.makeCar(v);this.playerMesh.position.set(0,.065,0);this.dynamicRoot.add(this.playerMesh);
    this.camera.position.set(10,4.8,-14);this.camera.lookAt(0,.9,0);
  }

  showGarage(v){
    this.clear();this.trackRuntime=null;this.scene.background.set('#060b11');this.scene.fog.color.set('#060b11');this.scene.fog.near=60;this.scene.fog.far=190;
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(180,180),new THREE.MeshStandardMaterial({color:'#111a20',roughness:.55,metalness:.25}));floor.rotation.x=-Math.PI/2;this.roadRoot.add(floor);
    const platform=new THREE.Mesh(new THREE.CylinderGeometry(5.8,6,.45,64),new THREE.MeshStandardMaterial({color:'#15222b',roughness:.28,metalness:.72}));platform.position.y=.22;this.roadRoot.add(platform);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(5.25,.055,10,96),new THREE.MeshBasicMaterial({color:'#31c7ff'}));ring.rotation.x=Math.PI/2;ring.position.y=.47;this.roadRoot.add(ring);
    this.playerMesh=this.makeCar(v);this.playerMesh.position.y=.51;this.dynamicRoot.add(this.playerMesh);
    this.camera.position.set(-9.6,4.4,-10.4);this.camera.lookAt(0,1,0);
  }

  buildTrack(track){
    this.clear();
    const env=track.environment||{};
    const rt=new TrackRuntime(track,this.aaa.handling?.motion_scale??.28);
    this.trackRuntime=rt;
    this.scene.background.set(env.sky_color||'#7894a8');
    this.scene.fog.color.copy(this.scene.background);this.scene.fog.near=env.fog_near||95;this.scene.fog.far=env.fog_far||440;
    const pos=[],col=[],idx=[],n=rt.points.length;
    for(let i=0;i<n;i++){
      const pose=rt.pose(i),p=pose.position,r=pose.right,w=pose.width,source=pose.source;let c=new THREE.Color('#35383d');
      for(const s of track.surfaces||[]){const f=+s.from,t=+s.to;if((f<=t&&source>=f&&source<=t)||(f>t&&(source>=f||source<=t)))c.set(s.color||'#35383d');}
      pos.push(p.x+r.x*w/2,p.y+.04,p.z+r.z*w/2,p.x-r.x*w/2,p.y+.04,p.z-r.z*w/2);
      for(let k=0;k<2;k++)col.push(c.r,c.g,c.b);
    }
    for(let i=0;i<n;i++){const j=(i+1)%n,li=i*2,ri=li+1,lj=j*2,rj=lj+1;idx.push(li,ri,lj,ri,rj,lj);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));geo.setIndex(idx);geo.computeVertexNormals();
    this.roadRoot.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:.02,side:THREE.DoubleSide})));

    for(let i=0;i<n;i+=4){
      const p=rt.pose(i),next=rt.pose(i+3),len=p.position.distanceTo(next.position),center=new THREE.Vector3().addVectors(p.position,next.position).multiplyScalar(.5);
      const mark=new THREE.Mesh(new THREE.BoxGeometry(.12,.03,Math.max(.8,len*.58)),new THREE.MeshBasicMaterial({color:'#dce7e9'}));mark.position.copy(center);mark.position.y+=.09;mark.rotation.y=p.heading;mark.rotation.x=-p.pitch;this.roadRoot.add(mark);
      if(i%12===0)for(const side of [-1,1]){const ref=new THREE.Mesh(new THREE.BoxGeometry(.12,.16,.2),new THREE.MeshBasicMaterial({color:i%24===0?'#ffd457':'#d5f5ff'}));ref.position.copy(p.position).addScaledVector(p.right,side*p.width*.48);ref.position.y+=.14;this.roadRoot.add(ref);}
    }

    const ground=new THREE.Mesh(new THREE.PlaneGeometry(1500,1500),new THREE.MeshStandardMaterial({color:env.terrain_color||'#324638',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.12;this.roadRoot.add(ground);
    for(const run of rt.shortcutRuns)this.addRoadStrip(run.points,+run.meta.width||10,run.meta.color||'#44484c');
    for(const r of track.ramps||[])this.addRamp(r);
    const tunnels=new Set((track.tunnel_segments||[]).map(Number));for(let i=0;i<n;i+=3)if(tunnels.has(rt.source[i]))this.addTunnelFrame(rt.pose(i));
    for(const z of track.scenery_zones||[])this.addSceneryZone(z);
    this.addTrackFurniture(rt);
    return rt;
  }

  addRoadStrip(points,width,color){
    if(points.length<2)return;
    const pos=[],idx=[];
    for(let i=0;i<points.length;i++){
      const p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],t=next.clone().sub(prev).normalize(),r=new THREE.Vector3(t.z,0,-t.x);
      pos.push(p.x+r.x*width/2,p.y+.035,p.z+r.z*width/2,p.x-r.x*width/2,p.y+.035,p.z-r.z*width/2);
    }
    for(let i=0;i<points.length-1;i++){const a=i*2,b=a+1,c=a+2,d=a+3;idx.push(a,b,c,b,d,c);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
    this.roadRoot.add(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:.95,side:THREE.DoubleSide})));
  }

  addTunnelFrame(pose){
    const mat=new THREE.MeshStandardMaterial({color:'#26333b',roughness:.82,metalness:.08}),g=new THREE.Group();
    for(const x of [-1,1]){const col=new THREE.Mesh(new THREE.BoxGeometry(.42,4.8,.42),mat);col.position.set(x*pose.width*.48,2.4,0);g.add(col);}
    const top=new THREE.Mesh(new THREE.BoxGeometry(pose.width,.42,.42),mat);top.position.y=4.7;g.add(top);g.position.copy(pose.position);g.rotation.y=pose.heading;g.rotation.x=-pose.pitch;this.sceneryRoot.add(g);
  }

  addRamp(r){
    const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:r.type==='curved'?'#df8b35':r.type==='inclined'?'#8e5edb':'#d45a38',roughness:.72,metalness:.12}));
    const s=r.scale||[5,.7,8];m.scale.set(s[0],s[1],s[2]);m.position.set(...r.position);m.rotation.y=(r.rotation_y||0)*Math.PI/180;m.rotation.x=r.type==='inclined'?-.2:r.type==='curved'?-.11:-.08;this.roadRoot.add(m);
  }

  addSceneryZone(zone){
    const [x,y,z]=zone.center||[0,0,0],type=zone.type||'city',scale=zone.scale||1;
    if(['downtown','industrial','stadium','campus','port','interchange','suburb','waterfront'].includes(type)){
      this.addSkyline(new THREE.Vector3(x,y,z),type,32*scale,this.trackRuntime);
    }else if(type==='hills'){
      for(let i=0;i<18;i++){
        const a=i/18*TAU+.37,r=24+((i*31)%57),candidate=new THREE.Vector3(x+Math.cos(a)*r,y,z+Math.sin(a)*r);
        if(this.trackRuntime&&!this.trackRuntime.isClearOfRoad(candidate,8))continue;
        const hill=new THREE.Mesh(new THREE.ConeGeometry(7+((i*17)%11),10+((i*13)%17),8),new THREE.MeshStandardMaterial({color:'#425942',roughness:1}));hill.position.set(candidate.x,y+4,candidate.z);this.sceneryRoot.add(hill);
      }
    }
  }

  addSkyline(center,type='city',radius=45,rt=this.trackRuntime){
    const target=Math.min(34,this.aaa.performance.max_buildings||180);
    const geo=new THREE.BoxGeometry(1,1,1);
    const palette={downtown:'#35526a',industrial:'#46515a',stadium:'#53606a',campus:'#425665',port:'#42545c',interchange:'#3c4b57',suburb:'#4c5c62',waterfront:'#3e5665',menu:'#253b4b'};
    const mat=new THREE.MeshStandardMaterial({color:palette[type]||'#354a59',roughness:.84,metalness:.06});
    const mesh=new THREE.InstancedMesh(geo,mat,target),dummy=new THREE.Object3D();let placed=0;
    for(let attempt=0;attempt<target*8&&placed<target;attempt++){
      const a=(attempt*.754877666)%1*TAU+(attempt%3)*.11;
      const rr=radius*(.48+.68*((attempt*37)%101)/100);
      const high=type==='downtown'||type==='interchange';
      const h=(high?8:5)+((attempt*29)%17)*(high?1.25:.72);
      const w=2.8+((attempt*13)%7)*.55;
      const candidate=new THREE.Vector3(center.x+Math.cos(a)*rr,center.y,center.z+Math.sin(a)*rr);
      if(rt&&!rt.isClearOfRoad(candidate,w*.7+3.5))continue;
      dummy.position.set(candidate.x,center.y+h/2,candidate.z);dummy.scale.set(w,h,w*.72);dummy.rotation.y=a*.37;dummy.updateMatrix();mesh.setMatrixAt(placed++,dummy.matrix);
    }
    mesh.count=placed;mesh.instanceMatrix.needsUpdate=true;if(placed)this.sceneryRoot.add(mesh);
  }

  addTrackFurniture(rt){
    const lampMat=new THREE.MeshBasicMaterial({color:'#f3e6bf'}),postMat=new THREE.MeshStandardMaterial({color:'#2b3439',roughness:.8});
    for(let i=0;i<rt.points.length;i+=12){
      const p=rt.pose(i);
      for(const side of [-1,1]){
        const g=new THREE.Group(),post=new THREE.Mesh(new THREE.BoxGeometry(.11,3.2,.11),postMat),light=new THREE.Mesh(new THREE.SphereGeometry(.11,6,6),lampMat);
        post.position.y=1.6;light.position.y=3.18;g.add(post,light);g.position.copy(p.position).addScaledVector(p.right,side*(p.width*.62+1));this.sceneryRoot.add(g);
      }
    }
  }

  render(){this.renderer.render(this.scene,this.camera);}
}

export class TrafficSystem{
  constructor(world,rt,vehicles,config){this.world=world;this.rt=rt;this.vehicles=vehicles;this.config=config;this.cars=[];this.active=0;this._rng=1;this.reset();}
  rnd(){this._rng=(this._rng*1664525+1013904223)>>>0;return this._rng/4294967296;}

  reset(){
    for(const c of this.cars)this.world.dynamicRoot.remove(c.mesh);
    this.cars=[];
    const count=Math.min(this.config.pool||30,30);
    for(let i=0;i<count;i++){
      const v=this.vehicles[(i*3+1)%this.vehicles.length],mesh=this.world.makeCar(v,i%5===0?'#d7d7d7':i%5===1?'#285a86':i%5===2?'#8d3732':'#4e5c51',0);
      mesh.scale.multiplyScalar(.82);this.world.dynamicRoot.add(mesh);
      this.cars.push({mesh,index:Math.floor(this.rnd()*this.rt.points.length),lane:this.rnd()<.5?-.45:.45,speed:11+this.rnd()*13,pace:.75+this.rnd()*.32,direction:this.rnd()<.18?-1:1,alive:true,checked:0,mass:900+this.rnd()*1300});
    }
  }

  speedLimit(source){
    const cls=this.rt.classAtSource(source);
    if(/highway|interstate|ring/i.test(cls))return 31;
    if(/service|park|alley/i.test(cls))return 17;
    if(/hill|mountain/i.test(cls))return 21;
    return 24;
  }

  update(dt,playerIndex,levelIntensity=.5){
    const desired=Math.round(lerp(this.config.spawn_min||12,this.config.spawn_max||24,levelIntensity));this.active=desired;
    for(let i=0;i<this.cars.length;i++){
      const c=this.cars[i];c.mesh.visible=i<desired;if(!c.mesh.visible)continue;
      const source=this.rt.source[wrap(Math.floor(c.index),this.rt.points.length)]??0;
      const limit=this.speedLimit(source),target=limit*c.pace*(1+levelIntensity*.08)*(c.direction<0?.9:1);
      c.speed=lerp(c.speed,target,1-Math.exp(-.65*dt));
      c.index=this.rt.advance(c.index,c.direction*this.rt.worldDistance(c.speed*dt));
      const p=this.rt.pose(c.index,c.lane);c.mesh.position.copy(p.position);c.mesh.position.y+=.065;c.mesh.rotation.y=p.heading+(c.direction<0?Math.PI:0);c.mesh.rotation.x=(c.direction<0?1:-1)*p.pitch;
      if(c.checked>0){c.checked-=dt;c.lane=clamp(c.lane+(Math.sin(c.index*.7)*.14)*dt,-.7,.7);}
    }
  }

  queryNear(position,radius=4){
    const out=[];for(let i=0;i<this.active;i++){const c=this.cars[i];if(c.mesh.visible&&c.mesh.position.distanceToSquared(position)<radius*radius)out.push(c);}return out;
  }
}
