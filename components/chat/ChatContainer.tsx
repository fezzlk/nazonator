'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen, BookMarked, Home, Settings, LogOut, AlertTriangle, Plus, Sparkles } from 'lucide-react';
import { MessageList } from './MessageList';
import { ChatInput, type AdditionMode } from './ChatInput';
import { LearningCardsPanel } from '@/components/learning/LearningCardsPanel';
import { PrinciplesLogicsPanel } from '@/components/global/PrinciplesLogicsPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { AIAvatar } from '@/components/ai/AIAvatar';
import { useAuth } from '@/context/AuthContext';
import type { Message } from '@/types/chat';
import type { GrowthLevel } from '@/types/ai';
import type { Learning } from '@/types/learning';
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
  onRemoveLearning: (id: string) => void;
  onUpdateLearning: (id: string, content: string) => void;
  onUpdateLearningTags: (id: string, tags: string[]) => void;
  onClearLearnings: () => void;
  onAddLearning: (content: string) => void;
  onAddPrinciple: (content: string) => void;
  onRemovePrinciple: (id: string) => void;
  onUpdatePrinciple: (id: string, content: string) => void;
  onAddLogic: (content: string) => void;
  onRemoveLogic: (id: string) => void;
  onUpdateLogic: (id: string, content: string) => void;
  hasApiKey: boolean;
  onSettingsClose?: () => void;
  isSolved?: boolean;
  onNextPuzzle?: () => void;
  onNewChat?: () => void;
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
  onRemoveLearning,
  onUpdateLearning,
  onUpdateLearningTags,
  onClearLearnings,
  onAddLearning,
  onAddPrinciple,
  onRemovePrinciple,
  onUpdatePrinciple,
  onAddLogic,
  onRemoveLogic,
  onUpdateLogic,
  hasApiKey,
  onSettingsClose,
  isSolved,
  onNextPuzzle,
  onNewChat,
}: ChatContainerProps) {
  const { user, signOut } = useAuth();

  function moveLearningToPrinciple(id: string, content: string) { onRemoveLearning(id); onAddPrinciple(content); }
  function moveLearningToLogic(id: string, content: string) { onRemoveLearning(id); onAddLogic(content); }
  function movePrincipleToLearning(id: string, content: string) { onRemovePrinciple(id); onAddLearning(content); }
  function movePrincipleToLogic(id: string, content: string) { onRemovePrinciple(id); onAddLogic(content); }
  function moveLogicToLearning(id: string, content: string) { onRemoveLogic(id); onAddLearning(content); }
  function moveLogicToPrinciple(id: string, content: string) { onRemoveLogic(id); onAddPrinciple(content); }
  const [panelOpen, setPanelOpen] = useState(false);
  const [principlesOpen, setPrinciplesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const avatarLetter = user?.displayName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?';

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

          {/* ユーザーメニュー */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-xs font-bold hover:shadow-md transition-shadow overflow-hidden"
              title="メニュー"
            >
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                avatarLetter
              )}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-10 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Home className="w-4 h-4" />
                  ホーム
                </Link>
                <button
                  onClick={() => { onNewChat?.(); setUserMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  新規会話
                </button>
                <button
                  onClick={() => { setSettingsOpen(true); setUserMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  設定
                  {!hasApiKey && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />}
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* API key notice */}
      {!hasApiKey && (
        <div className="mx-4 mt-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-800 flex-1">
            OpenAI APIキーが設定されていません。メッセージを送るには設定が必要です。
          </p>
          <button
            onClick={() => { setSettingsOpen(true); }}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline shrink-0"
          >
            設定を開く
          </button>
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} streamingContent={streamingContent} />

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          エラーが発生しました: {error}
        </div>
      )}

      {/* 正解バナー */}
      {isSolved && (
        <div className="mx-4 mb-2 px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
          <p className="flex-1 text-sm font-semibold text-indigo-800">謎が解けました！</p>
          <button
            onClick={onNextPuzzle}
            className="flex items-center gap-1.5 text-xs text-white bg-indigo-500 hover:bg-indigo-600 transition-colors px-3 py-1.5 rounded-xl font-semibold shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            次の会話を始める
          </button>
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
        onUpdateTags={onUpdateLearningTags}
        onClear={onClearLearnings}
        onMoveItem={(id, content, to) =>
          to === 'principles' ? moveLearningToPrinciple(id, content) : moveLearningToLogic(id, content)
        }
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
        principlesMoveTargets={[
          { label: 'テクニックへ', colorClass: 'hover:bg-indigo-50 hover:text-indigo-700', onClick: movePrincipleToLearning },
          { label: 'ロジックへ', colorClass: 'hover:bg-violet-50 hover:text-violet-700', onClick: movePrincipleToLogic },
        ]}
        logicsMoveTargets={[
          { label: 'テクニックへ', colorClass: 'hover:bg-indigo-50 hover:text-indigo-700', onClick: moveLogicToLearning },
          { label: '原則へ', colorClass: 'hover:bg-emerald-50 hover:text-emerald-700', onClick: moveLogicToPrinciple },
        ]}
        isOpen={principlesOpen}
        onClose={() => setPrinciplesOpen(false)}
      />
      <SettingsPanel isOpen={settingsOpen} onClose={() => { setSettingsOpen(false); onSettingsClose?.(); }} />
    </div>
  );
}
