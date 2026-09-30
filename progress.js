/* Pure progression and portable profile validation, shared with tests. */
(function(root){
  'use strict';
  const ops=['add','sub','mul','div'];
  const integer=(n,max=1e9)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
  const emptyStats=()=>({sessions:0,bestStreak:0,repairs:0,ops:[],tables:{},records:0,days:[],reviews:0,correct:0,perfect:0,bests:{},junior:0,missions:0,complements:0,opCorrect:{add:0,sub:0,mul:0,div:0}});
  const key=q=>`${q.track||'cm1'}:${q.op}:${q.a}:${q.b}:${!!q.complement}`;
  function cleanQuestion(q){
    if(!q||!ops.includes(q.op)||![q.a,q.b,q.answer].every(n=>Number.isFinite(n)&&n>=0&&n<=10000))throw Error('Calcul invalide');
    const expected=q.complement?20-q.a:({add:()=>q.a+q.b,sub:()=>q.a-q.b,mul:()=>q.a*q.b,div:()=>q.a/q.b}[q.op]());
    if(Math.abs(expected-q.answer)>1e-8)throw Error('Solution invalide');
    const fmt=n=>String(n).replace('.',',');
    return {op:q.op,a:q.a,b:q.b,answer:q.answer,track:['junior','cm2'].includes(q.track)?q.track:'cm1',level:['easy','medium','hard'].includes(q.level)?q.level:(q.complement||!Number.isInteger(q.a)||!Number.isInteger(q.b)?'hard':q.track==='junior'&&q.a+q.b>10?'medium':'easy'),complement:!!q.complement,label:q.complement?`${q.a} + ? = 20`:`${fmt(q.a)} ${{add:'+ ',sub:'− ',mul:'× ',div:'÷ '}[q.op]}${fmt(q.b)}`};
  }
  function cleanProfile(p){
    if(!p||typeof p.id!=='string'||p.id.length>100||typeof p.name!=='string'||!p.name.trim()||p.name.length>24||!integer(p.avatar,5)||!integer(p.stars)||!p.stats||!Array.isArray(p.errors)||p.errors.length>300)throw Error('Profil invalide');
    if(p.accessory!==null&&(!integer(p.accessory,11)||p.stars<(p.accessory+1)*10))throw Error('Accessoire invalide');
    const s=emptyStats();for(const k of ['sessions','bestStreak','repairs','records','reviews','correct','perfect','junior','missions','complements']){if(p.stats[k]!==undefined&&!integer(p.stats[k]))throw Error('Statistiques invalides');s[k]=p.stats[k]||0;}
    s.ops=Array.isArray(p.stats.ops)?p.stats.ops.filter(x=>ops.includes(x)):[];
    s.days=Array.isArray(p.stats.days)?p.stats.days.filter(x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)).slice(-10000):[];
    for(const [k,v] of Object.entries(p.stats.tables||{}))if(/^\d{1,2}$/.test(k)&&integer(v))s.tables[k]=v;
    for(const op of ops){const v=p.stats.opCorrect?.[op]||0;if(!integer(v))throw Error('Trophée invalide');s.opCorrect[op]=v;}
    const history=Array.isArray(p.history)?p.history.slice(-200).map(h=>{
      if(!h||typeof h.date!=='string'||!Number.isFinite(Date.parse(h.date))||!Array.isArray(h.answers)||h.answers.length>100)throw Error('Historique invalide');
      return {date:h.date,track:['junior','cm2'].includes(h.track)?h.track:'cm1',category:ops.includes(h.category)?h.category:'mix',level:['easy','medium','hard'].includes(h.level)?h.level:'easy',answers:h.answers.map(a=>({...cleanQuestion(a),correct:a.correct===true,corrected:a.corrected===true,spaced:a.spaced===true}))};
    }):[];
    const scores=Array.isArray(p.records)?p.records.slice(-1000).map(cleanScore):[];
    return {id:p.id,name:p.name.trim(),avatar:p.avatar,accessory:p.accessory,stars:p.stars,stats:s,badges:Array.isArray(p.badges)?p.badges.filter(x=>typeof x==='string'&&/^[a-z0-9_-]{1,30}$/.test(x)).slice(0,100):[],errors:p.errors.map(cleanQuestion),history,records:scores,mission:cleanMission(p.mission)};
  }
  function cleanScore(s){if(!s||!integer(s.score,1500)||!integer(s.correct,10)||!Number.isFinite(s.duration)||s.duration<0||s.duration>86400||!['add','sub','mul','div','mix'].includes(s.category)||!['easy','medium','hard'].includes(s.level)||typeof s.date!=='string'||!Number.isFinite(Date.parse(s.date)))throw Error('Record invalide');return {score:s.score,correct:s.correct,duration:s.duration,category:s.category,level:s.level,track:['junior','cm2','doom'].includes(s.track)?s.track:'cm1',table:/^(?:[2-9]|1[0-2])$/.test(String(s.table))?String(s.table):'',date:s.date};}
  const missions=[{id:'practice',title:'Termine une séance d’entraînement',target:1},{id:'correct',title:'Trouve 10 bonnes réponses',target:10},{id:'repair',title:'Corrige 3 calculs à revoir',target:3},{id:'add',title:'Réussis 10 additions',target:10}];
  function cleanMission(m){const def=missions.find(x=>x.id===m?.id)||missions[0];return {...def,progress:integer(m?.progress)?Math.min(def.target,m.progress):0,claimed:m?.claimed===true};}
  function update(p,g){
    if(g.config.track==='doom')return {correct:g.answers.filter(a=>a.correct).length,total:g.answers.length,repaired:0};
    const s=p.stats;const base=g.answers.filter(a=>!a.spaced);const correct=base.filter(a=>a.correct).length;
    s.sessions++;s.correct+=correct;s.opCorrect??={add:0,sub:0,mul:0,div:0};for(const a of base)if(a.correct)s.opCorrect[a.op]++;s.bestStreak=Math.max(s.bestStreak,g.maxCombo);if(g.config.track==='junior')s.junior++;
    const day=new Date().toLocaleDateString('sv-SE');if(!s.days.includes(day))s.days.push(day);
    const errors=new Map(p.errors.map(q=>[key(q),q]));let repaired=0;
    for(const a of g.answers){if(!s.ops.includes(a.op))s.ops.push(a.op);if(!a.spaced&&a.correct&&a.op==='mul')s.tables[a.b]=(s.tables[a.b]||0)+1;if(!a.spaced&&a.correct&&a.complement)s.complements++;
      if(a.correct&&errors.has(key(a))){errors.delete(key(a));repaired++;}else if(!a.correct)errors.set(key(a),cleanQuestion(a));
    }
    p.errors=[...errors.values()].slice(-300);s.repairs+=repaired;if(g.review)s.reviews++;
    p.history.push({date:new Date().toISOString(),track:g.config.track,category:g.config.category,level:g.config.level,answers:g.answers.map(a=>({...cleanQuestion(a),correct:a.correct,corrected:a.corrected,spaced:!!a.spaced}))});p.history=p.history.slice(-200);
    const m=p.mission;if(!m.claimed){const gain={practice:g.config.mode==='practice'?1:0,correct,repair:repaired,add:base.filter(a=>a.correct&&a.op==='add').length}[m.id];m.progress=Math.min(m.target,m.progress+gain);if(m.progress>=m.target){m.claimed=true;s.missions++;p.stars+=2;}}
    return {correct,total:base.length,repaired};
  }
  const api={emptyStats,cleanProfile,cleanQuestion,cleanScore,key,missions,cleanMission,update};root.MathProgress=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
