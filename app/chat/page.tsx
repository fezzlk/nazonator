'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { LevelUpNotice } from '@/components/ai/LevelUpNotice';
import { useChat } from '@/hooks/useChat';
import { useUserData } from '@/hooks/useUserData';
import { useExtraction } from '@/hooks/useExtraction';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { useAuth } from '@/context/AuthContext';
import { getLevelByCount, SOLVED_TRIGGER_PHRASES } from '@/prompts/constants';
import type { AdditionMode } from '@/types/chat';

function checkIfSolved(text: string): boolean {
  const lower = text.toLowerCase();
  return SOLVED_TRIGGER_PHRASES.some((phrase) => lower.includes(phrase));
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ChatPageInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get('id');

  const { messages, isLoading, streamingContent, error, sendMessage, loadSession } = useChat();
  const {
    solvedCount,
    learnings,
    principles,
    logics,
    dataLoading,
    incrementSolved,
    addLearning,
    removeLearning,
    updateLearning,
    clearLearnings,
    addPrinciple,
    removePrinciple,
    updatePrinciple,
    addLogic,
    removeLogic,
    updateLogic,
  } = useUserData(user?.uid ?? null);

  const { triggerExtraction } = useExtraction({ learnings, addLearning });
  const { saveCurrentSession, startResumingSession, loadSessionMessages } =
    useSessionHistory(user?.uid ?? null);

  const [additionMode, setAdditionMode] = useState<AdditionMode>(null);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [prevSolvedCount, setPrevSolvedCount] = useState(solvedCount);
  const [badgeFlash, setBadgeFlash] = useState(false);
  const prevLearningsLen = useRef(learnings.length);
  const hasLoadedFromUrl = useRef(false);

  // auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // レベルアップ検出
  useEffect(() => {
    if (solvedCount > prevSolvedCount) {
      const prev = getLevelByCount(prevSolvedCount);
      const next = getLevelByCount(solvedCount);
      if (next.level > prev.level) {
        setIsLevelingUp(true);
        setTimeout(() => setIsLevelingUp(false), 3000);
      }
      setPrevSolvedCount(solvedCount);
    }
  }, [solvedCount, prevSolvedCount]);

  // バッジフラッシュ検出
  useEffect(() => {
    if (learnings.length > prevLearningsLen.current) {
      setBadgeFlash(true);
      setTimeout(() => setBadgeFlash(false), 1500);
    }
    prevLearningsLen.current = learnings.length;
  }, [learnings.length]);

  const currentLevel = getLevelByCount(solvedCount);

  const handleResumeSession = useCallback(
    async (sessionId: string) => {
      const sessionMessages = await loadSessionMessages(sessionId);
      loadSession(sessionMessages);
      startResumingSession(sessionId);
    },
    [loadSessionMessages, loadSession, startResumingSession],
  );


  // URL パラメータ ?id= からセッションを読み込む
  useEffect(() => {
    if (hasLoadedFromUrl.current || !sessionIdParam || !user || authLoading || dataLoading) return;
    hasLoadedFromUrl.current = true;
    handleResumeSession(sessionIdParam);
  }, [sessionIdParam, user, authLoading, dataLoading, handleResumeSession]);

  const handleSend = useCallback(
    (content: string) => {
      const preMessages = messages;
      const currentMode = additionMode;

      sendMessage(content, currentLevel.level, learnings, principles, logics, currentMode, (fullText) => {
        // 追加モード時: AI応答をカードに追加
        if (currentMode === 'principles') {
          addPrinciple(fullText.trim());
        } else if (currentMode === 'logics') {
          addLogic(fullText.trim());
        } else {
          // 通常モード: 謎解き完了チェック + テクニック抽出
          if (checkIfSolved(fullText)) {
            incrementSolved();
          }
          const fullContext = [
            ...preMessages,
            { id: `${Date.now()}-u`, role: 'user' as const, content, timestamp: new Date() },
            { id: `${Date.now()}-a`, role: 'assistant' as const, content: fullText, timestamp: new Date() },
          ];
          triggerExtraction(fullContext);
        }

        const fullContext = [
          ...preMessages,
          { id: `${Date.now()}-u`, role: 'user' as const, content, timestamp: new Date() },
          { id: `${Date.now()}-a`, role: 'assistant' as const, content: fullText, timestamp: new Date() },
        ];
        saveCurrentSession(fullContext);
      });
    },
    [
      sendMessage,
      currentLevel.level,
      learnings,
      principles,
      logics,
      additionMode,
      incrementSolved,
      messages,
      triggerExtraction,
      saveCurrentSession,
      addPrinciple,
      addLogic,
    ],
  );

  if (authLoading || dataLoading) return <LoadingScreen />;
  if (!user) return null;

  return (
    <>
      <LevelUpNotice level={currentLevel} isVisible={isLevelingUp} />
      <ChatContainer
        messages={messages}
        isLoading={isLoading}
        streamingContent={streamingContent}
        error={error}
        currentLevel={currentLevel}
        solvedCount={solvedCount}
        learnings={learnings}
        principles={principles}
        logics={logics}
        badgeFlash={badgeFlash}
        additionMode={additionMode}
        onModeChange={setAdditionMode}
        onSend={handleSend}
        onRemoveLearning={removeLearning}
        onUpdateLearning={updateLearning}
        onClearLearnings={clearLearnings}
        onAddPrinciple={addPrinciple}
        onRemovePrinciple={removePrinciple}
        onUpdatePrinciple={updatePrinciple}
        onAddLogic={addLogic}
        onRemoveLogic={removeLogic}
        onUpdateLogic={updateLogic}
      />
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <ChatPageInner />
    </Suspense>
  );
}
