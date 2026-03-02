'use client';

import { useState, KeyboardEvent } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Learning } from '@/types/learning';
import { MAX_LEARNINGS, MAX_CONTENT_LENGTH } from '@/hooks/useLearnings';

interface LearningModalProps {
  learnings: Learning[];
  onAdd: (content: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function LearningModal({ learnings, onAdd, onRemove, onClear, onClose }: LearningModalProps) {
  const [input, setInput] = useState('');

  const remaining = MAX_CONTENT_LENGTH - input.length;
  const atLimit = learnings.length >= MAX_LEARNINGS;

  function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">AIに教える</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {learnings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">まだアドバイスが登録されていません</p>
          ) : (
            learnings.map((l) => (
              <div key={l.id} className="flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-700 flex-1 leading-snug">{l.content}</span>
                <button
                  onClick={() => onRemove(l.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors mt-0.5 shrink-0"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
              onKeyDown={handleKeyDown}
              placeholder={atLimit ? `上限 ${MAX_LEARNINGS} 件に達しました` : 'アドバイスを入力…'}
              disabled={atLimit}
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400 disabled:bg-gray-100 disabled:text-gray-400"
              maxLength={MAX_CONTENT_LENGTH}
            />
            <button
              onClick={handleAdd}
              disabled={!input.trim() || atLimit}
              className="text-sm bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 disabled:opacity-40 transition-colors"
            >
              追加
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {learnings.length} / {MAX_LEARNINGS} 件　残り {remaining} 文字
            </span>
            {learnings.length > 0 && (
              <button
                onClick={onClear}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                すべて削除
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
