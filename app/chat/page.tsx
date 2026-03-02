'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { LevelUpNotice } from '@/components/ai/LevelUpNotice';
import { useChat } from '@/hooks/useChat';
import { useUserData } from '@/hooks/useUserData';
import { useExtraction } from '@/hooks/useExtraction';
import { useAuth } from '@/context/AuthContext';
import { getLevelByCount, SOLVED_TRIGGER_PHRASES } from '@/prompts/constants';

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

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { messages, isLoading, streamingContent, error, sendMessage, clearMessages } = useChat();
  const { solvedCount, learnings, dataLoading, incrementSolved, addLearning, removeLearning, updateLearning, clearLearnings } =
    useUserData(user?.uid ?? null);

  const { triggerExtraction } = useExtraction({ learnings, addLearning });

  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [prevSolvedCount, setPrevSolvedCount] = useState(solvedCount);
  const [badgeFlash, setBadgeFlash] = useState(false);
  const prevLearningsLen = useRef(learnings.length);

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

  const handleSend = useCallback(
    (content: string) => {
      const preMessages = messages;

      sendMessage(content, currentLevel.level, learnings, (fullText) => {
        if (checkIfSolved(fullText)) {
          incrementSolved();
        }

        const fullContext = [
          ...preMessages,
          { id: '', role: 'user' as const, content, timestamp: new Date() },
          { id: '', role: 'assistant' as const, content: fullText, timestamp: new Date() },
        ];
        triggerExtraction(fullContext);
      });
    },
    [sendMessage, currentLevel.level, learnings, incrementSolved, messages, triggerExtraction],
  );

  const handleReset = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

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
        badgeFlash={badgeFlash}
        onSend={handleSend}
        onReset={handleReset}
        onRemoveLearning={removeLearning}
        onUpdateLearning={updateLearning}
        onClearLearnings={clearLearnings}
      />
    </>
  );
}
