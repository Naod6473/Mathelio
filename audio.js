(function(){
  'use strict';
  const defaults={muted:false,music:true,effects:true,musicVolume:.22,effectsVolume:.45,autoNext:true};
  let prefs={...defaults};try{const p=JSON.parse(localStorage.getItem('mathelio.preferences.v1')||'{}');for(const k of Object.keys(defaults))if(typeof p[k]===typeof defaults[k])prefs[k]=typeof p[k]==='number'?Math.max(0,Math.min(1,p[k])):p[k];}catch{}
  let manifest={music:{launch:null,background:[]},sfx:{}},unlocked=false,started=false,last='',bag=[],failed=new Set();const music=new Audio();const effects=new Set();
  const path=p=>typeof p==='string'&&/^assets\/audio\/(music|sfx)\/[a-z0-9-]+\.(mp3|wav|ogg)$/.test(p);
  fetch('assets/audio/manifest.json').then(r=>{if(!r.ok)throw Error('Audio manifest unavailable');return r.json();}).then(m=>{manifest={music:{launch:path(m.music?.launch)?m.music.launch:null,background:(m.music?.background||[]).filter(path)},sfx:Object.fromEntries(Object.entries(m.sfx||{}).map(([k,v])=>[k,Array.isArray(v)?v.filter(path):[]]))};playMusic();}).catch(e=>AppLog.log('warning','Configuration audio indisponible',e.message));
  function nextTrack(){let candidates=manifest.music.background.filter(x=>!failed.has(x));if(!candidates.length)return null;if(!bag.length){bag=candidates.sort(()=>Math.random()-.5);if(bag.length>1&&bag[0]===last)[bag[0],bag[1]]=[bag[1],bag[0]];}return bag.shift();}
  function playMusic(){if(!unlocked||prefs.muted||!prefs.music||document.hidden)return;music.volume=prefs.musicVolume;if(!music.getAttribute('src')){const track=!started&&manifest.music.launch&&!failed.has(manifest.music.launch)?manifest.music.launch:nextTrack();if(!track)return;started=true;last=track;music.src=track;}music.play().catch(e=>{if(e.name!=='NotAllowedError')AppLog.log('warning','Lecture audio impossible',e.message);});}
  music.onended=()=>{music.removeAttribute('src');playMusic();};music.onerror=()=>{failed.add(last);bag=bag.filter(x=>!failed.has(x));AppLog.log('warning','Fichier musical indisponible',last);music.removeAttribute('src');playMusic();};
  function sound(type){if(!unlocked||prefs.muted||!prefs.effects||document.hidden)return;const files=manifest.sfx[type]||[];if(!files.length)return;if(effects.size>=4){const first=effects.values().next().value;first.pause();effects.delete(first);}const a=new Audio(files[Math.floor(Math.random()*files.length)]);a.volume=prefs.effectsVolume;effects.add(a);a.onended=()=>effects.delete(a);a.onerror=()=>{effects.delete(a);};a.play().catch(()=>effects.delete(a));}
  function set(values){Object.assign(prefs,values);try{localStorage.setItem('mathelio.preferences.v1',JSON.stringify(prefs));}catch{AppLog.log('warning','Préférences non sauvegardées');}music.volume=prefs.musicVolume;if(prefs.muted||!prefs.music)music.pause();else playMusic();if(prefs.muted||!prefs.effects){for(const a of effects)a.pause();effects.clear();}document.dispatchEvent(new Event('preferenceschange'));}
  function unlock(){unlocked=true;playMusic();}
  document.addEventListener('pointerdown',unlock,{once:true});document.addEventListener('keydown',unlock,{once:true});document.addEventListener('click',e=>{if(e.target.closest('button'))sound('click');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){music.pause();for(const a of effects)a.pause();effects.clear();}else playMusic();});
  window.MathAudio={prefs,set,sound};
})();
