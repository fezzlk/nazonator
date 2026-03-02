'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'AIに解かせる謎を入力してください…',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-end gap-3 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm leading-relaxed',
            'focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-400 transition-all',
            'min-h-[42px] max-h-[160px]',
          )}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all',
            'bg-indigo-600 text-white hover:bg-indigo-700',
            'disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed',
          )}
          aria-label="送信"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">
        Ctrl+Enter / Cmd+Enter で送信
      </p>
    </div>
  );
}
