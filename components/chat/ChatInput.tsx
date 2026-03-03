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
    placeholder: '追加したい原則の内容を入力してください（AIが整形します）',
    borderClass: 'border-emerald-400 focus:ring-emerald-400',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700',
    selectClass: 'text-emerald-700',
    hint: '謎解きで気づいた「原則」をAIに整形して登録します',
    hintClass: 'text-emerald-600',
  },
  logics: {
    placeholder: '追加したい変換ロジックの内容を入力してください（AIが整形します）',
    borderClass: 'border-violet-400 focus:ring-violet-400',
    buttonClass: 'bg-violet-600 hover:bg-violet-700',
    selectClass: 'text-violet-700',
    hint: '文字変換などのロジックをAIに整形して登録します',
    hintClass: 'text-violet-600',
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

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onModeChange?.(val === '' ? null : (val as AdditionMode));
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

      <div className="flex items-start justify-between max-w-3xl mx-auto mt-1.5">
        {onModeChange ? (
          <div>
            <select
              value={additionMode ?? ''}
              onChange={handleSelectChange}
              className={cn(
                'text-xs bg-transparent border-none outline-none cursor-pointer',
                modeConfig ? modeConfig.selectClass : 'text-gray-400',
              )}
            >
              <option value="">出題 &amp; アドバイス</option>
              <option value="principles">＋原則 追加</option>
              <option value="logics">＋ロジック 追加</option>
            </select>
            {modeConfig && (
              <p className={cn('text-[11px] mt-0.5', modeConfig.hintClass)}>
                {modeConfig.hint}
              </p>
            )}
          </div>
        ) : (
          <span />
        )}
        <p className="text-xs text-gray-400 shrink-0 mt-0.5">Ctrl+Enter / Cmd+Enter で送信</p>
      </div>
    </div>
  );
}
