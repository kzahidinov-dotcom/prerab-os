'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Calculator, 
  Receipt, 
  FileText, 
  HardHat, 
  Settings, 
  ShieldCheck,
  Building2,
  TrendingUp,
  Sparkles,
  CheckSquare,
  CalendarRange
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'planner'
  | 'gantt'
  | 'projects' 
  | 'crm' 
  | 'budget' 
  | 'costs' 
  | 'invoices' 
  | 'workers' 
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  projectCount: number;
  unpaidInvoicesCount: number;
  pendingExpensesCount: number;
  tasksCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  projectCount,
  unpaidInvoicesCount,
  pendingExpensesCount,
  tasksCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Дашборд & Аналитика',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'planner' as NavTab,
      label: 'Задачи & Канбан',
      icon: CheckSquare,
      badge: tasksCount && tasksCount > 0 ? tasksCount : null,
      badgeColor: 'bg-amber-400 text-slate-950 font-black',
    },
    {
      id: 'gantt' as NavTab,
      label: 'План-график (Гант)',
      icon: CalendarRange,
      badge: 'ГАНТ',
      badgeColor: 'bg-brand-500 text-slate-950 font-black text-[9px]',
    },
    {
      id: 'projects' as NavTab,
      label: 'Объекты и Проекты',
      icon: FolderKanban,
      badge: projectCount > 0 ? projectCount : null,
      badgeColor: 'bg-brand-500 text-slate-950 font-bold',
    },
    {
      id: 'crm' as NavTab,
      label: 'CRM Клиенты',
      icon: Users,
      badge: null,
    },
    {
      id: 'budget' as NavTab,
      label: 'Сметчик (Výkaz výmer)',
      icon: Calculator,
      badge: 'PRO',
      badgeColor: 'bg-gradient-to-r from-brand-400 to-brand-600 text-slate-950 font-black text-[10px]',
    },
    {
      id: 'costs' as NavTab,
      label: 'Расходы и Чеки',
      icon: Receipt,
      badge: pendingExpensesCount > 0 ? pendingExpensesCount : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      id: 'invoices' as NavTab,
      label: 'Счета & DPH (Faktúry)',
      icon: FileText,
      badge: unpaidInvoicesCount > 0 ? unpaidInvoicesCount : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'workers' as NavTab,
      label: 'Мастера и Бригады',
      icon: HardHat,
      badge: null,
    },
    {
      id: 'settings' as NavTab,
      label: 'Настройки & Бэкап',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-850 select-none relative z-20">
      {/* Brand Logo Header */}
      <div className="p-5 border-b border-slate-850/80 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-full max-w-[200px] h-14 relative flex items-center justify-center mb-1">
            {/* Official PRERAB Logo */}
            <img 
              src="/prerab-logo.png" 
              alt="PRERAB Logo" 
              className="max-h-full max-w-full object-contain filter drop-shadow-[0_2px_8px_rgba(197,155,53,0.3)]" 
            />
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">
              INTERNAL OS
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
              v1.0
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Разделы управления</span>
          <span className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full shadow-xs">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Администратор</span>
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-slate-950 shadow-lg shadow-brand-500/20 font-bold'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-brand-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-brand-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Security Seal Footer */}
      <div className="p-4 border-t border-slate-850 bg-slate-950/60 text-xs">
        <div className="flex items-center gap-2 text-brand-400 mb-1.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-brand-400" />
          <span className="font-bold text-[11px] tracking-tight">Защищено водяным знаком</span>
        </div>
        <div className="text-[11px] text-slate-400 leading-relaxed">
          Prerab s.r.o. &middot; Bratislava<br />
          <span className="text-slate-400 font-medium">Конфиденциальная система</span>
        </div>
      </div>
    </aside>
  );
};
