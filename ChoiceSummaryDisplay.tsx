import React from 'react';
import { CharacterDetails, CharacterAttributes, AttributeDice, SkillFormData, PowerFormData } from '../types';
import { ATTRIBUTE_LABELS, AttributeName, getDieForPoints } from '../utils/characterUtils';

export interface ChoiceSummaryData {
  characterDetails?: CharacterDetails | null;
  characterAttributes?: CharacterAttributes | null;
  attributeDice?: AttributeDice | null;
  skillsData?: SkillFormData[] | null;
  powersData?: PowerFormData[] | null;
}

const SummaryItem: React.FC<{ label: string; value: React.ReactNode; valueClassName?: string }> = ({ label, value, valueClassName }) => (
  <div className="text-xs">
    <span className="font-semibold text-slate-400">{label}: </span>
    <span className={`text-slate-200 ${valueClassName || ''}`}>{value}</span>
  </div>
);

const ChoiceSummaryDisplay: React.FC<ChoiceSummaryData> = ({
  characterDetails,
  characterAttributes,
  attributeDice,
  skillsData,
  powersData,
}) => {
  if (!characterDetails && !characterAttributes && !skillsData && !powersData) {
    return null; 
  }

  const validSkills = skillsData?.filter(skill => skill.name.trim() !== '' || skill.points > 0);
  const validPowers = powersData?.filter(power => power.name.trim() !== '' || power.points > 0);

  return (
    <div className="mb-6 p-4 bg-slate-850 border border-slate-700 rounded-lg shadow-md animate-fadeIn">
      <h3 className="text-md font-semibold text-sky-300 mb-3 font-orbitron border-b border-slate-700 pb-2">Current Selections</h3>
      
      {characterDetails && (
        <div className="mb-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-1.5">Details</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 items-start">
            {characterDetails.playerName && <SummaryItem label="Player" value={characterDetails.playerName} valueClassName="truncate" />}
            <SummaryItem label="Character" value={characterDetails.characterName} valueClassName="truncate" />
            <SummaryItem label="Hero" value={characterDetails.heroName} valueClassName="truncate"/>
            <SummaryItem label="Level" value={characterDetails.level} valueClassName="font-bold text-amber-300" />
            {characterDetails.characterImage && (
              <div className="text-xs sm:col-span-1 flex items-center mt-1 sm:mt-0">
                <span className="font-semibold text-slate-400">Image: </span>
                <img 
                  src={characterDetails.characterImage} 
                  alt="Char" 
                  className="ml-1.5 w-8 h-8 rounded object-cover border border-slate-600" 
                />
              </div>
            )}
          </div>
        </div>
      )}

      {characterAttributes && attributeDice && (
        <div className="mb-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-1.5">Attributes</h4>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
            {Object.keys(characterAttributes).map(key => (
              <li key={key}>
                <SummaryItem 
                  label={ATTRIBUTE_LABELS[key as AttributeName]} 
                  value={`${characterAttributes[key as AttributeName]} (${attributeDice[key as AttributeName]})`} 
                  valueClassName="text-cyan-300"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {validSkills && validSkills.length > 0 && characterAttributes && (
           <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-1.5">Skills</h4>
            <ul className="space-y-1">
              {validSkills.map(skill => {
                const baseDie = getDieForPoints(skill.points);
                let linkedAttributeBonus = 0;
                let linkedAttributeNameDisplay = '';
                if (skill.linkedAttribute && characterAttributes[skill.linkedAttribute as AttributeName]) {
                  linkedAttributeBonus = characterAttributes[skill.linkedAttribute as AttributeName];
                  linkedAttributeNameDisplay = ` (${skill.linkedAttribute.charAt(0).toUpperCase() + skill.linkedAttribute.slice(1)})`;
                }
                const finalDieString = `${baseDie} + ${linkedAttributeBonus}${linkedAttributeNameDisplay}`;
                
                return (
                  <li key={skill.id}>
                     <SummaryItem 
                      label={skill.name || "Unnamed Skill"} 
                      value={finalDieString}
                      valueClassName="text-purple-300"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {validPowers && validPowers.length > 0 && characterAttributes && (
           <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-1.5">Powers</h4>
            <ul className="space-y-1">
              {validPowers.map(power => {
                const baseDie = getDieForPoints(power.points);
                let linkedAttributeBonus = 0;
                let linkedAttributeNameDisplay = '';
                if (power.linkedAttribute && characterAttributes[power.linkedAttribute as AttributeName]) {
                  linkedAttributeBonus = characterAttributes[power.linkedAttribute as AttributeName];
                  linkedAttributeNameDisplay = ` (${power.linkedAttribute.charAt(0).toUpperCase() + power.linkedAttribute.slice(1)})`;
                }
                const finalDieString = `${baseDie} + ${linkedAttributeBonus}${linkedAttributeNameDisplay}`;
                
                return (
                  <li key={power.id}>
                     <SummaryItem 
                      label={power.name || "Unnamed Power"} 
                      value={finalDieString}
                      valueClassName="text-orange-300"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChoiceSummaryDisplay;