'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Trash2, MessageSquare, Plus, Settings, LogOut, BookOpen } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { getUserData } from '@/lib/userDoc';
import { getLevelByXP } from '@/lib/xp';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
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

export default function HomePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [solvedCount, setSolvedCount] = useState(0);
  const [learningsCount, setLearningsCount] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [solvedLoading, setSolvedLoading] = useState(true);
  const { sessions, sessionsLoading, removeSession } = useSessionHistory(user?.uid ?? null);

  useEffect(() => {
    if (!user?.uid) return;
    getUserData(user.uid).then((data) => {
      setSolvedCount(data?.solvedCount ?? 0);
      setLearningsCount(data?.learnings?.length ?? 0);
      setTotalCards(
        (data?.learnings?.length ?? 0) +
        (data?.principles?.length ?? 0) +
        (data?.logics?.length ?? 0)
      );
      setSolvedLoading(false);
    });
  }, [user?.uid]);

  const currentLevel = getLevelByXP(solvedCount * 3 + totalCards);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  if (authLoading || solvedLoading || sessionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const avatarLetter = user.displayName?.[0] ?? user.email?.[0]?.toUpperCase() ?? '?';

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

        {/* ユーザーメニュー */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-xs font-bold hover:shadow-md transition-shadow overflow-hidden"
            title="メニュー"
          >
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              avatarLetter
            )}
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-10 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
              <button
                onClick={() => { setSettingsOpen(true); setUserMenuOpen(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
                設定
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                ログアウト
              </button>
            </div>
          )}
        </div>
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

        {/* アドバイス一覧ボタン */}
        <Link
          href="/learnings"
          className="flex items-center justify-center gap-2 w-full bg-white border border-indigo-100 text-indigo-600 font-semibold text-sm py-3 rounded-2xl shadow-sm hover:bg-indigo-50 transition-all"
        >
          <BookOpen className="w-4 h-4" />
          アドバイス一覧
          <span className="text-xs text-gray-400 font-normal">({learningsCount}件)</span>
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
                <div key={session.id} className={cn('bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3')}>
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

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
