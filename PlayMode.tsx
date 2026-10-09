import React,{useState,useRef} from 'react';
import {Character} from '../types';
import {ATTRIBUTE_KEYS,ATTRIBUTE_LABELS} from '../utils/characterUtils';
import {host,sessionKey,fail} from '../host';
const ALL_CONDITIONS = [
  'Injured', 'Injured (2)', 'Injured (3)', 'Injured (4)', 'Injured (5)', 'Injured (6)', 'Injured (7)',
  'Defeated',
  'Empowered', 'Empowered (2)', 'Empowered (3)', 'Empowered (4)', 'Empowered (5)', 'Empowered (6)', 'Empowered (7)',
  'Unstable', 'Power Dampened', 'Stunned', 'Demoralized', 'Fearful', 'Enraged', 'Confused', 'Compelled',
  'Distracted', 'Delirious', 'Hacked', 'Guilt-Ridden', 'Guilty', 'Distrust', 'Publicly Despised',
  'Muted', 'Deafened', 'Anchored', 'Panicking', 'Frozen in Fear'
];

const CONDITION_EFFECTS: Record<string, string> = {
  'Injured': '-1', 'Injured (2)': '-1d4', 'Injured (3)': '-1d6', 'Injured (4)': '-1d8', 'Injured (5)': '-1d10', 'Injured (6)': '-1d12', 'Injured (7)': '-1d20',
  'Empowered': '+1', 'Empowered (2)': '+1d4', 'Empowered (3)': '+1d6', 'Empowered (4)': '+1d8', 'Empowered (5)': '+1d10', 'Empowered (6)': '+1d12', 'Empowered (7)': '+1d20',
};

const CONDITION_DESCRIPTIONS: Record<string, string> = {
  'Injured': 'Receive -1 on all rolls made.',
  'Injured (2)': 'Receive -1d4 on all rolls made.',
  'Injured (3)': 'Receive -1d6 on all rolls made.',
  'Injured (4)': 'Receive -1d8 on all rolls made.',
  'Injured (5)': 'Receive -1d10 on all rolls made.',
  'Injured (6)': 'Receive -1d12 on all rolls made.',
  'Injured (7)': 'Receive -1d20 on all rolls made.',
  'Defeated': 'Character is unable to take actions and is removed from Initiative.',
  'Empowered': 'Receive +1 on all rolls made.',
  'Empowered (2)': 'Receive +1d4 on all rolls made.',
  'Empowered (3)': 'Receive +1d6 on all rolls made.',
  'Empowered (4)': 'Receive +1d8 on all rolls made.',
  'Empowered (5)': 'Receive +1d10 on all rolls made.',
  'Empowered (6)': 'Receive +1d12 on all rolls made.',
  'Empowered (7)': 'Receive +1d20 on all rolls made.',
  'Unstable': "Character's power becomes unreliable.",
  'Power Dampened': 'Character is unable to roll any of their abilities under "Powers".',
  'Stunned': 'Character skips their next turn in the initiative and cannot join team attacks.',
  'Demoralized': 'Receive a penalty on rolls based on severity.',
  'Fearful': 'Cannot move toward the source of your fear.',
  'Enraged': 'Must use next turn to attack nearest target.',
  'Confused': 'Character moves or acts unpredictably (Odds/Evens check).',
  'Compelled': 'Character must take actions as directed by the source.',
  'Distracted': 'Minor penalty (-1d4) to teamwork related rolls.',
  'Delirious': 'Major penalty (-1d12) to teamwork related rolls.',
  'Hacked': 'Electronic device is unusable.',
  'Guilt-Ridden': 'Immune to benefits of Heroism.',
  'Guilty': 'Cannot gain additional Heroism.',
  'Distrust': 'Cannot take actions that rely on allies.',
  'Publicly Despised': 'Major penalty (-1d12) on all social contests.',
  'Muted': 'Cannot speak or use verbal components.',
  'Deafened': 'Cannot hear or use skills reliant on hearing.',
  'Anchored': 'Cannot be moved by external abilities.',
  'Panicking': 'Unable to use reactions to assist others.',
  'Frozen in Fear': 'Unable to move or act in presence of fear source.'
};

interface Session {heroism:number;conditions:string[];rolls:any[]}
const PlayMode:React.FC<{character:Character;onBackToRules:()=>void}>=({character,onBackToRules})=>{
 const [state,setState]=useState<Session>(()=>host.session(sessionKey));
 const current=useRef(state);const busyRef=useRef(false);const [busy,setBusy]=useState(false);
 const cap=Math.max(3,character.level*2);
 const commit=async(next:Session)=>{await host.setSession(sessionKey,next,current.current);current.current=next;setState(next);};
 const action=async(fn:()=>Promise<void>)=>{if(busyRef.current)return;busyRef.current=true;setBusy(true);try{await fn();}catch(e){fail(e);}finally{busyRef.current=false;setBusy(false);}};
 const changeHeroism=(amount:number)=>void action(async()=>commit({...current.current,heroism:Math.max(0,Math.min(cap,current.current.heroism+amount))}));
 const toggle=(condition:string)=>void action(async()=>{
  let conditions=[...current.current.conditions];
  if(conditions.includes(condition))conditions=conditions.filter(c=>c!==condition);
  else {const family=/^(Injured|Empowered)/.exec(condition)?.[1];if(family)conditions=conditions.filter(c=>!c.startsWith(family));conditions.push(condition);}
  await commit({...current.current,conditions});
 });
 const roll=(label:string,die:string,modifier=0,flat=false)=>void action(async()=>{
  const result=await host.roll(sessionKey,label,die,modifier,current.current.conditions,flat);
  const critical=!flat&&(result.dieRoll===1||result.dieRoll===result.dieMax);
  const next={...current.current,heroism:Math.min(cap,current.current.heroism+(critical&&!current.current.conditions.includes('Guilty')?1:0)),rolls:[{...result,label,date:new Date().toISOString(),critical},...current.current.rolls].slice(0,100)};
  await commit(next);
 });
 const panel='p-5 bg-slate-800 rounded-xl border border-slate-700 space-y-3';
 const btn='rounded-lg px-4 py-2 bg-sky-700 hover:bg-sky-600 disabled:opacity-40';
 return <div className="space-y-6">
  <div className="flex justify-between items-center"><h2 className="text-3xl font-bold text-emerald-400">{character.heroName} · Play Mode</h2><button className={btn} onClick={onBackToRules}>Rules</button></div>
  <p className="text-sm text-slate-400">Rolls appear in Foundry chat using your selected roll visibility. Heroism and conditions are saved on the world Actor. Injured and Empowered modify checks; other conditions are reminders unless noted.</p>
  <div className="grid md:grid-cols-2 gap-5">
   <section className={panel}><h3 className="text-xl text-amber-300">Heroism · {state.heroism} / {cap}</h3><div className="flex gap-3"><button className={btn} disabled={busy||state.heroism===0||state.conditions.includes('Guilt-Ridden')} onClick={()=>changeHeroism(-1)}>Spend 1</button><button className={btn} disabled={busy||state.heroism>=cap||state.conditions.includes('Guilty')} onClick={()=>changeHeroism(1)}>Gain 1</button></div><p className="text-xs text-slate-400">Spending tracks the resource; apply the chosen narrative benefit at the table. Critical checks grant 1 Heroism unless Guilty.</p></section>
   <section className={panel}><h3 className="text-xl text-sky-300">Conditions</h3><select aria-label="Add condition" className="p-2 bg-slate-900 w-full" disabled={busy} value="" onChange={e=>{if(e.target.value)toggle(e.target.value);}}><option value="">Add condition…</option>{ALL_CONDITIONS.map(c=><option key={c}>{c}</option>)}</select>{state.conditions.map(c=><button key={c} title={CONDITION_DESCRIPTIONS[c]} disabled={busy} className="block text-left text-sm text-amber-200" onClick={()=>toggle(c)}>{c} × — {CONDITION_DESCRIPTIONS[c]}</button>)}</section>
  </div>
  <section className={panel}><h3 className="text-xl text-sky-300">Attributes</h3><div className="grid sm:grid-cols-2 gap-2">{ATTRIBUTE_KEYS.map(k=><button className={btn+' flex justify-between'} disabled={busy} key={k} onClick={()=>roll(ATTRIBUTE_LABELS[k],character.attributeDice[k])}><span>{ATTRIBUTE_LABELS[k]}</span><span>{character.attributeDice[k]}</span></button>)}</div></section>
  {(['skills','powers'] as const).map(group=><section className={panel} key={group}><h3 className="text-xl capitalize text-purple-300">{group}</h3>{(character[group]||[]).map((e,i)=>{const modifier=e.linkedAttribute?character.attributes[e.linkedAttribute]:0;const die=e.finalDieString.split(' + ')[0];return <div key={e.id||i}><button className={btn+' w-full flex justify-between'} disabled={busy||(group==='powers'&&state.conditions.includes('Power Dampened'))} onClick={()=>roll(e.name,die,modifier)}><span>{e.name}</span><span>{die} + {modifier}</span></button>{'description' in e&&!!e.description&&<p className="text-sm p-2 text-slate-300">{String(e.description)}</p>}</div>;})}</section>)}
  <section className={panel}><h3 className="text-xl text-rose-300">Weaknesses</h3>{character.weaknesses?.map(w=><p key={w.id}><strong>{w.name} ({w.severity})</strong> — {w.effect}</p>)}</section>
  <section className={panel}><h3 className="text-xl">Free Dice</h3><div className="flex gap-2 flex-wrap">{[4,6,8,10,12,20,100].map(n=><button key={n} disabled={busy} className={btn} onClick={()=>roll(`Free d${n}`,`1d${n}`,0,true)}>d{n}</button>)}</div></section>
  <section className={panel}><div className="flex justify-between"><h3 className="text-xl">Recent Rolls</h3><button disabled={busy} className="text-amber-300" onClick={()=>{if(confirm('Reset Heroism to 1, clear conditions and this Actor’s local roll list? Foundry chat remains unchanged.'))void action(async()=>commit({heroism:1,conditions:[],rolls:[]}));}}>Reset session</button></div>{state.rolls.map((r,i)=><div className="border-b border-slate-700 py-2 flex justify-between gap-4" key={i}><span>{r.label}<small className="block text-slate-400">{r.formula} · {new Date(r.date).toLocaleTimeString()}</small></span><strong className={r.critical?'text-amber-300':'text-sky-300'}>{r.total}</strong></div>)}</section>
 </div>;
};
export default PlayMode;
