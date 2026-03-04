import type { GrowthLevel } from '@/types/ai';

export const GROWTH_LEVELS: GrowthLevel[] = [
  { level: 1, name: 'ひよっこAI',      minXP: 0  },
  { level: 2, name: '見習いAI',        minXP: 5  },
  { level: 3, name: '探偵見習いAI',    minXP: 12 },
  { level: 4, name: '熟練探偵AI',      minXP: 22 },
  { level: 5, name: '謎解きマスターAI', minXP: 36 },
];

export const SOLVED_TRIGGER_PHRASES = [
  'わかった',
  '解けた',
  '答えは',
  'そういうことか',
  'なるほど',
  '正解',
];
