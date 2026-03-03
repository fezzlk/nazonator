'use client';

import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, X, Check, Trash2 } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey } from '@/lib/apiKey';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey() ?? '');
      setSaved(false);
    }
  }, [isOpen]);

  function handleSave() {
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    setStoredApiKey(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClear() {
    clearStoredApiKey();
    setApiKey('');
    setSaved(false);
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
            <Settings className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-800">設定</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              OpenAI APIキー（任意）
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showKey ? 'APIキーを隠す' : 'APIキーを表示'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className={cn(
                  'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40',
                )}
              >
                {saved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    保存しました
                  </>
                ) : (
                  '保存'
                )}
              </button>
              <button
                onClick={handleClear}
                disabled={!apiKey}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                削除
              </button>
            </div>
          </div>

          {/* Security notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-3">
            <p className="text-xs text-amber-800 font-semibold mb-1">セキュリティについて</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              APIキーはあなたのブラウザ（localStorage）にのみ保存されます。
              リクエストのたびにHTTPS経由でサーバーに送られますが、サーバーはキーを保存・ログ記録しません。
            </p>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            設定しない場合は、サービス共有のAPIキーが使用されます。
          </p>
        </div>
      </div>
    </>
  );
}
