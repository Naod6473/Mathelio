(function(root){
 'use strict';
 const WIDTH=23,HEIGHT=15;
 function create(){return {rectangles:[],turn:0,dice:null,passes:0,finished:false};}
 function farm(player){return player===0?{x:0,y:0,w:3,h:3}:{x:20,y:12,w:3,h:3};}
 const tree={x:10,y:6,w:3,h:3};
 function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
 function touches(a,b){return ((a.x+a.w===b.x||b.x+b.w===a.x)&&a.y<b.y+b.h&&a.y+a.h>b.y)||((a.y+a.h===b.y||b.y+b.h===a.y)&&a.x<b.x+b.w&&a.x+a.w>b.x);}
 function valid(g,r,player=g.turn){
  if(!r||![r.x,r.y,r.w,r.h].every(Number.isInteger)||r.w<1||r.h<1||r.x<0||r.y<0||r.x+r.w>WIDTH||r.y+r.h>HEIGHT)return false;
  if([farm(0),farm(1),tree,...g.rectangles].some(b=>overlaps(r,b)))return false;
  return [farm(player),...g.rectangles.filter(b=>b.player===player)].some(b=>touches(r,b));
 }
 function moves(g,dice=g.dice){
  if(!dice)return [];
  const result=[],sizes=dice[0]===dice[1]?[dice]:[dice,[dice[1],dice[0]]];
  for(const [w,h] of sizes)for(let y=0;y<=HEIGHT-h;y++)for(let x=0;x<=WIDTH-w;x++){const r={x,y,w,h};if(valid(g,r))result.push(r);}
  return result;
 }
 function roll(g,random=Math.random){
  if(g.finished||g.dice)throw Error('Lance les dés une seule fois par tour.');
  g.dice=[1+Math.floor(random()*6),1+Math.floor(random()*6)];return g.dice;
 }
 function next(g){g.turn=1-g.turn;g.dice=null;}
 function place(g,r,area){
  if(g.finished||!g.dice)throw Error('Lance les dés avant de placer un champ.');
  if(!((r.w===g.dice[0]&&r.h===g.dice[1])||(r.w===g.dice[1]&&r.h===g.dice[0]))||!valid(g,r))throw Error('Ce rectangle ne peut pas être placé ici.');
  if(area!==r.w*r.h)throw Error('Vérifie l’aire de ton rectangle.');
  g.rectangles.push({...r,player:g.turn,area,perimeter:2*(r.w+r.h)});g.passes=0;next(g);
 }
 function pass(g){
  if(g.finished||!g.dice||moves(g).length)throw Error('Tu peux encore placer un rectangle.');
  g.passes++;if(g.passes===2)g.finished=true;next(g);
 }
 function totals(g){return [0,1].map(player=>{const rs=g.rectangles.filter(r=>r.player===player);return {area:rs.reduce((a,r)=>a+r.area,0),perimeter:rs.reduce((a,r)=>a+r.perimeter,0),largest:Math.max(0,...rs.map(r=>r.area)),count:rs.length};});}
 function scores(g){const t=totals(g),points=[0,0],criteria={};for(const k of ['area','perimeter','largest']){criteria[k]=t.map(v=>Number(v[k]===Math.max(t[0][k],t[1][k])));points[0]+=criteria[k][0];points[1]+=criteria[k][1];}return {totals:t,criteria,points};}
 function computerMove(g){
  const options=moves(g);if(!options.length)return null;
  // Grow towards the centre while keeping contact with our existing territory.
  return options.sort((a,b)=>{const value=r=>-Math.hypot(r.x+r.w/2-WIDTH/2,r.y+r.h/2-HEIGHT/2)+g.rectangles.filter(s=>s.player===g.turn&&touches(r,s)).length*.15;return value(b)-value(a);})[0];
 }
 const api={WIDTH,HEIGHT,tree,farm,create,overlaps,touches,valid,moves,roll,place,pass,totals,scores,computerMove};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FieldsEngine=api;
})(globalThis);
