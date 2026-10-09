import {test} from 'node:test';
import assert from 'node:assert/strict';
import {adjustHeroism,toggleCondition,rollActor,readSession} from '../../scripts/play.mjs';
let natural=1,faces=10,sent=[];
globalThis.foundry={dice:{Roll:class{constructor(formula){this.formula=formula;this.dice=[{faces,results:[{result:natural,active:true}]}];this.total=natural;}async evaluate(){return this;}async toMessage(data,options){sent.push({formula:this.formula,data,options});}}}};
globalThis.CONFIG={ChatMessage:{documentClass:{getSpeaker:({actor})=>({actor:actor.id})}}};globalThis.game={settings:{get:()=> 'gmroll'}};
const actor=()=>({id:'hero',uuid:'Actor.hero',isOwner:true,system:{build:{character:{level:1}},session:{heroism:1,conditions:[],rolls:[]}},getRollData:()=>({}),async update(data){for(const [path,value]of Object.entries(data)){if(path==='system.session'){this.system.session=value;continue;}this.system.session[path.split('.').at(-1)]=structuredClone(value);}}});
test('low and high main-die results grant once, normal results do not, cap enforced',async()=>{
 const a=actor();natural=1;await rollActor(a,{label:'Mind',formula:'1d10'});assert.equal(a.system.session.heroism,2);
 natural=10;await rollActor(a,{label:'Mind',formula:'1d10'});assert.equal(a.system.session.heroism,3);
 await rollActor(a,{label:'Mind',formula:'1d10'});assert.equal(a.system.session.heroism,3);
 a.system.session.heroism=1;natural=5;await rollActor(a,{label:'Mind',formula:'1d10'});assert.equal(a.system.session.heroism,1);assert.equal(a.system.session.rolls.length,4);
 assert.equal(sent.at(-1).options.rollMode,'gmroll');assert.equal(sent.at(-1).data.speaker.actor,'hero');
});
test('conditions replace severity, modify rolls, and remove cleanly',async()=>{
 const a=actor();await toggleCondition(a,'Injured');await toggleCondition(a,'Injured (3)');await toggleCondition(a,'Empowered');assert.deepEqual(readSession(a).conditions,['Injured (3)','Empowered']);
 natural=5;const r=await rollActor(a,{label:'Skill',formula:'1d10 + 5'});assert.equal(r.formula,'(1d10 + 5)-1d6+1');await toggleCondition(a,'Injured (3)');assert.deepEqual(readSession(a).conditions,['Empowered']);
});
test('Guilty blocks automatic and manual gains; Guilt-Ridden blocks spending; no negatives',async()=>{
 const a=actor();await toggleCondition(a,'Guilty');natural=1;await rollActor(a,{label:'Mind',formula:'1d10'});assert.equal(a.system.session.heroism,1);await assert.rejects(adjustHeroism(a,1),/Guilty/);
 await toggleCondition(a,'Guilt-Ridden');await assert.rejects(adjustHeroism(a,-1),/Guilt-Ridden/);await toggleCondition(a,'Guilt-Ridden');await adjustHeroism(a,-1);await adjustHeroism(a,-1);assert.equal(a.system.session.heroism,0);
});
test('Power Dampened blocks powers but allows attributes',async()=>{const a=actor();await toggleCondition(a,'Power Dampened');const count=sent.length;await assert.rejects(rollActor(a,{label:'Fly',formula:'1d6',group:'powers'}),/Power Dampened/);assert.equal(sent.length,count);await rollActor(a,{label:'Mind',formula:'1d6',group:'Attibutes'});});
test('owner permissions checked and same-client changes serialize',async()=>{const a=actor();await Promise.all([adjustHeroism(a,1),adjustHeroism(a,1)]);assert.equal(a.system.session.heroism,3);a.isOwner=false;await assert.rejects(adjustHeroism(a,-1),/own/);await assert.rejects(toggleCondition(a,'Injured'),/own/);await assert.rejects(rollActor(a,{label:'Mind',formula:'1d10'}),/own/);});
test('free dice omit conditions and still award main-die critical Heroism',async()=>{const a=actor();await toggleCondition(a,'Injured (7)');natural=10;const r=await rollActor(a,{label:'Free d10',formula:'1d10',applyConditions:false});assert.equal(r.formula,'1d10');assert.equal(r.session.heroism,2);});
