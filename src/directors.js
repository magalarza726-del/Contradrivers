import * as THREE from 'three';
import {clamp,lerp,wrap} from './core.js';

export class LevelBeatDirector{
  constructor(rt){this.rt=rt;this.track=rt.track;this.intensity=.45;this.label='FLOW';this.lastSource=-1;this.profile=this.track.aaa_profile||({inversion_circuit:{aggression:.52},rockfall_pursuit:{aggression:.84},eclipse_bay_interchange:{aggression:.74}}[this.track.id]||{});}
  update(playerIndex){const src=this.rt.source[playerIndex]??0,cls=this.rt.classAtSource(src),t=this.profile;let i=.42,label='FLOW';if(/highway|interstate|ring/i.test(cls)){i=.68;label='HIGH SPEED';}if(/hill|mountain/i.test(cls)){i=.58;label='TECHNICAL';}if((this.track.tunnel_segments||[]).includes(src)){i=.76;label='TUNNEL PRESSURE';}if((this.track.ramps||[]).some(r=>Math.abs((r.position?.[0]||0)-this.rt.points[playerIndex].x)<20&&Math.abs((r.position?.[2]||0)-this.rt.points[playerIndex].z)<20)){i=.72;label='STUNT';}i=clamp(i+(t.aggression||.5)*.18,0,1);this.intensity=lerp(this.intensity,i,.08);this.label=label;return this.intensity;}
}

function placeVehicleOnRoad(mesh,pose,reverse=false,ride=.065){
  mesh.position.copy(pose.position);mesh.position.y+=ride;mesh.rotation.y=pose.heading+(reverse?Math.PI:0);mesh.rotation.x=(reverse?1:-1)*(pose.pitch||0);
}

export class AIDriver{
  constructor(mesh,rt,vehicle,index=0,difficulty=.65){
    this.mesh=mesh;this.rt=rt;this.vehicle=vehicle;this.index=index;this.difficulty=difficulty;this.aggression=.35+difficulty*.55;
    const top=Math.max(18,Math.min(55,(+vehicle.top_speed||220)/3.6*(.68+difficulty*.16)));
    this.speed=top*.72;this.lane=(index%2?-.28:.28);this.progress=index;this.health=100;this.wobble=Math.random()*10;this.takenDown=0;this._lap=0;this.pose=rt.pose(index,this.lane);placeVehicleOnRoad(this.mesh,this.pose);
  }
  update(dt,playerIndex){
    if(this.takenDown>0){this.takenDown-=dt;this.speed=lerp(this.speed,12,1-Math.exp(-2*dt));return;}
    const vehicleTop=Math.max(18,Math.min(55,(+this.vehicle.top_speed||220)/3.6*(.68+this.difficulty*.16)));
    const playerGap=wrap(playerIndex-this.progress,this.rt.points.length),rubber=playerGap>this.rt.points.length*.2?1.06:playerGap<this.rt.points.length*.04?.97:1;
    const target=vehicleTop*rubber;this.speed=lerp(this.speed,target,1-Math.exp(-.58*dt));
    const prev=this.progress;this.progress=this.rt.advance(this.progress,this.rt.worldDistance(this.speed*dt));
    if(prev>this.rt.points.length*.82&&this.progress<this.rt.points.length*.18)this._lap++;
    this.lane=clamp(this.lane+Math.sin(this.progress*.03+this.wobble)*dt*.035,-.62,.62);
    this.pose=this.rt.pose(this.progress,this.lane);placeVehicleOnRoad(this.mesh,this.pose);
  }
  hit(power){this.health-=power*28;this.speed*=1-clamp(power*.16,.06,.42);if(this.health<=0){this.takenDown=2.2;this.health=100;return true;}return false;}
}

export class PursuitDirector{
  constructor(world,rt,vehicles,config){this.world=world;this.rt=rt;this.vehicles=vehicles;this.config=config;this.heat=0;this.police=[];this.roadblock=null;this.cooldown=0;for(let i=0;i<4;i++){const mesh=world.makeCar(vehicles[(i+4)%vehicles.length],i%2?'#0b1d45':'#f1f1f1',0);mesh.visible=false;world.dynamicRoot.add(mesh);this.police.push({mesh,index:0,lane:0,speed:0,active:false});}}
  reset(){this.heat=0;this.cooldown=0;for(const p of this.police){p.active=false;p.mesh.visible=false;}if(this.roadblock){this.world.dynamicRoot.remove(this.roadblock);this.roadblock=null;}}
  aggression(amount){this.heat=clamp(this.heat+amount*this.config.heat_aggression_gain,0,1);}
  update(dt,player){
    const kmh=Math.abs(player.speed)*3.6;this.heat=clamp(this.heat+(kmh>180?(kmh-180)/300*this.config.heat_speed_gain*dt:-this.config.heat_decay*dt),0,1);this.cooldown=Math.max(0,this.cooldown-dt);
    const wanted=Math.floor(this.heat*4.2);
    for(let i=0;i<this.police.length;i++){
      const p=this.police[i];
      if(i<wanted&&!p.active){p.active=true;p.mesh.visible=true;p.index=wrap(player.nearest-18-i*8,this.rt.points.length);p.speed=Math.max(20,Math.abs(player.speed)*.88);}
      if(i>=wanted&&p.active&&this.heat<.22){p.active=false;p.mesh.visible=false;}
      if(!p.active)continue;
      const gap=wrap(player.nearest-p.index,this.rt.points.length),push=gap<20?1.06:gap>60?1.15:1;
      const target=clamp(Math.abs(player.speed)*push,20,58);p.speed=lerp(p.speed,target,1-Math.exp(-.72*dt));
      p.index=this.rt.advance(p.index,this.rt.worldDistance(p.speed*dt));
      const pose=this.rt.pose(p.index,i%2?-.35:.35);placeVehicleOnRoad(p.mesh,pose);
      if(p.mesh.position.distanceToSquared(player.position)<9.2&&player.lastImpact<=0){const rel=Math.abs(player.speed-p.speed),damage=(5+rel*.18)*(1-player.currentStats().resistance/190);player.impact(Math.max(1.4,damage),.08+.08*this.heat);player.lastImpact=.28;this.heat=clamp(this.heat+.035,0,1);}
    }
    if(this.heat>this.config.roadblock_heat&&this.cooldown<=0&&!this.roadblock){this.spawnRoadblock(player.nearest+42);this.cooldown=16;}
    if(this.roadblock){
      this.roadblock.userData.life-=dt;const rbIndex=this.roadblock.userData.index,gap=Math.min(wrap(rbIndex-player.nearest,this.rt.points.length),wrap(player.nearest-rbIndex,this.rt.points.length));
      if(gap<4&&this.roadblock.position.distanceToSquared(player.position)<32&&player.lastImpact<=0){player.impact(12+18*this.heat,.28);player.lastImpact=.45;this.heat=clamp(this.heat+.08,0,1);this.world.dynamicRoot.remove(this.roadblock);this.roadblock=null;}
      if(this.roadblock&&this.roadblock.userData.life<=0){this.world.dynamicRoot.remove(this.roadblock);this.roadblock=null;}
    }
  }
  spawnRoadblock(index){const pose=this.rt.pose(index),g=new THREE.Group();for(let s=-1;s<=1;s++){const b=new THREE.Mesh(new THREE.BoxGeometry(2.6,.8,1.2),new THREE.MeshStandardMaterial({color:s===0?'#e5e5e5':'#192f60',roughness:.65,metalness:.2}));b.position.set(s*2.7,.45,0);g.add(b);}g.position.copy(pose.position);g.position.y+=.04;g.rotation.y=pose.heading;g.rotation.x=-pose.pitch;g.userData.life=13;g.userData.index=wrap(index,this.rt.points.length);this.world.dynamicRoot.add(g);this.roadblock=g;}
}

export class RhythmDirector{
  constructor(nitro,audio){this.nitro=nitro;this.audio=audio;this.sequence=[];this.cursor=0;this.timer=0;this.bpm=126;this.window=.17;this.judge='';this.judgeTimer=0;this.reset();}
  reset(){this.sequence=Array.from({length:64},(_,i)=>({lane:(i*7+i%3)%4,beat:i*.5+(i%7===0?.25:0),hit:false}));this.cursor=0;this.timer=0;this.judge='';}
  update(dt,input){this.timer+=dt*(this.bpm/60);this.judgeTimer=Math.max(0,this.judgeTimer-dt);if(this.judgeTimer<=0)this.judge='';for(let lane=0;lane<4;lane++){if(!input.pressedAction('rhythm'+lane))continue;let best=null,bestD=999;for(let i=Math.max(0,this.cursor-2);i<Math.min(this.sequence.length,this.cursor+4);i++){const n=this.sequence[i];if(n.hit||n.lane!==lane)continue;const d=Math.abs(n.beat-this.timer);if(d<bestD){best=n;bestD=d;}}if(best&&bestD<this.window){best.hit=true;const perfect=bestD<.065;this.nitro.hitRhythm(perfect);this.audio?.rhythm(true);this.judge=perfect?'PERFECT':'GOOD';this.judgeTimer=.5;}else{this.nitro.missRhythm();this.audio?.rhythm(false);this.judge='MISS';this.judgeTimer=.4;}}while(this.cursor<this.sequence.length&&this.sequence[this.cursor].beat<this.timer-.2){if(!this.sequence[this.cursor].hit)this.nitro.missRhythm();this.cursor++;}if(this.cursor>=this.sequence.length){this.timer=0;this.cursor=0;for(const n of this.sequence)n.hit=false;}}
  upcoming(count=8){return this.sequence.slice(this.cursor,this.cursor+count).map(n=>({...n,delta:n.beat-this.timer}));}
}

export class RaceDirector{
  constructor(rt,laps=3){this.rt=rt;this.laps=laps;this.time=0;this.lap=1;this.finished=false;this.lastProgress=0;this.position=1;this.checkpoint=0;}
  reset(){this.time=0;this.lap=1;this.finished=false;this.lastProgress=0;this.position=1;}
  update(dt,playerIndex,bots=[]){if(this.finished)return;this.time+=dt;const p=this.rt.progress(playerIndex);if(this.lastProgress>.82&&p<.18){this.lap++;if(this.lap>this.laps){this.finished=true;this.lap=this.laps;}}this.lastProgress=p;const playerTotal=(this.lap-1)+p;this.position=1+bots.filter(b=>(b._lap||0)+(b.progress/this.rt.points.length)>playerTotal).length;}
}
