const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const E=require('../engine.js'),P=require('../progress.js');
test('junior questions follow each level and session lengths',()=>{for(const level of ['easy','medium','hard'])for(const count of [5,10,20]){const qs=E.generate({track:'junior',level,count,mode:'practice'});assert.equal(qs.length,count);assert.equal(new Set(qs.map(P.key)).size,count);for(const q of qs){if(level==='easy'){assert.ok(q.a<=9&&q.b<=9&&q.answer<=10);}if(level==='medium'){assert.ok(q.a<=9&&q.b<=9&&q.answer>=10&&q.answer<=18);}if(level==='hard'){assert.ok(q.complement);assert.equal(q.a+q.answer,20);}}}});
test('20-question table session repeats only after ten distinct calculations',()=>{const qs=E.generate({track:'cm1',category:'mul',table:'7',level:'easy',count:20,mode:'practice'});assert.equal(qs.length,20);assert.equal(new Set(qs.slice(0,10).map(P.key)).size,10);assert.equal(new Set(qs.slice(10).map(P.key)).size,10);});
const profile=()=>({id:'local',name:'Test',avatar:0,accessory:null,stars:0,badges:[],errors:[],history:[],records:[],stats:P.emptyStats(),mission:P.cleanMission(null)});
test('spaced reviews resolve errors without inflating precision or missions',()=>{const p=profile(),q=E.generate({category:'add',level:'easy'})[0];const g={config:{track:'cm1',mode:'practice',category:'add',level:'easy'},maxCombo:1,answers:[{...q,correct:false,corrected:false},{...q,correct:true,corrected:true,spaced:true}]};const result=P.update(p,g);assert.equal(result.correct,0);assert.equal(result.total,1);assert.equal(p.errors.length,0);assert.equal(p.stats.repairs,1);assert.equal(p.stars,2);P.update(p,g);assert.equal(p.stars,2);});
test('portable imports validate all profiles and remove secrets and markup labels',()=>{const p=profile();p.secret='do not export';p.shared=true;p.errors=[{op:'add',a:1,b:2,answer:3,label:'<img src=x onerror=alert(1)>'}];const clean=P.cleanProfile(p);assert.equal(clean.secret,undefined);assert.equal(clean.shared,undefined);assert.equal(clean.errors[0].label,'1 + 2');assert.throws(()=>P.cleanProfile({...p,stars:-1}));assert.throws(()=>P.cleanProfile({...p,history:[{date:'bad',answers:[]}]}));assert.throws(()=>P.cleanQuestion({op:'div',a:1,b:0,answer:0}));});
test('audio manifest points to real audio files',()=>{const m=require('../assets/audio/manifest.json');for(const file of [m.music.launch,m.music.doom,...m.music.background,...Object.values(m.sfx).flat()]){assert.ok(fs.statSync(path.join(__dirname,'..',file)).size>44);const data=fs.readFileSync(path.join(__dirname,'..',file));assert.ok(data.toString('ascii',0,3)==='ID3'||(data[0]===255&&(data[1]&224)===224));}});

test('Doom generates distinct mental calculations with 2 to 5 operands',()=>{
 for(let run=0;run<30;run++){
  const qs=E.generate({track:'doom'});assert.equal(qs.length,10);assert.equal(new Set(qs.map(q=>q.label)).size,10);
  for(const q of qs){assert.ok(q.numbers.length>=2&&q.numbers.length<=5);assert.equal(q.operators.length,q.numbers.length-1);assert.ok(q.operators.every(op=>['add','sub','mul'].includes(op)));assert.ok(Number.isSafeInteger(q.answer)&&q.answer>=0&&q.answer<=999999);
   const expression=q.label.replaceAll('×','*').replaceAll('−','-');assert.match(expression,/^[0-9()+* -]+$/);assert.equal(require('node:vm').runInNewContext(expression),q.answer);
  }
 }
});
test('Doom preserves child progression and portable personal records',()=>{
 const p=profile(),before=structuredClone(p);const answers=E.generate({track:'doom'}).map(q=>({...q,correct:true}));P.update(p,{config:{track:'doom'},answers});assert.deepEqual(p,before);
 p.records.push({track:'doom',category:'mix',level:'hard',table:'',score:1200,correct:10,duration:50,date:new Date().toISOString()});assert.equal(P.cleanProfile(p).records[0].track,'doom');
});
