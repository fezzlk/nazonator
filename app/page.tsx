import Link from 'next/link';
import { Brain, Lightbulb, Star, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
            <Brain className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
          なぞなぞAI
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          AIに謎を解かせて育てよう
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            <span className="text-xs text-gray-600 font-medium">謎を出題</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
            <Star className="w-6 h-6 text-indigo-500" />
            <span className="text-xs text-gray-600 font-medium">AIが成長</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
            <Zap className="w-6 h-6 text-purple-500" />
            <span className="text-xs text-gray-600 font-medium">ストリーミング</span>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/login"
          className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg py-4 rounded-2xl shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-95"
        >
          はじめる
        </Link>

        <p className="mt-6 text-sm text-gray-400">
          謎を出題してAIを正解に導こう。アドバイスを重ねるほどAIが成長する
        </p>
      </div>
    </main>
  );
}
