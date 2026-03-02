'use client';

import { useState, useCallback } from 'react';
import type { Message, ChatState } from '@/types/chat';
import type { Learning } from '@/types/learning';
import { getStoredApiKey } from '@/lib/apiKey';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    streamingContent: '',
    error: null,
  });

  const sendMessage = useCallback(
    async (
      content: string,
      growthLevel: number,
      learnings?: Learning[],
      principles?: Learning[],
      logics?: Learning[],
      onComplete?: (fullText: string) => void,
    ) => {
      if (!content.trim() || state.isLoading) return;

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        streamingContent: '',
        error: null,
      }));

      try {
        const messagesForApi = [...state.messages, userMessage].map(({ role, content }) => ({
          role,
          content,
        }));

        const requestBody: Record<string, unknown> = { messages: messagesForApi, growthLevel };
        if (learnings && learnings.length > 0) requestBody.learnings = learnings;
        if (principles && principles.length > 0) requestBody.principles = principles;
        if (logics && logics.length > 0) requestBody.logics = logics;
        const storedApiKey = getStoredApiKey();
        if (storedApiKey) requestBody.apiKey = storedApiKey;

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;

          setState((prev) => ({
            ...prev,
            streamingContent: fullText,
          }));
        }

        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: fullText,
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
          streamingContent: '',
        }));

        onComplete?.(fullText);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          streamingContent: '',
          error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
        }));
      }
    },
    [state.messages, state.isLoading],
  );

  const clearMessages = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      streamingContent: '',
      error: null,
    });
  }, []);

  const loadSession = useCallback((messages: Message[]) => {
    setState({
      messages,
      isLoading: false,
      streamingContent: '',
      error: null,
    });
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    streamingContent: state.streamingContent,
    error: state.error,
    sendMessage,
    clearMessages,
    loadSession,
  };
}
