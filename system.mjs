import {SagaCharacterData,SagaItemData} from './models.mjs';
import {SagaActorSheet,SagaItemSheet} from './sheets.mjs';
import {api} from './studio.mjs';
import {importActorFile} from './importer.mjs';
const Hooks=foundry.helpers.Hooks;
Hooks.once('init',()=>{
 CONFIG.Actor.dataModels.character=SagaCharacterData;
 CONFIG.Item.dataModels.item=SagaItemData;
 const sheets=foundry.applications.apps.DocumentSheetConfig;
 sheets.registerSheet(CONFIG.Actor.documentClass,'saga',SagaActorSheet,{types:['character'],makeDefault:true,label:'SAGA Character'});
 sheets.registerSheet(CONFIG.Item.documentClass,'saga',SagaItemSheet,{types:['item'],makeDefault:true,label:'SAGA Item'});
 // SAGA uses narrative turn order. Set tracker initiatives manually; no invented initiative die.
 CONFIG.Combat.initiative.formula=null;
 game.saga=api;
 api.importActorFile=importActorFile;
});
Hooks.on('renderActorDirectory',(app,html)=>{
 const root=html?.nodeType===1?html:html?.[0]??app.element;
 if(!root||root.querySelector('.saga-import')||!game.user.can('ACTOR_CREATE'))return;
 const b=document.createElement('button');b.type='button';b.className='saga-import';b.textContent='Import SAGA / SWB Actor copy';
 b.onclick=()=>{const input=document.createElement('input');input.type='file';input.accept='.json';input.onchange=async()=>{if(!input.files[0])return;try{await importActorFile(input.files[0]);}catch(e){ui.notifications.error(e.message);}};input.click();};
 (root.querySelector('.directory-header')||root).append(b);
});
