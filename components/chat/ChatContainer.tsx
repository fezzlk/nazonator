'use client';

import { useState } from 'react';
import { RotateCcw, BookOpen, Settings, History } from 'lucide-react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { LearningCardsPanel } from '@/components/learning/LearningCardsPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { SessionHistoryPanel } from '@/components/history/SessionHistoryPanel';
import { AIAvatar } from '@/components/ai/AIAvatar';
import type { Message } from '@/types/chat';
import type { GrowthLevel } from '@/types/ai';
import type { Learning } from '@/types/learning';
import type { SessionSummary } from '@/lib/sessions';
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
  sessions: SessionSummary[];
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
  onResumeSession: (sessionId: string) => void;
  onRemoveSession: (sessionId: string) => void;
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
  sessions,
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
  onResumeSession,
  onRemoveSession,
}: ChatContainerProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const totalCards = learnings.length + principles.length + logics.length;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <AIAvatar level={currentLevel} isThinking={isLoading} />
          <div>
            <h1 className="text-base font-bold text-gray-900">なぞなぞAI</h1>
            <p className="text-xs text-gray-500">解決数: {solvedCount}問</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="relative flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50"
            title="学習カードを見る"
          >
            <BookOpen className="w-3.5 h-3.5" />
            学習カード
            <span
              className={cn(
                'text-[11px] font-bold px-1.5 py-0.5 rounded-full',
                learnings.length > 0 ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500',
                badgeFlash && 'animate-bounce',
              )}
            >
              {totalCards}
            </span>
          </button>
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50"
            title="セッション履歴"
          >
            <History className="w-3.5 h-3.5" />
            履歴
          </button>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50"
            title="設定"
          >
            <Settings className="w-3.5 h-3.5" />
            設定
          </button>
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
      <ChatInput onSend={onSend} disabled={isLoading} />

      {/* Learning Cards Panel */}
      <LearningCardsPanel
        learnings={learnings}
        principles={principles}
        logics={logics}
        onRemove={onRemoveLearning}
        onUpdate={onUpdateLearning}
        onClear={onClearLearnings}
        onAddPrinciple={onAddPrinciple}
        onRemovePrinciple={onRemovePrinciple}
        onUpdatePrinciple={onUpdatePrinciple}
        onAddLogic={onAddLogic}
        onRemoveLogic={onRemoveLogic}
        onUpdateLogic={onUpdateLogic}
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
      />

      {/* Session History Panel */}
      <SessionHistoryPanel
        sessions={sessions}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onResume={onResumeSession}
        onRemove={onRemoveSession}
      />

      {/* Settings Panel */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
