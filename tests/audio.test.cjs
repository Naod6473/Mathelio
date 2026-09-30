const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
test('audio waits for interaction, starts with launch, avoids repeats and honors mute/visibility',async()=>{
 const audios=[],listeners={};const document={hidden:false,addEventListener:(k,f)=>(listeners[k]??=[]).push(f),dispatchEvent:()=>{}};
 class Audio{constructor(src=''){this.src=src;this.paused=true;this.played=[];audios.push(this);}getAttribute(){return this.src;}removeAttribute(){this.src='';}pause(){this.paused=true;}play(){this.paused=false;this.played.push(this.src);return Promise.resolve();}}
 const context={Audio,document,localStorage:{getItem:()=>null,setItem:()=>{}},Event:class{},AppLog:{log:()=>{}},fetch:async()=>({ok:true,json:async()=>require('../assets/audio/manifest.json')})};context.window=context;
 vm.runInNewContext(fs.readFileSync(require.resolve('../audio.js'),'utf8'),context);await new Promise(r=>setImmediate(r));const music=audios[0];assert.equal(music.played.length,0);listeners.pointerdown[0]();assert.equal(music.src,'assets/audio/music/launch.wav');music.onended();const first=music.src;music.onended();assert.notEqual(music.src,first);assert.ok(music.src.includes('background-'));
 context.MathAudio.set({muted:true});assert.equal(music.paused,true);context.MathAudio.set({muted:false});assert.equal(music.paused,false);document.hidden=true;listeners.visibilitychange[0]();assert.equal(music.paused,true);document.hidden=false;listeners.visibilitychange[0]();assert.equal(music.paused,false);
});
