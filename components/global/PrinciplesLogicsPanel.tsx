'use client';

import { useState } from 'react';
import { BookMarked, ChevronDown, ChevronUp, Pencil, Trash2, X, Check, Plus } from 'lucide-react';
import type { Learning } from '@/types/learning';
import { MAX_CONTENT_LENGTH } from '@/hooks/useLearnings';
import { cn } from '@/lib/utils';

interface PrinciplesLogicsPanelProps {
  principles: Learning[];
  logics: Learning[];
  onAddPrinciple: (content: string) => void;
  onRemovePrinciple: (id: string) => void;
  onUpdatePrinciple: (id: string, content: string) => void;
  onAddLogic: (content: string) => void;
  onRemoveLogic: (id: string) => void;
  onUpdateLogic: (id: string, content: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface SectionProps {
  title: string;
  accent: string;
  items: Learning[];
  editingId: string | null;
  editingContent: string;
  onStartEdit: (l: Learning) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onEditChange: (v: string) => void;
  onRemove: (id: string) => void;
  onAdd: (content: string) => void;
}

function Section({
  title,
  accent,
  items,
  editingId,
  editingContent,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditChange,
  onRemove,
  onAdd,
}: SectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [addValue, setAddValue] = useState('');

  function handleAdd() {
    const t = addValue.trim();
    if (!t) return;
    onAdd(t);
    setAddValue('');
  }

  return (
    <div className="mb-1">
      {/* Section header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors',
          'bg-white border-b border-gray-100',
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn('w-1.5 h-4 rounded-full', accent)} />
          <span className="text-xs font-semibold text-gray-700">{title}</span>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {items.length}件
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>

      {!collapsed && (
        <div className="px-3 py-2 space-y-2 bg-gray-50">
          {/* Cards */}
          {items.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">まだ項目がありません</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
                {editingId === item.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      className="w-full text-sm text-gray-800 border border-indigo-300 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      rows={3}
                      maxLength={MAX_CONTENT_LENGTH}
                      value={editingContent}
                      onChange={(e) => onEditChange(e.target.value)}
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">
                        {editingContent.length}/{MAX_CONTENT_LENGTH}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={onCancelEdit}
                          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => onSaveEdit(item.id)}
                          disabled={!editingContent.trim()}
                          className="flex items-center gap-1 text-xs text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 px-2 py-1 rounded"
                        >
                          <Check className="w-3 h-3" />
                          保存
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-sm text-gray-800 leading-relaxed">{item.content}</p>
                    <div className="flex shrink-0 gap-1 mt-0.5">
                      <button
                        onClick={() => onStartEdit(item)}
                        className="text-gray-400 hover:text-indigo-400 transition-colors"
                        aria-label="編集"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRemove(item.id)}
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

          {/* Add form */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              placeholder="直接追加..."
              maxLength={MAX_CONTENT_LENGTH}
              value={addValue}
              onChange={(e) => setAddValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={!addValue.trim()}
              className="flex items-center gap-1 text-xs text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PrinciplesLogicsPanel({
  principles,
  logics,
  onAddPrinciple,
  onRemovePrinciple,
  onUpdatePrinciple,
  onAddLogic,
  onRemoveLogic,
  onUpdateLogic,
  isOpen,
  onClose,
}: PrinciplesLogicsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingSection, setEditingSection] = useState<'principles' | 'logics' | null>(null);

  function startEdit(item: Learning, section: 'principles' | 'logics') {
    setEditingId(item.id);
    setEditingContent(item.content);
    setEditingSection(section);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingContent('');
    setEditingSection(null);
  }

  function saveEdit(id: string) {
    const t = editingContent.trim();
    if (!t) return;
    if (editingSection === 'principles') onUpdatePrinciple(id, t);
    else if (editingSection === 'logics') onUpdateLogic(id, t);
    cancelEdit();
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
            <BookMarked className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-gray-800">原則 / 変換ロジック</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto">
          <Section
            title="謎解きの原則"
            accent="bg-emerald-400"
            items={principles}
            editingId={editingSection === 'principles' ? editingId : null}
            editingContent={editingContent}
            onStartEdit={(l) => startEdit(l, 'principles')}
            onCancelEdit={cancelEdit}
            onSaveEdit={saveEdit}
            onEditChange={setEditingContent}
            onRemove={onRemovePrinciple}
            onAdd={onAddPrinciple}
          />
          <Section
            title="変換操作ロジック"
            accent="bg-violet-400"
            items={logics}
            editingId={editingSection === 'logics' ? editingId : null}
            editingContent={editingContent}
            onStartEdit={(l) => startEdit(l, 'logics')}
            onCancelEdit={cancelEdit}
            onSaveEdit={saveEdit}
            onEditChange={setEditingContent}
            onRemove={onRemoveLogic}
            onAdd={onAddLogic}
          />
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <p className="text-xs text-gray-400 text-center">
            チャットの追加モードからも登録できます
          </p>
        </div>
      </div>
    </>
  );
}
