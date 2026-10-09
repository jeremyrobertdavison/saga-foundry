
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CharacterAttributes, SkillFormData, SelectOption } from '../types'; 
import { ATTRIBUTE_OPTIONS, AttributeName } from '../utils/characterUtils'; 
import SkillInputRow from './SkillInputRow'; 
import ChoiceSummaryDisplay, { ChoiceSummaryData } from './ChoiceSummaryDisplay';
import TTSButton from './TTSButton';
import { speak } from '../utils/tts';

interface SkillsFormProps {
  characterLevel: number;
  characterName: string;
  characterAttributes: CharacterAttributes;
  onSubmit: (skills: SkillFormData[]) => void;
  onBack: () => void;
  summaryData: ChoiceSummaryData;
  initialSkillsData?: SkillFormData[] | null;
  onSaveProgress: () => void;
  onLoadProgress: () => void;
  onPartialUpdate: (skills: SkillFormData[]) => void;
  autoReadEnabled?: boolean;
}

const SkillsForm: React.FC<SkillsFormProps> = ({ 
  characterLevel, characterName, characterAttributes, onSubmit, onBack, 
  summaryData, initialSkillsData, onSaveProgress, onLoadProgress, onPartialUpdate, autoReadEnabled
}) => {
  const [skills, setSkills] = useState<SkillFormData[]>(() => {
    return initialSkillsData || [{ id: Date.now().toString(), name: '', points: 0, linkedAttribute: '' }];
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalPoints = characterLevel * 6;
  const maxPointsPerSkill = 12;
  const pointsSpent = useMemo(() => skills.reduce((sum, s) => sum + (s.points || 0), 0), [skills]);
  const pointsRemaining = totalPoints - pointsSpent;

  const title = "Define Skills";
  const instructionText = "Third step is determining our skills. Where rolling attributes represent generic broad actions our hero might take, skill start to narrow that field. Skills are things that our hero can do that are learned or honed like skills might be in real life. Their gifts may give them an edge on their use but in general these are things our hero could teach other people how do to if they ever needed to. Take a moment and consider our hero we pictured in step 1. Then select the names of skills you'd like our hero to have. Assign points from our pool of skill points and then select the attribute that is related to the skill. Notice that gives our hero a bonus to rolling dice to take those skill actions. This represents our heroes powers and abilities giving them a leg up. When you are ready select next and we'll be on giving our hero their super powers!";

  useEffect(() => {
    if (autoReadEnabled) {
      speak(`${title}. ${instructionText} You have ${pointsRemaining} points remaining out of ${totalPoints}.`);
    }
  }, [autoReadEnabled]);

  const handleSkillChange = useCallback((id: string, updated: Partial<SkillFormData>) => {
    setSkills(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updated } : s);
      onPartialUpdate(next);
      return next;
    });
    setErrorMessage(null);
  }, [onPartialUpdate]);

  const handleAddSkill = useCallback(() => {
    const next: SkillFormData[] = [...skills, { id: Date.now().toString(), name: '', points: 0, linkedAttribute: '' }];
    setSkills(next);
    onPartialUpdate(next);
    setErrorMessage(null);
  }, [skills, onPartialUpdate]);

  const handleRemoveSkill = useCallback((id: string) => {
    setSkills(prev => {
      const next = prev.filter(s => s.id !== id);
      const final: SkillFormData[] = next.length === 0 ? [{ id: Date.now().toString(), name: '', points: 0, linkedAttribute: '' }] : next;
      onPartialUpdate(final);
      return final;
    });
    setErrorMessage(null);
  }, [onPartialUpdate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Check points spent
    if (pointsSpent > totalPoints) {
        const overspentMsg = "You have overspent your skill points. Please adjust them before proceeding.";
        if (autoReadEnabled) speak(overspentMsg);
        setErrorMessage(overspentMsg);
        return;
    }
    if (pointsRemaining > 0) {
      const errorMsg = `You still have ${pointsRemaining} skill points remaining. Please spend all ${totalPoints} points before continuing.`;
      if (autoReadEnabled) speak(errorMsg);
      setErrorMessage(errorMsg);
      return;
    }

    // 2. Validate each row that has points or a name
    const activeSkills = skills.filter(s => s.name.trim() !== '' || s.points > 0);
    
    if (activeSkills.length === 0 && totalPoints > 0) {
      const errorMsg = "Please define at least one skill to spend your points.";
      if (autoReadEnabled) speak(errorMsg);
      setErrorMessage(errorMsg);
      return;
    }

    for (const skill of activeSkills) {
      if (skill.name.trim() === '') {
        const errorMsg = "One of your skills is missing a name. Please provide names for all skills that have points assigned.";
        if (autoReadEnabled) speak(errorMsg);
        setErrorMessage(errorMsg);
        return;
      }
      if (skill.linkedAttribute === '') {
        const errorMsg = `The skill "${skill.name}" is missing a linked attribute. Please select an attribute for every skill.`;
        if (autoReadEnabled) speak(errorMsg);
        setErrorMessage(errorMsg);
        return;
      }
    }

    onSubmit(activeSkills);
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
        {skills.map(skill => (
          <SkillInputRow
            key={skill.id} skill={skill} maxPoints={maxPointsPerSkill}
            onChange={handleSkillChange} onRemove={handleRemoveSkill}
            characterAttributes={characterAttributes}
            attributeOptions={[{ value: '', label: 'Select Attribute' }, ...ATTRIBUTE_OPTIONS]}
          />
        ))}
      </div>
      
      <button type="button" onClick={handleAddSkill} className="text-sky-300 text-sm font-medium hover:underline">+ Add Skill</button>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button type="button" onClick={onBack} className="py-3 border border-slate-500 rounded text-slate-300">Back</button>
        <button type="button" onClick={onLoadProgress} className="py-3 border border-sky-500 rounded text-sky-300">Load SagaChar</button>
        <button type="button" onClick={onSaveProgress} className="py-3 border border-sky-500 rounded text-sky-300">Save</button>
        <button type="submit" className="py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded text-white transform hover:scale-105 transition font-bold shadow-lg">Next: Powers</button>
      </div>
    </form>
  );
};

export default SkillsForm;
