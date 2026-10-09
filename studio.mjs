import {readSession,adjustHeroism,toggleCondition,resetSession,replaceSession,rollActor} from './play.mjs';
import {ALL_CONDITIONS,CONDITION_DESCRIPTIONS} from './conditions.mjs';
import {creatorDocument} from './frame.mjs';
import {ID,validate,project,legacy,conditionFormula,normalize} from './rules.mjs';
const sessions=new Map();
const HooksAPI=foundry.helpers?.Hooks ?? globalThis.Hooks;
const actorClass=()=>globalThis.CONFIG?.Actor?.documentClass ?? foundry.documents.Actor.implementation ?? foundry.documents.Actor;
const chatClass=()=>globalThis.CONFIG?.ChatMessage?.documentClass ?? foundry.documents.ChatMessage;
const copy=x=>JSON.parse(JSON.stringify(x));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stamp=a=>{const system=copy(a.system.toObject?.()??a.system);delete system.session;return JSON.stringify({name:a.name,img:a.img,system});};
function owned(id){const a=game.actors.get(id);if(!a||!a.isOwner)throw Error('You must own this world Actor.');return a;}
function getSession(key){const s=sessions.get(key);if(!s)throw Error('This editor session has closed.');return s;}
class SagaWindow extends foundry.applications.api.ApplicationV2 {
 static DEFAULT_OPTIONS={id:'saga-character-studio',classes:['saga-studio'],window:{title:'SAGA Character Studio',resizable:true},position:{width:1100,height:820}};
 _canDetach(){return false;}
 async _renderHTML(){
  const pageURL=new URL(foundry.utils.getRoute(`systems/${ID}/app/index.html`),globalThis.location.href);
  const response=await fetch(pageURL,{cache:'no-cache',credentials:'same-origin'});
  if(!response.ok)throw new Error(`SAGA creator could not load (HTTP ${response.status}). Reinstall the complete system ZIP.`);
  const html=creatorDocument(await response.text(),new URL('./',pageURL).href);
  const f=document.createElement('iframe');f.title='SAGA Character Studio';
  f.dataset.sagaSession=this.key;f.srcdoc=html;return f;
 }
 _replaceHTML(result,content){content.replaceChildren(result);}
 async close(options){if(!await foundry.applications.api.DialogV2.confirm({window:{title:'Close SAGA Studio?'},content:'<p>Unsaved character edits will be lost. Close the editor?</p>'}))return this; sessions.delete(this.key);return super.close(options);}
}
let app;
export const api={
 open(actorId=null,mode='edit'){
  if(game.system.id!=='saga')return ui.notifications.error('This creator requires the SAGA system.');
  if(actorId){try{owned(actorId);}catch(e){return ui.notifications.error(e.message);}
   for(const state of sessions.values())if(state.actorId===actorId&&state.window?.rendered){state.window.bringToFront();ui.notifications.info('This character is already open. Use its navigation to switch between editing and Play Mode.');return;}
  }else if(app?.rendered){app.bringToFront();return;}
  const key=foundry.utils.randomID();const window=new SagaWindow({id:`saga-studio-${key}`});window.key=key;
  sessions.set(key,{actorId:null,base:null,initialActor:actorId,mode,window});if(!actorId)app=window;window.render({force:true});
 },
 initialMode(key){return getSession(key).mode;},
 initial(key){return getSession(key).initialActor||null;},
 list(){return game.actors.contents.filter(a=>a.type==='character'&&a.isOwner).map(a=>({id:a.id,name:a.name,managed:!!a.system.build}));},
 load(key,id){const s=getSession(key);const a=owned(id);s.actorId=id;s.base=stamp(a);const build=a.system.build;if(build?.schemaVersion>1)throw Error('This character was saved by a newer SAGA Studio version. Update the system before editing.');return {character:build?copy(build.character):null,legacy:build?null:legacy(a),name:a.name};},
 reset(key){const s=getSession(key);s.actorId=null;s.base=null;},
 async save(key,character){const s=getSession(key);if(s.busy)throw Error('A save is already in progress.');s.busy=true;try{
  const c=normalize(character);let a=s.actorId?owned(s.actorId):null;
  if(a&&stamp(a)!==s.base)throw Error('This Actor changed after you opened it. Export your .sagaChar progress, reopen the Actor, then reapply your changes.');
  if(!a&&!game.user.can('ACTOR_CREATE'))throw Error('You cannot create Actors. Ask the GM to create a blank character and give you Owner permission, then open it here.');
  let img=c.characterImage;
  if(!img&&a?.img){img=a.img;c.characterImage=img;}
  if(img?.startsWith('data:')){
   if(!game.user.can('FILES_UPLOAD'))throw Error('Portrait upload requires File Upload permission. Ask the GM to upload it, or use a character with an existing portrait.');
   if(!/^data:image\/(png|jpeg|webp|gif);base64,/.test(img))throw Error('Use a PNG, JPEG, WebP or GIF portrait.');
   const response=await fetch(img);const blob=await response.blob();if(blob.size>10*1024*1024)throw Error('Portrait must be smaller than 10 MB.');
   const ext=blob.type.split('/')[1];const path=`worlds/${game.world.id}`;
   const result=await foundry.applications.apps.FilePicker.upload('data',path,new File([blob],`saga-${foundry.utils.randomID()}.${ext}`,{type:blob.type}),{}, {notify:false});
   if(!result?.path)throw Error('Portrait upload failed.');img=result.path;c.characterImage=img;
  }
  const attrs=project(c);const update={name:c.heroName,'system.biography':c.characterBackstory||'','system.build':{schemaVersion:1,character:c}};
  if(img)update.img=img;
  for(const group of ['Attibutes','Skills','Powers']){
   for(const k of Object.keys(a?.system.attributes?.[group]||{}))if(!(k in attrs[group]))update[`system.attributes.${group}.-=${k}`]=null;
   for(const [k,v]of Object.entries(attrs[group]))update[`system.attributes.${group}.${k}`]=v;
   update[`system.groups.${group}`]={key:group,label:'',dtype:'String'};
  }
  if(a){if(!a.system.build&&!a.system.legacyBackup)update['system.legacyBackup']={system:copy(a.system),name:a.name,img:a.img};await a.update(update);}
  else{const data=foundry.utils.expandObject(update);data.type='character';data.ownership={[game.user.id]:CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER};data.prototypeToken={name:c.heroName,actorLink:true,disposition:1,...(img?{texture:{src:img}}:{})};a=await actorClass().create(data);s.actorId=a.id;}
  s.base=stamp(a);ui.notifications.info(`Saved ${a.name}`);return {id:a.id,name:a.name,character:c};
 }finally{s.busy=false;}},
 session(key){const s=getSession(key);return s.actorId?copy(owned(s.actorId).system.session||{heroism:1,conditions:[],rolls:[]}):{heroism:1,conditions:[],rolls:[]};},
 conditions(){return {names:[...ALL_CONDITIONS],descriptions:{...CONDITION_DESCRIPTIONS}};},
 async setSession(key,data,expected){const s=getSession(key);if(!s.actorId)throw Error('Save the character before using Play Mode.');return replaceSession(owned(s.actorId),data,expected);},
 changeHeroism(key,amount){return adjustHeroism(owned(getSession(key).actorId),amount);},
 toggleCondition(key,condition){return toggleCondition(owned(getSession(key).actorId),condition);},
 resetSession(key){return resetSession(owned(getSession(key).actorId));},
 subscribeSession(key,callback){const id=HooksAPI.on('updateActor',a=>{const state=sessions.get(key);if(state?.actorId===a.id&&a.isOwner)callback(readSession(a));});return ()=>HooksAPI.off('updateActor',id);},
 async roll(key,label,die,modifier,_conditions,flat,group=''){const s=getSession(key);if(!s.actorId)throw Error('Save the character before rolling.');if(!/^1d(4|6|8|10|12|20|100)$/.test(die)||!Number.isFinite(modifier))throw Error('Invalid roll.');return rollActor(owned(s.actorId),{label,formula:modifier?`${die}+${modifier}`:die,group,applyConditions:!flat});}

};
HooksAPI.once('ready',()=>{game.saga=api;});
function button(_app,html){if(game.system.id!=='saga')return;const el=html?.nodeType===1?html:html?.[0]??_app.element;if(!el||el.querySelector('.saga-launch'))return;const target=el.querySelector('.directory-header')||el;const b=document.createElement('button');b.type='button';b.className='saga-launch';b.textContent='SAGA Character Studio';b.onclick=()=>api.open();target.append(b);}
HooksAPI.on('renderActorDirectory',button);
HooksAPI.on('getSceneControlButtons',controls=>{if(game.system.id!=='saga')return;const tokens=controls.tokens;if(tokens?.tools)tokens.tools.sagaStudio={name:'sagaStudio',title:'SAGA Character Studio',icon:'fa-solid fa-hat-wizard',button:true,onChange:()=>api.open()};});

