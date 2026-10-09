import {imageURL} from '../host';

import React from 'react';
import { Character, Skill, Power, Weakness } from '../types';
import { ATTRIBUTE_LABELS, AttributeName } from '../utils/characterUtils';

interface CharacterCardProps {
  character: Character;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; className?: string; isBlock?: boolean; valueClassName?: string }> =
  ({ label, value, className = '', isBlock = false, valueClassName = '' }) => (
  <div className={`py-3 ${isBlock ? '' : 'sm:grid sm:grid-cols-3 sm:gap-4'} ${className}`}>
    <dt className="text-sm font-semibold text-sky-300">{label}</dt>
    <dd className={`mt-1 text-sm text-slate-100 ${isBlock ? 'mt-2' : 'sm:mt-0 sm:col-span-2'} break-words ${valueClassName}`}>
      {value}
    </dd>
  </div>
);

const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => {
  const attributeOrder: AttributeName[] = ['general', 'arcana', 'technology', 'body', 'mind', 'mutation'];

  return (
    <div className="bg-slate-750 shadow-xl rounded-lg overflow-hidden border border-slate-700">
      <div className="px-6 py-5 bg-gradient-to-r from-sky-600 to-indigo-600">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {character.characterImage && (
            <div className="flex-shrink-0 w-32 h-32 sm:w-36 sm:h-36 rounded-lg border-2 border-sky-300 shadow-lg overflow-hidden">
              <img 
                src={imageURL(character.characterImage)} 
                alt={`${character.heroName}'s image`} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="text-center sm:text-left">
            <h3 className="text-2xl leading-7 font-bold text-white font-orbitron tracking-wide">
              {character.heroName}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-sky-100">
              Character: {character.characterName} {character.playerName && `(Played by: ${character.playerName})`}
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-600 px-6 py-5">
        <dl className="divide-y divide-slate-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <DetailItem label="Age" value={character.age} />
            <DetailItem label="Level" value={character.level} />
          </div>

          <DetailItem
            label="Character Overview"
            value={<p className="whitespace-pre-wrap leading-relaxed">{character.description}</p>}
            isBlock={true}
          />
          <DetailItem
            label="Hero Profile"
            value={<p className="whitespace-pre-wrap leading-relaxed">{character.heroDescription}</p>}
            isBlock={true}
          />
          <DetailItem
            label="Character Backstory"
            value={<p className="whitespace-pre-wrap leading-relaxed">{character.characterBackstory || '(No backstory provided)'}</p>}
            isBlock={true}
          />

          {character.attributes && character.attributeDice && (
            <div className="py-3">
              <dt className="text-sm font-semibold text-sky-300 mb-2">Attributes</dt>
              <dd className="mt-1 text-sm text-slate-100 sm:col-span-2">
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                  {attributeOrder.map(key => (
                     <li key={key} className="flex justify-between items-center p-2 bg-slate-700 rounded-md shadow">
                       <span className="font-medium text-slate-200">{ATTRIBUTE_LABELS[key]}:</span>
                       <div className="text-right">
                         <span className="text-amber-400 font-bold">{character.attributes[key]}</span>
                         <span className="ml-2 text-xs text-cyan-300 bg-cyan-800/50 px-1.5 py-0.5 rounded">
                           ({character.attributeDice[key]})
                         </span>
                       </div>
                     </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}

          {character.skills && character.skills.length > 0 && (
            <div className="py-3">
              <dt className="text-sm font-semibold text-sky-300 mb-2">Skills</dt>
              <dd className="mt-1 text-sm text-slate-100 sm:col-span-2">
                <ul className="space-y-2">
                  {character.skills.map((skill: Skill) => (
                    <li key={skill.id} className="flex justify-between items-center p-2.5 bg-slate-700 rounded-md shadow">
                      <span className="font-medium text-slate-200">{skill.name}</span>
                      <span className="text-sm font-semibold text-purple-300 bg-purple-800/50 px-2 py-1 rounded-md">
                        {skill.finalDieString}
                      </span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}

          {character.powers && character.powers.length > 0 && (
            <div className="py-3">
              <dt className="text-sm font-semibold text-sky-300 mb-2">Powers</dt>
              <dd className="mt-1 text-sm text-slate-100 sm:col-span-2">
                <ul className="space-y-3">
                  {character.powers.map((power: Power) => (
                    <li key={power.id} className="p-2.5 bg-slate-700 rounded-md shadow flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-200">{power.name}</span>
                        <span className="text-sm font-semibold text-orange-300 bg-orange-800/50 px-2 py-1 rounded-md">
                          {power.finalDieString}
                        </span>
                      </div>
                      {power.description && (
                        <p className="text-xs text-slate-400 mt-1 italic leading-relaxed">
                          {power.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}

          {character.weaknesses && character.weaknesses.length > 0 && (
            <div className="py-3">
              <dt className="text-sm font-semibold text-rose-400 mb-2">Weaknesses</dt>
              <dd className="mt-1 text-sm text-slate-100 sm:col-span-2">
                <ul className="space-y-2">
                  {character.weaknesses.map((w: Weakness) => (
                    <li key={w.id} className="p-3 bg-slate-700 rounded-md shadow border-l-4 border-rose-500">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-100">{w.name}</span>
                        <span className="text-[10px] uppercase font-black text-rose-400 tracking-widest">{w.effect}</span>
                      </div>
                      <p className="text-xs text-slate-400 italic">{w.severity}</p>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </div>
       <div className="px-6 py-4 bg-slate-800 border-t border-slate-600">
         <p className="text-xs text-slate-400 text-center italic">This hero is forged and ready for an epic SAGA!</p>
       </div>
    </div>
  );
};

export default CharacterCard;
