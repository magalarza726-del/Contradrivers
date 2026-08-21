export class RhythmDirector{
  constructor(nitro,audio){this.nitro=nitro;this.audio=audio;this.sequence=[];this.cursor=0;this.timer=0;this.bpm=126;this.window=.17;this.judge='';this.judgeTimer=0;this.reset()}
  reset(){this.sequence=Array.from({length:64},(_,i)=>({lane:(i*7+i%3)%4,beat:i*.5+(i%7===0 ? .25 : 0),hit:false}));this.cursor=0;this.timer=0;this.judge=''}
  update(dt,input){
    this.timer+=dt*(this.bpm/60);this.judgeTimer=Math.max(0,this.judgeTimer-dt);if(this.judgeTimer<=0)this.judge='';
    for(let lane=0;lane<4;lane++){
      if(!input.pressedAction('rhythm'+lane))continue;
      let best=null,bestD=999;
      for(let i=Math.max(0,this.cursor-2);i<Math.min(this.sequence.length,this.cursor+4);i++){const n=this.sequence[i];if(n.hit||n.lane!==lane)continue;const d=Math.abs(n.beat-this.timer);if(d<bestD){best=n;bestD=d}}
      if(best&&bestD<this.window){best.hit=true;const perfect=bestD<.065;this.nitro.hitRhythm(perfect);this.audio?.rhythm(true);this.judge=perfect?'PERFECT':'GOOD';this.judgeTimer=.5}else{this.nitro.missRhythm();this.audio?.rhythm(false);this.judge='MISS';this.judgeTimer=.4}
    }
    while(this.cursor<this.sequence.length&&this.sequence[this.cursor].beat<this.timer-.2){if(!this.sequence[this.cursor].hit)this.nitro.missRhythm();this.cursor++}
    if(this.cursor>=this.sequence.length){this.timer=0;this.cursor=0;for(const n of this.sequence)n.hit=false}
  }
  upcoming(count=8){return this.sequence.slice(this.cursor,this.cursor+count).map(n=>({...n,delta:n.beat-this.timer}))}
}
