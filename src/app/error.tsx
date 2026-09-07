'use client';

import React, { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router Error caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-white">
      <div className="max-w-md w-full bg-slate-850 p-6 rounded-2xl border border-slate-800 shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-white">Произошла ошибка при загрузке</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          {error?.message || 'Не удалось загрузить модуль. Нажмите кнопку ниже для повторной попытки.'}
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Попробовать снова</span>
        </button>
      </div>
    </div>
  );
}
