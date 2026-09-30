(function () {
  'use strict';
  const defaults = {muted:false,music:true,effects:true,musicVolume:.22,effectsVolume:.45,autoNext:true};
  let prefs = {...defaults};
  try {
    const saved = JSON.parse(localStorage.getItem('mathelio.preferences.v1') || '{}');
    for (const key of Object.keys(defaults)) if (typeof saved[key] === typeof defaults[key]) {
      prefs[key] = typeof saved[key] === 'number' && Number.isFinite(saved[key]) ? Math.max(0,Math.min(1,saved[key])) : saved[key];
    }
  } catch {}
  let manifest = {music:{launch:null,background:[],doom:null},sfx:{}};
  let unlocked = false, mode = 'opening', last = '', bag = [];
  const failed = new Set(), music = new Audio(), effects = new Set();
  const validPath = value => typeof value === 'string' && /^assets\/audio\/(music|sfx|doom)\/[a-z0-9-]+\.(mp3|wav|ogg)$/.test(value);
  fetch('assets/audio/manifest.json').then(r => {
    if (!r.ok) throw Error('Audio manifest unavailable');
    return r.json();
  }).then(m => {
    manifest = {
      music:{launch:validPath(m.music?.launch)?m.music.launch:null,background:(m.music?.background || []).filter(validPath),doom:validPath(m.music?.doom)?m.music.doom:null},
      sfx:Object.fromEntries(Object.entries(m.sfx || {}).map(([key,list]) => [key,Array.isArray(list)?list.filter(validPath):[]]))
    };
    playMusic();
  }).catch(e => AppLog.log('warning','Configuration audio indisponible',e.message));
  function nextTrack() {
    if (mode === 'doom') return failed.has(manifest.music.doom)?null:manifest.music.doom;
    if (mode === 'opening' && manifest.music.launch && !failed.has(manifest.music.launch)) return manifest.music.launch;
    const candidates = [...new Set([manifest.music.launch,...manifest.music.background])].filter(x => x && !failed.has(x));
    if (!bag.length) {
      bag = candidates;
      for (let i=bag.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
      if (bag.length>1 && bag[0]===last) [bag[0],bag[1]]=[bag[1],bag[0]];
    }
    return bag.shift();
  }
  function playMusic() {
    if (!unlocked || prefs.muted || !prefs.music || document.hidden) return;
    music.volume = prefs.musicVolume;
    if (!music.getAttribute('src')) {
      const track = nextTrack(); if (!track) return;
      last = track; music.src = track;
    }
    music.loop = mode === 'doom';
    music.play().catch(e => {if (!['NotAllowedError','AbortError'].includes(e.name)) AppLog.log('warning','Lecture audio impossible',e.message);});
  }
  function changeMusic(nextMode) {
    mode = nextMode; bag = []; music.pause(); music.removeAttribute('src'); playMusic();
  }
  music.onended = () => {if (mode==='opening') mode='normal';music.removeAttribute('src');playMusic();};
  music.onerror = () => {
    failed.add(last);bag=bag.filter(x=>!failed.has(x));AppLog.log('warning','Fichier musical indisponible',last);
    music.removeAttribute('src');playMusic();
  };
  function sound(type,after) {
    if (!unlocked || prefs.muted || !prefs.effects || document.hidden) return;
    const files = (manifest.sfx[type] || []).filter(x=>!failed.has(x)); if (!files.length) return;
    if (effects.size>=4) {const old=effects.values().next().value;old.onended=null;old.pause();effects.delete(old);}
    const file=files[Math.floor(Math.random()*files.length)], effect=new Audio(file);
    effect.volume=prefs.effectsVolume;effects.add(effect);
    effect.onended=()=>{effects.delete(effect);if(after)sound(after);};
    effect.onerror=()=>{effects.delete(effect);failed.add(file);AppLog.log('warning','Effet sonore indisponible',file);};
    effect.play().catch(()=>effects.delete(effect));
  }
  function stopEffects() {for(const effect of effects){effect.onended=null;effect.pause();}effects.clear();}
  function set(values) {
    Object.assign(prefs,values);
    try {localStorage.setItem('mathelio.preferences.v1',JSON.stringify(prefs));} catch {AppLog.log('warning','Préférences non sauvegardées');}
    music.volume=prefs.musicVolume;
    if(prefs.muted || !prefs.music) music.pause(); else playMusic();
    if(prefs.muted || !prefs.effects) stopEffects();
    document.dispatchEvent(new Event('preferenceschange'));
  }
  function unlock(){unlocked=true;playMusic();}
  document.addEventListener('pointerdown',unlock,{once:true});
  document.addEventListener('keydown',unlock,{once:true});
  document.addEventListener('click',e=>{if(e.target.closest('button'))sound('click');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){music.pause();stopEffects();}else playMusic();});
  function enterDoom(){if(mode!=='doom'){stopEffects();changeMusic('doom');}}
  window.MathAudio={prefs,set,sound,enterDoom,startGame:track=>{stopEffects();if(track==='doom')enterDoom();else changeMusic('normal');},exitDoom:()=>{if(mode==='doom')changeMusic('normal');},finish:badges=>sound('victory',badges?'badge':null)};
})();
