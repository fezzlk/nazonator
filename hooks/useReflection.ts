import { useCallback, useRef } from 'react';
import type { Message } from '@/types/chat';
import type { Learning } from '@/types/learning';
import { MAX_LEARNINGS } from './useLearnings';
import { getStoredApiKey } from '@/lib/apiKey';

export function useReflection({
  learnings,
  logics,
  addLearning,
  addLogic,
  onNewCards,
}: {
  learnings: Learning[];
  logics: Learning[];
  addLearning: (content: string) => void;
  addLogic: (content: string) => void;
  onNewCards?: (cards: string[]) => void;
}) {
  const isReflecting = useRef(false);

  const triggerReflection = useCallback(
    async (messages: Message[]) => {
      if (messages.length < 2) return;
      if (isReflecting.current) return;

      isReflecting.current = true;
      try {
        const apiKey = getStoredApiKey();
        const existingLearnings = learnings.map((l) => l.content);
        const existingLogics = logics.map((l) => l.content);

        const res = await fetch('/api/reflect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            existingLearnings,
            existingLogics,
            apiKey,
          }),
        });
        if (!res.ok) return;

        const { learnings: newLearnings, logics: newLogics } = await res.json();
        const remainingLearnings = MAX_LEARNINGS - learnings.length;
        const addedL = (newLearnings as string[]).slice(0, remainingLearnings);
        const addedLogics = (newLogics as string[]);
        addedL.forEach((c) => addLearning(c));
        addedLogics.forEach((c) => addLogic(c));
        const allAdded = [...addedL, ...addedLogics];
        if (allAdded.length > 0) onNewCards?.(allAdded);
      } catch {
        // silent fail
      } finally {
        isReflecting.current = false;
      }
    },
    [learnings, logics, addLearning, addLogic, onNewCards],
  );

  return { triggerReflection };
}
