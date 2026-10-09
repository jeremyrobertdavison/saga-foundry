import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, ...rest }) => {
  return (
    <div className="mb-5">
      <div className="flex items-center space-x-2 mb-1.5">
        <label htmlFor={id} className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      </div>
      <textarea
        id={id}
        rows={4}
        className="mt-1 block w-full px-3.5 py-2.5 bg-input border border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-100
                   focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors duration-150"
        {...rest}
      />
    </div>
  );
};

export default Textarea;