import React from 'react';
import { SkillFormData, CharacterAttributes, SelectOption } from '../types';
import { getDieForPoints, AttributeName, ATTRIBUTE_LABELS } from '../utils/characterUtils';
import Input from './Input';
import Select from './Select';

interface SkillInputRowProps {
  skill: SkillFormData;
  maxPoints: number;
  onChange: (id: string, updatedData: Partial<SkillFormData>) => void;
  onRemove: (id: string) => void;
  characterAttributes: CharacterAttributes;
  attributeOptions: SelectOption[];
  isFirst?: boolean; 
}

const SkillInputRow: React.FC<SkillInputRowProps> = ({ skill, maxPoints, onChange, onRemove, characterAttributes, attributeOptions, isFirst }) => {
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(skill.id, { name: e.target.value });
  };

  const handlePointsChange = (newPoints: number) => {
    const validatedPoints = Math.min(maxPoints, Math.max(0, isNaN(newPoints) ? 0 : newPoints));
    onChange(skill.id, { points: validatedPoints });
  };

  const handleLinkedAttributeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(skill.id, { linkedAttribute: e.target.value as AttributeName | '' });
  };

  const baseDie = getDieForPoints(skill.points);
  let bonus = 0;
  let linkedAttributeLabel = "";
  if (skill.linkedAttribute && characterAttributes[skill.linkedAttribute as AttributeName] !== undefined) {
    bonus = characterAttributes[skill.linkedAttribute as AttributeName];
    linkedAttributeLabel = ` (${ATTRIBUTE_LABELS[skill.linkedAttribute as AttributeName]})`;
  }
  const finalDieDisplay = `${baseDie} + ${bonus}${linkedAttributeLabel}`;


  return (
    <div className="p-4 bg-slate-700 rounded-lg shadow grid grid-cols-1 md:grid-cols-12 gap-3 items-end relative">
      <div className="md:col-span-4">
        <label htmlFor={`skillName-${skill.id}`} className="block text-xs font-medium text-slate-300 mb-1">
          Skill Name
        </label>
        <input
          id={`skillName-${skill.id}`}
          type="text"
          value={skill.name}
          onChange={handleNameChange}
          placeholder="e.g., Stealth, Persuasion"
          className="block w-full px-3 py-2 bg-input border border-slate-500 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
      </div>

      <div className="md:col-span-3">
        <label htmlFor={`skillPoints-${skill.id}`} className="block text-xs font-medium text-slate-300 mb-1">
          Points (Max {maxPoints})
        </label>
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => handlePointsChange(skill.points - 1)}
            disabled={skill.points <= 0}
            className="px-2 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-md disabled:opacity-50 text-sm"
            aria-label="Decrease skill points"
          >
            -
          </button>
          <input
            type="number"
            id={`skillPoints-${skill.id}`}
            value={skill.points}
            onChange={(e) => handlePointsChange(parseInt(e.target.value, 10))}
            min="0"
            max={maxPoints}
            className="w-12 text-center px-1 py-1.5 bg-input border border-slate-500 rounded-md text-slate-100 focus:ring-sky-500 focus:border-sky-500 text-sm"
            aria-label="Skill points"
          />
          <button
            type="button"
            onClick={() => handlePointsChange(skill.points + 1)}
            disabled={skill.points >= maxPoints}
            className="px-2 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-md text-sm disabled:opacity-50"
            aria-label="Increase skill points"
          >
            +
          </button>
        </div>
      </div>
      
      <div className="md:col-span-3">
         <label htmlFor={`linkedAttribute-${skill.id}`} className="block text-xs font-medium text-slate-300 mb-1">
          Linked Attribute
        </label>
        <select
          id={`linkedAttribute-${skill.id}`}
          value={skill.linkedAttribute}
          onChange={handleLinkedAttributeChange}
          className="block w-full pl-3 pr-8 py-2 text-sm bg-input border border-slate-500 focus:outline-none focus:ring-sky-500 focus:border-sky-500 rounded-md text-slate-100"
        >
          {attributeOptions.map(option => (
            <option key={option.value.toString()} value={option.value} className="bg-input text-slate-100">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2 flex items-end justify-center md:justify-end">
        <span className="px-2.5 py-1.5 bg-sky-700/60 text-sky-200 rounded-md text-sm font-semibold tabular-nums whitespace-nowrap">
          {finalDieDisplay}
        </span>
      </div>

      {!isFirst && (
         <button
            type="button"
            onClick={() => onRemove(skill.id)}
            className="absolute -top-2 -right-2 h-6 w-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors"
            aria-label="Remove skill"
          >
            &times;
          </button>
      )}
    </div>
  );
};

export default SkillInputRow;