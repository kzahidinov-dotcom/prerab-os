import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prerab OS — Система управления строительной компанией',
  description: 'ERP / CRM / PM комплекс для строительных и ремонтных компаний в Словакии. Расчет смет, маржинальность, чеки, DPH, PAY by square.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#f57223" />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
