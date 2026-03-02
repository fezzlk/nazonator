'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { ThinkingIndicator } from './ThinkingIndicator';
import { CourseCorrectButton } from './CourseCorrectButton';
import type { Message } from '@/types/chat';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  onCourseCorrect: (content: string) => void;
}

export function MessageList({ messages, isLoading, streamingContent, onCourseCorrect }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isLoading]);

  const lastAssistantIndex = messages.reduce(
    (acc, m, i) => (m.role === 'assistant' ? i : acc),
    -1,
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((message, index) => (
        <div key={message.id}>
          <MessageBubble message={message} />
          {!isLoading && index === lastAssistantIndex && message.role === 'assistant' && (
            <div className="flex justify-start">
              <CourseCorrectButton onSubmit={onCourseCorrect} />
            </div>
          )}
        </div>
      ))}

      {isLoading && streamingContent && (
        <div className="flex justify-start w-full">
          <div className="max-w-[80%] bg-white border border-gray-200 rounded-2xl rounded-bl-sm shadow-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
            {streamingContent}
            <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 animate-pulse align-middle" />
          </div>
        </div>
      )}

      {isLoading && !streamingContent && <ThinkingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
