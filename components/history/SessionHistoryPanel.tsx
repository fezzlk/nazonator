'use client';

import { History, RotateCcw, Trash2, X } from 'lucide-react';
import type { SessionSummary } from '@/lib/sessions';
import type { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

function formatDate(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  try {
    const date = ts.toDate();
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

interface SessionHistoryPanelProps {
  sessions: SessionSummary[];
  isOpen: boolean;
  onClose: () => void;
  onResume: (sessionId: string) => void;
  onRemove: (sessionId: string) => void;
}

export function SessionHistoryPanel({ sessions, isOpen, onClose, onResume, onRemove }: SessionHistoryPanelProps) {
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
            <History className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-800">セッション履歴</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
              <History className="w-10 h-10 text-gray-300" />
              <div>
                <p className="text-sm text-gray-400 font-medium">まだ履歴がありません</p>
                <p className="text-xs text-gray-400 mt-1">チャットすると自動で保存されます</p>
              </div>
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-sm">
                <p className="text-sm font-medium text-gray-800 truncate">{session.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(session.updatedAt)} · {session.messageCount}件
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    onClick={() => {
                      onResume(session.id);
                      onClose();
                    }}
                    className="flex items-center gap-1 text-xs text-white bg-indigo-500 hover:bg-indigo-600 transition-colors px-2.5 py-1 rounded"
                  >
                    <RotateCcw className="w-3 h-3" />
                    再開
                  </button>
                  <button
                    onClick={() => onRemove(session.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded"
                    aria-label="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
