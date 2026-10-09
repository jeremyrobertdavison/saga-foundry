import {imageURL} from '../host';

import React, { useState, useEffect, useRef } from 'react';
import { CharacterDetails, SelectOption } from '../types';
import Input from './Input';
import Select from './Select';
import Textarea from './Textarea';
import TTSButton from './TTSButton';
import { speak } from '../utils/tts';

interface CharacterDetailsFormProps {
  onSubmit: (details: CharacterDetails) => void;
  initialDetails?: CharacterDetails | null;
  onSaveProgress: () => void;
  onLoadProgress: () => void;
  onPartialUpdate: (details: CharacterDetails) => void;
  autoReadEnabled?: boolean;
}

const CharacterDetailsForm: React.FC<CharacterDetailsFormProps> = ({ 
  onSubmit, initialDetails, onSaveProgress, onLoadProgress, onPartialUpdate, autoReadEnabled 
}) => {
  const [playerName, setPlayerName] = useState(initialDetails?.playerName || '');
  const [characterName, setCharacterName] = useState(initialDetails?.characterName || '');
  const [heroName, setHeroName] = useState(initialDetails?.heroName || '');
  const [age, setAge] = useState<string>(initialDetails?.age?.toString() || '');
  const [description, setDescription] = useState(initialDetails?.description || '');
  const [heroDescription, setHeroDescription] = useState(initialDetails?.heroDescription || '');
  const [characterBackstory, setCharacterBackstory] = useState(initialDetails?.characterBackstory || '');
  const [level, setLevel] = useState<number>(initialDetails?.level || 1);
  const [characterImage, setCharacterImage] = useState<string | undefined>(initialDetails?.characterImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const title = "Character Details";
  const descriptionInstruction = "First step is to define our character. What is your name? What do you look like? What kind of powers do you have? What is your story, how did you get those powers? Take a moment to consider these things and fill out the following sheet.";

  useEffect(() => {
    if (autoReadEnabled) {
      speak(`${title}. ${descriptionInstruction}`);
    }
  }, [autoReadEnabled]);

  const syncToParent = (overrides: Partial<CharacterDetails> = {}) => {
    onPartialUpdate({
      playerName,
      characterName,
      heroName,
      age: parseInt(age, 10) || 0,
      description,
      heroDescription,
      characterBackstory,
      level,
      characterImage,
      ...overrides
    });
  };

  useEffect(() => {
    if (initialDetails) {
      setPlayerName(initialDetails.playerName || '');
      setCharacterName(initialDetails.characterName);
      setHeroName(initialDetails.heroName);
      setAge(initialDetails.age.toString());
      setDescription(initialDetails.description);
      setHeroDescription(initialDetails.heroDescription);
      setCharacterBackstory(initialDetails.characterBackstory || '');
      setLevel(initialDetails.level);
      setCharacterImage(initialDetails.characterImage);
    }
  }, [initialDetails]);

  const levelOptions: SelectOption[] = Array.from({ length: 10 }, (_, i) => ({
    value: i + 1,
    label: `Level ${i + 1}`,
  }));

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCharacterImage(result);
        syncToParent({ characterImage: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setCharacterImage(undefined);
    syncToParent({ characterImage: undefined });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ageValue = parseInt(age, 10);
    if (isNaN(ageValue) || ageValue <= 0) {
      const errorMsg = "Please enter a valid age greater than zero.";
      if (autoReadEnabled) speak(errorMsg);
      alert(errorMsg);
      return;
    }
    onSubmit({
      playerName, characterName, heroName, age: ageValue,
      description, heroDescription, characterBackstory,
      level: Number(level), characterImage,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-center space-x-2 mb-4">
        <h2 className="text-2xl font-semibold text-sky-400 font-orbitron">{title}</h2>
        <TTSButton text={title} />
      </div>
      <div className="flex items-center justify-center space-x-2 mb-8 px-2">
        <p className="text-sm text-slate-400 text-center leading-relaxed max-w-2xl">
          {descriptionInstruction}
        </p>
        <TTSButton text={descriptionInstruction} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <Input
          label="Player Name"
          id="playerName"
          type="text"
          value={playerName}
          onChange={(e) => { setPlayerName(e.target.value); syncToParent({ playerName: e.target.value }); }}
          placeholder="e.g., Alex"
        />
        <Input
          label="Character Name"
          id="characterName"
          type="text"
          value={characterName}
          onChange={(e) => { setCharacterName(e.target.value); syncToParent({ characterName: e.target.value }); }}
          placeholder="e.g., Zephyr"
          required
        />
      </div>
      
      <Input
        label="Hero Name / Alias"
        id="heroName"
        type="text"
        value={heroName}
        onChange={(e) => { setHeroName(e.target.value); syncToParent({ heroName: e.target.value }); }}
        placeholder="e.g., The Nightwind"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <Input
          label="Age"
          id="age"
          type="number"
          value={age}
          onChange={(e) => { setAge(e.target.value); syncToParent({ age: parseInt(e.target.value, 10) || 0 }); }}
          placeholder="e.g., 28"
          min="1" required
        />
        <Select
          label="Level"
          id="level"
          options={levelOptions}
          value={level}
          onChange={(e) => { setLevel(Number(e.target.value)); syncToParent({ level: Number(e.target.value) }); }}
          required
        />
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Image (Optional)</label>
        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="text-sm text-slate-400 file:mr-4 file:bg-sky-600 file:text-sky-50 file:rounded file:border-0 file:px-4 file:py-1.5" />
        {characterImage && (
          <div className="mt-3 relative w-32 h-32 group">
            <img src={imageURL(characterImage)} className="rounded object-cover w-full h-full shadow" />
            <button type="button" onClick={removeImage} className="absolute top-1 right-1 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition">&times;</button>
          </div>
        )}
      </div>

      <Textarea label="Description" id="description" value={description} onChange={(e) => { setDescription(e.target.value); syncToParent({ description: e.target.value }); }} placeholder="Appearance..." required rows={2} />
      <Textarea label="Hero Persona" id="heroDescription" value={heroDescription} onChange={(e) => { setHeroDescription(e.target.value); syncToParent({ heroDescription: e.target.value }); }} placeholder="Costume..." required rows={2} />
      <Textarea label="Backstory" id="characterBackstory" value={characterBackstory} onChange={(e) => { setCharacterBackstory(e.target.value); syncToParent({ characterBackstory: e.target.value }); }} placeholder="History..." required rows={3} />

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button type="button" onClick={onLoadProgress} className="py-2.5 border border-sky-500 text-sky-300 rounded-md">Load SagaChar</button>
        <button type="button" onClick={onSaveProgress} className="py-2.5 border border-sky-500 text-sky-300 rounded-md">Save Progress</button>
        <button type="submit" className="py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md font-medium transform hover:scale-105 transition text-white">Next: Assign Attributes</button>
      </div>
    </form>
  );
};

export default CharacterDetailsForm;
