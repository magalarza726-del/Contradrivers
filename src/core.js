export const TAU=Math.PI*2;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const invLerp=(a,b,v)=>a===b?0:(v-a)/(b-a);
export const smoothstep=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
export const wrap=(i,n)=>(i%n+n)%n;
export const rad=d=>d*Math.PI/180;
export const deg=r=>r*180/Math.PI;
export const copy=o=>JSON.parse(JSON.stringify(o));
export const fmtTime=s=>{const m=Math.floor(s/60),ss=Math.floor(s%60),cs=Math.floor((s%1)*100);return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}.${String(cs).padStart(2,'0')}`};
export const shortestAngle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export const expSmoothing=(current,target,rate,dt)=>lerp(current,target,1-Math.exp(-rate*dt));

export class InputManager{
  constructor(){
    this.keys=new Set();this.pressed=new Set();this.released=new Set();this.axes={steer:0,throttle:0,brake:0};this.gamepad=false;this.pad={};this.padPrev={};
    this.bindings={accelerate:['KeyW','ArrowUp'],brake:['KeyS','ArrowDown'],left:['KeyA','ArrowLeft'],right:['KeyD','ArrowRight'],handbrake:['Space'],switch:['KeyE'],time:['KeyQ'],ram:['AltLeft','AltRight'],nitro:['KeyN'],remix:['KeyM'],camera:['KeyC'],reset:['KeyR'],pause:['Escape'],guide:['KeyH'],rhythm0:['KeyJ'],rhythm1:['KeyK'],rhythm2:['KeyL'],rhythm3:['KeyI']};
    addEventListener('keydown',e=>{if(!this.keys.has(e.code))this.pressed.add(e.code);this.keys.add(e.code);if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault()},{passive:false});
    addEventListener('keyup',e=>{this.keys.delete(e.code);this.released.add(e.code)});
    const clear=()=>this.reset();addEventListener('blur',clear);document.addEventListener?.('visibilitychange',()=>{if(document.hidden)clear()});
  }
  reset(){this.keys.clear();this.pressed.clear();this.released.clear();this.pad={};this.padPrev={};this.axes={steer:0,throttle:0,brake:0}}
  any(action,set=this.keys){return (this.bindings[action]||[]).some(k=>set.has(k))}
  down(a){return this.any(a,this.keys)||!!this.pad[a]}
  pressedAction(a){return this.any(a,this.pressed)||(!!this.pad[a]&&!this.padPrev[a])}
  releasedAction(a){return this.any(a,this.released)||(!this.pad[a]&&!!this.padPrev[a])}
  update(){
    this.padPrev={...this.pad};this.pad={};
    const pads=navigator.getGamepads?.()||[];const p=[...pads].find(Boolean);this.gamepad=!!p;
    let steer=(this.any('right',this.keys)?1:0)-(this.any('left',this.keys)?1:0),throttle=this.any('accelerate',this.keys)?1:0,brake=this.any('brake',this.keys)?1:0;
    if(p){const dz=.12,ax=Math.abs(p.axes[0]||0)>dz?p.axes[0]:0;steer=Math.abs(ax)>Math.abs(steer)?ax:steer;throttle=Math.max(throttle,p.buttons[7]?.value||0);brake=Math.max(brake,p.buttons[6]?.value||0);this.pad.handbrake=!!p.buttons[0]?.pressed;this.pad.ram=!!p.buttons[1]?.pressed;this.pad.switch=!!p.buttons[2]?.pressed;this.pad.remix=!!p.buttons[3]?.pressed;this.pad.time=!!p.buttons[4]?.pressed;this.pad.nitro=!!p.buttons[5]?.pressed}
    this.axes.steer=clamp(steer,-1,1);this.axes.throttle=clamp(throttle,0,1);this.axes.brake=clamp(brake,0,1);
  }
  endFrame(){this.pressed.clear();this.released.clear()}
}

export class FixedStepper{
  constructor(step=1/120,maxSubsteps=5){this.step=step;this.maxSubsteps=maxSubsteps;this.acc=0}
  run(realDt,fn){this.acc=Math.min(this.acc+Math.min(realDt,.1),this.step*this.maxSubsteps);let n=0;while(this.acc>=this.step&&n<this.maxSubsteps){fn(this.step);this.acc-=this.step;n++}return this.acc/this.step}
}

export class AudioEngine{
  constructor(){this.ctx=null;this.master=.18;this.engineOsc=null;this.engineGain=null;this.nitroGain=null;this.lastBeat=0;this.available=true}
  wake(){if(!this.available)return false;if(!this.ctx){const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx){this.available=false;return false}try{this.ctx=new AudioCtx();this._build()}catch(err){console.warn('WebAudio unavailable',err);this.available=false;this.ctx=null;return false}}if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});return true}
  _build(){const c=this.ctx;this.engineOsc=c.createOscillator();this.engineGain=c.createGain();this.engineOsc.type='sawtooth';this.engineGain.gain.value=.0001;this.engineOsc.connect(this.engineGain).connect(c.destination);this.engineOsc.start();this.nitroOsc=c.createOscillator();this.nitroGain=c.createGain();this.nitroOsc.type='triangle';this.nitroGain.gain.value=.0001;this.nitroOsc.connect(this.nitroGain).connect(c.destination);this.nitroOsc.start()}
  update(speedKmh,throttle,nitro,dt){if(!this.ctx)return;const now=this.ctx.currentTime,rpm=55+Math.pow(clamp(speedKmh/420,0,1),.72)*210+throttle*45;this.engineOsc.frequency.setTargetAtTime(rpm,now,.03);this.engineGain.gain.setTargetAtTime((.025+.055*throttle)*this.master,now,.04);this.nitroOsc.frequency.setTargetAtTime(380+nitro*300,now,.03);this.nitroGain.gain.setTargetAtTime((nitro>.01 ? .045*nitro : .0001)*this.master,now,.03);this.lastBeat-=dt;if(this.lastBeat<=0&&speedKmh>20){this.lastBeat=.24-.08*clamp(speedKmh/400,0,1);this.beep(70+speedKmh*.14,.025,'square',.03)}}
  beep(freq=440,dur=.08,type='sine',gain=.08){if(!this.ctx)return;try{const o=this.ctx.createOscillator(),g=this.ctx.createGain(),now=this.ctx.currentTime;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain*this.master,now);g.gain.exponentialRampToValueAtTime(.0001,now+dur);o.connect(g).connect(this.ctx.destination);o.start(now);o.stop(now+dur)}catch{}}
  impact(intensity=.5){this.beep(58+intensity*40,.11,'square',.22*intensity)}
  rhythm(ok=true){this.beep(ok?680:180,ok ? .05 : .09,ok?'sine':'sawtooth',ok ? .12 : .08)}
}
