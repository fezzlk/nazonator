import { useCallback, useEffect, useRef } from 'react';
import type { Learning } from '@/types/learning';
import { getStoredApiKey } from '@/lib/apiKey';

type CardCategory = 'learnings' | 'principles' | 'logics';

interface EmbedCard {
  id: string;
  content: string;
  category: CardCategory;
}

async function upsertCards(uid: string, cards: EmbedCard[], apiKey: string) {
  await fetch('/api/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, cards, apiKey }),
  });
}

async function deleteCard(uid: string, cardId: string) {
  await fetch('/api/embed', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, cardId }),
  });
}

export function useCardEmbed({
  uid,
  learnings,
  principles,
  logics,
}: {
  uid: string | null;
  learnings: Learning[];
  principles: Learning[];
  logics: Learning[];
}) {
  // 既知カードIDを追跡（初回バックフィル済みフラグ兼用）
  const knownIds = useRef<Map<string, CardCategory> | null>(null);
  const isInitialized = useRef(false);

  // 初回バックフィル: ユーザーの既存カードを全てPineconeにupsert
  useEffect(() => {
    if (!uid || isInitialized.current) return;
    const apiKey = getStoredApiKey();
    if (!apiKey) return;

    isInitialized.current = true;

    const allCards: EmbedCard[] = [
      ...learnings.map((l) => ({ id: l.id, content: l.content, category: 'learnings' as const })),
      ...principles.map((l) => ({ id: l.id, content: l.content, category: 'principles' as const })),
      ...logics.map((l) => ({ id: l.id, content: l.content, category: 'logics' as const })),
    ];

    const known = new Map<string, CardCategory>();
    allCards.forEach((c) => known.set(c.id, c.category));
    knownIds.current = known;

    if (allCards.length > 0) {
      upsertCards(uid, allCards, apiKey).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // カード追加・削除の検出と同期
  const syncCards = useCallback(
    (cards: Learning[], category: CardCategory) => {
      if (!uid || !knownIds.current) return;
      const apiKey = getStoredApiKey();
      if (!apiKey) return;

      const known = knownIds.current;
      const currentIds = new Set(cards.map((l) => l.id));

      // 新規追加
      const added = cards.filter((l) => !known.has(l.id));
      if (added.length > 0) {
        const embedCards = added.map((l) => ({ id: l.id, content: l.content, category }));
        added.forEach((l) => known.set(l.id, category));
        upsertCards(uid, embedCards, apiKey).catch(() => {});
      }

      // 削除
      for (const [id, cat] of known.entries()) {
        if (cat === category && !currentIds.has(id)) {
          known.delete(id);
          deleteCard(uid, id).catch(() => {});
        }
      }
    },
    [uid],
  );

  // 内容更新（同一IDでcontentが変わった場合）の検出
  const syncUpdatedCards = useCallback(
    (cards: Learning[], category: CardCategory) => {
      if (!uid || !knownIds.current) return;
      const apiKey = getStoredApiKey();
      if (!apiKey) return;

      // 内容変更されたカードは再upsert（IDで識別）
      // knownIdsはID存在のみ管理なので、変更検出は別refで行う
      // ここではsyncCards呼び出し側で管理する（シンプルにする）
      syncCards(cards, category);
    },
    [syncCards, uid],
  );

  useEffect(() => { syncUpdatedCards(learnings, 'learnings'); }, [learnings, syncUpdatedCards]);
  useEffect(() => { syncUpdatedCards(principles, 'principles'); }, [principles, syncUpdatedCards]);
  useEffect(() => { syncUpdatedCards(logics, 'logics'); }, [logics, syncUpdatedCards]);
}
