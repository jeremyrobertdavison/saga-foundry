import {host,sessionKey,scope,fail} from './host';
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Character, CharacterDetails, CharacterAttributes, AttributeDice, Skill, SkillFormData, Power, PowerFormData, Weakness, AppTheme } from './types';
import CharacterDetailsForm from './components/CharacterDetailsForm';
import AttributesForm from './components/AttributesForm';
import SkillsForm from './components/SkillsForm';
import PowersForm from './components/PowersForm';
import WeaknessesForm from './components/WeaknessesForm';
import CharacterCard from './components/CharacterCard';
import PlayMode from './components/PlayMode';
import TTSButton from './components/TTSButton';
import { ATTRIBUTE_KEYS, getDieForPoints, AttributeName, ATTRIBUTE_LABELS } from './utils/characterUtils';
import { speak } from './utils/tts';

type CreationStep = 'home' | 'details' | 'attributes' | 'skills' | 'powers' | 'weaknesses' | 'summary' | 'play' | 'rules' | 'rules-dice' | 'rules-attributes' | 'rules-skills' | 'rules-powers' | 'rules-out-of-combat' | 'rules-combat' | 'rules-conditions' | 'rules-defeat-death' | 'rules-weaknesses' | 'rules-circumstance' | 'rules-heroism' | 'resources';

declare global {
  interface Window {
    html2canvas: (element: HTMLElement, options?: Partial<any>) => Promise<HTMLCanvasElement>;
  }
}

interface SavedProgress {
  version: string;
  savedAt: string;
  appState: {
    step: CreationStep;
    characterDetails: CharacterDetails | null;
    characterAttributes: CharacterAttributes | null;
    characterSkillsData: SkillFormData[] | null;
    characterPowersData: PowerFormData[] | null;
    characterWeaknessesData: Weakness[] | null;
    autoReadEnabled?: boolean;
  };
}

const APP_VERSION = "7.7";
const LOCAL_STORAGE_KEY = `${scope}-recent`;
const THEME_STORAGE_KEY = `${scope}-theme`;
const AUTO_READ_STORAGE_KEY = `${scope}-read`;

const THEMES: { value: AppTheme; label: string }[] = [
  { value: 'neon-city', label: 'Neon City' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'high-contrast', label: 'High Contrast' },
  { value: 'hacker', label: 'Hacker Terminal' },
  { value: 'just-a-yak', label: 'Just a Yak' },
  { value: 'and-my-canoe', label: 'And my canoe.' },
  { value: 'lotta-cats', label: 'Lotta Cats' },
  { value: 'medieval-fantasy', label: 'Medieval Fantasy' },
  { value: 'anime-thing', label: 'Anime Thing' },
];

interface PointValidationStatus {
  isValid: boolean;
  message: string;
  spent: number;
  total: number;
  category: string;
}

interface OverallValidationResult {
  isOverallValid: boolean;
  attributes: PointValidationStatus;
  skills: PointValidationStatus;
  powers: PointValidationStatus;
}

const App: React.FC = () => {
  const [theme, setTheme] = useState<AppTheme>(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme;
    return savedTheme && THEMES.some(t => t.value === savedTheme) ? savedTheme : 'neon-city';
  });

  const [autoReadEnabled, setAutoReadEnabled] = useState<boolean>(() => {
    return localStorage.getItem(AUTO_READ_STORAGE_KEY) === 'true';
  });
  
  const [step, setStep] = useState<CreationStep>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [characterDetails, setCharacterDetails] = useState<CharacterDetails | null>(null);
  const [characterAttributes, setCharacterAttributes] = useState<CharacterAttributes | null>(null);
  const [attributeDice, setAttributeDice] = useState<AttributeDice | null>(null);
  const [characterSkillsData, setCharacterSkillsData] = useState<SkillFormData[] | null>(null);
  const [characterPowersData, setCharacterPowersData] = useState<PowerFormData[] | null>(null);
  const [characterWeaknessesData, setCharacterWeaknessesData] = useState<Weakness[] | null>(null);
  const [characterSummary, setCharacterSummary] = useState<Character | null>(null);
  const [summaryValidationResult, setSummaryValidationResult] = useState<OverallValidationResult | null>(null);
  const characterCardRef = useRef<HTMLDivElement>(null);
  const summaryContainerRef = useRef<HTMLDivElement>(null); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlayModeRequest, setIsPlayModeRequest] = useState<boolean>(false);
  
  const [isRecentCharactersModalOpen, setIsRecentCharactersModalOpen] = useState<boolean>(false);
  const [recentCharacters, setRecentCharacters] = useState<Character[]>([]);

  const welcomeTitle = "Welcome to the SAGA Character Creator";
  const welcomeDescription = "Forge your legend from scratch or continue a previously saved journey.";
  const summaryInstructionText = "Congratulations! Your new hero is ready. Please take some time and review everything we have put into the hero. If there is something you would like to change, you can use the navigation bar on the side to go back to the different steps we have taken. When you are ready, save your character to Foundry. You can reopen the Actor here to edit it, download a portable character file, or export a text or picture sheet. Happy Crime Fighting!";

  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(AUTO_READ_STORAGE_KEY, autoReadEnabled.toString());
  }, [autoReadEnabled]);

  useEffect(() => {
    try {
      const rawData = localStorage.getItem(LOCAL_STORAGE_KEY);
      const savedCharacters: Character[] = rawData ? JSON.parse(rawData) : [];
      setRecentCharacters(savedCharacters);
    } catch (error) {
      setRecentCharacters([]);
    }
  }, []);

  useEffect(() => {
    if (step === 'summary' && characterSummary) {
        if (!characterSummary.id) {
          const newId = `saga-${Date.now()}`;
          setCharacterSummary(prev => prev ? { ...prev, id: newId } : null);
          return;
        }
        
        const characterToSave: Character = {
            ...characterSummary
        };
        setRecentCharacters(prevRecent => {
            const updatedRecent = [
                characterToSave,
                ...prevRecent.filter(char => char.id !== characterToSave.id)
            ].slice(0, 10);
            try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedRecent));
            } catch (error) {}
            return updatedRecent;
        });
    }
  }, [characterSummary, step]);

  useEffect(() => {
    if (step === 'home' && autoReadEnabled) {
      speak(`${welcomeTitle}. ${welcomeDescription}`);
    }
  }, [step, autoReadEnabled]);

  useEffect(() => {
    if (step === 'summary' && autoReadEnabled && characterSummary) {
      speak(`Your Hero Awaits! ${summaryInstructionText}`);
    }
  }, [step, autoReadEnabled, !!characterSummary]);

  const calculateOverallValidationStatus = (summary: Character): OverallValidationResult => {
    const level = summary.level;
    const totalAttributePoints = level * 5;
    const spentAttributePoints = ATTRIBUTE_KEYS.reduce((sum, key) => sum + (summary.attributes[key] || 0), 0);
    const attributeDiff = spentAttributePoints - totalAttributePoints;
    const attributeStatus: PointValidationStatus = {
      isValid: spentAttributePoints === totalAttributePoints,
      spent: spentAttributePoints, total: totalAttributePoints,
      message: attributeDiff === 0 ? "Points correctly allocated." : attributeDiff > 0 ? `${attributeDiff} point(s) overspent.` : `${Math.abs(attributeDiff)} point(s) unspent.`,
      category: "Attributes"
    };
    const totalSkillPoints = level * 6;
    const spentSkillPoints = (summary.skills || []).reduce((sum, skill) => sum + (skill.points || 0), 0);
    const skillDiff = spentSkillPoints - totalSkillPoints;
    const skillStatus: PointValidationStatus = {
      isValid: spentSkillPoints === totalSkillPoints,
      spent: spentSkillPoints, total: totalSkillPoints,
      message: skillDiff === 0 ? "Points correctly allocated." : skillDiff > 0 ? `${skillDiff} point(s) overspent.` : `${Math.abs(skillDiff)} point(s) unspent.`,
      category: "Skills"
    };
    const totalPowerPoints = level * 5;
    const spentPowerPoints = (summary.powers || []).reduce((sum, power) => sum + (power.points || 0), 0);
    const powerDiff = spentPowerPoints - totalPowerPoints;
    const powerStatus: PointValidationStatus = {
      isValid: spentPowerPoints === totalPowerPoints,
      spent: spentPowerPoints, total: totalPowerPoints,
      message: powerDiff === 0 ? "Points correctly allocated." : powerDiff > 0 ? `${powerDiff} point(s) overspent.` : `${Math.abs(powerDiff)} point(s) unspent.`,
      category: "Powers"
    };
    return {
      isOverallValid: attributeStatus.isValid && skillStatus.isValid && powerStatus.isValid,
      attributes: attributeStatus, skills: skillStatus, powers: powerStatus,
    };
  };

  const recalculateDerivedDataAndSummary = useCallback((
    details: CharacterDetails | null,
    attributes: CharacterAttributes | null,
    skillsInput: SkillFormData[] | null,
    powersInput: PowerFormData[] | null,
    weaknessesInput: Weakness[] | null,
    existingId?: string,
  ): { derivedAttributeDice: AttributeDice | null, derivedSummary: Character | null } => {
    if (!details || !attributes) return { derivedAttributeDice: null, derivedSummary: null };
    const newAttributeDice: AttributeDice = {} as AttributeDice;
    ATTRIBUTE_KEYS.forEach(key => { newAttributeDice[key] = getDieForPoints(attributes[key]); });
    
    const finalSkills: Skill[] = (skillsInput || []).map(skill => {
      const baseDie = getDieForPoints(skill.points);
      let linkedAttributeBonus = 0;
      let linkedAttributeNameDisplay = '';
      if (skill.linkedAttribute && attributes[skill.linkedAttribute as AttributeName]) {
        linkedAttributeBonus = attributes[skill.linkedAttribute as AttributeName];
        linkedAttributeNameDisplay = ` (${skill.linkedAttribute.charAt(0).toUpperCase() + skill.linkedAttribute.slice(1)})`;
      }
      return { ...skill, finalDieString: `${baseDie} + ${linkedAttributeBonus}${linkedAttributeNameDisplay}` };
    });
    
    const finalPowers: Power[] = (powersInput || []).map(power => {
      const baseDie = getDieForPoints(power.points);
      let linkedAttributeBonus = 0;      
      let linkedAttributeNameDisplay = '';
      if (power.linkedAttribute && attributes[power.linkedAttribute as AttributeName]) {
        linkedAttributeBonus = attributes[power.linkedAttribute as AttributeName];
        linkedAttributeNameDisplay = ` (${power.linkedAttribute.charAt(0).toUpperCase() + power.linkedAttribute.slice(1)})`;
      }
      return { ...power, finalDieString: `${baseDie} + ${linkedAttributeBonus}${linkedAttributeNameDisplay}` };
    });

    const summary: Character = { 
      id: existingId, 
      ...details, 
      attributes, 
      attributeDice: newAttributeDice, 
      skills: finalSkills, 
      powers: finalPowers,
      weaknesses: weaknessesInput || []
    };
    return { derivedAttributeDice: newAttributeDice, derivedSummary: summary };
  }, []);

  const handleResetData = () => {
    setCharacterDetails(null); setCharacterAttributes(null); setAttributeDice(null); setCharacterSkillsData(null); setCharacterPowersData(null); setCharacterWeaknessesData(null); setCharacterSummary(null); setSummaryValidationResult(null);
    setIsPlayModeRequest(false);
  };
  
  const handleCreateNewHero = () => {
    host.reset(sessionKey); setActorLabel("New character"); setLegacyInfo(null);
    handleResetData();
    setStep('details');
  };

  const updateSummaryData = useCallback((details: CharacterDetails | null, attrs: CharacterAttributes | null, skills: SkillFormData[] | null, powers: PowerFormData[] | null, weaknesses: Weakness[] | null) => {
    if (details && attrs && skills && powers && weaknesses) {
      const { derivedSummary, derivedAttributeDice } = recalculateDerivedDataAndSummary(details, attrs, skills, powers, weaknesses, characterSummary?.id);
      if (derivedAttributeDice) setAttributeDice(derivedAttributeDice);
      if (derivedSummary) {
        setCharacterSummary(derivedSummary);
        setSummaryValidationResult(calculateOverallValidationStatus(derivedSummary));
      }
    }
  }, [recalculateDerivedDataAndSummary, characterSummary?.id]);

  const handleDetailsSubmit = useCallback((details: CharacterDetails) => {
    setCharacterDetails(details); 
    setStep('attributes');
  }, []);

  const handleBackToDetails = useCallback(() => { setStep('details'); }, []);

  const handleAttributesSubmit = useCallback((attributesData: CharacterAttributes) => {
    setCharacterAttributes(attributesData);
    const { derivedAttributeDice } = recalculateDerivedDataAndSummary(characterDetails, attributesData, null, null, null);
    if (derivedAttributeDice) setAttributeDice(derivedAttributeDice);
    setStep('skills');
  }, [characterDetails, recalculateDerivedDataAndSummary]);

  const handleBackToAttributes = useCallback(() => { setStep('attributes'); }, []);

  const handleSkillsSubmit = useCallback((skillsData: SkillFormData[]) => {
    setCharacterSkillsData(skillsData); setStep('powers');
  }, []);

  const handleBackToSkills = useCallback(() => { setStep('skills'); }, []);
  
  const handlePowersSubmit = useCallback((powersData: PowerFormData[]) => {
    setCharacterPowersData(powersData);
    setStep('weaknesses');
  }, []);

  const handleBackToPowers = useCallback(() => {
    setStep('powers');
  }, []);

  const handleWeaknessesSubmit = useCallback((weaknessesData: Weakness[]) => {
    setCharacterWeaknessesData(weaknessesData);
    updateSummaryData(characterDetails, characterAttributes, characterSkillsData, characterPowersData, weaknessesData);
    setStep('summary');
  }, [characterDetails, characterAttributes, characterSkillsData, characterPowersData, updateSummaryData]);

  const handleBackToWeaknesses = useCallback(() => {
    setStep('weaknesses');
  }, []);

  const handleSaveProgress = useCallback(() => {
    const saveData: SavedProgress = {
      version: APP_VERSION, savedAt: new Date().toISOString(),
      appState: { step, characterDetails, characterAttributes, characterSkillsData, characterPowersData, characterWeaknessesData, autoReadEnabled },
    };
    const jsonString = JSON.stringify(saveData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const heroName = characterDetails?.heroName?.replace(/\s+/g, '_') || '';
    const charName = characterDetails?.characterName?.replace(/\s+/g, '_') || '';
    const baseFilename = heroName || charName || 'SAGA_Character_Progress';
    link.download = `${baseFilename}.sagaChar`; link.href = url;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
  }, [step, characterDetails, characterAttributes, characterSkillsData, characterPowersData, characterWeaknessesData, autoReadEnabled]);

  const handleLoadProgress = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const loadedData = JSON.parse(jsonString) as SavedProgress;
        if (!loadedData.appState || !loadedData.appState.step) throw new Error("Invalid save file structure.");
        const { 
          step: loadedStep, 
          characterDetails: loadedDetails, 
          characterAttributes: loadedAttributes, 
          characterSkillsData: loadedSkills, 
          characterPowersData: loadedPowers,
          characterWeaknessesData: loadedWeaknesses,
          autoReadEnabled: loadedAutoRead
        } = loadedData.appState;
        
        setCharacterDetails(loadedDetails); setCharacterAttributes(loadedAttributes); setCharacterSkillsData(loadedSkills); setCharacterPowersData(loadedPowers); setCharacterWeaknessesData(loadedWeaknesses || []);
        if (loadedAutoRead !== undefined) setAutoReadEnabled(loadedAutoRead);
        
        const { derivedAttributeDice, derivedSummary } = recalculateDerivedDataAndSummary(loadedDetails, loadedAttributes, loadedSkills, loadedPowers, loadedWeaknesses);
        if (derivedAttributeDice) setAttributeDice(derivedAttributeDice);
        if (derivedSummary) {
            setCharacterSummary(derivedSummary);
            setSummaryValidationResult(calculateOverallValidationStatus(derivedSummary));
        }

        if (isPlayModeRequest) setStep('summary');
        else setStep(loadedDetails ? 'details' : 'home');
        setIsPlayModeRequest(false);
      } catch (error) { alert(`Error loading file: ${error instanceof Error ? error.message : "Unknown error"}`); }
      finally { if (fileInputRef.current) fileInputRef.current.value = ""; }
    };
    reader.readAsText(file);
  }, [recalculateDerivedDataAndSummary, isPlayModeRequest]);
  
  const handleLoadFromRecent = (character: Character, forcePlay: boolean = false) => {
      const details: CharacterDetails = { playerName: character.playerName, characterName: character.characterName, heroName: character.heroName, age: character.age, description: character.description, heroDescription: character.heroDescription, characterBackstory: character.characterBackstory, level: character.level, characterImage: character.characterImage };
      const attributes = character.attributes;
      const skillsData = (character.skills || []).map(s => ({ id: s.id, name: s.name, points: s.points, linkedAttribute: s.linkedAttribute }));
      const powersData = (character.powers || []).map(p => ({ id: p.id, name: p.name, points: p.points, linkedAttribute: p.linkedAttribute, description: p.description }));
      const weaknessesData = character.weaknesses || [];
      
      setCharacterDetails(details); setCharacterAttributes(attributes); setCharacterSkillsData(skillsData); setCharacterPowersData(powersData); setCharacterWeaknessesData(weaknessesData);
      
      const { derivedAttributeDice, derivedSummary = character } = recalculateDerivedDataAndSummary(details, attributes, skillsData, powersData, weaknessesData, character.id);
      if (derivedAttributeDice) setAttributeDice(derivedAttributeDice);
      if (derivedSummary) { 
        setCharacterSummary(derivedSummary); 
        setSummaryValidationResult(calculateOverallValidationStatus(derivedSummary)); 
      }
      setIsRecentCharactersModalOpen(false); 
      setStep('summary');
      setIsPlayModeRequest(false);
  };

  const handleDeleteRecent = (characterId: string) => {
      setRecentCharacters(prevRecent => {
          const updatedRecent = prevRecent.filter(char => char.id !== characterId);
          try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedRecent)); } catch (error) {}
          return updatedRecent;
      });
  };

  const [actorLabel, setActorLabel] = useState('New character');
  const [actorChoice,setActorChoice] = useState('');
  const [legacyInfo,setLegacyInfo] = useState<any>(null);
  const [saving,setSaving] = useState(false);
  const openActor = () => {
    if(!actorChoice || !confirm('Open this Actor? Unsaved editor changes will be replaced.')) return;
    try {
      const result=host.load(sessionKey,actorChoice); handleResetData(); setActorLabel(result.name);
      setLegacyInfo(result.legacy);
      if(result.character) handleLoadFromRecent(result.character);
      else setStep('home');
    } catch(e){fail(e);}
  };
  useEffect(()=>{
    const id=host?.initial?.(sessionKey);
    if(!id)return;
    try{
      const result=host.load(sessionKey,id);
      setActorChoice(id);setActorLabel(result.name);setLegacyInfo(result.legacy);
      if(result.character){handleLoadFromRecent(result.character);setStep(host.initialMode?.(sessionKey)==='play'?'play':'details');}
      else setStep('home');
    }catch(e){fail(e);}
  },[]);
  const saveActor = async () => {
    if(saving)return;
    setSaving(true);
    try {
      const {derivedSummary}=recalculateDerivedDataAndSummary(characterDetails,characterAttributes,characterSkillsData,characterPowersData,characterWeaknessesData);
      if(!derivedSummary) throw Error('Complete the character creation steps before saving.');
      if(legacyInfo && !confirm('Replace this legacy Actor’s SAGA attribute, skill and power groups with this build? Its original system fields will be backed up.')) return;
      const result=await host.save(sessionKey,derivedSummary);
      setActorLabel(result.name);setLegacyInfo(null);setCharacterSummary({...result.character,id:result.id});
      setCharacterDetails(prev=>prev?{...prev,characterImage:result.character.characterImage}:prev);
      return result;
    }catch(e){fail(e);}finally{setSaving(false);}
  };
  const enterPlay = async () => {if(await saveActor())setStep('play');};
  const triggerLoadFile = (playRequested: boolean = false) => {
    setIsPlayModeRequest(playRequested);
    fileInputRef.current?.click();
  };

  const handleExportToTXT = () => {
    if (!characterSummary) return;
    const c=characterSummary;
    let content = `SAGA Character Sheet\nHero: ${c.heroName}\nName: ${c.characterName}\nPlayer: ${c.playerName||''}\nLevel: ${c.level}\nAge: ${c.age}\n\nDescription: ${c.description}\nHero description: ${c.heroDescription}\nBackstory: ${c.characterBackstory}\n\nAttributes\n`;
    ATTRIBUTE_KEYS.forEach(k=>{content+=`${ATTRIBUTE_LABELS[k]}: ${c.attributes[k]} points; roll ${c.attributeDice[k]}\n`;});
    for(const [heading,entries] of [['Skills',c.skills||[]],['Powers',c.powers||[]]] as const){content+=`\n${heading}\n`;entries.forEach(e=>{content+=`${e.name}: ${e.points} points; ${e.finalDieString}${'description' in e?' — '+(e.description||''):''}\n`;});}
    content+='\nWeaknesses\n';(c.weaknesses||[]).forEach(w=>{content+=`${w.name} (${w.severity}): ${w.effect}\n`;});
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `${characterSummary.heroName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
  };

  const handleExportToPNG = async () => {
    if (!characterSummary || !summaryContainerRef.current) return;
     try {
      const canvas = await window.html2canvas(summaryContainerRef.current, { backgroundColor: '#0f172a', useCORS: true, scale: 2 });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a'); link.href = image; link.download = `${characterSummary.heroName.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (error) {fail(error);}
  };

  const ValidationSummaryDisplay: React.FC<{ result: OverallValidationResult | null }> = ({ result }) => {
    if (!result) return null;
    const sections = [result.attributes, result.skills, result.powers];
    return (
      <div className={`p-4 rounded-lg mt-6 border ${result.isOverallValid ? 'bg-green-500/10 border-green-700' : 'bg-red-500/10 border-red-700'}`}>
        <div className={`flex items-center ${!result.isOverallValid ? 'mb-3' : 'justify-center'}`}>
          {result.isOverallValid ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-7 h-7 text-green-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
          ) : (
            <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-7 h-7 text-red-400 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg><h3 className="text-xl font-semibold text-red-300">Invalid Character Configuration</h3></>
          )}
        </div>
        {!result.isOverallValid && (
          <ul className="space-y-2 text-sm">
            {sections.map(section => !section.isValid && (
              <li key={section.category} className="p-2 rounded-md bg-red-500/20 text-red-200"><strong>{section.category}:</strong> {section.message} <span className="text-xs opacity-80">(Spent: {section.spent}, Total: {section.total})</span></li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const navItems = [
    { id: 'home', label: 'Home', disabled: false },
    { id: 'details', label: 'Character Details', disabled: false },
    { id: 'attributes', label: 'Assign Attributes', disabled: !characterDetails },
    { id: 'skills', label: 'Define Skills', disabled: !characterAttributes },
    { id: 'powers', label: 'Bestow Powers', disabled: !characterSkillsData },
    { id: 'weaknesses', label: 'Personal Weaknesses', disabled: !characterPowersData },
    { id: 'summary', label: 'Your Hero Awaits', disabled: !characterWeaknessesData },
    { id: 'play', label: 'Play Mode', disabled: !characterWeaknessesData },
    { id: 'rules', label: 'View Rules', disabled: false },
    { id: 'resources', label: 'Resources', disabled: false }
  ];

  const handleNavClick = (targetStep: CreationStep) => {
    if (targetStep === 'play') { void enterPlay(); return; }
    if (targetStep === 'summary') {
      updateSummaryData(characterDetails, characterAttributes, characterSkillsData, characterPowersData, characterWeaknessesData);
    }
    setStep(targetStep);
    setIsMobileMenuOpen(false);
  };

  const getNavHelpText = (currentStep: CreationStep): React.ReactNode => {
    if (currentStep.startsWith('rules')) return "Consulting the Tome of Rules.";
    switch (currentStep) {
      case 'home': return "Welcome to the Saga Character Creator!";
      case 'resources': return "Additional materials for your adventure.";
      case 'details': return (
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            Picture it. You have super powers. What do you look like? What are your powers like? 
            Before we get into mechanics lets get that image locked in.
          </p>
          
          <div className="p-3 bg-slate-850/50 rounded-lg border border-slate-700 shadow-inner">
            <p className="font-black text-[10px] text-sky-400 uppercase tracking-widest mb-2 border-b border-slate-700 pb-1">Example Hero Profile</p>
            <div className="space-y-2 text-[10px] leading-snug">
              <div><span className="text-indigo-300 font-bold">Player Name:</span> <span className="text-slate-400 ml-1">Taylor</span></div>
              <div><span className="text-indigo-300 font-bold">Character Name:</span> <span className="text-slate-400 ml-1">Jordan Smith</span></div>
              <div><span className="text-indigo-300 font-bold">Hero Alias:</span> <span className="text-sky-300 font-bold italic ml-1 underline decoration-sky-800">The Blue Ruse</span></div>
              <div><span className="text-indigo-300 font-bold">Age / Level:</span> <span className="text-slate-400 ml-1">20 / Level 3</span></div>
              <div className="pt-1 border-t border-slate-700/50">
                <span className="text-indigo-300 font-bold block mb-0.5 uppercase tracking-tighter">Description:</span> 
                <span className="text-slate-300 italic">Jordan has blonde hair and green eyes. They are tall, around 5'8".</span>
              </div>
              <div>
                <span className="text-indigo-300 font-bold block mb-0.5 uppercase tracking-tighter">Hero Persona:</span> 
                <span className="text-slate-300 italic">Wears a dark blue costume with white accents and a small half cape with a blue question mark on it.</span>
              </div>
              <div>
                <span className="text-indigo-300 font-bold block mb-0.5 uppercase tracking-tighter">Backstory:</span> 
                <span className="text-slate-300 italic">The Blue Ruse is an anti hero that likes to keep them guessing.</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic text-center">Use this as a guide for your identity!</p>
        </div>
      );
      case 'attributes': return (
        <div className="space-y-3">
          <p className="border-b border-slate-600 pb-1 mb-2 font-black text-[10px] text-slate-400">ATTRIBUTE SOURCES</p>
          <div><span className="text-emerald-400 font-black">MUTATION:</span> <span className="text-slate-300">For characters whose powers come from Mutating such as Wolverine or Spider-Man.</span></div>
          <div><span className="text-rose-400 font-black">BODY:</span> <span className="text-slate-300">For characters whose powers come from their bodies and who they are such as Superman or Captain America.</span></div>
          <div><span className="text-indigo-400 font-black">ARCANA:</span> <span className="text-slate-300">For characters whose powers come from Magic such as Zatana or Doctor Strange.</span></div>
          <div><span className="text-sky-400 font-black">MIND:</span> <span className="text-slate-300">For characters whose powers come from intellect such as Ozymandias.</span></div>
          <div><span className="text-slate-400 font-black">TECHNOLOGY:</span> <span className="text-slate-300">For characters whose powers come from the use of technology such as Batman.</span></div>
          <div><span className="text-amber-400 font-black">GENERAL:</span> <span className="text-slate-300">For Characters who have some powers that may not be described by other attributes.</span></div>
        </div>
      );
      case 'skills': return (
        <div className="space-y-3">
          <p className="border-b border-slate-600 pb-1 mb-2 font-black text-[10px] text-slate-400">EXAMPLE SKILLS</p>
          <ul className="space-y-1">
            <li className="text-purple-400 font-bold">• Acrobatics</li>
            <li className="text-purple-400 font-bold">• Athletics</li>
            <li className="text-purple-400 font-bold">• Deceit</li>
            <li className="text-purple-400 font-bold">• Intimidation</li>
            <li className="text-purple-400 font-bold">• Investigation</li>
            <li className="text-purple-400 font-bold">• Stealth</li>
          </ul>
          <p className="text-[9px] text-slate-400 mt-2 italic leading-tight">
            Check the rules for more information and example skills!
          </p>
        </div>
      );
      case 'powers': return (
        <div className="space-y-3">
          <p className="border-b border-slate-600 pb-1 mb-2 font-black text-[10px] text-slate-400 uppercase tracking-widest">Super Powers</p>
          <p className="text-slate-300">
            Example Powers are unique. Think <span className="text-orange-400 font-bold">flight</span>, <span className="text-orange-400 font-bold">super strength</span>, etc.
          </p>
          <div className="pt-2 border-t border-slate-700/50">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">External Reference</span>
            <a 
              href="https://www.superherodb.com/powers/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline text-[10px] break-all block transition-colors"
            >
              https://www.superherodb.com/powers/
            </a>
          </div>
        </div>
      );
      case 'weaknesses': return (
        <div className="space-y-3">
          <p className="text-slate-300 leading-snug">
            Truly memorable characters are shaped by their <span className="font-bold text-rose-400">weaknesses</span>. Each character should choose at least one.
          </p>
          
          <div className="p-2 bg-slate-850/40 border border-slate-700 rounded-lg">
            <p className="text-[9px] font-black text-rose-300 uppercase mb-1 tracking-widest border-b border-slate-700/50 pb-0.5">Common Forms</p>
            <ul className="space-y-1 text-[9px] leading-tight">
              <li className="flex gap-1.5"><span className="text-rose-500 font-bold">•</span> <span className="text-slate-400"><strong className="text-slate-300">Physical:</strong> specific elements or materials</span></li>
              <li className="flex gap-1.5"><span className="text-rose-500 font-bold">•</span> <span className="text-slate-400"><strong className="text-slate-300">Emotional:</strong> anger, overconfidence, obsession</span></li>
              <li className="flex gap-1.5"><span className="text-rose-500 font-bold">•</span> <span className="text-slate-400"><strong className="text-slate-300">Narrative:</strong> prophecy, haunting memories, fate</span></li>
              <li className="flex gap-1.5"><span className="text-rose-500 font-bold">•</span> <span className="text-slate-400"><strong className="text-slate-300">Behavioral:</strong> compulsions or specific draws</span></li>
            </ul>
          </div>

          <p className="text-[10px] text-slate-400 italic leading-snug">
            Weaknesses ground your character and provide rich opportunities for tension, growth, and roleplaying.
          </p>

          <div className="pt-2 border-t border-slate-700/50">
            <h4 className="text-[10px] font-black text-rose-300 uppercase mb-1 tracking-wider">Customizing Your Weakness</h4>
            <p className="text-[10px] text-slate-400 leading-normal italic">
              Define frequency and impact with your GM. Whether rare and devastating or common and mild, all should feel meaningful.
            </p>
          </div>
        </div>
      );
      case 'summary': return "Behold! Your creation is ready for battle.";
      case 'play': return "Entering the fray: Play Mode active.";
      default: return "";
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'home':
        return (
          <div className="text-center animate-fadeIn space-y-6 py-8">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <h2 className="text-3xl sm:text-4xl font-semibold text-sky-300 font-orbitron">{welcomeTitle}</h2>
              <TTSButton text={`${welcomeTitle}. ${welcomeDescription}`} />
            </div>
            <p className="text-slate-300 text-lg max-w-md mx-auto">{welcomeDescription}</p>
            
            <div className="max-w-sm mx-auto space-y-2 pt-4 text-left">
              <label htmlFor="themeSelector" className="block text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Interface Theme</label>
              <select 
                id="themeSelector"
                value={theme}
                onChange={(e) => setTheme(e.target.value as AppTheme)}
                className="w-full py-2.5 px-4 bg-slate-800 border-2 border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500 transition-all font-bold"
              >
                {THEMES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4 pt-6">
              <button onClick={handleCreateNewHero} className="w-full max-w-sm mx-auto flex justify-center py-3.5 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition duration-150 transform hover:scale-105">Create New Hero</button>
              
              <button onClick={() => triggerLoadFile(false)} className="w-full max-w-sm mx-auto flex justify-center py-3 px-4 border border-sky-500 rounded-md shadow-sm text-md font-medium text-sky-300 hover:bg-sky-700 hover:text-white transition duration-150 text-sky-300">Load SagaChar</button>
              <button onClick={() => setStep('rules')} className="w-full max-w-sm mx-auto flex justify-center py-3 px-4 border border-amber-500 rounded-md shadow-sm text-md font-medium text-amber-300 hover:bg-amber-700 hover:text-white transition duration-150">View Rules</button>
              <button onClick={() => setStep('resources')} className="w-full max-w-sm mx-auto flex justify-center py-3 px-4 border border-indigo-500 rounded-md shadow-sm text-md font-medium text-indigo-300 hover:bg-indigo-700 hover:text-white transition duration-150">Resources</button>
              <a href="https://jdthedm.com/wp-content/uploads/2025/10/The-First-Saga-v1.0.pdf" target="_blank" rel="noopener noreferrer" className="w-full max-w-sm mx-auto flex justify-center py-3 px-4 border border-teal-500 rounded-md shadow-sm text-md font-medium text-teal-300 hover:bg-teal-700 hover:text-white transition duration-150">Download Rules</a>
              
              
            </div>
            <div className="pt-8 opacity-40 text-[10px] uppercase tracking-tighter text-slate-500 font-bold">
              v{APP_VERSION} 2026
            </div>
          </div>
        );
      case 'resources':
        return (
          <div className="animate-fadeIn py-8 text-center">
            <h2 className="text-3xl font-semibold text-sky-400 font-orbitron mb-8">Resources</h2>
            <div className="max-w-md mx-auto space-y-4">
               <a 
                 href="https://ttrpgsafetytoolkit.com/" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="w-full flex justify-center py-3 px-4 border border-rose-500 rounded-md shadow-sm text-md font-medium text-rose-300 hover:bg-rose-700 hover:text-white transition duration-150 transform hover:scale-105 active:scale-95"
               >
                 Safety Tools
               </a>
               <a 
                 href="https://powerlisting.fandom.com/wiki/Superpower_Wiki" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="w-full flex justify-center py-3 px-4 border border-amber-500 rounded-md shadow-sm text-md font-medium text-amber-300 hover:bg-amber-700 hover:text-white transition duration-150 transform hover:scale-105 active:scale-95"
               >
                 Superpower Wiki
               </a>
               <a 
                 href="https://www.superherodb.com/powers/" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="w-full flex justify-center py-3 px-4 border border-sky-500 rounded-md shadow-sm text-md font-medium text-sky-300 hover:bg-sky-700 hover:text-white transition duration-150 transform hover:scale-105 active:scale-95"
               >
                 Superpower Database
               </a>
               <a 
                 href="https://www.fantasynamegenerators.com/hero-names.php" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="w-full flex justify-center py-3 px-4 border border-emerald-500 rounded-md shadow-sm text-md font-medium text-emerald-300 hover:bg-emerald-700 hover:text-white transition duration-150 transform hover:scale-105 active:scale-95"
               >
                 Hero Name Generator
               </a>
               <a 
                 href="https://rolladvantage.com/tokenstamp/" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="w-full flex justify-center py-3 px-4 border border-blue-500 rounded-md shadow-sm text-md font-medium text-blue-300 hover:bg-blue-700 hover:text-white transition duration-150 transform hover:scale-105 active:scale-95"
               >
                 Token Maker
               </a>
            </div>
            <button onClick={() => setStep('home')} className="mt-8 py-3 px-8 border border-sky-500 rounded-lg text-sky-300 hover:bg-sky-700 transition font-bold mx-auto block">Back to Home</button>
          </div>
        );
      case 'play':
        return characterSummary ? (
          <PlayMode 
            character={characterSummary} 
            onBackToRules={() => setStep('rules')}
          />
        ) : null;
      case 'rules-heroism':
        return (
          <div className="animate-fadeIn space-y-6 py-8 px-4 sm:px-8 text-left max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-sky-400 font-orbitron mb-6 text-center">Heroism</h2>
            <div className="space-y-6 text-slate-200 leading-relaxed">
              <p>
                <span className="font-bold text-sky-300">Heroism</span> is a form of meta-currency in The First Saga that allows players to take bold,
                dramatic action, reshape the scene, or seize a moment when the dice don’t quite go
                their way. Heroism reflects the spirit of the game with characters rising above the odds
                to be exceptional.
              </p>
              
              <h3 className="text-xl font-bold text-sky-300 mt-8 font-orbitron text-center">Earning Heroism</h3>
              <p>Players can earn Heroism in four key ways:</p>
              <ul className="list-disc pl-10 space-y-3">
                <li><span className="font-bold text-amber-400 uppercase tracking-tighter mr-1">Start of Session:</span> Each player gains Heroism automatically at the start of every session.</li>
                <li><span className="font-bold text-amber-400 uppercase tracking-tighter mr-1">Exceptional Roleplay:</span> The Game Master may award Heroism to players who roleplay in compelling, moving, or especially creative ways.</li>
                <li><span className="font-bold text-amber-400 uppercase tracking-tighter mr-1">Critical Roll Values:</span> Rolling the highest possible value on a die (e.g., 10 on a d10, 20 on a d20) grants 1 Heroism. Same as when a player rolls the lowest possible value on a die (a 1 on any die.)</li>
                <li><span className="font-bold text-amber-400 uppercase tracking-tighter mr-1">End-of-Session Awards:</span> During the session recap, each player may choose one other player to receive 1 Heroism for something awesome they did that session.</li>
              </ul>

              <h3 className="text-xl font-bold text-sky-300 mt-8 font-orbitron text-center">Heroism Limit</h3>
              <p className="text-center">A player may bank up to <span className="font-bold text-amber-400 underline decoration-amber-600/50">2 × their character level</span>, with a minimum cap of 3 Heroism. These points are meant to be used often, not hoarded, so spend boldly!</p>

              <h3 className="text-xl font-bold text-sky-300 mt-8 font-orbitron text-center">Using Heroism</h3>
              <p>You can spend 1 Heroism to do one of the following:</p>
              <ul className="list-disc pl-10 space-y-3">
                <li><span className="font-bold text-indigo-300 uppercase tracking-tighter mr-1">Edit the Scene:</span> Make a small narrative change such as introducing a previously unmentioned item, detail, or event (with agreement from the GM and other players.)</li>
                <li><span className="font-bold text-indigo-300 uppercase tracking-tighter mr-1">Add +5 to a Roll:</span> Declared before rolling, this gives you a powerful edge.</li>
                <li><span className="font-bold text-indigo-300 uppercase tracking-tighter mr-1">Reduce the Bad:</span> Reduce (Not remove) the negative impact of a failed roll.</li>
                <li><span className="font-bold text-indigo-300 uppercase tracking-tighter mr-1">Boost Proficiency:</span> Roll any check as if you were +1 tier higher in proficiency. (e.g., d8 becomes d10)</li>
              </ul>
              <p className="p-4 bg-slate-800 border-l-4 border-amber-500 italic text-slate-300 mt-6 shadow-inner">
                Only one Heroism point may be spent per player on any given check, roll, or scene alteration.
              </p>
            </div>
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setStep('rules')} className="py-3 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition font-bold shadow-sm">Back to Rules</button>
              <button onClick={() => setStep('home')} className="py-3 px-4 bg-sky-600 rounded-lg text-white hover:bg-sky-500 transition font-bold shadow-md shadow-sky-900/20">Home</button>
            </div>
          </div>
        );
      case 'rules-circumstance':
        return (
          <div className="animate-fadeIn space-y-6 py-8 px-4 sm:px-8 text-left max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-sky-400 font-orbitron mb-6 text-center">Circumstance Modifiers</h2>
            <div className="space-y-6 text-slate-200 leading-relaxed">
              <p>Not every challenge unfolds on even ground. Sometimes the environment, momentum, or narrative context gives a character an advantage and other times, it makes things more difficult. These are called Circumstantial Modifiers, and they represent narrative boosts or penalties granted at the Game Master’s discretion, based on what’s happening in the story.</p>
              
              <h3 className="text-xl font-bold text-sky-300 mt-8 font-orbitron text-center">When to Apply Modifiers</h3>
              <p>If something in the narrative logically benefits or hinders a character’s attempt, like surprise, momentum, emotional state, weather, terrain, or clever planning and so the GM may assign a bonus or penalty die to the roll. This die is rolled alongside the main check, and the result is either added to or subtracted from the final total based on the following table:</p>
              
              <div className="overflow-x-auto border border-slate-700 rounded-lg mt-4 shadow-md max-w-sm mx-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-700 text-sky-300">
                    <tr><th className="p-3 font-bold">Level of Impact</th><th className="p-3 font-bold">Die</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <tr className="border-b border-slate-700"><td className="p-3 font-semibold">Mild</td><td className="p-3 font-mono font-bold text-amber-400">+/- 1d4</td></tr>
                    <tr className="border-b border-slate-700 bg-slate-750/30"><td className="p-3 font-semibold">Medium</td><td className="p-3 font-mono font-bold text-amber-400">+/- 1d8</td></tr>
                    <tr><td className="p-3 font-semibold">Greater</td><td className="p-3 font-mono font-bold text-amber-400">+/- 1d12</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setStep('rules')} className="py-3 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition font-bold shadow-sm">Back to Rules</button>
              <button onClick={() => setStep('home')} className="py-3 px-4 bg-sky-600 rounded-lg text-white hover:bg-sky-500 transition font-bold shadow-md shadow-sky-900/20">Home</button>
            </div>
          </div>
        );
      case 'rules-weaknesses':
        return (
          <div className="animate-fadeIn space-y-8 py-8 px-4 sm:px-8 text-left max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-sky-400 font-orbitron mb-6 text-center">Weaknesses</h2>
            <div className="space-y-6 text-slate-200 leading-relaxed">
              <p>Truly memorable characters aren’t defined by their powers alone but they are shaped by their weaknesses. Each character should choose at least one personal weakness. This can take many forms:</p>
              <ul className="list-disc pl-10 space-y-1">
                <li><span className="font-bold text-sky-300">A physical vulnerability</span> (e.g., a specific element or material)</li>
                <li><span className="font-bold text-sky-300">An emotional flaw</span> (e.g., quick to anger, overconfident, obsessed with glory)</li>
                <li><span className="font-bold text-sky-300">A narrative burden</span> (e.g., a prophecy, haunting memory, or inevitable fate)</li>
                <li><span className="font-bold text-sky-300">A behavioral compulsion</span> (e.g., always needing to duel strong opponents, drawn to deserts, etc.)</li>
              </ul>
              <p>Weaknesses help ground your character in the story and provide rich opportunities for tension, growth, and roleplaying.</p>
              
              <h3 className="text-xl font-bold text-sky-300 mt-8 font-orbitron">Customizing Your Weakness</h3>
              <p>You’re encouraged to work with your Game Master to define how often your weakness might appear in play, and how impactful it should be. Some weaknesses are rare but devastating. Others are common but mild. All of them should feel meaningful. Your weakness might be:</p>
              <ul className="list-disc pl-10 space-y-1">
                <li>A MacGuffin you are drawn to or bound by</li>
                <li>A character trait that gets you into trouble</li>
                <li>A truth you’re trying to avoid, but can’t ignore forever</li>
              </ul>
              <p>Based on that choose one of the following impacts being in the presence of your weakness applies:</p>

              <div className="overflow-x-auto border border-slate-700 rounded-lg mt-4 shadow-md max-w-md mx-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-700 text-sky-300">
                    <tr><th className="p-3 font-bold">Frequency or Impact</th><th className="p-3 font-bold">Effect on Dice Rolls</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <tr className="border-b border-slate-700"><td className="p-3">Rarely Encountered or Highly Impactful</td><td className="p-3 text-rose-400 font-bold">-3 Proficiency on Rolls</td></tr>
                    <tr className="border-b border-slate-700 bg-slate-750/30"><td className="p-3">Uncommon or Moderately Impactful</td><td className="p-3 text-rose-400 font-bold">-2 Proficiency on Rolls</td></tr>
                    <tr><td className="p-3">Common or Less Impactful</td><td className="p-3 text-rose-400 font-bold">-1 Proficiency on Rolls</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-sky-900/20 border-l-4 border-sky-500 rounded-r-xl shadow-lg">
                 <h4 className="text-md font-bold text-sky-300 uppercase mb-3 border-b border-sky-500/20 pb-1">GM Tips: Choosing a Good Weakness</h4>
                 <p className="text-xs text-slate-300 mb-3 font-semibold">Here are some prompts to help you brainstorm:</p>
                 <ul className="text-xs space-y-2 list-disc pl-5 text-slate-400 italic mb-4">
                   <li>What’s something your character would refuse to do, no matter the cost?</li>
                   <li>What flaw has cost them in the past?</li>
                   <li>What makes them hesitate, even when everything is on the line?</li>
                   <li>What could someone use to manipulate or control them?</li>
                 </ul>
                 <p className="text-[10px] font-black uppercase text-sky-400 tracking-widest mb-2 border-t border-sky-500/10 pt-2">Example Weaknesses:</p>
                 <ul className="text-[11px] space-y-2 text-slate-200">
                   <li><span className="text-rose-400">“</span>I can never harm a child, even if they pose a threat.<span className="text-rose-400">”</span></li>
                   <li><span className="text-rose-400">“</span>I feel the pull of deserts. I’m drawn to them, even when I shouldn’t be.<span className="text-rose-400">”</span></li>
                   <li><span className="text-rose-400">“</span>My body rejects electricity. Even the smallest jolts disorient me.<span className="text-rose-400">”</span></li>
                   <li><span className="text-rose-400">“</span>I live in fear of the moment my prophecy comes true.<span className="text-rose-400">”</span></li>
                   <li><span className="text-rose-400">“</span>I fly into a rage whenever someone mocks my family.<span className="text-rose-400">”</span></li>
                 </ul>
              </div>

              <p className="text-center font-bold text-sky-300 italic pt-4 leading-relaxed">
                Remember, a well-crafted weakness isn’t a limitation, it’s an invitation to explore what makes your hero truly legend!
              </p>
            </div>
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setStep('rules')} className="py-3 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition font-bold shadow-sm">Back to Rules</button>
              <button onClick={() => setStep('home')} className="py-3 px-4 bg-sky-600 rounded-lg text-white hover:bg-sky-500 transition font-bold shadow-md shadow-sky-900/20">Home</button>
            </div>
          </div>
        );
      case 'rules-defeat-death':
        return (
          <div className="animate-fadeIn space-y-8 py-8 px-4 sm:px-8 text-left max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-sky-400 font-orbitron mb-6 text-center">Defeat and Death</h2>
            <div className="space-y-6 text-slate-200 leading-relaxed">
              <p>In The First Saga, combat outcomes serve the story first and foremost. A character, whether player, NPC, or enemy, is not considered defeated or dead unless the narrative flow supports it and the decision is mutually agreed upon by the involved players (or the Game Master, in the case of NPCs). Defeat and death are not automatic but rather they are collaborative storytelling decisions.</p>

              <h3 className="text-xl font-bold text-sky-300 mt-8 font-orbitron text-center">Defeat</h3>
              <p>A character can be knocked down, incapacitated, or taken out of a scene without being permanently removed from the story. “Defeat” is flexible and can take many forms:</p>
              <ul className="list-disc pl-10 space-y-2">
                <li>Being knocked unconscious</li>
                <li>Losing the ability to act in the scene</li>
                <li>Being trapped, restrained, or otherwise rendered ineffective</li>
              </ul>
              <p>The exact nature of defeat should be narratively described, often by the defender or the GM, and agreed upon by the players at the table.</p>
              <p className="p-4 bg-slate-800 border-l-4 border-sky-400 rounded-xl text-sm italic shadow-inner">
                If you are using the <span className="text-sky-300 font-bold">Conditions</span> rules, defeat can naturally come as the character takes damage beyond injured (7).
              </p>

              <h3 className="text-xl font-bold text-sky-300 mt-8 font-orbitron text-center">Death</h3>
              <p>Death is never automatic in The First Saga. Even if a character is severely wounded or dramatically outmatched, they do not die unless all players involved agree that it makes sense for the story. This rule applies to players and NPCs alike. Death can be a powerful storytelling tool, but only when it’s earned, meaningful, and consensual.</p>

              <div className="p-6 bg-sky-900/20 border-l-4 border-sky-500 rounded-r-xl shadow-lg mt-8">
                 <h4 className="text-md font-bold text-sky-300 uppercase mb-4 border-b border-sky-500/20 pb-1">GM Tips: Story-Driven Defeat & Death</h4>
                 <ul className="text-xs space-y-4 list-disc pl-5 text-slate-300">
                   <li><span className="font-bold text-sky-100 uppercase tracking-tighter mr-1">Player defeated but not dead?</span> They could be captured, left behind, or changed forever by the encounter.</li>
                   <li><span className="font-bold text-sky-100 uppercase tracking-tighter mr-1">NPC death in question?</span> Talk as a table. A dramatic survival or unexpected escape might serve the story better.</li>
                   <li><span className="font-bold text-sky-100 uppercase tracking-tighter mr-1">Want death to matter?</span> Build toward it and let it be the climax of a narrative arc or the turning point of a campaign.</li>
                 </ul>
              </div>
            </div>
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setStep('rules')} className="py-3 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition font-bold shadow-sm">Back to Rules</button>
              <button onClick={() => setStep('home')} className="py-3 px-4 bg-sky-600 rounded-lg text-white hover:bg-sky-500 transition font-bold shadow-md shadow-sky-900/20">Home</button>
            </div>
          </div>
        );
      case 'rules-dice':
        return (
          <div className="animate-fadeIn space-y-6 py-8 px-4 sm:px-8 text-left max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-sky-400 font-orbitron mb-6 text-center">The Dice System</h2>
            <div className="space-y-4 text-slate-200 leading-relaxed">
              <p className="text-center mb-6">
                In The First Saga, the type of die you roll for a check depends on how many points
                you’ve invested in the relevant attribute, skill, or power. Refer to the following list to
                determine which die to use:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center"><span className="text-[10px] block uppercase text-slate-500 font-black">Not Proficient</span><span className="text-xl font-black text-slate-200 font-mono">1d4</span></div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center"><span className="text-[10px] block uppercase text-slate-500 font-black">Proficient</span><span className="text-xl font-black text-slate-200 font-mono">1d6</span></div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center"><span className="text-[10px] block uppercase text-slate-500 font-black">Adept</span><span className="text-xl font-black text-slate-200 font-mono">1d8</span></div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center"><span className="text-[10px] block uppercase text-slate-500 font-black">Expert</span><span className="text-xl font-black text-slate-200 font-mono">1d10</span></div>
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center"><span className="text-[10px] block uppercase text-slate-500 font-black">Elite</span><span className="text-xl font-black text-slate-200 font-mono">1d12</span></div>
                <div className="bg-amber-900/20 p-3 rounded-xl border border-amber-500/30 text-center"><span className="text-[10px] block uppercase text-amber-500 font-black">Omega</span><span className="text-xl font-black text-amber-400 font-mono">1d20</span></div>
              </div>
              <p className="text-sm mt-8 text-center text-slate-400">
                The number of points required to reach each tier varies depending on whether it’s an
                attribute, ability, or power. For full details, see the Attributes, Powers, Abilities, or
                Character Creation sections.
              </p>

              <h3 className="text-xl font-bold text-sky-300 mt-12 font-orbitron text-center uppercase tracking-widest border-b border-sky-500/20 pb-2">Rolling Extremes</h3>
              <p className="leading-relaxed text-center italic">
                Rolling the highest or lowest value on a die is not an automatic success or failure.
                However, when you do roll either extreme (e.g., a 1 on a d4 or a 20 on a d20), you always
                gain <span className="font-bold text-amber-400 uppercase tracking-widest">1 Heroism</span> as a result.
              </p>
            </div>
            <div className="pt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setStep('rules')} className="py-3 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition font-bold shadow-sm">Back to Rules</button>
              <button onClick={() => setStep('home')} className="py-3 px-4 bg-sky-600 rounded-lg text-white hover:bg-sky-500 transition font-bold shadow-md shadow-sky-900/20">Home</button>
            </div>
          </div>
        );
      case 'rules':
        return (
          <div className="text-center animate-fadeIn space-y-6 py-8">
            <h2 className="text-3xl font-semibold text-sky-400 font-orbitron mb-8 uppercase tracking-widest border-b-2 border-sky-500/20 pb-4 inline-block">SAGA Rules Guide</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { label: "The Dice System", step: 'rules-dice' },
                { label: "Attribute System", step: 'rules-attributes' },
                { label: "Skills", step: 'rules-skills' },
                { label: "Powers", step: 'rules-powers' },
                { label: "Checks Out of Combat", step: 'rules-out-of-combat' },
                { label: "Combat", step: 'rules-combat' },
                { label: "Conditions", step: 'rules-conditions' },
                { label: "Defeat and Death", step: 'rules-defeat-death' },
                { label: "Weaknesses", step: 'rules-weaknesses' },
                { label: "Circumstance Modifiers", step: 'rules-circumstance' },
                { label: "Heroism", step: 'rules-heroism' }
              ].map((rule) => (
                <button 
                  key={rule.label} 
                  onClick={() => setStep(rule.step as CreationStep)}
                  className="py-6 px-4 bg-slate-800 border-2 border-slate-700 hover:border-sky-500 rounded-2xl text-slate-100 font-bold font-orbitron uppercase tracking-tighter transition-all transform hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-900/10 active:scale-95 group"
                >
                  <span className="group-hover:text-sky-300 transition-colors">{rule.label}</span>
                </button>
              ))}
              <button onClick={() => { setStep('home'); }} className="py-5 px-4 border-2 border-slate-600 hover:bg-slate-700 rounded-2xl text-slate-400 hover:text-white font-black uppercase tracking-widest transition-all sm:col-span-2 lg:col-span-3">Back to Main Menu</button>
            </div>
          </div>
        );
      case 'rules-attributes':
        return (
          <div className="animate-fadeIn space-y-6 py-8 px-4 sm:px-8 text-left max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold text-sky-400 font-orbitron mb-6 text-center">Attribute System</h2>
            <div className="space-y-4 text-slate-200 leading-relaxed">
              <p>Attributes in The First Saga represent broad categories of your character’s talents and potential. They measure how skilled or powerful your character is in a particular area.</p>
              <h3 className="text-xl font-bold text-sky-300 mt-8 font-orbitron text-center">Gaining Attributes</h3>
              <p className="text-center">Characters gain attribute points equal to <span className="font-bold text-amber-400 underline decoration-amber-600/50 underline-offset-4">5 × their level</span>. These points are spent across the available attributes during character creation and advancement. As you invest points into an attribute, your proficiency tier in that attribute increases, determining the die you roll when making attribute checks as follows:</p>
              
              <div className="overflow-x-auto border border-slate-700 rounded-lg mt-4 shadow-md max-w-lg mx-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-700 text-sky-300">
                    <tr><th className="p-3 font-bold">Proficiency</th><th className="p-3 font-bold text-center">Points</th><th className="p-3 font-bold text-center">Die</th><th className="p-3 font-bold text-center">Modifier</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <tr><td className="p-3">Not Proficient</td><td className="p-3 text-center">0</td><td className="p-3 text-center font-mono">1d4</td><td className="p-3 text-center">0</td></tr>
                    <tr className="bg-slate-750/30"><td className="p-3">Proficient</td><td className="p-3 text-center">1+</td><td className="p-3 text-center font-mono">1d6</td><td className="p-3 text-center font-bold text-sky-300">Points</td></tr>
                    <tr><td className="p-3">Adept</td><td className="p-3 text-center">3+</td><td className="p-3 text-center font-mono">1d8</td><td className="p-3 text-center font-bold text-sky-300">Points</td></tr>
                    <tr className="bg-slate-750/30"><td className="p-3">Expert</td><td className="p-3 text-center">5+</td><td className="p-3 text-center font-mono">1d10</td><td className="p-3 text-center font-bold text-sky-300">Points</td></tr>
                    <tr><td className="p-3">Elite</td><td className="p-3 text-center">7+</td><td className="p-3 text-center font-mono">1d12</td><td className="p-3 text-center font-bold text-sky-300">Points</td></tr>
                    <tr className="bg-slate-750/30"><td className="p-3 font-bold text-amber-400">Omega</td><td className="p-3 text-center font-bold text-amber-400">12+</td><td className="p-3 text-center font-mono font-bold text-amber-400">1d20</td><td className="p-3 text-center font-bold text-amber-400">Points</td></tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-8 bg-slate-800/40 p-5 rounded-2xl border border-slate-700 shadow-inner">
                For players familiar with other TTRPGs: these attributes do not follow the traditional lineup of Strength, Dexterity, Intelligence, and so on. Instead, they are designed to reflect the unique mechanics and flavor of this system. When adapting SAGA to a new setting or medium, begin by identifying 5 to 6 core attributes that reflect the key areas of expertise, power, or skill characters should be capable of at a high level. These attributes serve the foundation of your game’s mechanics and flavor.
              </p>
              
              <h4 className="text-lg font-bold text-sky-300 mt-8 text-center uppercase tracking-widest">SAGA: Superhero Attributes</h4>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ATTRIBUTE_KEYS.map(key => (
                  <li key={key} className="bg-slate-700/50 p-3 rounded-xl border border-slate-600 text-center font-bold text-slate-100 shadow-sm uppercase tracking-tighter">{ATTRIBUTE_LABELS[key]}</li>
                ))}
              </ul>
            </div>
            <div className="pt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setStep('rules')} className="py-3 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition font-bold shadow-sm">Back to Rules</button>
              <button onClick={() => setStep('home')} className="py-3 px-4 bg-sky-600 rounded-lg text-white hover:bg-sky-500 transition font-bold shadow-md shadow-sky-900/20">Home</button>
            </div>
          </div>
        );
      case 'rules-skills':
        return (
          <div className="animate-fadeIn space-y-8 py-8 px-4 sm:px-8 text-left max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-sky-400 font-orbitron mb-6 text-center">Skills</h2>
            <div className="space-y-6 text-slate-200 leading-relaxed">
              <p>
                Skills are the actions and techniques your character uses to interact with the world and
                are comparable to skills in other roleplaying games. These represent anything from
                investigation and persuasion to crafting, piloting, or survival. For example, a player
                might use the Investigation ability to analyze a crime scene and uncover hidden clues. A
                good rule of thumb is that Skills are things that can be taught and learned, and others
                could potentially also do.
              </p>

              <h3 className="text-xl font-bold text-sky-300 mt-8 font-orbitron text-center">Gaining Skill Ranks</h3>
              <p>
                You gain a number of skill points equal to <span className="font-bold text-amber-400">6 × your character level</span>. That’s a generous
                pool of points with plenty of room to customize your character’s strengths and
                specialties!
              </p>
              
              <p className="font-bold text-sky-300">To use them:</p>
              <ul className="list-disc pl-10 space-y-2">
                <li>Choose the active abilities (skills) your character should have.</li>
                <li>Assign points to each ability to increase your proficiency tier (which determines your die size, see table below).</li>
                <li>When using a skill, add the modifier from the most relevant attribute chosen by you, based on the context of the action. (For example, you might use intimidation as a Charisma based skill if you are threatening someone, but you also might use intimidation as Strength based if the presence of your rippling physique is the source of the intimidation.)</li>
              </ul>

              <h3 className="text-xl font-bold text-sky-300 mt-8 font-orbitron text-center">Skills Include, but are not limited to:</h3>
              <div className="overflow-x-auto border border-slate-700 rounded-lg mt-4 shadow-md">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-700 text-sky-300">
                    <tr>
                      <th className="p-3 font-bold border-b border-slate-600">Skill</th>
                      <th className="p-3 font-bold border-b border-slate-600">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <tr><td className="p-3 font-bold text-sky-200">Acrobatics</td><td className="p-3">Used for feats of agility such as flips, rolls, and navigating tight spaces or dangerous terrain with grace.</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-sky-200">Animal Magnetism</td><td className="p-3">Represents your natural charm and charisma specifically when dealing with animals or non-human creatures.</td></tr>
                    <tr><td className="p-3 font-bold text-sky-200">Athletics</td><td className="p-3">Covers physical prowess like running, jumping, climbing, swimming, or feats of raw strength.</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-sky-200">Craft Device (Type)</td><td className="p-3">Used to construct or engineer devices of a specific type (Can be taken repeatedly for different devices); requires time, tools, and components.</td></tr>
                    <tr><td className="p-3 font-bold text-sky-200">Decipher Meaning</td><td className="p-3">Interprets hidden messages, symbolism, or coded languages whether ancient, encrypted, or metaphorical.</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-sky-200">Deceit</td><td className="p-3">Used when lying, bluffing, or creating false impressions to mislead others.</td></tr>
                    <tr><td className="p-3 font-bold text-sky-200">Diplomacy</td><td className="p-3">Applies to navigating formal social situations, treaties, or negotiations between groups or individuals.</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-sky-200">Disable (Type)</td><td className="p-3">Used to disarm, sabotage, or manipulate devices or traps of a specific type (Can be taken repeatedly for different device types).</td></tr>
                    <tr><td className="p-3 font-bold text-sky-200">Insight</td><td className="p-3">Measures your ability to read emotions, motives, or determine if someone is being honest.</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-sky-200">Intimidation</td><td className="p-3">Relies on fear, threats, or aggressive behavior to compel others to act in your favor.</td></tr>
                    <tr><td className="p-3 font-bold text-sky-200">Investigation</td><td className="p-3">Used to carefully search for clues, piece together information, or analyze crime scenes and complex environments.</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-sky-200">Knowledge (Type)</td><td className="p-3">Represents expertise in a specific field of study, such as history, science, or arcane lore. Can be taken repeatedly for different knowledge types.</td></tr>
                    <tr><td className="p-3 font-bold text-sky-200">Operate Device (Type)</td><td className="p-3">Covers the operation of a device or tool of a specific type (Can be taken repeatedly for different device types) that requires technical or learned skill.</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-sky-200">Persuasion</td><td className="p-3">Used to influence others through charm, reason, or heartfelt appeals in casual or conversational settings.</td></tr>
                    <tr><td className="p-3 font-bold text-sky-200">Perception</td><td className="p-3">Covers general awareness, spotting hidden objects, hearing faint sounds, or noticing small details in your surroundings.</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-sky-200">Stealth</td><td className="p-3">Applies when sneaking, hiding, or moving silently to avoid detection.</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="italic text-slate-400 text-center">Work with your Game Master to add additional skills you would like to have for your character.</p>

              <h3 className="text-xl font-bold text-sky-300 mt-8 font-orbitron text-center">Skill Proficiencies and Spending:</h3>
              <p className="text-center">Spending skill points increases your proficiency tier as follows:</p>
              <div className="overflow-x-auto border border-slate-700 rounded-lg mt-4 shadow-md max-w-md mx-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-700 text-sky-300">
                    <tr>
                      <th className="p-3 font-bold">Proficiency</th>
                      <th className="p-3 font-bold text-center">Cost</th>
                      <th className="p-3 font-bold text-center">Die</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <tr><td className="p-3">Not Proficient</td><td className="p-3 text-center">0</td><td className="p-3 text-center font-mono">1d4</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3">Proficient</td><td className="p-3 text-center">1+</td><td className="p-3 text-center font-mono">1d6</td></tr>
                    <tr><td className="p-3">Adept</td><td className="p-3 text-center">3+</td><td className="p-3 text-center font-mono">1d8</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3">Expert</td><td className="p-3 text-center">5+</td><td className="p-3 text-center font-mono">1d10</td></tr>
                    <tr><td className="p-3">Elite</td><td className="p-3 text-center">7+</td><td className="p-3 text-center font-mono">1d12</td></tr>
                    <tr className="bg-amber-900/20"><td className="p-3 font-bold text-amber-400">Omega</td><td className="p-3 text-center font-bold text-amber-400">12+</td><td className="p-3 text-center font-mono font-bold text-amber-400">1d20</td></tr>
                  </tbody>
                </table>
              </div>

              <p className="text-center font-bold text-sky-300 mt-8 p-4 bg-slate-800 rounded-xl border border-sky-500/30">
                Rolls for Skills will always be in the form of: <br/>
                <span className="text-2xl font-orbitron text-amber-400">Proficiency Die + Chosen Ability Score Modifier</span>
              </p>
            </div>
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setStep('rules')} className="py-3 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition font-bold shadow-sm">Back to Rules</button>
              <button onClick={() => setStep('home')} className="py-3 px-4 bg-sky-600 rounded-lg text-white hover:bg-sky-500 transition font-bold shadow-md shadow-sky-900/20">Home</button>
            </div>
          </div>
        );
      case 'rules-powers':
        return (
          <div className="animate-fadeIn space-y-8 py-8 px-4 sm:px-8 text-left max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-sky-400 font-orbitron mb-6 text-center">Powers</h2>
            <div className="space-y-6 text-slate-200 leading-relaxed">
              <p>
                Powers are as limitless as your imagination. They represent your character’s unique
                abilities—whether supernatural, psychic, technological, or something entirely original.
              </p>
              <p>
                Like active abilities, you gain a number of power points equal to <span className="font-bold text-amber-400">5 × your character level</span>.
                These points are used to increase your proficiency tier in each power, which determines
                the die you roll when using that power.
              </p>
              <p>
                When using a power, you also add the modifier from the most relevant attribute, just as
                you would with an active ability.
              </p>

              <h3 className="text-xl font-bold text-sky-300 mt-8 font-orbitron text-center uppercase tracking-widest">Customizing Powers</h3>
              <p>
                Powers can be as broad or as specific as you like. A general power might be <strong>Fire Manipulation</strong>,
                while a more specific one could be <strong>Flame Whip</strong>. The scope is up to you—but always be sure to
                talk with your Game Master when creating or refining powers to ensure balance and narrative fit.
              </p>

              <h3 className="text-xl font-bold text-sky-300 mt-8 font-orbitron text-center uppercase tracking-widest">Spending Points</h3>
              <p className="text-center">As you invest points into a power, you gain proficiency in that power and increase your effectiveness when using it in gameplay as follows:</p>
              
              <div className="overflow-x-auto border border-slate-700 rounded-lg mt-4 shadow-md max-w-md mx-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-700 text-sky-300">
                    <tr>
                      <th className="p-3 font-bold">Proficiency</th>
                      <th className="p-3 font-bold text-center">Cost</th>
                      <th className="p-3 font-bold text-center">Die</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <tr><td className="p-3">Not Proficient</td><td className="p-3 text-center">0</td><td className="p-3 text-center font-mono">1d4</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3">Proficient</td><td className="p-3 text-center">1+</td><td className="p-3 text-center font-mono">1d6</td></tr>
                    <tr><td className="p-3">Adept</td><td className="p-3 text-center">3+</td><td className="p-3 text-center font-mono">1d8</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3">Expert</td><td className="p-3 text-center">5+</td><td className="p-3 text-center font-mono">1d10</td></tr>
                    <tr><td className="p-3">Elite</td><td className="p-3 text-center">7+</td><td className="p-3 text-center font-mono">1d12</td></tr>
                    <tr className="bg-amber-900/20"><td className="p-3 font-bold text-amber-400">Omega</td><td className="p-3 text-center font-bold text-amber-400">12+</td><td className="p-3 text-center font-mono font-bold text-amber-400">1d20</td></tr>
                  </tbody>
                </table>
              </div>

              <p className="text-center font-bold text-sky-300 mt-8 p-4 bg-slate-800 rounded-xl border border-sky-500/30">
                Rolls for powers will always be in the form of: <br/>
                <span className="text-2xl font-orbitron text-amber-400">Proficiency Die + Ability Score Modifier</span>
              </p>
            </div>
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setStep('rules')} className="py-3 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition font-bold shadow-sm">Back to Rules</button>
              <button onClick={() => setStep('home')} className="py-3 px-4 bg-sky-600 rounded-lg text-white hover:bg-sky-500 transition font-bold shadow-md shadow-sky-900/20">Home</button>
            </div>
          </div>
        );
      case 'rules-out-of-combat':
        return (
          <div className="animate-fadeIn space-y-8 py-8 px-4 sm:px-8 text-left max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-sky-400 font-orbitron mb-6 text-center">Checks Out of Combat</h2>
            <div className="space-y-6 text-slate-200 leading-relaxed">
              <p>
                When attempting to do something that isn’t directly opposed by a player or an NPC—such as picking a lock, climbing a wall, or decoding an ancient script—you roll against a static <strong>Difficulty Value (DV)</strong>.
              </p>
              <p>
                DVs represent how challenging the task is, and are used as a target number that your total roll (die + modifiers) must meet or exceed to succeed.
              </p>
              <p>
                Use the table below as a general guideline for setting DVs:
              </p>

              <div className="overflow-x-auto border border-slate-700 rounded-lg mt-4 shadow-md max-w-sm mx-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-700 text-sky-300">
                    <tr>
                      <th className="p-3 font-bold">Difficulty Description</th>
                      <th className="p-3 font-bold text-center">DV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <tr><td className="p-3">Definite</td><td className="p-3 text-center font-mono font-bold text-sky-400">1</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3">Simple</td><td className="p-3 text-center font-mono font-bold text-sky-400">3</td></tr>
                    <tr><td className="p-3">Easy</td><td className="p-3 text-center font-mono font-bold text-sky-400">5</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3">Straightforward</td><td className="p-3 text-center font-mono font-bold text-sky-400">7</td></tr>
                    <tr><td className="p-3">Moderate</td><td className="p-3 text-center font-mono font-bold text-sky-400">9</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3">Intermediate</td><td className="p-3 text-center font-mono font-bold text-sky-400">11</td></tr>
                    <tr><td className="p-3">Challenging</td><td className="p-3 text-center font-mono font-bold text-sky-400">13</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3">Difficult</td><td className="p-3 text-center font-mono font-bold text-sky-400">15</td></tr>
                    <tr><td className="p-3">Complex</td><td className="p-3 text-center font-mono font-bold text-sky-400">17</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3">Very Hard</td><td className="p-3 text-center font-mono font-bold text-sky-400">19</td></tr>
                    <tr><td className="p-3">Vexing</td><td className="p-3 text-center font-mono font-bold text-sky-400">21</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3">Near Impossible</td><td className="p-3 text-center font-mono font-bold text-sky-400">23</td></tr>
                    <tr><td className="p-3">Quite Impossible</td><td className="p-3 text-center font-mono font-bold text-sky-400">25</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3">Absurd</td><td className="p-3 text-center font-mono font-bold text-sky-400">27</td></tr>
                    <tr><td className="p-3">Ungodly</td><td className="p-3 text-center font-mono font-bold text-sky-400">29</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-amber-400">Cosmic</td><td className="p-3 text-center font-mono font-bold text-amber-400">31</td></tr>
                  </tbody>
                </table>
              </div>

              <p className="italic text-slate-400 text-center mt-6">
                Remember—players don’t need to roll if success is guaranteed or failure is inconsequential.
              </p>
            </div>
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setStep('rules')} className="py-3 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition font-bold shadow-sm">Back to Rules</button>
              <button onClick={() => setStep('home')} className="py-3 px-4 bg-sky-600 rounded-lg text-white hover:bg-sky-500 transition font-bold shadow-md shadow-sky-900/20">Home</button>
            </div>
          </div>
        );
      case 'rules-combat':
        return (
          <div className="animate-fadeIn space-y-8 py-8 px-4 sm:px-8 text-left max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-sky-400 font-orbitron mb-6 text-center">Combat</h2>
            
            <div className="space-y-6 text-slate-200 leading-relaxed">
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-sky-300 font-orbitron border-b border-sky-500/20 pb-2">Defenses & Opposed Checks</h3>
                <p>
                  Most combat in The First Saga is handled through <strong>opposed checks</strong>—where one character’s action is directly challenged by another. These are used for player vs. player, player vs. NPC, or any situation where two forces are actively working against each other.
                </p>
                <p>
                  Combat should be narratively driven, with mechanics supporting the action. If a character can reasonably describe how a power, ability, or skill would help them defend against an incoming attack or effect, and the GM agrees, they may roll a defensive check in response.
                </p>
                <p className="italic text-slate-400">Both describe what would happen in the event they are successful in the opposed roll.</p>
              </section>

              <section className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <h4 className="text-lg font-bold text-sky-300 mb-4 uppercase tracking-widest">Resolution</h4>
                <ul className="space-y-3">
                  <li className="flex gap-3"><span className="text-sky-500 font-bold">●</span> <span>If the <strong>initiator</strong> wins the opposed check, their described outcome happens.</span></li>
                  <li className="flex gap-3"><span className="text-sky-500 font-bold">●</span> <span>If the <strong>defender</strong> wins, their described outcome happens.</span></li>
                  <li className="flex gap-3"><span className="text-sky-500 font-bold">●</span> <span>On a <strong>tie</strong>, the Game Master determines the outcome as a neutral result not favoring either party.</span></li>
                </ul>
                <p className="mt-4 text-sm font-bold text-amber-400 italic">Note: Outside of PvP a tie will always favor the player character.</p>
              </section>

              <div className="p-5 bg-sky-900/20 border-l-4 border-sky-500 rounded-r-xl shadow-lg">
                <h4 className="text-sm font-bold text-sky-300 uppercase mb-3">GM Tips: Running Opposed Checks in Combat</h4>
                <ul className="text-xs space-y-2 list-disc pl-5 text-slate-300">
                  <li><strong>Keep it cinematic:</strong> Let the players drive the visual storytelling.</li>
                  <li><strong>Encourage creativity:</strong> Let players defend using unconventional abilities if their explanation is solid.</li>
                  <li><strong>Clarify the stakes:</strong> Before the roll, make sure everyone knows what’s at risk—whether it’s damage, positioning, or a dramatic beat.</li>
                </ul>
              </div>

              <section className="space-y-4">
                <h3 className="text-xl font-bold text-sky-300 font-orbitron border-b border-sky-500/20 pb-2">Possibilities & Outcomes</h3>
                <p>
                  Before any opposed roll is made, each player involved—whether as attacker or defender—gets to state what they want their success to accomplish. This includes both mechanical and narrative intentions: damage, escape, disarm, repositioning, intimidation, etc.
                </p>
                <p>
                  The Game Master will do the same for any involved NPCs. In player vs. player (PvP) situations, both players declare their desired outcomes.
                </p>
                <p>
                  Once all parties have shared their intended outcomes and everyone involved agrees on what is at stake, the opposed roll is made to determine who wins the moment and gets to narrate the result.
                </p>
              </section>

              <section className="bg-slate-900/80 p-6 rounded-2xl border border-slate-700 shadow-xl">
                <h4 className="text-lg font-bold text-amber-400 mb-4 font-orbitron uppercase tracking-widest flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Example Combat: Flowerman vs. Flame Dragon
                </h4>
                <div className="space-y-4 text-sm">
                  <p>Let’s say Flame Dragon uses his mutation ability and describes how he would launch a fireblast at Flowerman. Flowerman describes how he counters by using his plant-based magic to grow a beanstalk and escape.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-rose-900/20 border border-rose-500/30 rounded-xl">
                      <p className="font-bold text-rose-300 mb-1">Flame Dragon's Intent:</p>
                      <p className="italic text-slate-300">“You see Flame Dragon raise his hands up at you conjuring a roaring fire ball. He smiles and hurls it at you. If he hits, it will knock Flowerman backwards and prone and will damage him with fire!”</p>
                    </div>
                    <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
                      <p className="font-bold text-emerald-300 mb-1">Flowerman's Intent:</p>
                      <p className="italic text-slate-300">“To defend you see Flowerman raise his arms to the sky, and a giant beanstalk erupts from the soil, lifting him into the air. The lush, damp, and mossy base of the beanstalk catches your fireblast, putting it out and diminishing it.”</p>
                    </div>
                  </div>
                  <div className="flex justify-center items-center gap-8 py-2">
                    <div className="text-center"><span className="block text-xs text-slate-500 uppercase">Flame Dragon</span><span className="text-xl font-black font-mono text-rose-400">6 (1d10+4)</span></div>
                    <div className="text-2xl font-black text-slate-600">VS</div>
                    <div className="text-center"><span className="block text-xs text-slate-500 uppercase">Flowerman</span><span className="text-xl font-black font-mono text-emerald-400">8 (1d8+3)</span></div>
                  </div>
                  <p className="text-center font-bold text-emerald-400 bg-emerald-900/30 py-2 rounded-lg border border-emerald-500/20">Flowerman wins and his narration of the event is what happens!</p>
                </div>
              </section>

              <div className="p-5 bg-sky-900/20 border-l-4 border-sky-500 rounded-r-xl shadow-lg">
                <h4 className="text-sm font-bold text-sky-300 uppercase mb-3">GM Tips: Setting Stakes Before the Roll</h4>
                <p className="text-xs text-slate-300 mb-3">To keep gameplay flowing and cinematic, encourage players to be clear about what they want to achieve. Examples:</p>
                <ul className="text-xs space-y-1 italic text-slate-400 list-none pl-2">
                  <li>“If I win, I disarm her and knock the blade aside.”</li>
                  <li>“I want to break his concentration so he can’t finish the ritual.”</li>
                  <li>“I’m trying to hold them off long enough for the others to escape.”</li>
                  <li>“I want to leap from the rooftop and land with the upper hand.”</li>
                </ul>
              </div>

              <section className="space-y-4">
                <h3 className="text-xl font-bold text-sky-300 font-orbitron border-b border-sky-500/20 pb-2">Turn Order</h3>
                <p>
                  Combat in The First Saga doesn’t rely on a rigid initiative score—instead, it follows a flexible, cinematic structure designed to keep the story moving and the spotlight shared.
                </p>
                
                <h4 className="text-lg font-bold text-sky-200">When Supervillains Are Present</h4>
                <p>If a supervillain (or boss/mini-boss) is in combat, the GM selects one to act first. After that:</p>
                <ol className="list-decimal pl-10 space-y-2">
                  <li>A hero chosen by the player group goes next.</li>
                  <li>Then another villain acts.</li>
                  <li>Then another hero, and so on...</li>
                </ol>
                <p>This alternating pattern continues until each hero has taken a turn. If there are fewer villains than heroes, the villains may act multiple times within a round to maintain the alternating rhythm.</p>

                <h4 className="text-lg font-bold text-sky-200">Hero Rounds & Flexibility</h4>
                <p>
                  Once every hero has acted, that round is considered the end of the <strong>Hero Round</strong>. At the start of each new Hero Round, players are free to choose a new order among themselves for who goes first, second, and so on, with a villain alternating in between.
                </p>

                <h4 className="text-lg font-bold text-sky-200">When No Supervillains Are Present</h4>
                <p>If the encounter doesn’t include supervillains, the heroes act first, then the GM chooses a villain or NPC to respond, continuing the same alternating rhythm.</p>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold text-sky-300 font-orbitron border-b border-sky-500/20 pb-2">Combat Breakouts</h3>
                <p>Cinematically fights can break out from the central battle. When this happens, the fight can literally separate into two distinct battles happening at the same time!</p>
                <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl">
                  <p className="font-bold text-sky-200 mb-2">Divide the Initiative into Two Separate Instances:</p>
                  <p>Run one round of the first combat, followed by the round of the second combat. Continue this alternating pattern until the combats resolve.</p>
                  <p className="mt-2 text-xs text-slate-400 italic">Note: Players may use their action to change between combat instances if it makes logical sense (e.g., flying to the other site).</p>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold text-sky-300 font-orbitron border-b border-sky-500/20 pb-2">Advanced Combat Options</h3>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-sky-200">Chain Attacks</h4>
                  <p>Actions involving multiple targets or consecutive steps. Each part is a separate opposed check; each success leads to the next “link”. If any link fails, the chain ends immediately.</p>
                  <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl text-sm italic">
                    Example: Julia wants to grab Steve and throw him at Jimmy. First check: Grab Steve. Success? Second check: Throw at Jimmy. Fail grab? Action ends.
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-sky-200">Group / Team Attacks</h4>
                  <p>Combined assaults against strong defenses. One player is the attack leader. Each additional participant adds their attribute modifier to the check, but must skip their next turn in combat.</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-sky-200">Reactions</h4>
                  <p>Each character has <strong>1 Reaction Point</strong>, refreshing at the start of every Hero Round. Spend it when targeted or to intervene for an ally.</p>
                  <p className="text-sky-200 font-bold">Reactions as Offense:</p>
                  <ul className="list-disc pl-10 space-y-1 text-sm">
                    <li>Enemy moves past you without caution.</li>
                    <li>Target is vulnerable, weakened, or unaware.</li>
                    <li>GM agrees the moment is justified.</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-bold text-sky-300 font-orbitron border-b border-sky-500/20 pb-2">Defeat and Death</h3>
                <p>Combat outcomes serve the story first. A character is not considered defeated or dead unless the narrative flow supports it and it is mutually agreed upon.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl">
                    <h5 className="font-bold text-sky-200 mb-2">Defeat</h5>
                    <p className="text-xs">Knocked down, incapacitated, or taken out of a scene. Can be unconscious, restrained, or rendered ineffective.</p>
                  </div>
                  <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl">
                    <h5 className="font-bold text-sky-200 mb-2">Death</h5>
                    <p className="text-xs">Never automatic. Only happens if all players agree it makes sense for the story. A powerful, consensual storytelling tool.</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setStep('rules')} className="py-3 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition font-bold shadow-sm">Back to Rules</button>
              <button onClick={() => setStep('home')} className="py-3 px-4 bg-sky-600 rounded-lg text-white hover:bg-sky-500 transition font-bold shadow-md shadow-sky-900/20">Home</button>
            </div>
          </div>
        );
      case 'rules-conditions':
        return (
          <div className="animate-fadeIn space-y-8 py-8 px-4 sm:px-8 text-left max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-sky-400 font-orbitron mb-6 text-center">Conditions</h2>
            <div className="space-y-6 text-slate-200 leading-relaxed">
              <p>
                Conditions can be optionally added as additional crunch during combat. They can
                represent the status of characters and enemies as superhero battles go on. Feel free to
                add your own, but some base conditions and their effects include:
              </p>

              <div className="overflow-x-auto border border-slate-700 rounded-lg mt-4 shadow-md">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-700 text-sky-300">
                    <tr>
                      <th className="p-3 font-bold border-b border-slate-600">Condition</th>
                      <th className="p-3 font-bold border-b border-slate-600">Effect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <tr><td className="p-3 font-bold text-rose-400">Injured</td><td className="p-3">Receive -1 on all rolls made</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-rose-400">Injured (2)</td><td className="p-3 font-mono">Receive -1d4 on all rolls made</td></tr>
                    <tr><td className="p-3 font-bold text-rose-400">Injured (3)</td><td className="p-3 font-mono">Receive -1d6 on all rolls made</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-rose-400">Injured (4)</td><td className="p-3 font-mono">Receive -1d8 on all rolls made</td></tr>
                    <tr><td className="p-3 font-bold text-rose-400">Injured (5)</td><td className="p-3 font-mono">Receive -1d10 on all rolls made</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-rose-400">Injured (6)</td><td className="p-3 font-mono">Receive -1d12 on all rolls made</td></tr>
                    <tr><td className="p-3 font-bold text-rose-400">Injured (7)</td><td className="p-3 font-mono font-bold">Receive -1d20 on all rolls made</td></tr>
                    <tr className="bg-rose-900/20"><td className="p-3 font-bold text-rose-500 uppercase">Defeated</td><td className="p-3">Character is unable to take actions and is removed from Initiative</td></tr>
                    <tr><td className="p-3 font-bold text-emerald-400">Empowered</td><td className="p-3">Receive +1 on all rolls made</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-emerald-400">Empowered (2)</td><td className="p-3 font-mono">Receive +1d4 on all rolls made</td></tr>
                    <tr><td className="p-3 font-bold text-emerald-400">Empowered (3)</td><td className="p-3 font-mono">Receive +1d6 on all rolls made</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-emerald-400">Empowered (4)</td><td className="p-3 font-mono">Receive +1d8 on all rolls made</td></tr>
                    <tr><td className="p-3 font-bold text-emerald-400">Empowered (5)</td><td className="p-3 font-mono">Receive +1d10 on all rolls made</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-emerald-400">Empowered (6)</td><td className="p-3 font-mono">Receive +1d12 on all rolls made</td></tr>
                    <tr><td className="p-3 font-bold text-emerald-400 font-black">Empowered (7)</td><td className="p-3 font-mono font-bold">Receive +1d20 on all rolls made</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-amber-400">Unstable</td><td className="p-3">Characters power becomes unreliable</td></tr>
                    <tr><td className="p-3 font-bold text-amber-400">Power Dampened</td><td className="p-3">Character is unable to roll any of their abilities under “Powers”</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-amber-400">Stunned</td><td className="p-3">Character skips their next turn in the initiative and cannot join team attacks or rolls until after their next turn.</td></tr>
                    <tr><td className="p-3 font-bold text-indigo-400">Demoralized</td><td className="p-3">Receive a penalty on rolls based on circumstance table regarding severity of demoralization</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-indigo-400">Fearful</td><td className="p-3">Cannot move toward the source of your fear</td></tr>
                    <tr><td className="p-3 font-bold text-rose-500">Enraged</td><td className="p-3">Must use next turn to attack nearest target</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-purple-400">Confused</td><td className="p-3">Roll 1d4. Odds: Action as Normal. Evens: Character moves in random direction.</td></tr>
                    <tr><td className="p-3 font-bold text-purple-400">Compelled</td><td className="p-3">Character must take actions as directed by source of compelled condition.</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-slate-400">Distracted</td><td className="p-3">Character suffers a minor penalty (-1d4) to rolls related to teamwork.</td></tr>
                    <tr><td className="p-3 font-bold text-slate-400">Delirious</td><td className="p-3">Character suffers a major penalty (-1d12) to rolls related to teamwork.</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-sky-400">Hacked</td><td className="p-3">Character is unable to use electronic device that was the subject of the hacked condition</td></tr>
                    <tr><td className="p-3 font-bold text-amber-600">Guilt-Ridden</td><td className="p-3">Character is immune to benefits of heroism</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-amber-600">Guilty</td><td className="p-3">Character cannot gain additional heroism</td></tr>
                    <tr><td className="p-3 font-bold text-slate-500">Distrust</td><td className="p-3">Cannot take actions that rely on allies</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-rose-600">Publicly Despised</td><td className="p-3">Character has a major penalty (-1d12) on all social contests when dealing with the public.</td></tr>
                    <tr><td className="p-3 font-bold text-slate-300">Muted</td><td className="p-3">Cannot speak or use verbal components for abilities</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-slate-300">Deafened</td><td className="p-3">Cannot hear or use skills reliant on hearing</td></tr>
                    <tr><td className="p-3 font-bold text-sky-500">Anchored</td><td className="p-3">Cannot be moved by external abilities or powers</td></tr>
                    <tr className="bg-slate-800/50"><td className="p-3 font-bold text-orange-400">Panicking</td><td className="p-3">Unable to spend your reaction or use your reaction to assist another</td></tr>
                    <tr><td className="p-3 font-bold text-orange-600">Frozen in Fear</td><td className="p-3">Unable to move of your own free will or take actions while in the presence of the source of your fear.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setStep('rules')} className="py-3 px-4 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition font-bold shadow-sm">Back to Rules</button>
              <button onClick={() => setStep('home')} className="py-3 px-4 bg-sky-600 rounded-lg text-white hover:bg-sky-500 transition font-bold shadow-md shadow-sky-900/20">Home</button>
            </div>
          </div>
        );
      case 'details':
        return <CharacterDetailsForm onSubmit={handleDetailsSubmit} initialDetails={characterDetails} onSaveProgress={handleSaveProgress} onLoadProgress={() => triggerLoadFile(false)} onPartialUpdate={setCharacterDetails} autoReadEnabled={autoReadEnabled} />;
      case 'attributes':
        return characterDetails ? <AttributesForm characterLevel={characterDetails.level} characterName={characterDetails.characterName} onSubmit={handleAttributesSubmit} onBack={handleBackToDetails} summaryData={summaryData} initialAttributesData={characterAttributes} onSaveProgress={handleSaveProgress} onLoadProgress={() => triggerLoadFile(false)} onPartialUpdate={setCharacterAttributes} autoReadEnabled={autoReadEnabled} /> : null;
      case 'skills':
        return characterDetails && characterAttributes && attributeDice ? <SkillsForm characterLevel={characterDetails.level} characterName={characterDetails.characterName} characterAttributes={characterAttributes} onSubmit={handleSkillsSubmit} onBack={handleBackToAttributes} summaryData={summaryData} initialSkillsData={characterSkillsData} onSaveProgress={handleSaveProgress} onLoadProgress={() => triggerLoadFile(false)} onPartialUpdate={setCharacterSkillsData} autoReadEnabled={autoReadEnabled} /> : null;
      case 'powers':
        return characterDetails && characterAttributes && attributeDice && characterSkillsData ? <PowersForm characterLevel={characterDetails.level} characterName={characterDetails.characterName} characterAttributes={characterAttributes} onSubmit={handlePowersSubmit} onBack={handleBackToSkills} summaryData={summaryData} initialPowersData={characterPowersData} onSaveProgress={handleSaveProgress} onLoadProgress={() => triggerLoadFile(false)} onPartialUpdate={setCharacterPowersData} autoReadEnabled={autoReadEnabled} /> : null;
      case 'weaknesses':
        return characterDetails ? <WeaknessesForm onSubmit={handleWeaknessesSubmit} onBack={handleBackToPowers} summaryData={summaryData} initialWeaknessesData={characterWeaknessesData} onSaveProgress={handleSaveProgress} onLoadProgress={() => triggerLoadFile(false)} onPartialUpdate={setCharacterWeaknessesData} autoReadEnabled={autoReadEnabled} /> : null;
      case 'summary':
        return characterSummary ? (
            <div className="animate-fadeIn">
              <div ref={summaryContainerRef}> 
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <h2 className="text-3xl font-semibold text-sky-400 font-orbitron">Your Hero Awaits!</h2>
                  <TTSButton text={`Your Hero Awaits! ${summaryInstructionText}`} />
                </div>
                <div className="flex items-center justify-center space-x-2 mb-8 px-2">
                  <p className="text-sm text-slate-400 text-center leading-relaxed max-w-3xl">{summaryInstructionText}</p>
                </div>
                <div ref={characterCardRef}><CharacterCard character={characterSummary} /></div>
                <ValidationSummaryDisplay result={summaryValidationResult} />
              </div>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={handleBackToWeaknesses} className="w-full py-3 px-4 border border-slate-500 rounded-md text-slate-300 hover:bg-slate-700 transition transform hover:scale-105">Back</button>
                <button onClick={handleSaveProgress} className="w-full py-3 px-4 border border-sky-500 rounded-md text-sky-300 hover:bg-sky-700 transition transform hover:scale-105">Save Progress</button>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4"> 
                <button onClick={handleExportToTXT} className="w-full py-3 px-4 rounded-md text-white bg-gradient-to-r from-sky-500 to-blue-500 transition shadow-lg">TXT</button>
                <button onClick={handleExportToPNG} className="w-full py-3 px-4 rounded-md text-white bg-gradient-to-r from-green-500 to-teal-500 transition shadow-lg">PNG</button>
                <button 
                  onClick={saveActor} 
                  className="w-full py-3 px-4 rounded-md text-white bg-gradient-to-r from-amber-500 to-orange-500 transition shadow-lg sm:col-span-2"
                >
                  Save to Foundry
                </button>
                
              </div>
              <div className="mt-12 pt-8 border-t border-slate-700">
                <button onClick={enterPlay} className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-2xl font-orbitron rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] transition-all transform hover:-translate-y-1 active:scale-95 border-b-4 border-emerald-800">Enter Play Mode</button>
              </div>
            </div>
          ) : null;
      default: return null;
    }
  };

  const summaryData = useMemo(() => ({
    characterDetails,
    characterAttributes,
    attributeDice,
    skillsData: characterSkillsData,
    powersData: characterPowersData
  }), [characterDetails, characterAttributes, attributeDice, characterSkillsData, characterPowersData]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-sky-500/30 flex flex-col">
      <input type="file" ref={fileInputRef} onChange={handleLoadProgress} accept=".sagaChar,.sagachar,.json" style={{ display: 'none' }} />
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 shadow-md">
        <h1 className="text-xl font-black text-sky-400 font-orbitron tracking-tighter uppercase">Saga Creator</h1>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-300 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg></button>
      </div>
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
      <nav className={`fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 p-6 z-40 overflow-y-auto custom-scrollbar transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-10">
          <div className="w-full flex flex-col items-center gap-2">
            <h1 className="text-2xl font-black text-sky-400 font-orbitron tracking-tighter uppercase text-center leading-tight">Saga Creator</h1>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">Foundry module · 0.2.1</div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="space-y-1">
          {navItems.map(item => (
            <button key={item.id} disabled={item.disabled} onClick={() => handleNavClick(item.id as CreationStep)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${step === item.id ? 'bg-navActive text-white shadow-lg border-r-4 border-sky-300' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'} disabled:opacity-30 disabled:cursor-not-allowed`}>
              {item.label}
            </button>
          ))}
          <a href="https://forms.gle/7ACfERkqmpzYqGcU8" target="_blank" rel="noopener noreferrer" className="w-full block text-left px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all">Feedback</a>
          <div className="pt-4 border-t border-slate-700 mt-4">
             <button onClick={() => triggerLoadFile(false)} className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-sky-300 border-2 border-sky-900/50 hover:bg-sky-900/20 transition-all flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Load Hero</button>
             <div className="mt-4 p-4 bg-slate-900/50 border border-slate-700 rounded-xl shadow-inner"><div className="text-[11px] text-sky-300 whitespace-pre-wrap leading-relaxed font-medium">{getNavHelpText(step)}</div></div>
          </div>
        </div>
      </nav>
      <main className="lg:ml-64 p-4 sm:p-8 lg:p-12 min-h-screen flex-grow">
        <section className="mb-6 p-4 rounded-xl border border-sky-700 bg-slate-800 space-y-3">
          <div className="font-bold text-sky-300">Foundry Actor: {actorLabel}</div>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Choose Foundry Actor" className="bg-slate-900 rounded p-2 max-w-xs" value={actorChoice} onChange={e=>setActorChoice(e.target.value)}><option value="">Choose an owned Actor…</option>{host?.list().map((a:any)=><option key={a.id} value={a.id}>{a.name}{a.managed?'':' — legacy / blank'}</option>)}</select>
            <button className="rounded bg-sky-700 px-3 py-2" onClick={openActor}>Open Actor</button>
            <button className="rounded bg-emerald-700 px-3 py-2" disabled={saving} onClick={saveActor}>{saving?'Saving…':'Save to Foundry'}</button>
            <button className="rounded bg-slate-700 px-3 py-2" onClick={handleSaveProgress}>Export .sagaChar</button>
          </div>
          {legacyInfo && <div className="text-sm text-amber-200 space-y-2"><p>This Actor has no original build data. Import its .sagaChar file using Load Hero, or enter its original level, allocations and links. The formulas below are reference only. Saving will update <strong>{actorLabel}</strong>.</p><button className="rounded bg-amber-800 px-3 py-2" onClick={()=>{setCharacterDetails({characterName:legacyInfo.name,heroName:legacyInfo.name,playerName:'',age:18,level:1,description:'',heroDescription:'',characterBackstory:legacyInfo.biography});setStep('details');}}>Enter missing build choices</button><details><summary>View existing formulas</summary><pre className="whitespace-pre-wrap max-h-64 overflow-auto">{JSON.stringify(legacyInfo.groups,null,2)}</pre></details></div>}
          <p className="text-xs text-slate-400">Save commits a complete build. Export .sagaChar also saves unfinished progress. Play Mode saves the build before opening.</p>
        </section><div className="max-w-5xl mx-auto">{renderStepContent()}</div>
      </main>
      {isRecentCharactersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-850"><h3 className="text-xl font-bold text-sky-400 font-orbitron uppercase tracking-widest">Recent Heroes</h3><button onClick={() => setIsRecentCharactersModalOpen(false)} className="text-slate-400 hover:text-white text-2xl font-bold transition-colors">&times;</button></div>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4 custom-scrollbar">
              {recentCharacters.length === 0 ? <p className="text-slate-400 italic text-center">No recent characters found.</p> : recentCharacters.map((char) => (
                <div key={char.id} className="p-4 bg-slate-700 border border-slate-600 rounded-xl hover:border-sky-500 transition-all group flex items-center justify-between">
                  <div className="flex-grow cursor-pointer" onClick={() => handleLoadFromRecent(char, isPlayModeRequest)}><h4 className="font-bold text-slate-100 group-hover:text-sky-300 transition-colors">{char.heroName}</h4><p className="text-xs text-slate-400">Level {char.level} • {char.characterName}</p></div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteRecent(char.id!); }} className="ml-4 text-slate-500 hover:text-rose-500 transition-colors p-2" title="Remove from history"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-700 bg-slate-850 flex justify-end"><button onClick={() => setIsRecentCharactersModalOpen(false)} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold uppercase text-xs tracking-widest transition-colors">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;