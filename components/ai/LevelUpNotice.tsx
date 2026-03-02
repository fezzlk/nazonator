'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GrowthLevel } from '@/types/ai';

interface LevelUpNoticeProps {
  level: GrowthLevel;
  isVisible: boolean;
}

export function LevelUpNotice({ level, isVisible }: LevelUpNoticeProps) {
  return (
    <div
      className={cn(
        'fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none',
      )}
    >
      <div className="flex items-center gap-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white px-6 py-3 rounded-full shadow-lg font-bold">
        <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '2s' }} />
        <span>レベルアップ！　{level.name}（Lv.{level.level}）になった！</span>
        <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '2s' }} />
      </div>
    </div>
  );
}
