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
  CalendarRange,
  ArrowUp,
  ArrowDown,
  Inbox
} from 'lucide-react';
import { scrollToTop, scrollToBottom } from '@/lib/scroll';

export type NavTab = 
  | 'dashboard' 
  | 'planner'
  | 'gantt'
  | 'projects' 
  | 'crm' 
  | 'budget' 
  | 'costs' 
  | 'invoices' 
  | 'supplier_invoices'
  | 'workers' 
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  projectCount: number;
  unpaidInvoicesCount: number;
  pendingExpensesCount: number;
  tasksCount?: number;
  unpaidSupplierInvoicesCount?: number;
  overdueSupplierInvoicesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  projectCount,
  unpaidInvoicesCount,
  pendingExpensesCount,
  tasksCount,
  unpaidSupplierInvoicesCount,
  overdueSupplierInvoicesCount,
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
      id: 'supplier_invoices' as NavTab,
      label: 'Фактуры на уплату',
      icon: Inbox,
      badge: unpaidSupplierInvoicesCount && unpaidSupplierInvoicesCount > 0 ? unpaidSupplierInvoicesCount : null,
      badgeColor: overdueSupplierInvoicesCount && overdueSupplierInvoicesCount > 0
        ? 'bg-rose-500 text-white font-black animate-pulse'
        : 'bg-emerald-500 text-white font-bold',
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
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-white/5 select-none relative z-20">
      {/* Brand Logo Header */}
      <div className="p-5 border-b border-white/5 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden">
        <div className="mesh-glow opacity-60" />
        <div className="flex flex-col items-center justify-center text-center relative">
          <div className="w-full max-w-[176px] h-14 relative flex items-center justify-center mb-2 rounded-2xl bg-white/[0.03] ring-1 ring-white/5 py-2">
            {/* Official PRERAB Logo */}
            <img
              src="/prerab-logo.png"
              alt="PRERAB Logo"
              className="max-h-full max-w-[85%] object-contain filter drop-shadow-[0_2px_10px_rgba(197,155,53,0.35)]"
            />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-slate-400">
              Internal OS
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-300 border border-brand-500/30">
              v1.0
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-between">
          <span>Разделы управления</span>
          <span className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Администратор</span>
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab(item.id)}
              className={`relative w-full flex items-center justify-between pl-3.5 pr-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 group cursor-pointer select-none ${
                isActive
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-slate-950 shadow-lg shadow-brand-500/25 font-bold'
                  : 'text-slate-300 font-medium hover:bg-white/[0.04] hover:text-brand-300'
              }`}
            >
              {!isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-brand-400 opacity-0 group-hover:opacity-60 transition-opacity" />
              )}
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-brand-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.id === 'costs' && (
                  <div
                    className="flex items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isActive) setActiveTab('costs');
                        setTimeout(scrollToTop, 50);
                      }}
                      className={`p-1 rounded transition-colors ${
                        isActive
                          ? 'hover:bg-amber-600/70 text-slate-950 hover:text-white'
                          : 'hover:bg-slate-800 text-slate-400 hover:text-amber-400'
                      }`}
                      title="Сразу вверх"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isActive) setActiveTab('costs');
                        setTimeout(scrollToBottom, 50);
                      }}
                      className={`p-1 rounded transition-colors ${
                        isActive
                          ? 'hover:bg-amber-600/70 text-slate-950 hover:text-white'
                          : 'hover:bg-slate-800 text-slate-400 hover:text-amber-400'
                      }`}
                      title="Сразу вниз"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Security Seal Footer */}
      <div className="p-4 border-t border-white/5 bg-slate-950/60 text-xs">
        <div className="flex items-center gap-2 text-brand-400 mb-1.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-brand-400" />
          <span className="font-bold text-[11px] tracking-tight">Защищено водяным знаком</span>
        </div>
        <div className="text-[11px] text-slate-500 leading-relaxed">
          Prerab s.r.o. &middot; Bratislava<br />
          <span className="text-slate-500 font-medium">Конфиденциальная система</span>
        </div>
      </div>
    </aside>
  );
};
