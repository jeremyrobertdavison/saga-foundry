import { AttributeName } from './utils/characterUtils';

export type AppTheme = 
  | 'neon-city' 
  | 'high-contrast' 
  | 'accessibility' 
  | 'hacker'
  | 'just-a-yak'
  | 'and-my-canoe'
  | 'lotta-cats'
  | 'medieval-fantasy'
  | 'anime-thing';

export interface CharacterAttributes {
  general: number;
  arcana: number;
  technology: number;
  body: number;
  mind: number;
  mutation: number;
}

export interface AttributeDice {
  general: string;
  arcana: string;
  technology: string;
  body: string;
  mind: string;
  mutation: string;
}

export interface Skill {
  id: string; 
  name: string;
  points: number;
  linkedAttribute: AttributeName | ''; 
  finalDieString: string; 
}

export interface SkillFormData {
  id: string;
  name: string;
  points: number;
  linkedAttribute: AttributeName | '';
}

export interface Power {
  id: string;
  name: string;
  points: number;
  linkedAttribute: AttributeName | '';
  finalDieString: string;
  description?: string;
}

export interface PowerFormData {
  id: string;
  name: string;
  points: number;
  linkedAttribute: AttributeName | '';
  description?: string;
}

export interface Weakness {
  id: string;
  name: string;
  severity: string;
  effect: string;
}

export interface Character {
  id?: string;
  playerName?: string;
  characterName: string;
  heroName: string;
  age: number;
  description: string;
  heroDescription: string;
  characterBackstory: string; 
  level: number;
  characterImage?: string; 
  attributes: CharacterAttributes;
  attributeDice: AttributeDice;
  skills?: Skill[];
  powers?: Power[];
  weaknesses?: Weakness[];
}

export type CharacterDetails = Omit<Character, 'id' | 'attributes' | 'attributeDice' | 'skills' | 'powers' | 'weaknesses'> & {
  characterImage?: string;
};

export interface SelectOption {
  value: string | number;
  label: string;
}