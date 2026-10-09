import React, { useState, useCallback, useEffect } from 'react';
import { Weakness, SelectOption } from '../types';
import TTSButton from './TTSButton';
import ChoiceSummaryDisplay, { ChoiceSummaryData } from './ChoiceSummaryDisplay';
import { speak } from '../utils/tts';

interface WeaknessesFormProps {
  onSubmit: (weaknesses: Weakness[]) => void;
  onBack: () => void;
  summaryData: ChoiceSummaryData;
  initialWeaknessesData?: Weakness[] | null;
  onSaveProgress: () => void;
  onLoadProgress: () => void;
  onPartialUpdate: (weaknesses: Weakness[]) => void;
  autoReadEnabled?: boolean;
}

const SEVERITY_OPTIONS: SelectOption[] = [
  { value: '', label: 'Select Severity' },
  { value: 'Rarely Encountered or Highly Impactful', label: 'Rarely Encountered or Highly Impactful' },
  { value: 'Uncommon or Moderately Impactful', label: 'Uncommon or Moderately Impactful' },
  { value: 'Common or Less Impactful', label: 'Common or Less Impactful' },
];

const SEVERITY_EFFECTS: Record<string, string> = {
  'Rarely Encountered or Highly Impactful': '-3 Proficiency on Rolls',
  'Uncommon or Moderately Impactful': '-2 Proficiency on Rolls',
  'Common or Less Impactful': '-1 Proficiency on Rolls',
};

const WeaknessesForm: React.FC<WeaknessesFormProps> = ({ 
  onSubmit, onBack, summaryData, initialWeaknessesData, onSaveProgress, onLoadProgress, onPartialUpdate, autoReadEnabled
}) => {
  const [weaknesses, setWeaknesses] = useState<Weakness[]>(() => {
    return initialWeaknessesData && initialWeaknessesData.length > 0 
      ? initialWeaknessesData 
      : [{ id: Date.now().toString(), name: '', severity: '', effect: '' }];
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const title = "Personal Weaknesses";
  const instructionText = `Truly memorable characters aren’t defined by their powers alone but they are shaped by their weaknesses. Each character should choose at least one personal weakness. This can take many forms:

• A physical vulnerability (e.g., a specific element or material)
• An emotional flaw (e.g., quick to anger, overconfident, obsessed with glory)
• A narrative burden (e.g., a prophecy, haunting memory, or inevitable fate)
• A behavioral compulsion (e.g., always needing to duel strong opponents, drawn to deserts, etc.)

Weaknesses help ground your character in the story and provide rich opportunities for tension, growth, and roleplaying.

Customizing Your Weakness: You’re encouraged to work with your Game Master to define how often your weakness might appear in play, and how impactful it should be. Some weaknesses are rare but devastating. Others are common but mild. All of them should feel meaningful.`;

  useEffect(() => {
    if (autoReadEnabled) {
      speak(`${title}. ${instructionText}`);
    }
  }, [autoReadEnabled]);

  const handleWeaknessChange = useCallback((id: string, updated: Partial<Weakness>) => {
    setWeaknesses(prev => {
      const next = prev.map(w => {
        if (w.id === id) {
          const newData = { ...w, ...updated };
          if (updated.severity !== undefined) {
            newData.effect = SEVERITY_EFFECTS[updated.severity] || '';
          }
          return newData;
        }
        return w;
      });
      onPartialUpdate(next);
      return next;
    });
    setErrorMessage(null);
  }, [onPartialUpdate]);

  const handleAddWeakness = useCallback(() => {
    const next = [...weaknesses, { id: Date.now().toString(), name: '', severity: '', effect: '' }];
    setWeaknesses(next);
    onPartialUpdate(next);
    setErrorMessage(null);
  }, [weaknesses, onPartialUpdate]);

  const handleRemoveWeakness = useCallback((id: string) => {
    setWeaknesses(prev => {
      const next = prev.filter(w => w.id !== id);
      const final = next.length === 0 ? [{ id: Date.now().toString(), name: '', severity: '', effect: '' }] : next;
      onPartialUpdate(final as Weakness[]);
      return final as Weakness[];
    });
    setErrorMessage(null);
  }, [onPartialUpdate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (weaknesses.length === 0) {
      setErrorMessage("At least one weakness is required.");
      return;
    }

    for (const w of weaknesses) {
      if (!w.name.trim() || !w.severity) {
        setErrorMessage("Please ensure all weaknesses have a name and severity selected.");
        return;
      }
    }

    onSubmit(weaknesses);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {summaryData && <ChoiceSummaryDisplay {...summaryData} />}
      
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center space-x-2 pt-6">
          <h2 className="text-2xl font-semibold text-sky-400 font-orbitron">{title}</h2>
          <TTSButton text={title} />
        </div>

        <div className="flex items-center justify-center space-x-2 mb-6 px-2">
          <div className="text-sm text-slate-400 text-center leading-relaxed max-w-2xl whitespace-pre-wrap">
            {instructionText}
          </div>
          <TTSButton text={instructionText} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-3 bg-red-500/20 text-red-300 text-sm rounded border border-red-700 animate-pulse">
            <strong>Validation Error:</strong> {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          {weaknesses.map((w) => (
            <div key={w.id} className="p-4 bg-slate-700 rounded-lg shadow grid grid-cols-1 md:grid-cols-12 gap-3 items-end relative">
              <div className="md:col-span-5">
                <label className="block text-xs font-medium text-slate-300 mb-1">Weakness Name</label>
                <input
                  type="text"
                  value={w.name}
                  onChange={(e) => handleWeaknessChange(w.id, { name: e.target.value })}
                  placeholder="e.g., Cryptonite Vibe, Fear of Water"
                  className="block w-full px-3 py-2 bg-input border border-slate-500 rounded-md text-sm text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-slate-300 mb-1">Severity / Frequency</label>
                <select
                  value={w.severity}
                  onChange={(e) => handleWeaknessChange(w.id, { severity: e.target.value })}
                  className="block w-full pl-3 pr-8 py-2 text-sm bg-input border border-slate-500 focus:outline-none focus:ring-sky-500 focus:border-sky-500 rounded-md text-slate-100"
                >
                  {SEVERITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-1">Effect on Dice Rolls</label>
                <div className="px-3 py-2 bg-slate-800 border border-slate-500 rounded-md text-sm text-amber-400 font-bold min-h-[38px]">
                  {w.effect || '---'}
                </div>
              </div>
              {weaknesses.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveWeakness(w.id)}
                  className="absolute -top-2 -right-2 h-6 w-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={handleAddWeakness} className="text-sky-300 text-sm font-medium hover:underline">+ Add Another Weakness</button>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button type="button" onClick={onBack} className="py-3 border border-slate-500 rounded text-slate-300">Back</button>
          <button type="button" onClick={onLoadProgress} className="py-3 border border-sky-500 rounded text-sky-300">Load SagaChar</button>
          <button type="button" onClick={onSaveProgress} className="py-3 border border-sky-500 rounded text-sky-300">Save</button>
          <button type="submit" className="py-3.5 bg-gradient-to-r from-amber-600 to-orange-700 rounded text-white font-bold transform hover:scale-105 transition shadow-lg">Next: Summary</button>
        </div>
      </form>
    </div>
  );
};

export default WeaknessesForm;