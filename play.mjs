import {conditionFormula} from './rules.mjs';
import {ALL_CONDITIONS} from './conditions.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
const locks=new Map();
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const heroismCap=actor=>Math.max(3,2*(actor.system.build?.character?.level||1));
export function readSession(actor){return clone(actor.system.session||{heroism:1,conditions:[],rolls:[]});}
function owned(actor){if(!actor?.isOwner)throw Error('You must own this character to change its play state or roll.');}
async function serial(actor,fn){owned(actor);const key=actor.uuid||actor.id;const previous=locks.get(key)||Promise.resolve();const task=previous.catch(()=>{}).then(()=>{owned(actor);return fn();});locks.set(key,task);try{return await task;}finally{if(locks.get(key)===task)locks.delete(key);}}
export async function adjustHeroism(actor,amount){return serial(actor,async()=>{
 if(![-1,1].includes(amount))throw Error('Heroism changes must be +1 or -1.');
 const state=readSession(actor);
 if(amount>0&&state.conditions.includes('Guilty'))throw Error('Guilty prevents gaining Heroism.');
 if(amount<0&&state.conditions.includes('Guilt-Ridden'))throw Error('Guilt-Ridden prevents using Heroism.');
 const value=Math.max(0,Math.min(heroismCap(actor),state.heroism+amount));
 await actor.update({'system.session.heroism':value});return readSession(actor);
});}
export async function toggleCondition(actor,condition){return serial(actor,async()=>{
 if(!ALL_CONDITIONS.includes(condition))throw Error('Unknown SAGA condition.');
 let {conditions}=readSession(actor);
 if(conditions.includes(condition))conditions=conditions.filter(c=>c!==condition);
 else{const family=/^(Injured|Empowered)(?: \(|$)/.exec(condition)?.[1];if(family)conditions=conditions.filter(c=>c!==family&&!c.startsWith(family+' ('));conditions.push(condition);}
 await actor.update({'system.session.conditions':conditions});return readSession(actor);
});}
export async function resetSession(actor){return serial(actor,async()=>{await actor.update({'system.session':{heroism:1,conditions:[],rolls:[]}});return readSession(actor);});}
export async function replaceSession(actor,data,expected){return serial(actor,async()=>{
 if(JSON.stringify(readSession(actor))!==JSON.stringify(expected))throw Error('Play state changed in another window. Reopen Play Mode before replacing it.');
 if(!Number.isInteger(data.heroism)||data.heroism<0||data.heroism>heroismCap(actor)||!Array.isArray(data.conditions)||data.conditions.some(c=>!ALL_CONDITIONS.includes(c))||!Array.isArray(data.rolls))throw Error('Invalid play state.');
 await actor.update({'system.session':clone(data)});return readSession(actor);
});}
export async function rollActor(actor,{label,formula,group='',applyConditions=true}){return serial(actor,async()=>{
 const before=readSession(actor);
 if(group.toLowerCase()==='powers'&&before.conditions.includes('Power Dampened'))throw Error('Power Dampened prevents power rolls.');
 if(typeof formula!=='string'||!formula.trim())throw Error('Missing dice formula.');
 const suffix=applyConditions?conditionFormula(before.conditions):'';
 const roll=await new foundry.dice.Roll(suffix?`(${formula})${suffix}`:formula,actor.getRollData?.()||{}).evaluate();
 const main=roll.dice[0];const natural=main?.results?.find(r=>r.active!==false&&!r.discarded)?.result;
 const critical=Number.isFinite(natural)&&(natural===1||natural===main.faces);
 const result={total:roll.total,dieRoll:natural,dieMax:main?.faces,formula:roll.formula,critical,label,date:new Date().toISOString()};
 const Chat=CONFIG.ChatMessage.documentClass;
 await roll.toMessage({speaker:Chat.getSpeaker({actor}),flavor:escape(label)},{rollMode:game.settings.get('core','rollMode')});
 // Read again after rolling: do not overwrite condition edits made while the dice were resolving.
 const latest=readSession(actor);
 const heroism=Math.min(heroismCap(actor),latest.heroism+(critical&&!latest.conditions.includes('Guilty')?1:0));
 try{await actor.update({'system.session.heroism':heroism,'system.session.rolls':[result,...latest.rolls].slice(0,100)});}catch(e){throw Error(`The roll was posted to chat, but its Heroism/history could not be saved: ${e.message}`);}
 return {...result,session:readSession(actor)};
});}
