import { useCallback, useRef } from 'react';
import type { Learning } from '@/types/learning';
import { MAX_LEARNINGS } from './useLearnings';
import { getStoredApiKey } from '@/lib/apiKey';

export function useAssociation({
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
  const isAssociating = useRef(false);

  const triggerAssociation = useCallback(
    async (newCards: string[]) => {
      if (newCards.length === 0) return;
      if (isAssociating.current) return;

      isAssociating.current = true;
      try {
        const apiKey = getStoredApiKey();
        if (!apiKey) return;

        const allCards = [
          ...learnings.map((l) => l.content),
          ...logics.map((l) => l.content),
        ];

        const res = await fetch('/api/associate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newCards, allCards, apiKey }),
        });
        if (!res.ok) return;

        const { learnings: newL, logics: newLogics } = await res.json();
        const remainingLearnings = MAX_LEARNINGS - learnings.length;
        (newL as string[]).slice(0, remainingLearnings).forEach((c) => addLearning(c));
        (newLogics as string[]).forEach((c) => addLogic(c));
      } catch {
        // silent fail
      } finally {
        isAssociating.current = false;
      }
    },
    [learnings, logics, addLearning, addLogic],
  );

  return { triggerAssociation };
}
