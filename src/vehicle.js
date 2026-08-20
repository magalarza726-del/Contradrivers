import * as THREE from 'three';
import {clamp,lerp,smoothstep,expSmoothing,rad} from './core.js';

export function interpolateVehicle(a,b,t){
  const f=k=>lerp(+a[k],+b[k],t), av=a.advanced||{},bv=b.advanced||{},ar=av.ram||{},br=bv.ram||{},at=av.time_control||{},bt=bv.time_control||{},an=av.nitro||{},bn=bv.nitro||{};const derive=v=>{const c=(+v.control||60)/100,g=+v.grip||.85,m=+v.mass||1400;return{steer_response:.55+.65*c,high_speed_steer:.28+.35*c,drift_grip:clamp(g*.78,.42,.88),yaw_damping:.72+.24*c,weight_transfer:clamp(1500/Math.max(550,m),.55,1.35),heroic_assist:.12+.48*c}};const ah=a.handling||derive(a),bh=b.handling||derive(b);
  const g=(x,y,k,d)=>lerp(+(x[k]??d),+(y[k]??d),t);
  return {top_speed:f('top_speed'),acceleration:f('acceleration'),robustness:f('robustness'),resistance:f('resistance'),control:f('control'),mass:f('mass'),grip:f('grip'),braking:f('braking'),push_force:f('push_force'),max_health:f('max_health'),
    steer_response:g(ah,bh,'steer_response',.8),high_speed_steer:g(ah,bh,'high_speed_steer',.5),drift_grip:g(ah,bh,'drift_grip',.65),yaw_damping:g(ah,bh,'yaw_damping',.85),weight_transfer:g(ah,bh,'weight_transfer',1),heroic_assist:g(ah,bh,'heroic_assist',.35),
    ram_max_time:g(ar,br,'max_time',5),ram_acceleration_multiplier:g(ar,br,'acceleration_multiplier',1.25),ram_top_speed_multiplier:g(ar,br,'top_speed_multiplier',1.12),ram_damage_multiplier:g(ar,br,'damage_multiplier',1.8),time_control_max:g(at,bt,'max_time',3),time_control_control_multiplier:g(at,bt,'control_multiplier',1.5),nitro_capacity:g(an,bn,'capacity',100),
    nitro_base_speed:g(an.base||{},bn.base||{},'top_speed_multiplier',1.07),nitro_base_accel:g(an.base||{},bn.base||{},'acceleration_multiplier',1.14),nitro_remix_speed:g(an.remix||{},bn.remix||{},'top_speed_multiplier',1.18),nitro_remix_accel:g(an.remix||{},bn.remix||{},'acceleration_multiplier',1.3),nitro_turbo_speed:g(an.turbo||{},bn.turbo||{},'top_speed_multiplier',1.34),nitro_turbo_accel:g(an.turbo||{},bn.turbo||{},'acceleration_multiplier',1.55)}
}

export class SwitchSystem{
  constructor(a,b,duration=1,cooldown=.3){this.a=a;this.b=b;this.duration=duration;this.cooldown=cooldown;this.value=0;this.start=0;this.target=0;this.elapsed=0;this.cool=0;this.active=false}
  request(){if(this.active||this.cool>0)return false;this.start=this.value;this.target=this.value<.5?1:0;this.elapsed=0;this.active=true;return true}
  update(dt){this.cool=Math.max(0,this.cool-dt);if(!this.active)return;this.elapsed+=dt;const u=clamp(this.elapsed/Math.max(.05,this.duration),0,1),s=smoothstep(u);this.value=lerp(this.start,this.target,s);if(u>=1){this.value=this.target;this.active=false;this.cool=this.cooldown}}
  stats(){return interpolateVehicle(this.a,this.b,this.value)}
}

export class NitroSystem{
  constructor(){this.n1=.35;this.n2=0;this.n3=0;this.mode=0;this.remixTimer=0;this.turboTimer=0;this.combo=0;this.comboTimer=0}
  add(amount,channel=1){if(channel===3){this.n3=clamp(this.n3+amount,0,1);return}if(channel===2){this.n2=clamp(this.n2+amount,0,1);return}const room=1-this.n1,d=Math.min(room,amount);this.n1+=d;this.n2=clamp(this.n2+(amount-d)*.75,0,1)}
  reward(type,magnitude=1){const table={nearMiss:.035,drift:.012,air:.018,takedown:.16,trafficCheck:.055,shortcut:.07,slipstream:.008,perfect:.04};this.add((table[type]||.01)*magnitude,1)}
  base(){if(this.n1<=.04)return false;this.mode=1;return true}
  remix(){if(this.n2<=.12||this.mode===3)return false;this.mode=2;this.remixTimer=5+this.n2*10;this.n2=0;return true}
  hitRhythm(perfect=false){if(this.mode===2)this.add(perfect?.085:.05,3);else this.add(perfect?.04:.025,1);this.combo++;this.comboTimer=1.4}
  missRhythm(){this.combo=0;this.comboTimer=0}
  update(dt){if(this.comboTimer>0){this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0}if(this.mode===1){this.n1=Math.max(0,this.n1-dt*.115);if(this.n1<=0)this.mode=0}else if(this.mode===2){this.remixTimer-=dt;if(this.remixTimer<=0){if(this.n3>.02){this.mode=3;this.turboTimer=1.5+this.n3*6.5;this.n3=0}else this.mode=0}}else if(this.mode===3){this.turboTimer-=dt;if(this.turboTimer<=0)this.mode=0}}
  multipliers(stats){return this.mode===1?[stats.nitro_base_speed,stats.nitro_base_accel]:this.mode===2?[stats.nitro_remix_speed,stats.nitro_remix_accel]:this.mode===3?[stats.nitro_turbo_speed,stats.nitro_turbo_accel]:[1,1]}
}

export class VehicleController{
  constructor(mesh,rt,switchSystem,config){this.mesh=mesh;this.rt=rt;this.switch=switchSystem;this.config=config;this.position=new THREE.Vector3();this.heading=0;this.speed=0;this.lateral=0;this.yawRate=0;this.steer=0;this.throttle=0;this.brake=0;this.handbrake=false;this.nearest=0;this.health=100;this.ramCharge=0;this.ramArmed=0;this.timeReserve=1;this.timeActive=false;this.air=0;this.driftScore=0;this.wallTime=0;this.lastImpact=0;this.recover=0;this.setStart()}
  setStart(offset=0){const p=this.rt.pose(offset);this.position.copy(p.position);this.position.y+=.48;this.heading=p.heading;this.speed=0;this.lateral=0;this.yawRate=0;this.nearest=p.index;this.syncMesh()}
  currentStats(){return this.switch.stats()}
  updateInput(input,dt,nitro){this.steer=expSmoothing(this.steer,input.axes.steer,8.5,dt);this.throttle=input.axes.throttle;this.brake=input.axes.brake;this.handbrake=input.down('handbrake');if(input.pressedAction('switch'))this.switch.request();if(input.pressedAction('nitro'))nitro.base();if(input.pressedAction('remix'))nitro.remix();this.timeActive=input.down('time')&&this.timeReserve>.005;const ramDown=input.down('ram');const stats=this.currentStats();if(ramDown)this.ramCharge=clamp(this.ramCharge+dt/Math.max(.1,stats.ram_max_time),0,1);if(input.releasedAction('ram')&&this.ramCharge>.03){this.ramArmed=.2+.8*this.ramCharge;this.speed*=1+.035*this.ramCharge;this.ramCharge=0}if(this.ramCharge>=1){this.ramArmed=1;this.ramCharge=0}}
  fixedUpdate(dt,nitro){const s=this.currentStats(),[nSpeed,nAccel]=nitro.multipliers(s),kmh=Math.abs(this.speed)*3.6,maxKmh=Math.max(55,s.top_speed*nSpeed),maxSpeed=maxKmh/3.6,tc=this.timeActive?s.time_control_control_multiplier:1;
    if(this.timeActive)this.timeReserve=Math.max(0,this.timeReserve-dt/Math.max(.5,s.time_control_max));else this.timeReserve=Math.min(1,this.timeReserve+dt*.09);
    const ramAccel=this.ramCharge>0?lerp(1,s.ram_acceleration_multiplier,this.ramCharge):1,ramSpeed=this.ramCharge>0?lerp(1,s.ram_top_speed_multiplier,this.ramCharge):1,targetMax=maxSpeed*ramSpeed;
    const accel=(4.8+s.acceleration*.105)*nAccel*ramAccel*(1-Math.pow(clamp(Math.abs(this.speed)/Math.max(.1,targetMax),0,1),1.75));
    if(this.throttle>0)this.speed+=accel*this.throttle*dt;if(this.brake>0){const brake=(6+s.braking*.13)*this.brake;this.speed-=Math.sign(this.speed||1)*brake*dt;if(Math.abs(this.speed)<.35)this.speed=-this.brake*2.5}
    const drag=(.32+.0032*kmh+.000018*kmh*kmh);this.speed-=Math.sign(this.speed)*Math.min(Math.abs(this.speed),drag*dt);this.speed=clamp(this.speed,-11,targetMax*1.05);
    const speedNorm=clamp(Math.abs(this.speed)/Math.max(1,maxSpeed),0,1),steerAvail=lerp(1,s.high_speed_steer,Math.pow(speedNorm,1.4)),steerAngle=this.steer*rad(31)*steerAvail*tc;
    const baseGrip=s.grip*this.rt.gripAtSource(this.rt.source[this.nearest]??0),handGrip=this.handbrake?this.config.handbrake_grip:1,grip=baseGrip*handGrip;
    const desiredYaw=Math.tan(steerAngle)*this.speed/Math.max(2.2,3.3+s.mass/5000)*(.8+s.control/125);this.yawRate=expSmoothing(this.yawRate,desiredYaw,(2.4+s.steer_response*4.8)*grip,dt);
    if(this.handbrake&&kmh>this.config.drift_min_kmh)this.yawRate*=1.18+Math.abs(this.steer)*.8;
    const slipTarget=-this.yawRate*this.speed*.24*(1-grip*.42);this.lateral=expSmoothing(this.lateral,slipTarget,(2.2+grip*5.5)*(this.handbrake?.45:1),dt);
    const assist=s.heroic_assist*clamp(kmh/100,0,1);if(Math.abs(this.steer)<.15)this.yawRate*=1-dt*(1.5+assist*3.5);
    this.heading+=this.yawRate*dt;const fwd=new THREE.Vector3(Math.sin(this.heading),0,Math.cos(this.heading)),right=new THREE.Vector3(fwd.z,0,-fwd.x);this.position.addScaledVector(fwd,this.speed*dt).addScaledVector(right,this.lateral*dt);
    const near=this.rt.nearest(this.position,this.nearest,42);this.nearest=near.index;const shortcut=this.rt.nearestShortcut?.(this.position);let driveDistance=near.distance,roadHalf=near.pose.width*.55,roadTarget=near.pose.position;if(shortcut&&shortcut.distance<driveDistance){driveDistance=shortcut.distance;roadHalf=shortcut.width*.55;roadTarget=shortcut.position}if(driveDistance>roadHalf){const off=clamp((driveDistance-roadHalf)/10,0,1);this.speed*=1-dt*this.config.offroad_drag*(.6+off);this.lateral*=1-dt*.8;const toRoad=roadTarget.clone().sub(this.position);toRoad.y=0;if(toRoad.lengthSq()>.001)this.position.addScaledVector(toRoad.normalize(),dt*off*2.2)}
    const roadY=roadTarget.y+.46;this.position.y=expSmoothing(this.position.y,roadY,14,dt);this.ramArmed=Math.max(0,this.ramArmed-dt*.18);this.lastImpact=Math.max(0,this.lastImpact-dt);this.syncMesh()}
  syncMesh(){this.mesh.position.copy(this.position);this.mesh.rotation.y=this.heading;this.mesh.rotation.z=clamp(-this.lateral*.012,-.07,.07);this.mesh.rotation.x=clamp(-this.brake*.025+this.throttle*.012,-.03,.03)}
  impact(damage,impulse=0){this.health=Math.max(0,this.health-damage);this.speed*=clamp(1-impulse,0.18,1);this.lastImpact=1}
}

export function resolveTrafficInteractions(player,traffic,nitro,audio){const stats=player.currentStats();for(const c of traffic.queryNear(player.position,4.2)){const d=c.mesh.position.distanceTo(player.position);if(d>3.1)continue;const playerForward=new THREE.Vector3(Math.sin(player.heading),0,Math.cos(player.heading)),to=c.mesh.position.clone().sub(player.position).setY(0).normalize(),front=playerForward.dot(to),relative=Math.abs(player.speed-c.speed*c.direction),same=c.direction>0;if(same&&front>.15&&stats.mass>=c.mass*.48){const force=clamp((stats.mass/c.mass)*relative/24,.1,1);c.checked=.8;c.speed+=force*20;c.lane+=Math.sign(to.x||1)*force*.18;player.speed*=1-.045*(1-force);nitro.reward('trafficCheck',.5+force);audio?.impact(.2+force*.35)}else{const dmg=(same?7:22)*(1+c.mass/2200)*clamp(relative/28,.4,1.8)*(1.15-stats.resistance/180);player.impact(dmg,same?.12:.32);audio?.impact(clamp(dmg/35,.2,1));c.checked=.45}}
}
