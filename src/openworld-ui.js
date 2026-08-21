import {clamp} from './core.js';

export class OpenWorldUI{
  constructor(doc=document){this.doc=doc;this.nodes=new Map();this.toastTimer=0;this.rhythmPool=[];this.cache(['toast','fatal','fatalText','rhythmLanes','rhythmJudge','policeToggle','pausePoliceToggle','policeStatus'])}
  cache(ids){for(const id of ids)this.nodes.set(id,this.doc.getElementById(id))}
  get(id){if(!this.nodes.has(id))this.nodes.set(id,this.doc.getElementById(id));return this.nodes.get(id)}
  show(id){for(const node of this.doc.querySelectorAll('.screen'))node.classList.toggle('active',node.id===id)}
  toast(text,ms=1700){const node=this.get('toast');if(!node)return;node.textContent=text;node.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>node.classList.remove('show'),ms)}
  setTimeControl(active){this.doc.body.classList.toggle('time-control',!!active)}
  setRamState(charge=0,release=0){this.doc.body.classList.toggle('ram-charging',charge>.03);this.doc.body.classList.toggle('ram-release',release>0);this.doc.body.style.setProperty('--ram-charge',String(clamp(charge,0,1)))}
  renderGarageStats(a,b){const pair=this.get('garagePair'),stats=this.get('garageStats');if(pair)pair.textContent=`${a.name} ↔ ${b.name}`;if(!stats)return;const rows=[['Punta',a.top_speed,b.top_speed,' km/h'],['Aceleración',a.acceleration,b.acceleration,''],['Control',a.control,b.control,''],['Resistencia',a.resistance,b.resistance,''],['Robustez',a.robustness,b.robustness,''],['Masa',a.mass,b.mass,' kg'],['Time Control',a.advanced.time_control.max_time,b.advanced.time_control.max_time,' s'],['Embestida',a.advanced.ram.max_time,b.advanced.ram.max_time,' s']];stats.innerHTML=rows.map(r=>`<div><span>${r[0]}</span><b>${r[1]}${r[3]}</b><i>↔</i><b>${r[2]}${r[3]}</b></div>`).join('')}
  renderRhythm(upcoming,judge){const root=this.get('rhythmLanes');if(!root)return;while(this.rhythmPool.length<8){const n=this.doc.createElement('i');n.className='note';root.append(n);this.rhythmPool.push(n)}for(let i=0;i<this.rhythmPool.length;i++){const el=this.rhythmPool[i],note=upcoming[i];if(!note){el.hidden=true;continue}el.hidden=false;el.className=`note lane${note.lane}`;el.style.bottom=`${clamp(10+note.delta*34,8,94)}%`}const j=this.get('rhythmJudge');if(j)j.textContent=judge||''}
  updatePolice(enabled,active,max){const label=enabled?'POLICÍA: ACTIVA':'POLICÍA: DESACTIVADA';for(const id of ['policeToggle','pausePoliceToggle']){const n=this.get(id);if(n)n.textContent=label}const s=this.get('policeStatus');if(s)s.textContent=enabled?`POLICÍA ON · ${active}/${max}`:'POLICÍA OFF'}
  fatal(err){const root=this.get('fatal'),text=this.get('fatalText');if(root)root.hidden=false;if(text)text.textContent=String(err?.stack||err);this.doc.body.classList.remove('time-control','ram-charging','ram-release')}
}
