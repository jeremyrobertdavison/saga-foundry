import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...rest }) => {
  return (
    <div className="mb-5">
      <div className="flex items-center space-x-2 mb-1.5">
        <label htmlFor={id} className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      </div>
      <input
        id={id}
        className="mt-1 block w-full px-3.5 py-2.5 bg-input border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100
                   focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                   disabled:bg-slate-600 disabled:text-slate-400 disabled:border-slate-500 disabled:shadow-none
                   invalid:border-pink-500 invalid:text-pink-600
                   focus:invalid:border-pink-500 focus:invalid:ring-pink-500 transition-colors duration-150"
        {...rest}
      />
    </div>
  );
};

export default Input;