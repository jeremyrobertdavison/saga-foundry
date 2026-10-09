
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CharacterAttributes, PowerFormData } from '../types'; 
import { ATTRIBUTE_OPTIONS } from '../utils/characterUtils'; 
import PowerInputRow from './PowerInputRow';
import ChoiceSummaryDisplay, { ChoiceSummaryData } from './ChoiceSummaryDisplay';
import TTSButton from './TTSButton';
import { speak } from '../utils/tts';

interface PowersFormProps {
  characterLevel: number;
  characterName: string;
  characterAttributes: CharacterAttributes;
  onSubmit: (powers: PowerFormData[]) => void;
  onBack: () => void;
  summaryData: ChoiceSummaryData;
  initialPowersData?: PowerFormData[] | null;
  onSaveProgress: () => void;
  onLoadProgress: () => void;
  onPartialUpdate: (powers: PowerFormData[]) => void;
  autoReadEnabled?: boolean;
}

const PowersForm: React.FC<PowersFormProps> = ({ 
  characterLevel, characterName, characterAttributes, onSubmit, onBack, 
  summaryData, initialPowersData, onSaveProgress, onLoadProgress, onPartialUpdate, autoReadEnabled
}) => {
  const [powers, setPowers] = useState<PowerFormData[]>(() => {
    return initialPowersData || [{ id: Date.now().toString(), name: '', points: 0, linkedAttribute: '', description: '' }];
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalPoints = characterLevel * 5;
  const maxPointsPerPower = 12;
  const pointsSpent = useMemo(() => powers.reduce((sum, p) => sum + (p.points || 0), 0), [powers]);
  const pointsRemaining = totalPoints - pointsSpent;

  const title = "Bestow Powers";
  const instructionText = "Fourth step is to determine what our character's super powers are. Unlike skills superpower sets are unique the situation or our superhero's backstory. Thats not to say two heroes can't both have the same superpower. Both Superman and Ironman can fly but for very different reasons! Neither could teach their friends Batman or Captain America how to fly. These are super powers. Super powers can be defined as broadly or specifically as you and your game master would prefer. If you are at a loss of ideas of super powers there is a helpful link in the sidebar. Take a moment, consider the hero we pictured in step 1 and think of the super powers they would have. Then spend your available power points and select the attributes those powers come from. When you are completed hit the next button and we'll go through a summary of our new super hero!";

  useEffect(() => {
    if (autoReadEnabled) {
      speak(`${title}. ${instructionText} You have ${pointsRemaining} points remaining out of ${totalPoints}.`);
    }
  }, [autoReadEnabled]);

  const handlePowerChange = useCallback((id: string, updated: Partial<PowerFormData>) => {
    setPowers(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updated } : p);
      onPartialUpdate(next);
      return next;
    });
    setErrorMessage(null);
  }, [onPartialUpdate]);

  const handleAddPower = useCallback(() => {
    const next: PowerFormData[] = [...powers, { id: Date.now().toString(), name: '', points: 0, linkedAttribute: '', description: '' }];
    setPowers(next);
    onPartialUpdate(next);
    setErrorMessage(null);
  }, [powers, onPartialUpdate]);

  const handleRemovePower = useCallback((id: string) => {
    setPowers(prev => {
      const next = prev.filter(p => p.id !== id);
      const final: PowerFormData[] = next.length === 0 ? [{ id: Date.now().toString(), name: '', points: 0, linkedAttribute: '', description: '' }] : next;
      onPartialUpdate(final);
      return final;
    });
    setErrorMessage(null);
  }, [onPartialUpdate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pointsSpent > totalPoints) {
        const overspentMsg = "You have overspent your power points. Please adjust them before proceeding.";
        if (autoReadEnabled) speak(overspentMsg);
        setErrorMessage(overspentMsg);
        return;
    }
    if (pointsRemaining > 0) {
      const errorMsg = `You still have ${pointsRemaining} power points remaining. Please spend all ${totalPoints} points before continuing.`;
      if (autoReadEnabled) speak(errorMsg);
      setErrorMessage(errorMsg);
      return;
    }

    const activePowers = powers.filter(p => p.name.trim() !== '' || p.points > 0);
    
    if (activePowers.length === 0 && totalPoints > 0) {
      const errorMsg = "Please define at least one power to spend your points.";
      if (autoReadEnabled) speak(errorMsg);
      setErrorMessage(errorMsg);
      return;
    }

    for (const power of activePowers) {
      if (power.name.trim() === '') {
        const errorMsg = "One of your powers is missing a name. Please provide names for all powers that have points assigned.";
        if (autoReadEnabled) speak(errorMsg);
        setErrorMessage(errorMsg);
        return;
      }
      if (power.linkedAttribute === '') {
        const errorMsg = `The power "${power.name}" is missing a linked attribute. Please select an attribute for every power.`;
        if (autoReadEnabled) speak(errorMsg);
        setErrorMessage(errorMsg);
        return;
      }
    }

    onSubmit(activePowers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
      {summaryData && <ChoiceSummaryDisplay {...summaryData} />}
      <div className="flex items-center justify-center space-x-2 pt-6">
        <h2 className="text-2xl font-semibold text-sky-400 font-orbitron">{title}</h2>
        <TTSButton text={title} />
      </div>

      <div className="flex items-center justify-center space-x-2 mb-6 px-2">
        <p className="text-sm text-slate-400 text-center leading-relaxed max-w-2xl">
          {instructionText}
        </p>
        <TTSButton text={instructionText} />
      </div>

      <div className="flex items-center justify-center space-x-2 mb-4">
        <p className="text-center text-slate-300 text-sm">
          Available Points: <span className="font-bold text-amber-400">{pointsRemaining} / {totalPoints}</span>
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-500/20 text-red-300 text-sm rounded border border-red-700 animate-pulse">
          <strong>Validation Error:</strong> {errorMessage}
        </div>
      )}

      <div className="space-y-4">
        {powers.map(power => (
          <PowerInputRow
            key={power.id} power={power} maxPoints={maxPointsPerPower}
            onChange={handlePowerChange} onRemove={handleRemovePower}
            characterAttributes={characterAttributes}
            attributeOptions={[{ value: '', label: 'Select Attribute' }, ...ATTRIBUTE_OPTIONS]}
          />
        ))}
      </div>
      
      <button type="button" onClick={handleAddPower} className="text-sky-300 text-sm font-medium hover:underline">+ Add Power</button>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button type="button" onClick={onBack} className="py-3 border border-slate-500 rounded text-slate-300">Back</button>
        <button type="button" onClick={onLoadProgress} className="py-3 border border-sky-500 rounded text-sky-300">Load SagaChar</button>
        <button type="button" onClick={onSaveProgress} className="py-3 border border-sky-500 rounded text-sky-300">Save</button>
        <button type="submit" className="py-3.5 bg-gradient-to-r from-orange-500 to-red-600 rounded text-white font-bold transform hover:scale-105 transition shadow-lg">Next: Weaknesses</button>
      </div>
    </form>
  );
};

export default PowersForm;
