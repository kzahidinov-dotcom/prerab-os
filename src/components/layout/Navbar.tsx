'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  CheckCircle2, 
  HardHat, 
  Building, 
  Receipt, 
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  LogOut,
  CheckSquare,
  ClipboardList
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { storage } from '@/lib/storage';

import { UserProfile } from '@/types';

interface NavbarProps {
  activeTab: NavTab;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onSwitchUser?: () => void;
  onOpenNewProject: () => void;
  onOpenNewClient: () => void;
  onOpenNewExpense: () => void;
  onOpenNewInvoice: () => void;
  onOpenNewBudget: () => void;
  onOpenNewTask?: () => void;
  onOpenTeamReport?: () => void;
  onSyncGoogleSheets: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  currentUser,
  onLogout,
  onSwitchUser,
  onOpenNewProject,
  onOpenNewClient,
  onOpenNewExpense,
  onOpenNewInvoice,
  onOpenNewBudget,
  onOpenNewTask,
  onOpenTeamReport,
  onSyncGoogleSheets,
  searchQuery,
  setSearchQuery,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard': return 'Главная аналитика и финансовый дашборд';
      case 'planner': return 'Оперативные задачи и канбан-доска';
      case 'gantt': return 'План-график объектов (Диаграмма Ганта и Зависимости)';
      case 'projects': return 'Строительные объекты и проекты в работе';
      case 'crm': return 'Клиенты и воронка заказов (CRM)';
      case 'budget': return 'Сметчик (Výkaz výmer) и расчет маржи';
      case 'costs': return 'Учет расходов, чеков и себестоимости';
      case 'invoices': return 'Выставление счетов (Faktúry) и словацкий DPH';
      case 'workers': return 'Мастера, бригады и табель зарплат';
      case 'settings': return 'Реквизиты компании, облако и резервные копии';
    }
  };

  const handleQuickBackup = () => {
    const backupJson = storage.exportFullBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prerab_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setBackupSuccess(true);
    setTimeout(() => setBackupSuccess(false), 3000);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
      {/* Title & Path */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-950 p-1 border border-brand-500/30 flex items-center justify-center shadow-sm">
          <img src="/prerab-logo.png" alt="PRERAB" className="max-h-full max-w-full object-contain" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>{getTabTitle(activeTab)}</span>
          </h1>
          <p className="text-xs text-slate-500">
            Prerab s.r.o. &middot; Братислава &middot; Словакия
          </p>
        </div>
      </div>

      {/* Center Search */}
      <div className="hidden md:flex items-center relative w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск объектов, клиентов, чеков..."
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Live Cloud Status */}
        <div
          title="Единая облачная база данных активна в реальном времени между Керимом и Ваней"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg shadow-2xs"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Единое облако</span>
        </div>

        {/* Team Report Button */}
        {onOpenTeamReport && (
          <button
            onClick={onOpenTeamReport}
            title="Сформировать сводный отчет для команды (для планерки и бригад)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-800 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors border border-brand-200/90 shadow-2xs"
          >
            <ClipboardList className="w-3.5 h-3.5 text-brand-600" />
            <span>Отчет для команды</span>
          </button>
        )}

        {/* Google Sheets Sync Button */}
        <button
          onClick={onSyncGoogleSheets}
          title="Синхронизировать данные из Google Таблиц / Google Форм"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>Google Таблица</span>
        </button>

        {/* Fast Backup Button */}
        <button
          onClick={handleQuickBackup}
          title="Быстрый бэкап базы данных на компьютер"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
        >
          {backupSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-semibold">Сохранено!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Скачать бэкап</span>
            </>
          )}
        </button>

        {/* Quick Add Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Создать</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenNewProject();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-600 text-left font-medium"
                >
                  <Building className="w-4 h-4 text-brand-500" />
                  <span>Новый объект / Проект</span>
                </button>
                {onOpenNewTask && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenNewTask();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-600 text-left font-medium"
                  >
                    <CheckSquare className="w-4 h-4 text-brand-500" />
                    <span>Новая задача (Планировщик)</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenNewBudget();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-600 text-left font-medium"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Новая смета (Výkaz výmer)</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenNewExpense();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-600 text-left font-medium"
                >
                  <Receipt className="w-4 h-4 text-amber-500" />
                  <span>Записать чек / Расход</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenNewInvoice();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-600 text-left font-medium"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Выставить счет (Faktúra)</span>
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenNewClient();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-600 text-left font-medium"
                >
                  <Plus className="w-4 h-4 text-slate-400" />
                  <span>Новый клиент</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Profile Badge & Switcher */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <button
              onClick={onSwitchUser}
              title="Нажмите для смены профиля сотрудника"
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition-all text-left group"
            >
              <div className={`w-8 h-8 rounded-xl ${currentUser.avatar_color || 'bg-brand-500'} text-white font-black text-xs flex items-center justify-center shadow-sm`}>
                {currentUser.name.substring(0, 1).toUpperCase()}
              </div>
              <div className="hidden lg:block">
                <div className="text-xs font-black text-slate-900 group-hover:text-brand-600 transition-colors leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">
                  {currentUser.role === 'admin' ? '👑 Администратор' : currentUser.role === 'driver' ? '🚛 Водитель' : '👷 Бригадир'}
                </div>
              </div>
            </button>

            <button
              onClick={onLogout}
              title="Выйти из аккаунта"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
