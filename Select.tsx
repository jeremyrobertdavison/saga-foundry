import React from 'react';
import { SelectOption } from '../types';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  options: SelectOption[];
}

const Select: React.FC<SelectProps> = ({ label, id, options, ...rest }) => {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <select
        id={id}
        className="mt-1 block w-full pl-3.5 pr-10 py-2.5 text-base bg-input border border-slate-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md text-slate-100 transition-colors duration-150"
        {...rest}
      >
        {options.map(option => (
          <option key={option.value} value={option.value} className="bg-input text-slate-100">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;