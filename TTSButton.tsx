
import React, { useState } from 'react';
import { speak } from '../utils/tts';

interface TTSButtonProps {
  text: string | number | undefined;
  className?: string;
}

const TTSButton: React.FC<TTSButtonProps> = ({ text, className = "" }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSpeak = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!text) return;
    setIsLoading(true);
    await speak(text.toString());
    setIsLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      disabled={isLoading || !text}
      className={`p-1 text-sky-400 hover:text-sky-300 transition-colors disabled:opacity-50 inline-flex items-center justify-center ${className}`}
      title="Read aloud"
      aria-label="Read text aloud"
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
      )}
    </button>
  );
};

export default TTSButton;
