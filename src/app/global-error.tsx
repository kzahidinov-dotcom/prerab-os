'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body className="bg-slate-900 text-white min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-lg font-bold">Системная ошибка</h2>
          <p className="text-xs text-slate-400">{error.message}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg text-xs font-bold"
          >
            Перезагрузить
          </button>
        </div>
      </body>
    </html>
  );
}
