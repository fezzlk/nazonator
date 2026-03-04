'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Search, X, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { MAX_CONTENT_LENGTH } from '@/hooks/useLearnings';
import type { Learning } from '@/types/learning';
import { cn } from '@/lib/utils';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function LearningsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { learnings, dataLoading, updateLearning, updateLearningTags } = useUserData(
    user?.uid ?? null,
  );

  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  if (authLoading || dataLoading) return <LoadingScreen />;
  if (!user) {
    router.replace('/login');
    return null;
  }

  const allTags = Array.from(new Set(learnings.flatMap((l) => l.tags ?? []))).sort();

  const filtered = learnings.filter((l) => {
    const matchesSearch =
      !searchText || l.content.toLowerCase().includes(searchText.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 || selectedTags.every((t) => l.tags?.includes(t));
    return matchesSearch && matchesTags;
  });

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function startEdit(learning: Learning) {
    setEditingId(learning.id);
    setEditingContent(learning.content);
    setEditingTags(learning.tags ?? []);
    setTagInput('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingContent('');
    setEditingTags([]);
    setTagInput('');
  }

  function saveEdit(id: string) {
    const trimmed = editingContent.trim();
    if (trimmed) updateLearning(id, trimmed);
    updateLearningTags(id, editingTags);
    setEditingId(null);
    setEditingContent('');
    setEditingTags([]);
    setTagInput('');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
          aria-label="ホームへ戻る"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <h1 className="text-base font-bold text-gray-900">アドバイス一覧</h1>
        </div>
        <span className="text-xs text-gray-400">{learnings.length}件</span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* 検索バー */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="テキストで検索..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-300"
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* タグフィルター */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedTags([])}
              className={cn(
                'text-xs font-medium px-3 py-1 rounded-full transition-colors',
                selectedTags.length === 0
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-indigo-50',
              )}
            >
              すべて
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  'text-xs font-medium px-3 py-1 rounded-full transition-colors',
                  selectedTags.includes(tag)
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-indigo-50',
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* カード一覧 */}
        {learnings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <BookOpen className="w-10 h-10 text-gray-300" />
            <p className="text-sm text-gray-400 font-medium">まだカードがありません</p>
            <p className="text-xs text-gray-400">謎を解きながら自然に溜まります</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <Search className="w-10 h-10 text-gray-300" />
            <p className="text-sm text-gray-400 font-medium">見つかりません</p>
            <p className="text-xs text-gray-400">検索条件を変えてみてください</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((learning) => (
              <div
                key={learning.id}
                className="bg-white border border-indigo-100 rounded-xl px-4 py-3 shadow-sm"
              >
                {editingId === learning.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="w-full text-sm text-gray-800 border border-indigo-300 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      autoComplete="new-password"
                      rows={3}
                      maxLength={MAX_CONTENT_LENGTH}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      autoFocus
                    />
                    {/* タグ編集 */}
                    <div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {editingTags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5"
                          >
                            {tag}
                            <button
                              onClick={() =>
                                setEditingTags(editingTags.filter((t) => t !== tag))
                              }
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        autoComplete="new-password"
                        placeholder="タグを追加（Enterで確定）"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && tagInput.trim()) {
                            const t = tagInput.trim();
                            if (!editingTags.includes(t))
                              setEditingTags([...editingTags, t]);
                            setTagInput('');
                            e.preventDefault();
                          }
                        }}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-gray-300"
                      />
                      {allTags.filter((t) => !editingTags.includes(t)).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {allTags
                            .filter((t) => !editingTags.includes(t))
                            .map((t) => (
                              <button
                                key={t}
                                onClick={() => setEditingTags([...editingTags, t])}
                                className="text-[10px] text-indigo-500 border border-indigo-200 rounded-full px-2 py-0.5 hover:bg-indigo-50 transition-colors"
                              >
                                + {t}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">
                        {editingContent.length}/{MAX_CONTENT_LENGTH}
                      </span>
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
                  <div>
                    <p className="text-sm text-gray-800 leading-relaxed">{learning.content}</p>
                    {learning.tags && learning.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {learning.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => startEdit(learning)}
                      className="mt-2 text-[10px] text-gray-400 hover:text-indigo-500 transition-colors"
                    >
                      タグを編集
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
