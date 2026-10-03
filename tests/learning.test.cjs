const {test}=require('node:test');const assert=require('node:assert/strict');const L=require('../learning.js');const E=require('../engine.js');
test('calm mode forces practice and manual progression, while Doom preserves its rules',()=>{
 L.set({...L.defaults,calm:true});const original={track:'cm2',mode:'challenge'};assert.equal(L.configure(original).mode,'practice');assert.equal(original.mode,'challenge');assert.equal(L.autoNext({autoNext:true},'cm1'),false);assert.equal(L.configure({track:'doom',mode:'challenge'}).mode,'challenge');assert.equal(L.autoNext({autoNext:true},'doom'),true);
 L.set({...L.defaults,steps:true});assert.equal(L.autoNext({autoNext:true},'cm1'),false);L.set(L.defaults);assert.equal(L.autoNext({autoNext:true},'cm1'),true);assert.equal(L.autoNext({autoNext:false},'cm1'),false);
});
test('decimal places align correctly and invalid partial answers do not populate the table',()=>{
 assert.deepEqual(L.digits('1 204,05'),[' ',' ','1','2','0','4','0','5']);assert.deepEqual(L.digits('0'),[' ',' ',' ',' ',' ','0',' ',' ']);assert.equal(L.digits('12,'),null);assert.equal(L.digits('<b>'),null);assert.equal(L.digits('1234567'),null);
 assert(!L.tableHtml({a:15,b:3},'1,').includes('Ta réponse'));assert(L.tableHtml({a:15,b:3},'12,05').includes('Ta réponse'));assert(!L.tableHtml({a:15,b:3},'<script>').includes('<script>'));
});
test('base-ten exchanges preserve value and reject unavailable or excessive exchanges without mutation',()=>{
 const sum=a=>a.reduce((x,y)=>x+y,0);for(const n of [0,1,9,10,99,100,1234,9999])assert.equal(sum(L.pieces(n)),n);
 let pieces=L.pieces(1234);for(const unit of [1000,100,10]){const old=sum(pieces);pieces=L.exchange(pieces,unit,'split');assert.equal(sum(pieces),old);pieces=L.exchange(pieces,unit,'group');assert.equal(sum(pieces),old);}
 const one=[1];assert.throws(()=>L.exchange(one,10,'group'));assert.deepEqual(one,[1]);assert.throws(()=>L.pieces(-1));assert.throws(()=>L.pieces(1.5));assert.throws(()=>L.pieces(10000));assert.throws(()=>L.exchange(Array(195).fill(10),10,'split'));
});
test('step corrections remain mathematically correct with generated integer and decimal questions',()=>{
 const number=s=>Number(s.replace(',','.'));const rounded=n=>Math.round(n*100)/100;
 for(const track of ['cm1','cm2','junior'])for(const category of ['add','sub','mul','div'])for(const level of ['easy','medium','hard']){
  if(track==='junior'&&!['add','sub'].includes(category))continue;
  for(const q of E.generate({track,category,level,table:'',count:10,mode:'practice'})){
   const steps=L.correction(q);assert(steps.length>0);assert.equal(rounded(L.parts(q.b).reduce((a,b)=>a+b,0)),q.b);
   for(const {text}of steps){const eq=text.match(/(?:^|: )(\d+(?:,\d+)?) ([+−×]) (\d+(?:,\d+)?) = (\d+(?:,\d+)?)/);if(eq){const a=number(eq[1]),b=number(eq[3]);assert.equal(rounded(eq[2]==='+'?a+b:eq[2]==='−'?a-b:a*b),number(eq[4]),text);}}
  }
 }
});
test('learning preferences reject malformed storage values and tools stay unavailable in Doom',()=>{
 assert.equal(L.clean({calm:'yes',table:1}).calm,false);L.set({...L.defaults,table:true,blocks:true});assert.equal(L.toolsHtml({track:'doom'}),'');assert(L.toolsHtml({track:'cm1',a:3,b:5}).includes('blocks-form'));L.set(L.defaults);
});
