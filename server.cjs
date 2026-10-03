// Same-origin API. Node >= 22.13; SQLite lives outside the public directory.
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {randomBytes,createHash}=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const E=require('./engine.js');
const token=()=>randomBytes(32).toString('hex');
const hash=s=>createHash('sha256').update(s).digest('hex');
function configuration(c){if(!c||!['cm1','cm2','junior','doom'].includes(c.track)||!Object.hasOwn(E.categories,c.category)||!Object.hasOwn(E.levels,c.level)||!(c.table===''||/^(?:[2-9]|1[0-2])$/.test(c.table)))throw Error('Réglages invalides');return {track:c.track,category:c.track==='doom'?'mix':c.track==='junior'&&!['add','sub','mix'].includes(c.category)?'add':c.category,level:c.track==='doom'?'hard':c.level,table:['cm1','cm2'].includes(c.track)&&['mul','div'].includes(c.category)?c.table:'',mode:'challenge',count:10};}
function createApp({dbPath=':memory:',publicDir=__dirname,now=Date.now}={}){
  const db=new DatabaseSync(dbPath);db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS players(id TEXT PRIMARY KEY, secret TEXT NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS scores(player TEXT NOT NULL REFERENCES players(id), settings TEXT NOT NULL, name TEXT NOT NULL, score INTEGER NOT NULL, correct INTEGER NOT NULL, duration REAL NOT NULL, date TEXT NOT NULL, PRIMARY KEY(player,settings));`);
  const games=new Map(),limits=new Map();
  function reply(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
  function identity(req){const auth=req.headers.authorization||'';if(!/^Bearer [a-f0-9]{64}$/.test(auth))return null;return db.prepare('SELECT id FROM players WHERE secret=?').get(hash(auth.slice(7)))?.id;}
  function clean(){const t=now();for(const [k,v] of games)if(t-v.created>3600000)games.delete(k);for(const [k,v]of limits)if(t-v.since>60000)limits.delete(k);}
  async function body(req){if(!(req.headers['content-type']||'').startsWith('application/json'))throw Error('JSON attendu');let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>8192)throw Error('Requête trop volumineuse');}return JSON.parse(raw);}
  const current=g=>{const {answer,...q}=g.questions[g.index];return {question:q,index:g.index,game:g.id};};
  async function handler(req,res){try{
    const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/api/'))return serve(req,res,url.pathname,publicDir);
    clean();const origin=req.headers.origin;if(origin&&origin!==`https://${req.headers.host}`&&origin!==`http://${req.headers.host}`)return reply(res,403,{error:'Origine refusée'});
    const addr=req.socket.remoteAddress||'unknown';const k=hash(addr);const rate=limits.get(k)||{since:now(),count:0};rate.count++;limits.set(k,rate);if(rate.count>300)return reply(res,429,{error:'Trop de requêtes, réessaie dans une minute.'});
    if(req.method==='GET'&&url.pathname==='/api/health')return reply(res,200,{ok:true,version:'2.1.3'});
    if(req.method==='GET'&&url.pathname==='/api/scores'){const cfg=configuration(Object.fromEntries(url.searchParams));const settings=JSON.stringify(cfg);const rows=db.prepare('SELECT name,score,correct,duration,date FROM scores WHERE settings=? ORDER BY score DESC,correct DESC,duration ASC LIMIT 10').all(settings);return reply(res,200,{scores:rows});}
    if(req.method!=='POST')return reply(res,404,{error:'Route inconnue'});
    const data=await body(req);
    if(url.pathname==='/api/players'){const reg=limits.get(k+':registration')||{since:now(),count:0};limits.set(k+':registration',reg);if(++reg.count>12)return reply(res,429,{error:'Trop de nouveaux profils. Réessaie plus tard.'});const id=token(),secret=token();db.prepare('INSERT INTO players(id,secret) VALUES(?,?)').run(id,hash(secret));return reply(res,201,{token:secret});}
    const player=identity(req);if(!player)return reply(res,401,{error:'Profil commun non reconnu. Réactive sa participation dans les réglages.'});
    if(url.pathname==='/api/games'){
      const cfg=configuration(data.config);if(typeof data.name!=='string'||!data.name.trim()||data.name.length>24||/[\x00-\x1f<>]/.test(data.name))return reply(res,400,{error:'Choisis un pseudo de 1 à 24 caractères, sans chevrons.'});
      if(games.size>=1000)return reply(res,503,{error:'Serveur occupé'});for(const [id,g]of games)if(g.player===player)games.delete(id);
      const id=token(),g={id,player,cfg,name:data.name.trim(),questions:E.generate(cfg),index:0,score:0,correct:0,combo:0,duration:0,created:now(),tick:now(),elapsed:0,phase:'answer'};games.set(id,g);return reply(res,201,current(g));
    }
    const match=url.pathname.match(/^\/api\/games\/([a-f0-9]{64})\/(answer|next|pause|resume)$/);if(!match)return reply(res,404,{error:'Route inconnue'});
    const g=games.get(match[1]);if(!g||g.player!==player)return reply(res,404,{error:'Partie expirée. Relance un défi.'});const action=match[2];
    if(data.index!==g.index)return reply(res,409,{error:'Question déjà traitée ou décalée'});
    if(action==='pause'){if(g.cfg.track==='doom'&&g.phase==='answer')return reply(res,409,{error:'Le chronomètre Doom ne peut pas être suspendu.'});if(g.phase==='answer'){g.elapsed+=now()-g.tick;g.phase='paused';}return reply(res,200,{ok:true});}
    if(action==='resume'){if(g.phase==='paused'){g.tick=now();g.phase='answer';}return reply(res,200,{ok:true});}
    if(action==='next'){if(g.phase!=='feedback')return reply(res,409,{error:'Valide la réponse avant de continuer'});g.index++;g.tick=now();g.elapsed=0;g.phase='answer';return reply(res,200,current(g));}
    if(g.phase!=='answer')return reply(res,409,{error:'Partie en pause ou réponse déjà validée'});
    if(!(g.cfg.track==='doom'&&data.value===null)&&(typeof data.value!=='number'||!Number.isFinite(data.value)||data.value<0||data.value>999999))return reply(res,400,{error:'Réponse invalide'});
    const q=g.questions[g.index],rawSeconds=(g.elapsed+now()-g.tick)/1000,timedOut=g.cfg.track==='doom'&&(rawSeconds>=30||data.value===null),seconds=g.cfg.track==='doom'?Math.min(30,rawSeconds):rawSeconds,correct=!timedOut&&data.value===q.answer;g.combo=correct?g.combo+1:0;const gain=E.points(correct,g.cfg.track==='junior'?60:seconds,g.combo);g.score+=gain;g.correct+=Number(correct);g.duration+=seconds;g.phase='feedback';let finished=false;
    if(g.index===9){finished=true;const settings=JSON.stringify(g.cfg);const old=db.prepare('SELECT * FROM scores WHERE player=? AND settings=?').get(player,settings);if(!old||g.score>old.score||(g.score===old.score&&(g.correct>old.correct||(g.correct===old.correct&&g.duration<old.duration))))db.prepare('INSERT INTO scores VALUES(?,?,?,?,?,?,?) ON CONFLICT(player,settings) DO UPDATE SET name=excluded.name,score=excluded.score,correct=excluded.correct,duration=excluded.duration,date=excluded.date').run(player,settings,g.name,g.score,g.correct,g.duration,new Date(now()).toISOString());games.delete(g.id);}
    return reply(res,200,{correct,timedOut,answer:q.answer,gain,score:g.score,seconds,finished});
  }catch(e){if(!res.headersSent){if(e instanceof SyntaxError||/invalid|attendu|volumineuse/i.test(e.message))reply(res,400,{error:e.message});else{console.error(new Date().toISOString(),'API error:',e.message);reply(res,500,{error:'Erreur du serveur. Réessaie plus tard.'});}}else res.end();}}
  return {handler,close:()=>db.close(),db};
}
const publicFiles=new Set(['index.html','style.css','script.js','engine.js','progress.js','audio.js','diagnostics.js','logs.html','logs.js','favicon.svg','fields.html','fields.css','fields.js','fields-engine.js','assets/images/logo.png']);
function serve(req,res,pathname,root){const file=pathname==='/'?'index.html':pathname.slice(1);if(!['GET','HEAD'].includes(req.method)||(!publicFiles.has(file)&&!/^assets\/audio\/(manifest\.json|(?:music|sfx|doom)\/[a-z0-9-]+\.(mp3|wav|ogg))$/.test(file))){res.writeHead(404);res.end();return;}fs.readFile(path.join(root,file),(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg'})[path.extname(file)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);});}
if(require.main===module){const dbPath=process.env.MATHELIO_DB||path.join(__dirname,'data','mathelio.sqlite');fs.mkdirSync(path.dirname(dbPath),{recursive:true});const app=createApp({dbPath,publicDir:process.env.MATHELIO_PUBLIC||__dirname});const server=http.createServer(app.handler);server.requestTimeout=15000;server.headersTimeout=10000;server.listen(Number(process.env.PORT||4319),'127.0.0.1',()=>console.log('Mathélio v2 : http://127.0.0.1:'+(process.env.PORT||4319)));process.on('SIGTERM',()=>server.close(()=>{app.close();process.exit(0);}));}
module.exports={createApp,configuration,serve};
