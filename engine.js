/* Pure game rules. Integers in tenths keep decimal operations exact. */
(function (root) {
  'use strict';
  const categories = {add:'Additions',sub:'Soustractions',mul:'Multiplications',div:'Divisions',mix:'Mode mixte'};
  const levels = {easy:'Facile',medium:'Moyen',hard:'Difficile'};
  const fmt = n => String(n).replace('.', ',');
  const random = (min,max,rng) => min + Math.floor(rng()*(max-min+1));
  function question(op,level,table,rng=Math.random) {
    const r=(a,b)=>random(a,b,rng); let a,b,answer,scale=1;
    if(op==='add'||op==='sub') {
      if(level==='hard'){scale=10;a=r(11,799);b=r(11,199);}
      else if(level==='easy') {a=r(1,6)*10+r(0,9);b=r(0,Math.min(9-Math.floor(a/10),3))*10+r(0,9-a%10);}
      else {a=r(35,119);b=r(11,80);if(a%10+b%10<10)b+=10-(a%10+b%10);}
      if(op==='sub') {
        if(level==='easy'){const sum=a+b;a=sum;b=sum-b;}
        else if(level==='medium'){a=r(51,199);b=r(11,a-1);if(b%10<=a%10){b=Math.floor(b/10)*10+Math.min(9,a%10+1);if(a%10===9)a--; }if(b>a)[a,b]=[b,a];}
        else if(b>a)[a,b]=[b,a];
      }
      answer=(op==='add'?a+b:a-b)/scale;a/=scale;b/=scale;
    } else {
      const tables=table?[Number(table)]:(level==='easy'?[2,5,10]:level==='medium'?[2,3,4,5,6,7,8,9]:[11,12,15,20,25]);
      b=tables[r(0,tables.length-1)];a=r(1,10);answer=a*b;
      if(op==='div'){const product=answer;answer=a;a=product;}
    }
    return {op,a,b,answer,label:`${fmt(a)} ${{add:'+',sub:'−',mul:'×',div:'÷'}[op]} ${fmt(b)}`};
  }
  function generate(config,rng=Math.random) {
    if(config.track==='doom')return generateDoom(rng);
    if(config.track==='junior') {
      const pool=[];
      for(let a=0;a<=19;a++)for(let b=0;b<=9;b++) {
        if(config.level==='hard') {if(b===0)pool.push({op:'add',a,b:20-a,answer:20-a,complement:true,label:`${a} + ? = 20`,track:'junior'});}
        else if(a<=9&&(config.level==='easy'?a+b<=10:a+b>=10))pool.push({op:'add',a,b,answer:a+b,label:`${a} + ${b}`,track:'junior'});
      }
      for(let i=pool.length-1;i>0;i--){const j=random(0,i,rng);[pool[i],pool[j]]=[pool[j],pool[i]];}
      return pool.slice(0,config.mode==='challenge'?10:(config.count||5)).map(q=>({...q,level:config.level}));
    }
    const result=[],seen=new Set();const ops=['add','sub','mul','div'];
    const count=config.mode==='challenge'?10:(config.count||10);
    const order=config.category==='mix'?Array.from({length:count},(_,i)=>ops[i%4]):Array(count).fill(config.category);
    for(let i=order.length-1;i>0;i--){const j=random(0,i,rng);[order[i],order[j]]=[order[j],order[i]];}
    for(const op of order){if(config.table&&result.length===10)seen.clear();let q,tries=0;do {q=question(op,config.level,config.table,rng);tries++;}while(seen.has(q.label)&&tries<1000);if(seen.has(q.label))throw new Error('Impossible de générer des questions distinctes');seen.add(q.label);result.push({...q,track:'cm1',level:config.level});}
    return result;
  }
  function parse(value){const s=String(value).trim();return /^\d{1,6}([,.]\d{1,2})?$/.test(s)?Number(s.replace(',','.')):null;}
  function points(correct,seconds,combo){return correct?100+Math.max(0,20-Math.floor(seconds*2))+Math.min(30,Math.max(0,combo-1)*5):0;}
  function solve(q){
    if(q.track==='doom')return q.numbers.slice(1).reduce((value,n,i)=>q.operators[i]==='add'?value+n:q.operators[i]==='sub'?value-n:value*n,q.numbers[0]);
    return q.complement?20-q.a:Math.round(({add:()=>q.a+q.b,sub:()=>q.a-q.b,mul:()=>q.a*q.b,div:()=>q.a/q.b}[q.op]())*10)/10;
  }
  function doomLabel(numbers,operators){return numbers.slice(1).reduce((label,n,i)=>`${i?'('+label+')':label} ${{add:'+',sub:'−',mul:'×'}[operators[i]]} ${n}`,String(numbers[0]));}
  function generateDoom(rng){
    const r=(a,b)=>random(a,b,rng),questions=[],seen=new Set();
    for(const kind of ['add','sub','mul','mix','add','sub','mul','mix','add','mix']){
      let q;
      for(let tries=0;tries<1000;tries++){
        let numbers,operators;
        if(kind==='add'){numbers=Array.from({length:r(2,5)},()=>r(137,2987));operators=Array(numbers.length-1).fill('add');}
        else if(kind==='sub'){numbers=[r(6000,9999),...Array.from({length:r(1,4)},()=>r(117,999))];operators=Array(numbers.length-1).fill('sub');}
        else if(kind==='mul'){numbers=[r(23,97),r(12,89)];if(r(0,1))numbers.push(r(2,5));operators=Array(numbers.length-1).fill('mul');}
        else {numbers=[r(31,89),r(12,49),r(127,899)];operators=['mul','add'];if(r(0,1)){numbers.push(r(51,199));operators.push('sub');}if(r(0,1)){numbers.push(r(2,3));operators.push('mul');}}
        q={track:'doom',level:'hard',op:kind==='mix'?'mul':kind,numbers,operators,label:doomLabel(numbers,operators)};q.answer=solve(q);
        if(!seen.has(q.label))break;
      }
      if(seen.has(q.label))throw Error('Impossible de générer le défi Doom');seen.add(q.label);questions.push(q);
    }
    for(let i=questions.length-1;i>0;i--){const j=r(0,i);[questions[i],questions[j]]=[questions[j],questions[i]];}
    return questions;
  }
  const api={categories,levels,fmt,generate,parse,points,solve,doomLabel};root.MathEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
