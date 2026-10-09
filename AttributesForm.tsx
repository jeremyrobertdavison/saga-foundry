
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CharacterAttributes } from '../types';
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS, getDieForPoints, AttributeName } from '../utils/characterUtils';
import AttributeInput from './AttributeInput';
import ChoiceSummaryDisplay, { ChoiceSummaryData } from './ChoiceSummaryDisplay';
import TTSButton from './TTSButton';
import { speak } from '../utils/tts';

interface AttributesFormProps {
  characterLevel: number;
  characterName: string; 
  onSubmit: (attributes: CharacterAttributes) => void;
  onBack: () => void;
  summaryData: ChoiceSummaryData;
  initialAttributesData?: CharacterAttributes | null;
  onSaveProgress: () => void;
  onLoadProgress: () => void;
  onPartialUpdate: (attrs: CharacterAttributes) => void;
  autoReadEnabled?: boolean;
}

const AttributesForm: React.FC<AttributesFormProps> = ({ 
  characterLevel, characterName, onSubmit, onBack, summaryData, 
  initialAttributesData, onSaveProgress, onLoadProgress, onPartialUpdate, autoReadEnabled
}) => {
  const [attributes, setAttributes] = useState<CharacterAttributes>(() => {
    return initialAttributesData || ATTRIBUTE_KEYS.reduce((acc, key) => { acc[key] = 0; return acc; }, {} as CharacterAttributes);
  });
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalPointsToSpend = useMemo(() => characterLevel * 5, [characterLevel]);
  const maxPointsPerAttribute = useMemo(() => characterLevel + 12, [characterLevel]);
  const pointsSpent = useMemo(() => ATTRIBUTE_KEYS.reduce((sum, key) => sum + (attributes[key] || 0), 0), [attributes]);
  const pointsRemaining = totalPointsToSpend - pointsSpent;

  const title = "Assign Attributes";
  const instructionText = "Second step is determining our attributes. The more points you spend on each attribute the higher the die you get to roll for attribute rolls. What are attributes? They are the sources of our hero's powers. Heroes can be complex and may have more than one source to their powers. Take a moment and think about the powers you considered in step 1 and review the description of each attribute in the sidebar. Where do those powers come from? When you are ready spend your points. You'll see the die you roll go up as you spend points. When you are ready hit the next button and we'll be off to skills!";

  useEffect(() => {
    if (autoReadEnabled) {
      speak(`${title}. ${instructionText} You have ${pointsRemaining} points remaining out of ${totalPointsToSpend}.`);
    }
  }, [autoReadEnabled]);

  const handleAttributeChange = useCallback((attributeName: AttributeName, value: number) => {
    const newAttributeValue = Math.min(maxPointsPerAttribute, Math.max(0, value));
    const newAttrs = { ...attributes, [attributeName]: newAttributeValue };
    setAttributes(newAttrs);
    onPartialUpdate(newAttrs);
  }, [maxPointsPerAttribute, attributes, onPartialUpdate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pointsSpent > totalPointsToSpend) {
        const overspentMsg = "You have overspent your attribute points. Please adjust them before proceeding.";
        if (autoReadEnabled) speak(overspentMsg);
        setErrorMessage(overspentMsg);
        return;
    }
    if (pointsRemaining > 0) {
       const errorMsg = `You still have ${pointsRemaining} attribute points remaining. Please spend all ${totalPointsToSpend} points before continuing.`;
       if (autoReadEnabled) speak(errorMsg);
       setErrorMessage(errorMsg);
       return;
    }
    onSubmit(attributes);
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
          Available Points: <span className="font-bold text-amber-400">{pointsRemaining} / {totalPointsToSpend}</span>
        </p>
      </div>

      {errorMessage && <div className="p-3 bg-red-500/20 border border-red-700 text-red-300 rounded text-sm">{errorMessage}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ATTRIBUTE_KEYS.map(key => (
          <AttributeInput
            key={key} label={ATTRIBUTE_LABELS[key]} id={key} value={attributes[key]}
            maxAttributePoints={maxPointsPerAttribute} 
            onChange={(val) => handleAttributeChange(key, val)}
            dieString={getDieForPoints(attributes[key])}
          />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button type="button" onClick={onBack} className="py-3 border border-slate-500 rounded text-slate-300">Back</button>
        <button type="button" onClick={onLoadProgress} className="py-3 border border-sky-500 rounded text-sky-300">Load SagaChar</button>
        <button type="button" onClick={onSaveProgress} className="py-3 border border-sky-500 rounded text-sky-300">Save</button>
        <button type="submit" disabled={pointsSpent > totalPointsToSpend} className="py-3.5 bg-gradient-to-r from-green-500 to-teal-500 rounded text-white font-medium transform hover:scale-105 disabled:opacity-50 transition">Next: Skills</button>
      </div>
    </form>
  );
};

export default AttributesForm;
