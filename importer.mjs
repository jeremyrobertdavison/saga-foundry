import {normalize,project} from './rules.mjs';
const copy=x=>JSON.parse(JSON.stringify(x));
export function convertActor(source,userId){
 if(!source||source.type!=='character'||typeof source.name!=='string'||!source.system)throw Error('Choose an exported Foundry character Actor JSON. For .sagaChar files, use Load Hero in the creator.');
 const old=copy(source),system=old.system;
 const build=system.build??old.flags?.['saga-character-studio']?.build;
 if(build?.schemaVersion>1)throw Error('This build uses a newer format. Update SAGA before importing.');
 const character=build?normalize(build.character):null;
 const session=system.session??old.flags?.['saga-character-studio']?.session??{heroism:1,conditions:[],rolls:[]};
 if(!Number.isFinite(session.heroism)||!Array.isArray(session.conditions)||!Array.isArray(session.rolls))throw Error('Invalid saved Play Mode state.');
 return {
  name:old.name,type:'character',img:old.img||'icons/svg/mystery-man.svg',ownership:{[userId]:3},
  system:{biography:system.biography||'',health:system.health??{value:0,min:0,max:0},power:system.power??{value:0,min:0,max:0},attributes:character?project(character):system.attributes||{},groups:system.groups||{},build:character?{schemaVersion:1,character}:null,session,legacyBackup:{source:old}},
  prototypeToken:{name:old.prototypeToken?.name||old.name,actorLink:true,disposition:old.prototypeToken?.disposition??1,...(old.prototypeToken?.texture?{texture:old.prototypeToken.texture}:{texture:{src:old.img||'icons/svg/mystery-man.svg'}})},
  items:(old.items||[]).map(item=>({name:item.name,type:'item',img:item.img||'icons/svg/item-bag.svg',system:{description:item.system?.description||'',quantity:Number.isFinite(item.system?.quantity)?Math.max(0,item.system.quantity):1,legacyBackup:item}}))
 };
}
export async function importActorFile(file){
 if(!game.user.can('ACTOR_CREATE'))throw Error('You need permission to create Actors to import a copy.');
 if(file.size>25*1024*1024)throw Error('Actor exports must be smaller than 25 MB.');
 const data=convertActor(JSON.parse(await file.text()),game.user.id);
 const actor=await CONFIG.Actor.documentClass.create(data);
 ui.notifications.info(`Imported a new copy of ${actor.name}.`);
 await actor.sheet.render({force:true});return actor;
}
