'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { LevelUpNotice } from '@/components/ai/LevelUpNotice';
import { useChat } from '@/hooks/useChat';
import { useUserData } from '@/hooks/useUserData';
import { useExtraction } from '@/hooks/useExtraction';
import { useReflection } from '@/hooks/useReflection';
import { useAssociation } from '@/hooks/useAssociation';
import { useCardEmbed } from '@/hooks/useCardEmbed';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { useAuth } from '@/context/AuthContext';
import { SOLVED_TRIGGER_PHRASES } from '@/prompts/constants';
import { calcXP, getLevelByXP } from '@/lib/xp';
import { getStoredApiKey } from '@/lib/apiKey';
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

  const { messages, isLoading, streamingContent, error, sendMessage, patchLastMessage, clearMessages, loadSession } = useChat();
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
    updateLearningTags,
    clearLearnings,
    addPrinciple,
    removePrinciple,
    updatePrinciple,
    addLogic,
    removeLogic,
    updateLogic,
  } = useUserData(user?.uid ?? null);

  const { triggerAssociation } = useAssociation({ learnings, logics, addLearning, addLogic });
  const handleNewCards = useCallback((cards: string[]) => {
    triggerAssociation(cards);
  }, [triggerAssociation]);
  const { triggerExtraction } = useExtraction({ learnings, addLearning, onNewCards: handleNewCards });
  const { triggerReflection } = useReflection({ learnings, logics, addLearning, addLogic, onNewCards: handleNewCards });
  useCardEmbed({ uid: user?.uid ?? null, learnings, principles, logics });
  const { saveCurrentSession, startResumingSession, loadSessionMessages } =
    useSessionHistory(user?.uid ?? null);

  const [additionMode, setAdditionMode] = useState<AdditionMode>(null);
  const [hasApiKey, setHasApiKey] = useState(() => !!getStoredApiKey());
  const [isSolved, setIsSolved] = useState(false);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const prevXP = useRef<number | null>(null);
  const [badgeFlash, setBadgeFlash] = useState(false);
  const prevLearningsLen = useRef(learnings.length);
  const hasLoadedFromUrl = useRef(false);

  const currentXP = calcXP(solvedCount, learnings, principles, logics);
  const currentLevel = getLevelByXP(currentXP);

  // auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // レベルアップ検出（XP基準）
  useEffect(() => {
    if (prevXP.current === null) {
      prevXP.current = currentXP;
      return;
    }
    if (currentXP > prevXP.current) {
      const prevLevel = getLevelByXP(prevXP.current);
      if (currentLevel.level > prevLevel.level) {
        setIsLevelingUp(true);
        setTimeout(() => setIsLevelingUp(false), 3000);
      }
      prevXP.current = currentXP;
    }
  }, [currentXP, currentLevel.level]);

  // バッジフラッシュ検出
  useEffect(() => {
    if (learnings.length > prevLearningsLen.current) {
      setBadgeFlash(true);
      setTimeout(() => setBadgeFlash(false), 1500);
    }
    prevLearningsLen.current = learnings.length;
  }, [learnings.length]);


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

      // 通常モード: ユーザーメッセージ送信時点で即時保存（AI応答を待たない）
      if (currentMode === null) {
        saveCurrentSession([
          ...preMessages,
          { id: `${Date.now()}-u`, role: 'user' as const, content, timestamp: new Date() },
        ]);
      }

      sendMessage(content, learnings, principles, logics, currentMode, (fullText) => {
        // 追加モード時: JSONをパースしてカード登録 + 確認メッセージに差し替え
        if (currentMode === 'principles' || currentMode === 'logics') {
          try {
            const jsonMatch = fullText.match(/\{[\s\S]*\}/);
            const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            const cardContent = parsed?.card?.trim();
            const displayMessage = parsed?.message?.trim();
            if (cardContent) {
              if (currentMode === 'principles') addPrinciple(cardContent);
              else addLogic(cardContent);
            }
            if (displayMessage) patchLastMessage(displayMessage);
          } catch {
            if (currentMode === 'principles') addPrinciple(fullText.trim());
            else addLogic(fullText.trim());
          }
          return;
        } else {
          // 通常モード: 謎解き完了チェック + テクニック抽出
          const fullContext = [
            ...preMessages,
            { id: `${Date.now()}-u`, role: 'user' as const, content, timestamp: new Date() },
            { id: `${Date.now()}-a`, role: 'assistant' as const, content: fullText, timestamp: new Date() },
          ];
          if (checkIfSolved(fullText)) {
            incrementSolved();
            setIsSolved(true);
            triggerReflection(fullContext);
          }
          triggerExtraction(fullContext);
        }

        const fullContext = [
          ...preMessages,
          { id: `${Date.now()}-u`, role: 'user' as const, content, timestamp: new Date() },
          { id: `${Date.now()}-a`, role: 'assistant' as const, content: fullText, timestamp: new Date() },
        ];
        saveCurrentSession(fullContext);
      }, user?.uid);
    },
    [
      sendMessage,
      patchLastMessage,
      learnings,
      principles,
      logics,
      additionMode,
      incrementSolved,
      messages,
      triggerExtraction,
      triggerReflection,
      saveCurrentSession,
      addPrinciple,
      addLogic,
      user?.uid,
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
        streamingContent={additionMode ? '' : streamingContent}
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
        onUpdateLearningTags={updateLearningTags}
        onClearLearnings={clearLearnings}
        onAddPrinciple={addPrinciple}
        onRemovePrinciple={removePrinciple}
        onUpdatePrinciple={updatePrinciple}
        onAddLearning={addLearning}
        onAddLogic={addLogic}
        onRemoveLogic={removeLogic}
        onUpdateLogic={updateLogic}
        hasApiKey={hasApiKey}
        onSettingsClose={() => setHasApiKey(!!getStoredApiKey())}
        isSolved={isSolved}
        onNextPuzzle={() => { clearMessages(); setIsSolved(false); setAdditionMode(null); }}
        onNewChat={() => { clearMessages(); setIsSolved(false); setAdditionMode(null); }}
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
