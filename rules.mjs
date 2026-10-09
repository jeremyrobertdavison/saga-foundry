export const ID='saga';
export const ATTRS=['general','arcana','technology','body','mind','mutation'];
export const die=p=>p>=12?'1d20':p>=7?'1d12':p>=5?'1d10':p>=3?'1d8':p>=1?'1d6':'1d4';
export function validate(c){
 if(!c || typeof c!=='object') throw Error('Missing character.');
 if(!Number.isInteger(c.level)||c.level<1||c.level>100) throw Error('Level must be an integer from 1 to 100.');
 if(!c.heroName?.trim()) throw Error('Enter a hero name.');
 for(const key of ATTRS) if(!Number.isInteger(c.attributes?.[key])||c.attributes[key]<0) throw Error('Attribute points must be nonnegative whole numbers.');
 for(const list of [c.skills||[],c.powers||[]]) for(const entry of list){
  if(!entry.name?.trim()||!Number.isInteger(entry.points)||entry.points<0) throw Error('Skills and powers need names and nonnegative whole-number points.');
  if(entry.linkedAttribute && !ATTRS.includes(entry.linkedAttribute)) throw Error('Unknown linked attribute.');
 }
 for(const [label,spent,total] of [['Attributes',ATTRS.reduce((n,k)=>n+c.attributes[k],0),5*c.level],['Skills',(c.skills||[]).reduce((n,e)=>n+e.points,0),6*c.level],['Powers',(c.powers||[]).reduce((n,e)=>n+e.points,0),5*c.level]]) if(spent!==total) throw Error(`${label}: spend exactly ${total} points (currently ${spent}).`);
 return c;
}
export function project(c){
 const attributes={Attibutes:{},Skills:{},Powers:{}};
 for(const key of ATTRS){const label=key[0].toUpperCase()+key.slice(1);attributes.Attibutes[label]={value:die(c.attributes[key]),label,dtype:'Formula',group:'Attibutes'};}
 for(const [group,entries] of [['Skills',c.skills||[]],['Powers',c.powers||[]]]) entries.forEach((e,i)=>{
  attributes[group][`saga${i}`]={value:`${die(e.points)} + ${e.linkedAttribute?c.attributes[e.linkedAttribute]:0}`,label:e.name,dtype:'Formula',group};
 });
 return attributes;
}
export function legacy(actor){
 // Deliberately do not reverse-infer allocations from many-to-one dice tiers.
 return {name:actor.name,biography:actor.system.biography||'',groups:actor.system.attributes||{}};
}
export function conditionFormula(conditions){
 const dice=['1','1d4','1d6','1d8','1d10','1d12','1d20'];
 return conditions.flatMap(c=>{const m=/^(Injured|Empowered)(?: \(([2-7])\))?$/.exec(c);return m?[`${m[1]==='Injured'?'-':'+'}${dice[Number(m[2]||1)-1]}`]:[];}).join('');
}

export function normalize(character){
 const c=JSON.parse(JSON.stringify(validate(character)));
 c.attributeDice=Object.fromEntries(ATTRS.map(k=>[k,die(c.attributes[k])]));
 for(const entries of [c.skills||[],c.powers||[]])for(const e of entries)e.finalDieString=`${die(e.points)} + ${e.linkedAttribute?c.attributes[e.linkedAttribute]:0}`;
 return c;
}
