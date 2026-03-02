'use client';

import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GrowthLevel } from '@/types/ai';

interface AIAvatarProps {
  level: GrowthLevel;
  isThinking?: boolean;
  className?: string;
}

const levelColors: Record<number, string> = {
  1: 'bg-gray-100 border-gray-300 text-gray-600',
  2: 'bg-blue-100 border-blue-300 text-blue-600',
  3: 'bg-purple-100 border-purple-300 text-purple-600',
  4: 'bg-amber-100 border-amber-300 text-amber-600',
  5: 'bg-emerald-100 border-emerald-300 text-emerald-600',
};

const badgeColors: Record<number, string> = {
  1: 'bg-gray-500',
  2: 'bg-blue-500',
  3: 'bg-purple-500',
  4: 'bg-amber-500',
  5: 'bg-emerald-500',
};

export function AIAvatar({ level, isThinking = false, className }: AIAvatarProps) {
  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative">
        <div
          className={cn(
            'w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300',
            levelColors[level.level] ?? levelColors[1],
            isThinking && 'animate-pulse',
          )}
        >
          <Brain className="w-6 h-6" />
        </div>
        <div
          className={cn(
            'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm',
            badgeColors[level.level] ?? badgeColors[1],
          )}
        >
          {level.level}
        </div>
      </div>
      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{level.name}</span>
    </div>
  );
}
