import { useCallback, useRef } from 'react';
import type { Message } from '@/types/chat';
import type { Learning } from '@/types/learning';
import { MAX_LEARNINGS } from './useLearnings';

export function useExtraction({
  learnings,
  addLearning,
}: {
  learnings: Learning[];
  addLearning: (content: string) => void;
}) {
  const isExtracting = useRef(false);

  const triggerExtraction = useCallback(
    async (messages: Message[]) => {
      if (messages.length < 2) return;
      if (isExtracting.current) return;
      if (learnings.length >= MAX_LEARNINGS) return;

      isExtracting.current = true;
      try {
        const existingCardContents = learnings.map((l) => l.content);
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            existingCardContents,
          }),
        });
        if (!res.ok) return;
        const { newCards } = await res.json();
        const remaining = MAX_LEARNINGS - learnings.length;
        (newCards as string[]).slice(0, remaining).forEach((card) => addLearning(card));
      } catch {
        // silent fail
      } finally {
        isExtracting.current = false;
      }
    },
    [learnings, addLearning],
  );

  return { triggerExtraction };
}
