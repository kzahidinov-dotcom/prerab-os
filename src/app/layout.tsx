import type { Metadata } from 'next';
import { Golos_Text, Unbounded } from 'next/font/google';
import './globals.css';

// Golos Text — a UI-grade grotesk built for Cyrillic + Latin, used for all body/interface copy.
const golosText = Golos_Text({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-sans',
  display: 'swap',
});

// Unbounded — a bold geometric display face for headlines, KPI figures and the brand lockup.
const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
});

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
    <html lang="ru" className={`${golosText.variable} ${unbounded.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0d111a" />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
