'use client';

import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function LogoutButton() {
  const { signOut } = useAuth();

  return (
    <button
      onClick={signOut}
      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
      title="ログアウト"
    >
      <LogOut className="w-3.5 h-3.5" />
      ログアウト
    </button>
  );
}
