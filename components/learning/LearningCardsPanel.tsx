'use client';

import { useState } from 'react';
import { BookOpen, Pencil, Trash2, X, Check } from 'lucide-react';
import type { Learning } from '@/types/learning';
import { MAX_LEARNINGS, MAX_CONTENT_LENGTH } from '@/hooks/useLearnings';
import { cn } from '@/lib/utils';

interface LearningCardsPanelProps {
  learnings: Learning[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function LearningCardsPanel({ learnings, onRemove, onUpdate, onClear, isOpen, onClose }: LearningCardsPanelProps) {
  const isAtLimit = learnings.length >= MAX_LEARNINGS;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  function startEdit(learning: Learning) {
    setEditingId(learning.id);
    setEditingContent(learning.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingContent('');
  }

  function saveEdit(id: string) {
    const trimmed = editingContent.trim();
    if (trimmed) onUpdate(id, trimmed);
    setEditingId(null);
    setEditingContent('');
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-30 bg-black/20" onClick={onClose} />}

      <div
        className={cn(
          'fixed right-0 top-0 h-screen w-80 bg-gray-50 border-l border-gray-200 shadow-xl z-40',
          'flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-800">学習カード（テクニック）</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {learnings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
              <BookOpen className="w-10 h-10 text-gray-300" />
              <div>
                <p className="text-sm text-gray-400 font-medium">まだ学習カードはありません</p>
                <p className="text-xs text-gray-400 mt-1">謎を解きながら自然に溜まります</p>
              </div>
            </div>
          ) : (
            learnings.map((learning) => (
              <div
                key={learning.id}
                className="bg-white border border-indigo-100 rounded-xl px-3 py-2.5 shadow-sm"
              >
                {editingId === learning.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="w-full text-sm text-gray-800 border border-indigo-300 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      rows={3}
                      maxLength={MAX_CONTENT_LENGTH}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">{editingContent.length}/{MAX_CONTENT_LENGTH}</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={cancelEdit}
                          className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => saveEdit(learning.id)}
                          disabled={!editingContent.trim()}
                          className="flex items-center gap-1 text-xs text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 transition-colors px-2 py-1 rounded"
                        >
                          <Check className="w-3 h-3" />
                          保存
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-sm text-gray-800 leading-relaxed">{learning.content}</p>
                    <div className="flex shrink-0 gap-1 mt-0.5">
                      <button
                        onClick={() => startEdit(learning)}
                        className="text-gray-400 hover:text-indigo-400 transition-colors"
                        aria-label="編集"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRemove(learning.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                        aria-label="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white flex items-center justify-between">
          <span className={cn('text-xs font-medium', isAtLimit ? 'text-amber-600' : 'text-gray-400')}>
            {learnings.length}件 / {MAX_LEARNINGS}件{isAtLimit && ' (上限)'}
          </span>
          {learnings.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              すべて削除
            </button>
          )}
        </div>
      </div>
    </>
  );
}
