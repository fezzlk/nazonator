'use client';

import { cn } from '@/lib/utils';
import type { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm',
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
