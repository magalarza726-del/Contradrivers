import {clamp} from './core.js';

export const BUILD_VERSION='0.8.2';
const CURRENT_KEY='contradrivers:v0.8.2:settings';
const LEGACY_KEYS=['contradrivers:v0.8.1:settings'];
const defaults=Object.freeze({policeEnabled:true,policeMax:14,uiScale:1});

function parse(raw){try{return raw?JSON.parse(raw):null}catch{return null}}
function sanitize(value={}){
  return {
    policeEnabled:value.policeEnabled!==false,
    policeMax:Math.round(clamp(Number(value.policeMax)||defaults.policeMax,0,14)),
    uiScale:clamp(Number(value.uiScale)||1,.8,1.25),
  };
}
function load(){
  let value=parse(localStorage.getItem(CURRENT_KEY));
  if(!value){for(const key of LEGACY_KEYS){value=parse(localStorage.getItem(key));if(value)break}}
  return sanitize({...defaults,...value});
}

class SettingsStore extends EventTarget{
  constructor(){super();this.value=load();this.persist()}
  persist(){try{localStorage.setItem(CURRENT_KEY,JSON.stringify(this.value))}catch{}}
  get(key){return this.value[key]}
  set(key,value){const next=sanitize({...this.value,[key]:value});const changed=next[key]!==this.value[key];if(!changed)return this.value[key];this.value=next;this.persist();this.dispatchEvent(new CustomEvent('change',{detail:{key,value:next[key],settings:{...next}}}));return next[key]}
  togglePolice(){return this.set('policeEnabled',!this.value.policeEnabled)}
  snapshot(){return {...this.value}}
}

export const settings=new SettingsStore();
