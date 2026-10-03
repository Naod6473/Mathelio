(function(root){
 'use strict';
 const KEY='mathelio.number-display.v1';
 const palette={blue:['Bleu','#1d4ed8'],red:['Rouge','#b91c1c'],green:['Vert','#166534'],purple:['Violet','#6d28d9'],orange:['Orange foncé','#9a3412'],teal:['Turquoise foncé','#115e59'],pink:['Rose foncé','#9d174d'],black:['Noir','#1f2937']};
 const defaults={enabled:true,labels:false,units:'blue',tens:'red',hundreds:'green',thousands:'purple'};
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function clean(value){const result={...defaults};if(value&&typeof value==='object'){for(const k of ['enabled','labels'])if(typeof value[k]==='boolean')result[k]=value[k];for(const k of ['units','tens','hundreds','thousands'])if(Object.hasOwn(palette,value[k]))result[k]=value[k];}return result;}
 let prefs={...defaults};try{prefs=clean(JSON.parse(root.localStorage?.getItem(KEY)||'{}'));}catch{}
 function number(text,options){
  const pieces=text.split(/[,.]/),integer=pieces[0],length=integer.replace(/\D/g,'').length;
  let index=0;
  const digit=(char,key,label)=>`<span class="place-digit" style="--digit-color:${palette[options[key]||'black'][1]}"><span>${char}</span>${options.labels?`<small>${label}</small>`:''}</span>`;
  let visual='';
  for(const char of integer){if(/\d/.test(char)){const place=length-1-index++;const keys=['units','tens','hundreds','thousands','tens','hundreds'];const labels=['U','D','C','M','DM','CM'];visual+=digit(char,keys[place]||'thousands',labels[place]||'M');}else visual+=`<span class="number-separator">${escape(char)}</span>`;}
  if(pieces.length>1){visual+=`<span class="decimal-separator">${escape(text[integer.length])}</span>`;visual+=Array.from(pieces[1],(char,i)=>digit(char,'decimal',['d','c','m'][i]||'d')).join('');}
  return `<span class="place-number"><span class="sr-only">${escape(text)}</span><span class="place-visual" aria-hidden="true">${visual}</span></span>`;
 }
 function html(text,options=prefs){options=clean(options);text=String(text);if(!options.enabled)return escape(text);let output='',last=0;const pattern=/(?:\d{1,3}(?:[ \u00a0\u202f]\d{3})+|\d+)(?:[,.]\d+)?/g;for(const match of text.matchAll(pattern)){output+=escape(text.slice(last,match.index))+number(match[0],options);last=match.index+match[0].length;}return output+escape(text.slice(last));}
 function legend(){if(!prefs.enabled)return '';return `<p class="number-legend">${[['thousands','M · milliers'],['hundreds','C · centaines'],['tens','D · dizaines'],['units','U · unités']].map(([k,label])=>`<span style="--digit-color:${palette[prefs[k]][1]}">${label}</span>`).join('')}<span>Décimales : noir · d = dixièmes, c = centièmes</span></p>`;}
 function settingsHtml(){return `<section class="panel number-settings"><h2>🔢 Les couleurs des nombres</h2><p>Chaque position a sa couleur : unités, dizaines, centaines et milliers. Choisis les repères qui te conviennent.</p><label class="check"><input id="number-enabled" type="checkbox" ${prefs.enabled?'checked':''}> Colorer les chiffres dans les calculs</label><label class="check"><input id="number-labels" type="checkbox" ${prefs.labels?'checked':''}> Afficher aussi les lettres U, D, C et M sous les chiffres</label><div class="number-color-menu">${[['units','Unités'],['tens','Dizaines'],['hundreds','Centaines'],['thousands','Milliers']].map(([key,label])=>`<label>${label}<select id="number-${key}">${Object.entries(palette).map(([id,[name]])=>`<option value="${id}" ${prefs[key]===id?'selected':''}>${name}</option>`).join('')}</select></label>`).join('')}</div><p class="muted">Les lettres donnent un repère en plus des couleurs. Les décimales restent noires ; DM et CM désignent les dizaines et centaines de milliers.</p><div id="number-preview" class="number-preview" aria-label="Aperçu des couleurs">${html('1 234 + 56,78')}</div><div id="number-legend">${legend()}</div><p id="number-save-status" role="status"></p><button id="number-reset" type="button">Couleurs par défaut</button><p class="muted">Ces réglages sont mémorisés pour ce navigateur et partagés entre ses profils.</p></section>`;}
 function set(value){prefs=clean({...prefs,...value});let saved=true;try{root.localStorage.setItem(KEY,JSON.stringify(prefs));}catch{saved=false;}return saved;}
 function bindSettings(container,onChange=()=>{}){
  const query=s=>container.querySelector(s);
  const update=()=>{query('#number-preview').innerHTML=html('1 234 + 56,78');query('#number-legend').innerHTML=legend();onChange();};
  for(const key of ['enabled','labels','units','tens','hundreds','thousands']){const input=query('#number-'+key);input.onchange=()=>{const saved=set({[key]:input.type==='checkbox'?input.checked:input.value});update();query('#number-save-status').textContent=saved?'Réglages enregistrés.':'Réglages actifs, mais leur sauvegarde est indisponible.';};}
  query('#number-reset').onclick=()=>{const saved=set(defaults);for(const key of ['enabled','labels','units','tens','hundreds','thousands']){const input=query('#number-'+key);if(input.type==='checkbox')input.checked=prefs[key];else input.value=prefs[key];}update();query('#number-save-status').textContent=saved?'Couleurs par défaut rétablies.':'Couleurs rétablies pour cette session.';};
 }
 function decorate(container){if(!container||!prefs.enabled)return;const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode()){const n=walker.currentNode;if(/\d/.test(n.textContent)&&!n.parentElement.closest('.place-number,button,script,style'))nodes.push(n);}for(const n of nodes){const template=document.createElement('template');template.innerHTML=html(n.textContent);n.replaceWith(template.content);}}
 const api={palette,defaults,clean,html,legend,settingsHtml,bindSettings,decorate,set,get prefs(){return {...prefs};}};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.NumberDisplay=api;
})(globalThis);
