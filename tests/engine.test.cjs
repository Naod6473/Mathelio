const {test}=require('node:test');const assert=require('node:assert/strict');const E=require('../engine.js');
test('all settings generate ten unique valid calculations',()=>{for(const category of Object.keys(E.categories))for(const level of Object.keys(E.levels))for(const table of ['', '2','12'])for(let run=0;run<30;run++){const qs=E.generate({category,level,table:['mul','div'].includes(category)?table:''});assert.equal(qs.length,10);assert.equal(new Set(qs.map(q=>q.label)).size,10);for(const q of qs){assert.ok(q.answer>=0);const expected={add:()=>q.a+q.b,sub:()=>q.a-q.b,mul:()=>q.a*q.b,div:()=>q.a/q.b}[q.op]();assert.ok(Math.abs(expected-q.answer)<1e-9);if(q.op==='div'){assert.notEqual(q.b,0);assert.ok(Number.isInteger(q.answer));}if(level!=='hard')assert.ok(Number.isInteger(q.answer));if(level==='easy'&&q.op==='add')assert.ok(q.answer<=100);if(level==='medium'&&q.op==='add')assert.ok(q.answer<=200);}if(category==='mix'){const counts=['add','sub','mul','div'].map(op=>qs.filter(q=>q.op===op).length);assert.ok(Math.max(...counts)-Math.min(...counts)<=1);}}});
test('French and English decimal input, malformed and empty input',()=>{assert.equal(E.parse('12,50'),12.5);assert.equal(E.parse('12.5'),12.5);assert.equal(E.parse('0'),0);for(const invalid of ['',' ','12,','1e2','12abc','-2','1,2,3','Infinity'])assert.equal(E.parse(invalid),null);});
test('score favors accuracy and bounds speed and combo bonuses',()=>{assert.equal(E.points(false,0,10),0);assert.equal(E.points(true,0,1),120);assert.equal(E.points(true,30,1),100);assert.equal(E.points(true,0,100),150);assert.equal(E.points(true,30,100),130);});

test('CP subtraction and mixed sessions stay nonnegative, unique and balanced',()=>{
 for(const level of Object.keys(E.levels))for(const category of ['sub','mix'])for(const count of [5,10,20])for(let run=0;run<20;run++){
  const qs=E.generate({track:'junior',level,category,count,mode:'practice'});
  assert.equal(qs.length,count);assert.equal(new Set(qs.map(q=>q.label)).size,count);
  for(const q of qs){assert.equal(q.track,'junior');assert.ok(q.answer>=0);assert.equal(E.solve(q),q.answer);assert.ok(['add','sub'].includes(q.op));if(q.op==='sub')assert.ok(q.a<=19);}
  if(category==='mix')assert.equal(qs.filter(q=>q.op==='sub').length,Math.floor(count/2));else assert.ok(qs.every(q=>q.op==='sub'));
 }
});
test('CM2 sessions use larger operands and exact hundredths, preserving saved track',()=>{
 const P=require('../progress.js');
 for(const level of Object.keys(E.levels))for(const category of Object.keys(E.categories))for(let run=0;run<20;run++){
  const qs=E.generate({track:'cm2',level,category,count:20,mode:'practice'});
  assert.equal(qs.length,20);assert.equal(new Set(qs.map(q=>q.label)).size,20);
  for(const q of qs){assert.equal(q.track,'cm2');assert.equal(E.solve(q),q.answer);assert.equal(P.cleanQuestion(q).track,'cm2');assert.ok(q.answer>=0);if(['mul','div'].includes(q.op))assert.ok((q.op==='mul'?q.a:q.answer)>=11);}
 }
 assert.equal(P.cleanScore({track:'cm2',score:1000,correct:10,duration:60,category:'mix',level:'hard',table:'',date:new Date().toISOString()}).track,'cm2');
});
