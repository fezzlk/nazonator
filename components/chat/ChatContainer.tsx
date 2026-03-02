'use client';

import { useState } from 'react';
import { RotateCcw, BookOpen } from 'lucide-react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { LearningModal } from './LearningModal';
import { AIAvatar } from '@/components/ai/AIAvatar';
import type { Message } from '@/types/chat';
import type { GrowthLevel } from '@/types/ai';
import type { Learning } from '@/types/learning';
import { LogoutButton } from '@/components/auth/LogoutButton';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  error: string | null;
  currentLevel: GrowthLevel;
  solvedCount: number;
  learnings: Learning[];
  onSend: (content: string) => void;
  onReset: () => void;
  onAddLearning: (content: string) => void;
  onRemoveLearning: (id: string) => void;
  onClearLearnings: () => void;
}

export function ChatContainer({
  messages,
  isLoading,
  streamingContent,
  error,
  currentLevel,
  solvedCount,
  learnings,
  onSend,
  onReset,
  onAddLearning,
  onRemoveLearning,
  onClearLearnings,
}: ChatContainerProps) {
  const [modalOpen, setModalOpen] = useState(false);

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
            onClick={() => setModalOpen(true)}
            className="relative flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50"
            title="AIに知識を教える"
          >
            <BookOpen className="w-3.5 h-3.5" />
            AIに教える
            {learnings.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {learnings.length}
              </span>
            )}
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
      <MessageList
        messages={messages}
        isLoading={isLoading}
        streamingContent={streamingContent}
        onCourseCorrect={onAddLearning}
      />

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          エラーが発生しました: {error}
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={onSend} disabled={isLoading} />

      {/* Learning Modal */}
      {modalOpen && (
        <LearningModal
          learnings={learnings}
          onAdd={onAddLearning}
          onRemove={onRemoveLearning}
          onClear={onClearLearnings}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
