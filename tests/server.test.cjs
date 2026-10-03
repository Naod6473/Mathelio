const {test}=require('node:test');const assert=require('node:assert/strict');const http=require('node:http');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const {createApp}=require('../server.cjs');
test('shared leaderboard computes scores, enforces ownership and survives restart',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mathelio-test-'));const dbPath=path.join(dir,'test.sqlite');let clock=1000000;const app=createApp({dbPath,now:()=>clock});const server=http.createServer(app.handler);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/api/';let secret;
 const call=async(route,data,auth=secret)=>{const res=await fetch(base+route,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},...(data?{body:JSON.stringify(data)}:{})});return {status:res.status,body:await res.json()};};
 try{
 secret=(await call('players',{})).body.token;const cfg={track:'junior',category:'add',level:'easy',table:''};let start=await call('games',{config:cfg,name:'Alice'});assert.equal(start.status,201);let current=start.body;const gid=current.game;assert.equal(current.question.answer,undefined);
 assert.equal((await call('games/'+gid+'/answer',{index:0,value:0},'f'.repeat(64))).status,401);
 for(let i=0;i<10;i++){
   if(i===0){clock+=100;await call('games/'+gid+'/pause',{index:i});clock+=100000;assert.equal((await call('games/'+gid+'/answer',{index:i,value:0})).status,409);await call('games/'+gid+'/resume',{index:i});}
   clock+=1000;const q=current.question;const result=await call('games/'+gid+'/answer',{index:i,value:q.a+q.b,score:99999});assert.equal(result.status,200);assert.equal(result.body.correct,true);
   if(i<9){assert.equal((await call('games/'+gid+'/answer',{index:i,value:0})).status,409);current=(await call('games/'+gid+'/next',{index:i})).body;}
 }
 const list=await call('scores?'+new URLSearchParams(cfg));assert.equal(list.body.scores.length,1);assert.equal(list.body.scores[0].score,1195);assert.ok(list.body.scores[0].duration<12);
 assert.equal((await call('games/'+gid+'/answer',{index:9,value:0})).status,404);
 assert.equal((await call('games',{config:{...cfg,level:'evil'},name:'A'})).status,400);
 const blocked=await fetch(base+'players',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'});assert.equal(blocked.status,403);
 for(const filename of ['server.cjs','data/test.sqlite','.git/config'])assert.equal((await fetch(base.replace('/api/','/')+filename)).status,404);
 }finally{await new Promise(r=>server.close(r));app.close();}
 const reopened=createApp({dbPath});assert.equal(reopened.db.prepare('SELECT count(*) as n FROM scores').get().n,1);reopened.close();fs.rmSync(dir,{recursive:true});
});

test('Doom enforces deadline, separates rankings and serves supplied assets',async()=>{
 let clock=1000000;const app=createApp({now:()=>clock});const server=http.createServer(app.handler);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let token;
 const call=async(route,data)=>{const r=await fetch(base+'/api/'+route,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,body:await r.json()};};
 try{
  token=(await call('players',{})).body.token;const cfg={track:'doom',category:'mix',level:'hard',table:''};let current=(await call('games',{config:cfg,name:'Parent test'})).body;const id=current.game;
  assert.equal((await call('games/'+id+'/pause',{index:0})).status,409);
  for(let i=0;i<10;i++){
   const answer=require('../engine.js').solve(current.question);clock+=i===0?30000:1000;
   const result=await call('games/'+id+'/answer',{index:i,value:i===1?null:answer});assert.equal(result.status,200);assert.equal(result.body.correct,i>1);assert.equal(result.body.timedOut,i<2);if(i<2)assert.equal(result.body.gain,0);
   if(i<9){assert.equal((await call('games/'+id+'/answer',{index:i,value:answer})).status,409);current=(await call('games/'+id+'/next',{index:i})).body;}
  }
  assert.equal((await call('scores?'+new URLSearchParams(cfg))).body.scores[0].correct,8);
  assert.equal((await call('scores?'+new URLSearchParams({...cfg,track:'cm1'}))).body.scores.length,0);
  for(const [file,mime] of [['assets/images/logo.png','image/png'],['assets/audio/doom/doom-01.mp3','audio/mpeg'],['fields.html','text/html; charset=utf-8'],['fields.css','text/css; charset=utf-8'],['fields.js','text/javascript; charset=utf-8'],['fields-engine.js','text/javascript; charset=utf-8'],['number-display.js','text/javascript; charset=utf-8'],['learning.js','text/javascript; charset=utf-8']]){const r=await fetch(base+'/'+file);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),mime);await r.arrayBuffer();}
 }finally{await new Promise(r=>server.close(r));app.close();}
});

test('shared challenges preserve CP operation choices and separate CM2 scores',async()=>{
 const app=createApp();const server=http.createServer(app.handler);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/api/';let token;
 const call=async(route,data)=>{const r=await fetch(base+route,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});assert.ok(r.ok);return r.json();};
 try{
 token=(await call('players',{})).token;
 for(const [track,category] of [['junior','sub'],['junior','mix'],['cm2','mix']]){
 const cfg={track,category,level:'hard',table:''};let current=await call('games',{config:cfg,name:'Test parcours'});const id=current.game;const ops=[];
 for(let i=0;i<10;i++){ops.push(current.question.op);const answer=require('../engine.js').solve(current.question);assert.equal((await call('games/'+id+'/answer',{index:i,value:answer})).correct,true);if(i<9)current=await call('games/'+id+'/next',{index:i});}
 if(category==='sub')assert.ok(ops.every(op=>op==='sub'));if(track==='junior'&&category==='mix')assert.equal(ops.filter(op=>op==='sub').length,5);
 const scores=(await call('scores?'+new URLSearchParams(cfg))).scores;assert.equal(scores.length,1);assert.equal(scores[0].correct,10);
 }
 assert.equal((await call('scores?'+new URLSearchParams({track:'cm1',category:'mix',level:'hard',table:''}))).scores.length,0);
 }finally{await new Promise(r=>server.close(r));app.close();}
});
