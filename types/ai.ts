export interface GrowthLevel {
  level: number;
  name: string;
  minSolved: number;
  tone: string;
  description: string;
}

export interface PersonalityState {
  solvedCount: number;
  currentLevel: GrowthLevel;
  isLevelingUp: boolean;
}
