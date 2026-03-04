import { GROWTH_LEVELS } from '@/prompts/constants';
import type { GrowthLevel } from '@/types/ai';
import type { Learning } from '@/types/learning';

/**
 * XP = 解いた数 × 3 + 蓄積カード総数
 * カードを増やすほど（知識が増えるほど）成長する
 */
export function calcXP(
  solvedCount: number,
  learnings: Learning[],
  principles: Learning[],
  logics: Learning[],
): number {
  return solvedCount * 3 + learnings.length + principles.length + logics.length;
}

export function getLevelByXP(xp: number): GrowthLevel {
  const sorted = [...GROWTH_LEVELS].sort((a, b) => b.minXP - a.minXP);
  return sorted.find((l) => xp >= l.minXP) ?? GROWTH_LEVELS[0];
}
