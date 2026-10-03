(function(){
 'use strict';
 const E=FieldsEngine,$=s=>document.querySelector(s),board=$('#board');
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let game=null,names=[],computer=false,selection=null,rotated=false,busy=false,timer=null,calculating=0;
 const aiTurn=()=>computer&&game?.turn===1;
 const rectangle=(x,y)=>({x,y,w:game.dice[rotated?1:0],h:game.dice[rotated?0:1]});
 function overlay(r,classes,text,title){const el=document.createElement('div');el.className='field-overlay '+classes;el.style.cssText=`left:${r.x/E.WIDTH*100}%;top:${r.y/E.HEIGHT*100}%;width:${r.w/E.WIDTH*100}%;height:${r.h/E.HEIGHT*100}%`;el.textContent=text;el.title=title;el.setAttribute('aria-hidden','true');board.append(el);}
 function draw(){
  board.replaceChildren();
  for(let y=0;y<E.HEIGHT;y++)for(let x=0;x<E.WIDTH;x++){
   const cell=document.createElement('button');cell.type='button';cell.className='field-cell';cell.dataset.x=x;cell.dataset.y=y;cell.tabIndex=x===0&&y===0?0:-1;
   const square={x,y,w:1,h:1},r=game.rectangles.find(r=>E.overlaps(r,square));
   const obstacle=[E.farm(0),E.farm(1),E.tree].find(r=>E.overlaps(r,square));
   if(r)cell.classList.add(r.player===0?'occupied-red':'occupied-blue');else if(obstacle)cell.classList.add('obstacle');
   cell.setAttribute('aria-label',`Colonne ${x+1}, ligne ${y+1}${r?`, champ de ${names[r.player]}, aire ${r.area}`:obstacle?', ferme ou arbre':', libre'}`);
   board.append(cell);
  }
  overlay(E.farm(0),'farm red','⌂','Ferme rouge');overlay(E.farm(1),'farm blue','⌂','Ferme bleue');overlay(E.tree,'tree','🌳','Arbre');
  game.rectangles.forEach(r=>overlay(r,r.player===0?'red':'blue',r.area,`${names[r.player]} : ${r.w} × ${r.h} = ${r.area}`));
  preview(selection);
 }
 function preview(r){
  const valid=r&&E.valid(game,r);
  board.querySelectorAll('.field-cell').forEach(c=>{c.classList.remove('preview','preview-invalid');if(r&&E.overlaps(r,{x:Number(c.dataset.x),y:Number(c.dataset.y),w:1,h:1}))c.classList.add(valid?'preview':'preview-invalid');});
 }
 function controls(message){
  const human=!aiTurn()&&!busy&&!game.finished,hasDice=!!game.dice,canPlace=hasDice&&E.moves(game).length>0;
  $('#turn-title').textContent=game.finished?'Fin de la partie':`À ${names[game.turn]} de jouer`;
  $('#status').textContent=message||(!hasDice?'Lance les dés pour découvrir ton prochain champ.':canPlace?`Rectangle de ${game.dice[0]} × ${game.dice[1]}. Choisis un emplacement.`:'Aucun emplacement possible, même en tournant le rectangle.');
  $('#roll').disabled=!human||hasDice;$('#rotate').disabled=!human||!canPlace;$('#hint').disabled=!human||!canPlace;$('#pass').disabled=!human||!hasDice||canPlace;
  $('#area-form').hidden=!human||!selection;$('#confirm').disabled=!human||!selection;
  const glyphs=['⚀','⚁','⚂','⚃','⚄','⚅'];$('#dice').innerHTML=game.dice?game.dice.map(n=>`<span aria-hidden="true">${glyphs[n-1]}</span>`).join(''):'<span>?</span><span>?</span>';
  $('#dice').setAttribute('aria-label',game.dice?`Dés : ${game.dice.join(' et ')}`:'Dés non lancés');
  const totals=E.totals(game);$('#players').innerHTML=names.map((n,p)=>`<article class="fields-player ${p===0?'red':'blue'} ${!game.finished&&game.turn===p?'active':''}"><strong>${p===0?'Rouge':'Bleu'} · ${escape(n)}</strong><p>${totals[p].count} champ${totals[p].count>1?'s':''}</p></article>`).join('');
 }
 function choose(r){
  if(!game?.dice||busy||aiTurn()||game.finished)return;
  if(!E.valid(game,r)){selection=null;preview(r);$('#area-form').hidden=true;$('#feedback').textContent='Ce champ doit toucher ton territoire par un côté, rester dans la grille et éviter les cases occupées.';return;}
  selection=r;preview(r);$('#area').value='';$('#area-help').textContent=`Aire = largeur × hauteur = ${r.w} × ${r.h}.`;
  $('#feedback').textContent='Emplacement choisi. Calcule l’aire pour valider ton champ.';controls();$('#area').focus();
 }
 function turn(message){
  selection=null;rotated=false;$('#feedback').textContent='';draw();controls(message);
  if(game.finished){results();return;}
  if(aiTurn()){busy=true;controls('L’ordinateur prépare son champ…');timer=setTimeout(computerTurn,650);}
 }
 function computerTurn(){
  E.roll(game);$('#dice').classList.add('rolling');controls('L’ordinateur a lancé les dés…');
  timer=setTimeout(()=>{const r=E.computerMove(game),message=r?`L’ordinateur a placé ${r.w} × ${r.h} = ${r.w*r.h}.`:'L’ordinateur ne peut pas placer son champ et passe son tour.';if(r)E.place(game,r,r.w*r.h);else E.pass(game);busy=false;$('#dice').classList.remove('rolling');turn(message);},900);
 }
 board.addEventListener('click',event=>{const c=event.target.closest('.field-cell');if(c&&game?.dice)choose(rectangle(Number(c.dataset.x),Number(c.dataset.y)));});
 board.addEventListener('pointerover',event=>{const c=event.target.closest('.field-cell');if(c&&game?.dice&&!selection&&!busy&&!aiTurn()&&!game.finished)preview(rectangle(Number(c.dataset.x),Number(c.dataset.y)));});
 board.addEventListener('pointerleave',()=>preview(selection));
 board.addEventListener('keydown',event=>{const c=event.target.closest('.field-cell');if(!c)return;const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!delta)return;event.preventDefault();const x=Math.max(0,Math.min(E.WIDTH-1,Number(c.dataset.x)+delta[0])),y=Math.max(0,Math.min(E.HEIGHT-1,Number(c.dataset.y)+delta[1]));const target=board.querySelector(`[data-x="${x}"][data-y="${y}"]`);c.tabIndex=-1;target.tabIndex=0;target.focus();});
 $('#roll').onclick=()=>{if(!game||busy||aiTurn()||game.dice||game.finished)return;E.roll(game);$('#dice').classList.add('rolling');timer=setTimeout(()=>$('#dice').classList.remove('rolling'),650);controls();};
 $('#rotate').onclick=()=>{rotated=!rotated;const old=selection;selection=null;$('#area-form').hidden=true;$('#feedback').textContent='Rectangle tourné. Choisis son emplacement.';preview(null);if(old)choose(rectangle(old.x,old.y));};
 $('#hint').onclick=()=>{const r=E.moves(game)[0];if(!r)return;rotated=r.w!==game.dice[0];choose(r);};
 $('#pass').onclick=()=>{const name=names[game.turn];E.pass(game);turn(`${name} passe son tour : aucun emplacement possible.`);};
 $('#area-form').onsubmit=event=>{event.preventDefault();if(!selection||busy||aiTurn())return;try{const r=selection;E.place(game,r,Number($('#area').value));turn(`Champ validé : ${r.w} × ${r.h} = ${r.w*r.h}. Au joueur suivant !`);}catch(error){$('#feedback').textContent=error.message+' Multiplie la largeur par la hauteur.';$('#area').focus();}};
 function scoreForm(){
  const section=$('#results');section.hidden=false;section.innerHTML=`<h2>Calculons les scores</h2><p>Au tour de <strong>${escape(names[calculating])}</strong>. Les aires sont inscrites sur les champs. Pour chaque rectangle, le périmètre vaut 2 × (largeur + hauteur).</p><details><summary>Voir mes champs pour faire les calculs</summary><div class="table-wrap"><table><thead><tr><th>Champ</th><th>Dimensions</th><th>Aire</th></tr></thead><tbody>${game.rectangles.filter(r=>r.player===calculating).map((r,i)=>`<tr><td>${i+1}</td><td>${r.w} × ${r.h}</td><td>${r.area}</td></tr>`).join('')}</tbody></table></div></details><form id="score-form" class="fields-results-form"><label>A · Aire totale<input name="area" type="number" min="0" required inputmode="numeric"></label><label>P · Périmètre total<input name="perimeter" type="number" min="0" required inputmode="numeric"></label><label>R · Plus grand champ<input name="largest" type="number" min="0" max="36" required inputmode="numeric"></label><button class="primary">Vérifier mes calculs</button></form><p id="score-feedback" role="status"></p><button id="show-scores">Voir directement les résultats</button>`;
  $('#show-scores').onclick=finalScores;
  $('#score-form').onsubmit=event=>{event.preventDefault();const expected=E.totals(game)[calculating],data=new FormData(event.target),labels={area:'aire totale',perimeter:'périmètre total',largest:'plus grand champ'};const errors=Object.keys(labels).filter(k=>Number(data.get(k))!==expected[k]);if(errors.length){$('#score-feedback').textContent='À revoir : '+errors.map(k=>labels[k]).join(', ')+'. Tu peux réessayer ou voir les résultats.';return;}if(calculating===0&&!computer){calculating=1;scoreForm();}else finalScores();};
 }
 function finalScores(){const {totals,criteria,points}=E.scores(game),winner=points[0]===points[1]?'Égalité, bravo aux deux fermiers !':`${names[points[0]>points[1]?0:1]} remporte la partie !`;
  $('#results').innerHTML=`<h2 class="fields-result-heading">${escape(winner)}</h2><div class="table-wrap"><table><thead><tr><th>Critère</th>${names.map(n=>`<th>${escape(n)}</th>`).join('')}</tr></thead><tbody>${[['area','A · Aire totale'],['perimeter','P · Périmètre total'],['largest','R · Plus grand rectangle']].map(([k,label])=>`<tr><th>${label}</th>${totals.map((t,p)=>`<td>${t[k]} → ${criteria[k][p]} point</td>`).join('')}</tr>`).join('')}<tr><th>Total des points</th>${points.map(p=>`<td><strong>${p}</strong></td>`).join('')}</tr></tbody></table></div><p>Le périmètre total est la somme des périmètres de chaque rectangle, même lorsqu’ils partagent un côté.</p><button id="play-again" class="primary">Rejouer</button>`;$('#play-again').onclick=restart;
 }
 function results(){calculating=0;scoreForm();$('#results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
 function restart(){if(game&&!game.finished&&!confirm('Quitter cette partie et en commencer une nouvelle ?'))return;clearTimeout(timer);busy=false;game=null;selection=null;$('#dice').classList.remove('rolling');$('#match').hidden=true;$('#setup').hidden=false;$('#name-red').focus();}
 $('#restart').onclick=restart;
 $('#opponent').onchange=()=>{$('#blue-label').hidden=$('#opponent').value==='computer';$('#name-blue').required=$('#opponent').value!=='computer';};
 $('#setup-form').onsubmit=event=>{event.preventDefault();clearTimeout(timer);computer=$('#opponent').value==='computer';names=[$('#name-red').value.trim()||'Joueur 1',computer?'Ordinateur':$('#name-blue').value.trim()||'Joueur 2'];game=E.create();busy=false;$('#setup').hidden=true;$('#match').hidden=false;$('#results').hidden=true;turn();$('#roll').focus();};
 addEventListener('beforeunload',event=>{if(game&&!game.finished){event.preventDefault();event.returnValue='';}});
})();
