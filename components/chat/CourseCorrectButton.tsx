'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { MAX_CONTENT_LENGTH } from '@/hooks/useLearnings';

interface CourseCorrectButtonProps {
  onSubmit: (content: string) => void;
}

export function CourseCorrectButton({ onSubmit }: CourseCorrectButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
    setExpanded(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setValue('');
      setExpanded(false);
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-xs text-gray-500 hover:text-indigo-500 transition-colors mt-1 ml-1"
      >
        軌道修正
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mt-1 ml-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
        onKeyDown={handleKeyDown}
        placeholder="AIへの修正アドバイスを入力… (Enter で登録)"
        className="text-xs text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded px-2 py-1 w-72 focus:outline-none focus:border-indigo-400"
        maxLength={MAX_CONTENT_LENGTH}
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="text-xs text-indigo-500 hover:text-indigo-700 disabled:opacity-40 transition-colors"
      >
        登録
      </button>
      <button
        onClick={() => { setValue(''); setExpanded(false); }}
        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        キャンセル
      </button>
    </div>
  );
}
