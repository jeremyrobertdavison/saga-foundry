
import React from 'react';

interface AttributeInputProps {
  label: string;
  id: string;
  value: number;
  maxAttributePoints: number; 
  onChange: (value: number) => void;
  dieString: string;
}

const AttributeInput: React.FC<AttributeInputProps> = ({ label, id, value, maxAttributePoints, onChange, dieString }) => {
  const handleIncrement = () => {
    if (value < maxAttributePoints) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > 0) {
      onChange(value - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let numValue = parseInt(e.target.value, 10);
    if (isNaN(numValue)) {
      numValue = 0;
    }
    if (numValue < 0) {
      numValue = 0;
    }
    if (numValue > maxAttributePoints) {
      numValue = maxAttributePoints;
    }
    onChange(numValue);
  };

  return (
    <div className="p-3 bg-slate-700 rounded-lg shadow-sm">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= 0}
          className="px-2.5 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-md disabled:opacity-50 transition-colors text-lg"
          aria-label={`Decrease ${label} points`}
        >
          -
        </button>
        <input
          type="number"
          id={id}
          name={id}
          value={value}
          onChange={handleChange}
          min="0"
          max={maxAttributePoints}
          className="w-16 text-center px-2 py-1.5 bg-slate-800 border border-slate-600 rounded-md text-slate-100 focus:ring-sky-500 focus:border-sky-500"
          aria-label={`${label} points`}
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= maxAttributePoints}
          className="px-2.5 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-md transition-colors text-lg disabled:opacity-50"
          aria-label={`Increase ${label} points`}
        >
          +
        </button>
        <span 
            className="ml-auto text-sm font-semibold px-2.5 py-1 bg-sky-700/50 text-sky-200 rounded-md tabular-nums"
            aria-live="polite" 
            aria-atomic="true"
        >
            {dieString}
        </span>
      </div>
      <div className="mt-1 text-[10px] text-slate-400 text-right">
        Max: {maxAttributePoints}
      </div>
    </div>
  );
};

export default AttributeInput;
