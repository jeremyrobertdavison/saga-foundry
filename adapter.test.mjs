import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hero} from './fixture.mjs';
const hooks={};globalThis.Hooks={once:(k,f)=>hooks[k]=f,on:(k,f)=>hooks[k]=f};
let lastWindow;class App{constructor(){lastWindow=this;}render(options){assert.deepEqual(options,{force:true});this.rendered=true;}bringToFront(){}}
const assign=(obj,key,value)=>{const keys=key.split('.');const tail=keys.pop();let p=obj;for(const k of keys)p=p[k]??={};if(tail.startsWith('-='))delete p[tail.slice(2)];else p[tail]=structuredClone(value);};
let count=0;globalThis.foundry={applications:{api:{ApplicationV2:App}},utils:{randomID:()=>`id${++count}`,expandObject:o=>{const out={};for(const [k,v]of Object.entries(o))assign(out,k,v);return out;}}};
const actors=new Map();let createPermission=true;
globalThis.game={release:{generation:14},system:{id:'saga'},modules:new Map([['saga-character-studio',{}]]),user:{id:'player',can:()=>createPermission},actors:{get:id=>actors.get(id),get contents(){return [...actors.values()];}}};
globalThis.ui={notifications:{info:()=>{},error:()=>{}}};globalThis.CONST={DOCUMENT_OWNERSHIP_LEVELS:{OWNER:3}};
function actor(data){return {...data,id:`a${++count}`,isOwner:true,getFlag(ns,key){return this.flags?.[ns]?.[key];},async setFlag(ns,key,v){assign(this,`flags.${ns}.${key}`,v);},async update(data){for(const [k,v]of Object.entries(data))assign(this,k,v);}};}
foundry.documents={Actor:{create:async data=>{const a=actor(data);actors.set(a.id,a);return a;}}};
await import('../../scripts/studio.mjs');hooks.ready();const api=game.saga;
test('create, reopen, edit same actor; conflicts and ownership checked',async()=>{
 api.open();const key=lastWindow.key;const saved=await api.save(key,hero);const a=actors.get(saved.id);assert.equal(a.prototypeToken.actorLink,true);assert.equal(a.ownership.player,3);assert.equal(a.system.build.character.powers[0].description,'Test power');assert.equal(api.load(key,a.id).character.heroName,hero.heroName);
 a.prototypeToken.texture={src:'my-token.webp'};await api.save(key,{...hero,heroName:'Changed'});assert.equal(actors.size,1);assert.equal(a.prototypeToken.texture.src,'my-token.webp');
 a.system.biography='GM edit';await assert.rejects(api.save(key,hero),/changed/);api.load(key,a.id);a.isOwner=false;await assert.rejects(api.save(key,hero),/own/);a.isOwner=true;
});
test('legacy migration keeps backup, preserves health, token and unrelated fields',async()=>{
 const a=actor({name:'Legacy',img:'portrait.webp',system:{biography:'Original',health:{value:7,max:10},attributes:{Skills:{Old:{value:'1d6'}},Other:{custom:{value:2}}}},flags:{},prototypeToken:{texture:{src:'token.webp'}}});actors.set(a.id,a);api.open();const key=lastWindow.key;assert.equal(api.load(key,a.id).character,null);await api.save(key,hero);assert.equal(a.system.health.value,7);assert.equal(a.prototypeToken.texture.src,'token.webp');assert.equal(a.system.attributes.Other.custom.value,2);assert.equal(a.system.attributes.Skills.Old,undefined);assert.equal(a.system.legacyBackup.system.biography,'Original');assert.equal(a.img,'portrait.webp');
});
test('creation permissions and session conflicts',async()=>{api.open();const key=lastWindow.key;api.reset(key);createPermission=false;await assert.rejects(api.save(key,hero),/cannot create/);createPermission=true;await api.save(key,hero);const old=api.session(key);await api.setSession(key,{heroism:2,conditions:[],rolls:[]},old);await assert.rejects(api.setSession(key,{heroism:3,conditions:[],rolls:[]},old),/changed/);assert.equal(api.session(key).heroism,2);});

test('v14 namespaced dice and chat APIs preserve roll mode and attribute formula',async()=>{
 let sent;foundry.dice={Roll:class{constructor(formula){this.formula=formula;this.total=4;this.dice=[{faces:6,results:[{result:4}]}];}async evaluate(){return this;}async toMessage(data,options){sent={data,options};}}};
 foundry.documents.ChatMessage={getSpeaker:({actor})=>({actor:actor.id})};game.settings={get:()=> 'gmroll'};
 api.open();const key=lastWindow.key;api.load(key,[...actors.values()][0].id);
 const r=await api.roll(key,'Mind','1d6',0,[],false);assert.equal(r.formula,'1d6+0');assert.equal(sent.options.rollMode,'gmroll');
 assert.equal(globalThis.Roll,undefined);assert.equal(globalThis.Actor,undefined);assert.equal(globalThis.ChatMessage,undefined);
});
test('launcher consumes a text/plain response and gives the iframe its session',async()=>{
 globalThis.location={href:'https://example.org/foundry/game'};
 foundry.utils.getRoute=p=>'/foundry/'+p;
 globalThis.document={createElement:()=>({dataset:{}})};
 globalThis.fetch=async()=>({ok:true,status:200,headers:new Headers({'content-type':'text/plain'}),text:async()=>'<html><head></head><body><div id="root"></div></body></html>'});
 api.open();const frame=await lastWindow._renderHTML();
 assert.equal(frame.dataset.sagaSession,lastWindow.key);assert.match(frame.srcdoc,/<base href="https:\/\/example.org\/foundry\/systems\/saga\/app\/">/);assert.equal(frame.src,undefined);
 globalThis.fetch=async()=>({ok:false,status:404});await assert.rejects(lastWindow._renderHTML(),/HTTP 404/);
});
test('Play Mode updates do not hide a concurrent build change',async()=>{
 api.open();const key=lastWindow.key;api.reset(key);const saved=await api.save(key,hero);const a=actors.get(saved.id);a.system.biography='Changed by GM';await api.setSession(key,{heroism:2,conditions:[],rolls:[]},api.session(key));await assert.rejects(api.save(key,hero),/changed/);
});
test('rebuilding an imported legacy actor preserves its original source backup',async()=>{
 const a=actor({name:'Imported',system:{legacyBackup:{source:{important:'original export'}},attributes:{}},prototypeToken:{}});actors.set(a.id,a);api.open();const key=lastWindow.key;api.load(key,a.id);await api.save(key,hero);assert.equal(a.system.legacyBackup.source.important,'original export');
});
