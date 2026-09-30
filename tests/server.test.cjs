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
