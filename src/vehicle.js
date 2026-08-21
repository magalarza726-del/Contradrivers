import {clamp,lerp,smoothstep} from './core.js';

export function interpolateVehicle(a,b,t){
  const f=k=>lerp(+a[k],+b[k],t);
  const av=a.advanced||{},bv=b.advanced||{},ar=av.ram||{},br=bv.ram||{},at=av.time_control||{},bt=bv.time_control||{},an=av.nitro||{},bn=bv.nitro||{};
  const derive=v=>{const c=(+v.control||60)/100,g=+v.grip||.85,m=+v.mass||1400;return{steer_response:.55+.65*c,high_speed_steer:.28+.35*c,drift_grip:clamp(g*.78,.42,.88),yaw_damping:.72+.24*c,weight_transfer:clamp(1500/Math.max(550,m),.55,1.35),heroic_assist:.12+.48*c}};
  const ah=a.handling||derive(a),bh=b.handling||derive(b);
  const g=(x,y,k,d)=>lerp(+(x[k]??d),+(y[k]??d),t);
  return{
    top_speed:f('top_speed'),acceleration:f('acceleration'),robustness:f('robustness'),resistance:f('resistance'),control:f('control'),mass:f('mass'),grip:f('grip'),braking:f('braking'),push_force:f('push_force'),max_health:f('max_health'),
    steer_response:g(ah,bh,'steer_response',.8),high_speed_steer:g(ah,bh,'high_speed_steer',.5),drift_grip:g(ah,bh,'drift_grip',.65),yaw_damping:g(ah,bh,'yaw_damping',.85),weight_transfer:g(ah,bh,'weight_transfer',1),heroic_assist:g(ah,bh,'heroic_assist',.35),
    ram_max_time:g(ar,br,'max_time',5),ram_acceleration_multiplier:g(ar,br,'acceleration_multiplier',1.25),ram_top_speed_multiplier:g(ar,br,'top_speed_multiplier',1.12),ram_damage_multiplier:g(ar,br,'damage_multiplier',1.8),
    time_control_max:g(at,bt,'max_time',3),time_control_control_multiplier:g(at,bt,'control_multiplier',1.5),nitro_capacity:g(an,bn,'capacity',100),
    nitro_base_speed:g(an.base||{},bn.base||{},'top_speed_multiplier',1.07),nitro_base_accel:g(an.base||{},bn.base||{},'acceleration_multiplier',1.14),
    nitro_remix_speed:g(an.remix||{},bn.remix||{},'top_speed_multiplier',1.18),nitro_remix_accel:g(an.remix||{},bn.remix||{},'acceleration_multiplier',1.3),
    nitro_turbo_speed:g(an.turbo||{},bn.turbo||{},'top_speed_multiplier',1.34),nitro_turbo_accel:g(an.turbo||{},bn.turbo||{},'acceleration_multiplier',1.55)
  };
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
  hitRhythm(perfect=false){if(this.mode===2)this.add(perfect ? .085 : .05,3);else this.add(perfect ? .04 : .025,1);this.combo++;this.comboTimer=1.4}
  missRhythm(){this.combo=0;this.comboTimer=0}
  update(dt){if(this.comboTimer>0){this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=0}if(this.mode===1){this.n1=Math.max(0,this.n1-dt*.115);if(this.n1<=0)this.mode=0}else if(this.mode===2){this.remixTimer-=dt;if(this.remixTimer<=0){if(this.n3>.02){this.mode=3;this.turboTimer=1.5+this.n3*6.5;this.n3=0}else this.mode=0}}else if(this.mode===3){this.turboTimer-=dt;if(this.turboTimer<=0)this.mode=0}}
  multipliers(stats){if(this.mode===1)return[stats.nitro_base_speed,stats.nitro_base_accel];if(this.mode===2)return[stats.nitro_remix_speed,stats.nitro_remix_accel];if(this.mode===3)return[stats.nitro_turbo_speed,stats.nitro_turbo_accel];return[1,1]}
}
