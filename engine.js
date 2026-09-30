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
    const result=[],seen=new Set();const ops=['add','sub','mul','div'];
    const order=config.category==='mix'?Array.from({length:10},(_,i)=>ops[i%4]):Array(10).fill(config.category);
    for(let i=order.length-1;i>0;i--){const j=random(0,i,rng);[order[i],order[j]]=[order[j],order[i]];}
    for(const op of order){let q,tries=0;do {q=question(op,config.level,config.table,rng);tries++;}while(seen.has(q.label)&&tries<1000);if(seen.has(q.label))throw new Error('Impossible de générer des questions distinctes');seen.add(q.label);result.push(q);}
    return result;
  }
  function parse(value){const s=String(value).trim();return /^\d{1,6}([,.]\d{1,2})?$/.test(s)?Number(s.replace(',','.')):null;}
  function points(correct,seconds,combo){return correct?100+Math.max(0,20-Math.floor(seconds*2))+Math.min(30,Math.max(0,combo-1)*5):0;}
  const api={categories,levels,fmt,generate,parse,points};root.MathEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
