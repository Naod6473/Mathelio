(function(){
  'use strict';const KEY='mathelio.logs.v1';let entries=[];
  try {const raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(raw))entries=raw.filter(x=>x&&typeof x.message==='string').slice(-200);}catch{}
  function clean(value){return String(value||'').replace(/https?:\/\/[^\s)]+/g,s=>s.split(/[?#]/)[0]).slice(0,3000);}
  function log(level,message,detail=''){entries.push({date:new Date().toISOString(),level,message:clean(message),detail:clean(detail),version:'2.1.2',page:location.pathname});entries=entries.slice(-200);try{localStorage.setItem(KEY,JSON.stringify(entries));}catch{} }
  window.AppLog={log,read:()=>entries.slice(),clear:()=>{entries=[];try{localStorage.removeItem(KEY);}catch{}},export:()=>JSON.stringify({app:'Mathélio',version:'2.1.2',exportedAt:new Date().toISOString(),entries},null,2)};
  addEventListener('error',e=>{if(e.target!==window)log('error','Ressource impossible à charger',e.target?.src||e.target?.href);else log('error',e.message,e.error?.stack||`${e.filename}:${e.lineno}`);},true);
  addEventListener('unhandledrejection',e=>log('error','Promesse non traitée',e.reason?.stack||e.reason));
})();
