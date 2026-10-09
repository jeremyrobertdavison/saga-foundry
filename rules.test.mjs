import {test} from 'node:test';
import assert from 'node:assert/strict';
import {die,validate,project,conditionFormula} from '../../scripts/rules.mjs';
import {hero} from './fixture.mjs';
test('dice tier boundaries',()=>assert.deepEqual([0,1,2,3,4,5,6,7,11,12,25].map(die),['1d4','1d6','1d6','1d8','1d8','1d10','1d10','1d12','1d12','1d20','1d20']));
test('attribute checks omit points; skills and powers add attribute points',()=>{const a=project(hero);assert.equal(a.Attibutes.Mind.value,'1d10');assert.equal(a.Skills.saga0.value,'1d10 + 5');assert.equal(a.Powers.saga0.value,'1d10 + 5');});
test('invalid allocations and links rejected',()=>{assert.equal(validate(hero),hero);assert.throws(()=>validate({...hero,level:2}),/exactly/);assert.throws(()=>validate({...hero,skills:[{name:'X',points:6,linkedAttribute:'fake'}]}),/linked/);assert.throws(()=>validate({...hero,attributes:{...hero.attributes,mind:4.5}}),/whole/);});
test('duplicate display names survive mapping',()=>{const a=project({...hero,skills:[hero.skills[0],hero.skills[0]]});assert.equal(Object.keys(a.Skills).length,2);});
test('condition modifiers',()=>assert.equal(conditionFormula(['Injured (3)','Empowered','Stunned']),'-1d6+1'));
