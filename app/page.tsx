'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Trash2, MessageSquare, Plus } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { getLevelByCount } from '@/prompts/constants';
import { LogoutButton } from '@/components/auth/LogoutButton';

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

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { solvedCount, dataLoading } = useUserData(user?.uid ?? null);
  const { sessions, removeSession } = useSessionHistory(user?.uid ?? null);

  const currentLevel = getLevelByCount(solvedCount);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-base font-bold text-gray-900">なぞなぞAI</h1>
        </div>
        <LogoutButton />
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* AI Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-md flex-shrink-0">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">現在のAIレベル</p>
            <p className="text-lg font-bold text-gray-900">{currentLevel.name}</p>
            <p className="text-xs text-indigo-500 font-semibold">解決数 {solvedCount} 問</p>
          </div>
        </div>

        {/* New session button */}
        <Link
          href="/chat"
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-base py-3.5 rounded-2xl shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          新しい謎解きを始める
        </Link>

        {/* Session list */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">過去の謎解き</h2>
          {sessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center gap-3 text-center">
              <MessageSquare className="w-10 h-10 text-gray-200" />
              <p className="text-sm text-gray-400 font-medium">まだ謎解きがありません</p>
              <p className="text-xs text-gray-400">上のボタンから最初の謎解きを始めましょう</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800 truncate">{session.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(session.updatedAt)} · {session.messageCount}件のメッセージ
                  </p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <Link
                      href={`/chat?id=${session.id}`}
                      className="flex items-center gap-1.5 text-xs text-white bg-indigo-500 hover:bg-indigo-600 transition-colors px-3 py-1.5 rounded-lg font-medium"
                    >
                      続きから
                    </Link>
                    <button
                      onClick={() => removeSession(session.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                      aria-label="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
