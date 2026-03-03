'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCcw, BookOpen, Settings, BookMarked, Home } from 'lucide-react';
import { MessageList } from './MessageList';
import { ChatInput, type AdditionMode } from './ChatInput';
import { LearningCardsPanel } from '@/components/learning/LearningCardsPanel';
import { PrinciplesLogicsPanel } from '@/components/global/PrinciplesLogicsPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { AIAvatar } from '@/components/ai/AIAvatar';
import type { Message } from '@/types/chat';
import type { GrowthLevel } from '@/types/ai';
import type { Learning } from '@/types/learning';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { cn } from '@/lib/utils';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  error: string | null;
  currentLevel: GrowthLevel;
  solvedCount: number;
  learnings: Learning[];
  principles: Learning[];
  logics: Learning[];
  badgeFlash: boolean;
  additionMode: AdditionMode;
  onModeChange: (mode: AdditionMode) => void;
  onSend: (content: string) => void;
  onReset: () => void;
  onRemoveLearning: (id: string) => void;
  onUpdateLearning: (id: string, content: string) => void;
  onClearLearnings: () => void;
  onAddPrinciple: (content: string) => void;
  onRemovePrinciple: (id: string) => void;
  onUpdatePrinciple: (id: string, content: string) => void;
  onAddLogic: (content: string) => void;
  onRemoveLogic: (id: string) => void;
  onUpdateLogic: (id: string, content: string) => void;
}

export function ChatContainer({
  messages,
  isLoading,
  streamingContent,
  error,
  currentLevel,
  solvedCount,
  learnings,
  principles,
  logics,
  badgeFlash,
  additionMode,
  onModeChange,
  onSend,
  onReset,
  onRemoveLearning,
  onUpdateLearning,
  onClearLearnings,
  onAddPrinciple,
  onRemovePrinciple,
  onUpdatePrinciple,
  onAddLogic,
  onRemoveLogic,
  onUpdateLogic,
}: ChatContainerProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [principlesOpen, setPrinciplesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {/* Home button */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-indigo-50"
            title="ホームへ戻る"
          >
            <Home className="w-3.5 h-3.5" />
            ホーム
          </Link>
          <AIAvatar level={currentLevel} isThinking={isLoading} />
          <div>
            <h1 className="text-base font-bold text-gray-900">なぞなぞAI</h1>
            <p className="text-xs text-gray-500">解決数: {solvedCount}問</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* テクニック */}
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="relative flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50"
            title="学習カード（テクニック）"
          >
            <BookOpen className="w-3.5 h-3.5" />
            テクニック
            <span
              className={cn(
                'text-[11px] font-bold px-1.5 py-0.5 rounded-full',
                learnings.length > 0 ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500',
                badgeFlash && 'animate-bounce',
              )}
            >
              {learnings.length}
            </span>
          </button>

          {/* 原則/ロジック */}
          <button
            onClick={() => setPrinciplesOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-50"
            title="原則 / 変換ロジック"
          >
            <BookMarked className="w-3.5 h-3.5" />
            原則/ロジック
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500">
              {principles.length + logics.length}
            </span>
          </button>

          {/* 設定 */}
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50"
            title="設定"
          >
            <Settings className="w-3.5 h-3.5" />
            設定
          </button>

          {/* リセット */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
            title="会話をリセット"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            リセット
          </button>
          <LogoutButton />
        </div>
      </header>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} streamingContent={streamingContent} />

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          エラーが発生しました: {error}
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={onSend}
        disabled={isLoading}
        additionMode={additionMode}
        onModeChange={onModeChange}
      />

      {/* Panels */}
      <LearningCardsPanel
        learnings={learnings}
        onRemove={onRemoveLearning}
        onUpdate={onUpdateLearning}
        onClear={onClearLearnings}
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
      />
      <PrinciplesLogicsPanel
        principles={principles}
        logics={logics}
        onAddPrinciple={onAddPrinciple}
        onRemovePrinciple={onRemovePrinciple}
        onUpdatePrinciple={onUpdatePrinciple}
        onAddLogic={onAddLogic}
        onRemoveLogic={onRemoveLogic}
        onUpdateLogic={onUpdateLogic}
        isOpen={principlesOpen}
        onClose={() => setPrinciplesOpen(false)}
      />
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
