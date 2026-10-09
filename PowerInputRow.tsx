import React from 'react';
import { PowerFormData, CharacterAttributes, SelectOption } from '../types';
import { getDieForPoints, AttributeName, ATTRIBUTE_LABELS } from '../utils/characterUtils';

interface PowerInputRowProps {
  power: PowerFormData;
  maxPoints: number;
  onChange: (id: string, updatedData: Partial<PowerFormData>) => void;
  onRemove: (id: string) => void;
  characterAttributes: CharacterAttributes;
  attributeOptions: SelectOption[];
  isFirst?: boolean; 
}

const PowerInputRow: React.FC<PowerInputRowProps> = ({ power, maxPoints, onChange, onRemove, characterAttributes, attributeOptions, isFirst }) => {
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(power.id, { name: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(power.id, { description: e.target.value });
  };

  const handlePointsChange = (newPoints: number) => {
    const validatedPoints = Math.min(maxPoints, Math.max(0, isNaN(newPoints) ? 0 : newPoints));
    onChange(power.id, { points: validatedPoints });
  };

  const handleLinkedAttributeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(power.id, { linkedAttribute: e.target.value as AttributeName | '' });
  };

  const baseDie = getDieForPoints(power.points);
  let bonus = 0;
  let linkedAttributeLabel = "";
  if (power.linkedAttribute && characterAttributes[power.linkedAttribute as AttributeName] !== undefined) {
    bonus = characterAttributes[power.linkedAttribute as AttributeName];
    linkedAttributeLabel = ` (${ATTRIBUTE_LABELS[power.linkedAttribute as AttributeName]})`;
  }
  const finalDieDisplay = `${baseDie} + ${bonus}${linkedAttributeLabel}`;


  return (
    <div className="p-4 bg-slate-700 rounded-lg shadow space-y-3 relative">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-4">
          <label htmlFor={`powerName-${power.id}`} className="block text-xs font-medium text-slate-300 mb-1">
            Power Name
          </label>
          <input
            id={`powerName-${power.id}`}
            type="text"
            value={power.name}
            onChange={handleNameChange}
            placeholder="e.g., Flight, Telekinesis"
            className="block w-full px-3 py-2 bg-input border border-slate-500 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="md:col-span-3">
          <label htmlFor={`powerPoints-${power.id}`} className="block text-xs font-medium text-slate-300 mb-1">
            Points (Max {maxPoints})
          </label>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => handlePointsChange(power.points - 1)}
              disabled={power.points <= 0}
              className="px-2 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-md disabled:opacity-50 text-sm"
              aria-label="Decrease power points"
            >
              -
            </button>
            <input
              type="number"
              id={`powerPoints-${power.id}`}
              value={power.points}
              onChange={(e) => handlePointsChange(parseInt(e.target.value, 10))}
              min="0"
              max={maxPoints}
              className="w-12 text-center px-1 py-1.5 bg-input border border-slate-500 rounded-md text-slate-100 focus:ring-sky-500 focus:border-sky-500 text-sm"
              aria-label="Power points"
            />
            <button
              type="button"
              onClick={() => handlePointsChange(power.points + 1)}
              disabled={power.points >= maxPoints}
              className="px-2 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-md text-sm disabled:opacity-50"
              aria-label="Increase power points"
            >
              +
            </button>
          </div>
        </div>
        
        <div className="md:col-span-3">
           <label htmlFor={`powerLinkedAttribute-${power.id}`} className="block text-xs font-medium text-slate-300 mb-1">
            Linked Attribute
          </label>
          <select
            id={`powerLinkedAttribute-${power.id}`}
            value={power.linkedAttribute}
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
          <span className="px-2.5 py-1.5 bg-orange-600/70 text-orange-100 rounded-md text-sm font-semibold tabular-nums whitespace-nowrap">
            {finalDieDisplay}
          </span>
        </div>
      </div>

      <div className="w-full">
        <label htmlFor={`powerDesc-${power.id}`} className="block text-xs font-medium text-slate-300 mb-1">
          Power Description (Optional)
        </label>
        <textarea
          id={`powerDesc-${power.id}`}
          value={power.description || ''}
          onChange={handleDescriptionChange}
          placeholder="Describe how this power works or its narrative flavor..."
          rows={2}
          className="block w-full px-3 py-2 bg-input border border-slate-500 rounded-md text-sm shadow-sm placeholder-slate-500 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
        />
      </div>

      {!isFirst && (
         <button
            type="button"
            onClick={() => onRemove(power.id)}
            className="absolute -top-2 -right-2 h-6 w-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors"
            aria-label="Remove power"
          >
            &times;
          </button>
      )}
    </div>
  );
};

export default PowerInputRow;