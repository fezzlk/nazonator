'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AdditionMode = 'principles' | 'logics' | null;

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  additionMode?: AdditionMode;
  onModeChange?: (mode: AdditionMode) => void;
}

const MODE_CONFIG = {
  principles: {
    label: '＋原則',
    placeholder: '追加したい原則の内容を入力してください（AIが整形します）',
    borderClass: 'border-emerald-400 focus:ring-emerald-400',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700',
    badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
  },
  logics: {
    label: '＋ロジック',
    placeholder: '追加したい変換ロジックの内容を入力してください（AIが整形します）',
    borderClass: 'border-violet-400 focus:ring-violet-400',
    buttonClass: 'bg-violet-600 hover:bg-violet-700',
    badgeClass: 'bg-violet-100 text-violet-700 border border-violet-300',
  },
} as const;

export function ChatInput({
  onSend,
  disabled = false,
  additionMode = null,
  onModeChange,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const modeConfig = additionMode ? MODE_CONFIG[additionMode] : null;
  const placeholder = modeConfig?.placeholder ?? 'AIに解かせる謎を入力してください…';

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

  function toggleMode(mode: 'principles' | 'logics') {
    onModeChange?.(additionMode === mode ? null : mode);
  }

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      {/* Mode toggle bar */}
      {onModeChange && (
        <div className="flex items-center gap-2 max-w-3xl mx-auto mb-2">
          <span className="text-[11px] text-gray-400 shrink-0">追加モード:</span>
          <button
            onClick={() => toggleMode('principles')}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-full border transition-colors',
              additionMode === 'principles'
                ? 'bg-emerald-100 text-emerald-700 border-emerald-300 font-semibold'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-emerald-300 hover:text-emerald-600',
            )}
          >
            ＋原則
          </button>
          <button
            onClick={() => toggleMode('logics')}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-full border transition-colors',
              additionMode === 'logics'
                ? 'bg-violet-100 text-violet-700 border-violet-300 font-semibold'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600',
            )}
          >
            ＋ロジック
          </button>
          {additionMode && (
            <span className={cn('text-[11px] px-2 py-0.5 rounded-full', modeConfig?.badgeClass)}>
              {modeConfig?.label}モード中
            </span>
          )}
        </div>
      )}

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
            'flex-1 resize-none rounded-xl border px-4 py-2.5 text-sm text-gray-900 leading-relaxed',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-400 transition-all',
            'min-h-[42px] max-h-[160px]',
            modeConfig
              ? modeConfig.borderClass
              : 'border-gray-300 focus:ring-indigo-400',
          )}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all',
            modeConfig ? modeConfig.buttonClass : 'bg-indigo-600 hover:bg-indigo-700',
            'text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed',
          )}
          aria-label="送信"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-center text-xs text-gray-500 mt-2">
        Ctrl+Enter / Cmd+Enter で送信
      </p>
    </div>
  );
}
