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
}: {
  learnings: Learning[];
  logics: Learning[];
  addLearning: (content: string) => void;
  addLogic: (content: string) => void;
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
        (newLearnings as string[]).slice(0, remainingLearnings).forEach((c) => addLearning(c));
        (newLogics as string[]).forEach((c) => addLogic(c));
      } catch {
        // silent fail
      } finally {
        isReflecting.current = false;
      }
    },
    [learnings, logics, addLearning, addLogic],
  );

  return { triggerReflection };
}
