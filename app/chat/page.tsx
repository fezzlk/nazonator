'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { LevelUpNotice } from '@/components/ai/LevelUpNotice';
import { useChat } from '@/hooks/useChat';
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from '@/context/AuthContext';
import { getLevelByCount } from '@/prompts/constants';
import { SOLVED_TRIGGER_PHRASES } from '@/prompts/constants';

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
  const { solvedCount, learnings, dataLoading, incrementSolved, addLearning, removeLearning, clearLearnings } =
    useUserData(user?.uid ?? null);

  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [prevSolvedCount, setPrevSolvedCount] = useState(solvedCount);

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

  const currentLevel = getLevelByCount(solvedCount);

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content, currentLevel.level, learnings, (fullText) => {
        if (checkIfSolved(fullText)) {
          incrementSolved();
        }
      });
    },
    [sendMessage, currentLevel.level, learnings, incrementSolved],
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
        onSend={handleSend}
        onReset={handleReset}
        onAddLearning={addLearning}
        onRemoveLearning={removeLearning}
        onClearLearnings={clearLearnings}
      />
    </>
  );
}
