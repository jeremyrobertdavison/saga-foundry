import {readSession,heroismCap,adjustHeroism,toggleCondition,rollActor} from './play.mjs';
import {ALL_CONDITIONS,CONDITION_DESCRIPTIONS} from './conditions.mjs';
import {project} from './rules.mjs';
export const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const notify=e=>ui.notifications.error(e.message);
const button=(text,action)=>`<button type="button" data-saga="${action}">${text}</button>`;
export class SagaActorSheet extends foundry.applications.sheets.ActorSheetV2 {
 static DEFAULT_OPTIONS={classes:['saga-sheet'],tag:'div',position:{width:760,height:780},window:{resizable:true},form:{submitOnChange:false},viewPermission:2};
 async _renderHTML(){
  const a=this.document,c=a.system.build?.character,owner=this.isEditable;
  const state=readSession(a);const cap=heroismCap(a);
  const root=document.createElement('section');root.className='saga-content';
  const attrs=c?project(c):a.system.attributes||{};
  const groups=Object.entries(attrs).map(([group,entries])=>{
   if(entries?.value!==undefined)entries={[group]:entries};
   return `<section><h3>${escape(group==='Attibutes'?'Attributes':group)}</h3><div class="saga-roll-grid">${Object.entries(entries||{}).map(([key,e])=>{
    const rollable=e.dtype==='Formula';
    const contents=`<strong>${escape(e.label||key)}</strong><code>${escape(e.value)}</code>`;
    return rollable?`<button type="button" class="saga-stat saga-roll" data-group="${escape(group)}" data-formula="${escape(e.value)}" data-label="${escape(e.label||key)}" title="Roll ${escape(e.label||key)}: ${escape(e.value)}" ${owner&&!(group==='Powers'&&state.conditions.includes('Power Dampened'))?'':'disabled'}>${contents}</button>`:`<div class="saga-stat">${contents}</div>`;
   }).join('')}</div></section>`;
  }).join('');
  root.innerHTML=`<header class="saga-identity"><img src="${escape(a.img)}" alt="Character portrait"><div><small>SAGA • ${c?`LEVEL ${c.level}`:'CHARACTER'}</small><h1>${escape(a.name)}</h1><p>${escape(c?.characterName||'')}</p></div></header>
   ${owner?`<nav>${button(c?'Edit Character':'Open Character Creator','edit')}${c?button('Play Mode','play'):''}</nav>`:''}
   <p class="saga-note">${c?'Click an attribute, skill or power to roll in chat. Injured and Empowered modify rolls automatically. A natural 1 or maximum on the main die grants 1 Heroism, up to the cap, unless Guilty.':'This character has no complete SAGA build yet. The creator can load a .sagaChar file or walk you through the missing choices. Existing formulas remain available below.'}</p>
   <section class="saga-play-controls"><h3>Heroism <span class="saga-heroism-count">${state.heroism} / ${cap}</span></h3>
   ${owner?`<div class="saga-heroism-actions"><button type="button" data-saga="spend" ${state.heroism<=0||state.conditions.includes('Guilt-Ridden')?'disabled':''}>Use 1 Heroism</button><button type="button" data-saga="gain" ${state.heroism>=cap||state.conditions.includes('Guilty')?'disabled':''}>Gain 1 Heroism</button></div>`:''}
   <p class="saga-hint">Spending deducts 1 point; apply its chosen narrative benefit at the table.${state.conditions.includes('Guilty')?' Guilty prevents gaining Heroism.':''}${state.conditions.includes('Guilt-Ridden')?' Guilt-Ridden prevents spending Heroism.':''}</p>
   <h3>Conditions</h3>${owner?`<div class="saga-condition-add"><select aria-label="Condition to apply" data-condition-select><option value="">Choose a condition…</option>${ALL_CONDITIONS.filter(n=>!state.conditions.includes(n)).map(n=>`<option value="${escape(n)}">${escape(n)}</option>`).join('')}</select>${button('Apply condition','condition')}</div><p class="saga-hint" data-condition-preview></p>`:''}
   <ul class="saga-condition-list">${state.conditions.length?state.conditions.map(n=>`<li><div><strong>${escape(n)}</strong><small>${escape(CONDITION_DESCRIPTIONS[n]||'')}</small></div>${owner?`<button type="button" data-remove-condition="${escape(n)}" aria-label="Remove ${escape(n)}">Remove</button>`:''}</li>`).join(''):'<li>No active conditions.</li>'}</ul></section>
   ${groups}
   ${c?.weaknesses?.length?`<section><h3>Weaknesses</h3>${c.weaknesses.map(w=>`<p><b>${escape(w.name)}</b> (${escape(w.severity)}) — ${escape(w.effect)}</p>`).join('')}</section>`:''}
   <section><h3>Biography</h3><div class="saga-biography"></div></section>
   <details><summary>Optional resource trackers</summary><p>Generic trackers for campaigns that use them; these do not add SAGA combat rules.</p>${['health','power'].map(k=>`<label>${k}<input aria-label="${k} current" data-resource="${k}.value" type="number" value="${Number(a.system[k]?.value)||0}" ${owner?'':'disabled'}> / <input aria-label="${k} maximum" data-resource="${k}.max" type="number" value="${Number(a.system[k]?.max)||0}" ${owner?'':'disabled'}></label>`).join('')}${owner?button('Save trackers','resources'):''}</details>
   ${!c&&owner?`<details><summary>Edit legacy formulas</summary><p>JSON grouped by Attributes, Skills and Powers. This preserves legacy formulas without inventing build allocations.</p><textarea aria-label="Legacy formulas" data-legacy rows="10"></textarea>${button('Save formulas','legacy')}</details>`:''}
   ${a.items?.size?`<section><h3>Items</h3>${a.items.contents.map(i=>`<button type="button" data-item="${escape(i.id)}">${escape(i.name)}</button>`).join('')}</section>`:''}`;
  root.querySelector('.saga-biography').innerHTML=await foundry.applications.ux.TextEditor.enrichHTML(a.system.biography||'',{secrets:a.isOwner,relativeTo:a});
  const legacyInput=root.querySelector('[data-legacy]');if(legacyInput)legacyInput.value=JSON.stringify(attrs,null,2);
  root.querySelectorAll('[data-formula]').forEach(b=>b.onclick=async()=>{if(this._sagaRolling)return;this._sagaRolling=true;b.disabled=true;try{if(!this.isEditable)throw Error('You must own this character.');await rollActor(a,{formula:b.dataset.formula,label:b.dataset.label,group:b.dataset.group});}catch(e){notify(e);}finally{this._sagaRolling=false;b.disabled=!this.isEditable||(b.dataset.group==='Powers'&&readSession(a).conditions.includes('Power Dampened'));}});
  const select=root.querySelector('[data-condition-select]');if(select)select.onchange=()=>{root.querySelector('[data-condition-preview]').textContent=CONDITION_DESCRIPTIONS[select.value]||'';};
  root.querySelectorAll('[data-remove-condition]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await toggleCondition(a,b.dataset.removeCondition);}catch(e){notify(e);}finally{b.disabled=false;}});
  root.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>a.items.get(b.dataset.item)?.sheet.render({force:true}));
  root.querySelectorAll('[data-saga]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{
   if(!this.isEditable)throw Error('You must own this character.');
   if(b.dataset.saga==='spend'||b.dataset.saga==='gain'){await adjustHeroism(a,b.dataset.saga==='spend'?-1:1);
   }else if(b.dataset.saga==='condition'){if(!select.value)throw Error('Choose a condition first.');await toggleCondition(a,select.value);
   }else if(['edit','play'].includes(b.dataset.saga)){
    if(a.isToken&&!a.token?.actorLink)throw Error('Open the original character in the Actors directory to edit its build or use Play Mode. Unlinked token editing is not supported yet.');
    game.saga.open(a.id,b.dataset.saga);
   }else if(b.dataset.saga==='resources'){
    const update={};root.querySelectorAll('[data-resource]').forEach(i=>{if(!Number.isFinite(i.valueAsNumber))throw Error('Enter numbers for the resource trackers.');update[`system.${i.dataset.resource}`]=i.valueAsNumber;});await a.update(update);
   }else if(b.dataset.saga==='legacy'){
    const data=JSON.parse(legacyInput.value);if(!data||Array.isArray(data)||typeof data!=='object')throw Error('Enter a grouped JSON object.');
    const update={};const diff=(old,next,path)=>{for(const key of Object.keys(old||{}))if(!(key in next))update[`${path}.-=${key}`]=null;for(const [key,value]of Object.entries(next)){if(key.includes('.')||key.startsWith('-=')||['__proto__','constructor','prototype'].includes(key))throw Error('Use simple keys without dots or reserved names.');if(value&&typeof value==='object'&&!Array.isArray(value))diff(old?.[key],value,`${path}.${key}`);else update[`${path}.${key}`]=value;}};diff(a.system.attributes,data,'system.attributes');await a.update(update);
   }
  }catch(e){notify(e);}finally{b.disabled=false;}});
  return root;
 }
 _replaceHTML(result,content){content.replaceChildren(result);}
}
export class SagaItemSheet extends foundry.applications.sheets.ItemSheetV2 {
 static DEFAULT_OPTIONS={classes:['saga-sheet'],tag:'div',position:{width:520,height:480},form:{submitOnChange:false},viewPermission:2};
 async _renderHTML(){const d=this.document,root=document.createElement('section');root.className='saga-content';
  root.innerHTML=`<label>Name<input data-name value="${escape(d.name)}"></label><label>Quantity<input data-quantity type="number" min="0" value="${Number(d.system.quantity)||0}"></label><label>Description (HTML or plain text)<textarea data-description rows="10"></textarea></label>${this.isEditable?button('Save item','save'):''}`;
  root.querySelector('textarea').value=d.system.description||'';
  if(!this.isEditable)root.querySelectorAll('input,textarea').forEach(i=>i.disabled=true);
  const b=root.querySelector('button');if(b)b.onclick=async()=>{b.disabled=true;try{if(!this.isEditable)throw Error('You must own this item.');const q=root.querySelector('[data-quantity]').valueAsNumber;if(!Number.isFinite(q)||q<0)throw Error('Quantity must be a nonnegative number.');await d.update({name:root.querySelector('[data-name]').value,'system.quantity':q,'system.description':root.querySelector('textarea').value});}catch(e){notify(e);}finally{b.disabled=false;}};
  return root;
 }
 _replaceHTML(result,content){content.replaceChildren(result);}
}
