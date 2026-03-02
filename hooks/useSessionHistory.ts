'use client';

import { useState, useCallback, useEffect } from 'react';
import { upsertSession, listSessions, getSession, deleteSession, type SessionSummary } from '@/lib/sessions';
import type { Message } from '@/types/chat';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useSessionHistory(uid: string | null) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setSessions([]);
      return;
    }
    listSessions(uid).then(setSessions).catch(console.error);
  }, [uid]);

  const saveCurrentSession = useCallback(
    async (messages: Message[]) => {
      if (!uid || messages.length === 0) return;

      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = generateId();
        setCurrentSessionId(sessionId);
      }

      const firstUserMsg = messages.find((m) => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.content.slice(0, 30) : 'セッション';
      const messagesToSave = messages.map(({ role, content }) => ({ role, content }));

      await upsertSession(uid, sessionId, { title, messages: messagesToSave });
      listSessions(uid).then(setSessions).catch(console.error);
    },
    [uid, currentSessionId],
  );

  const startResumingSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  const resetSession = useCallback(() => {
    setCurrentSessionId(null);
  }, []);

  const loadSessionMessages = useCallback(
    async (sessionId: string): Promise<Message[]> => {
      if (!uid) return [];
      const session = await getSession(uid, sessionId);
      if (!session) return [];
      return session.messages.map((m, i) => ({
        id: `${sessionId}-${i}`,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(),
      }));
    },
    [uid],
  );

  const removeSession = useCallback(
    async (sessionId: string) => {
      if (!uid) return;
      await deleteSession(uid, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
    },
    [uid, currentSessionId],
  );

  return {
    sessions,
    currentSessionId,
    saveCurrentSession,
    startResumingSession,
    resetSession,
    loadSessionMessages,
    removeSession,
  };
}
