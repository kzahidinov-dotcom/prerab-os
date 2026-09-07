'use client';

import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  Download, 
  Check, 
  Building, 
  CheckSquare, 
  DollarSign, 
  Clock, 
  Users, 
  Sparkles, 
  AlertCircle, 
  Calendar, 
  FileSpreadsheet,
  ChevronRight,
  TrendingUp,
  MapPin,
  Flame
} from 'lucide-react';
import { 
  Project, 
  Client, 
  Expense, 
  Invoice, 
  Task, 
  Worker, 
  WorkLog, 
  UserProfile 
} from '@/types';
import { downloadExcelCsvSummary } from '@/lib/backup';
import { showToast } from '@/components/ui/NotificationToast';

interface TeamReportModalProps {
  onClose: () => void;
  projects: Project[];
  clients: Client[];
  expenses: Expense[];
  invoices: Invoice[];
  tasks: Task[];
  workers: Worker[];
  workLogs: WorkLog[];
  currentUser?: UserProfile | null;
}

export const TeamReportModal: React.FC<TeamReportModalProps> = ({
  onClose,
  projects,
  clients,
  expenses,
  invoices,
  tasks,
  workers,
  workLogs,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);
  const [csvDownloaded, setCsvDownloaded] = useState(false);

  const clientMap = new Map(clients.map(c => [c.id, c.name]));
  const activeProjects = (projects || []).filter(p => p.status === 'in_progress');
  const activeTasks = (tasks || []).filter(t => t.status !== 'done');
  const criticalTasks = activeTasks.filter(t => t.priority === 'critical');

  // Financials
  const totalRevenuePaid = (invoices || [])
    .filter(i => i.payment_status === 'paid')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const totalExpensesSum = (expenses || []).reduce((sum, e) => sum + (e.amount_with_vat || 0), 0);
  const netMargin = totalRevenuePaid - totalExpensesSum;

  // Work logs summary
  const totalHoursLogged = (workLogs || []).reduce((sum, wl) => sum + (wl.hours_worked || 0), 0);

  // Group tasks by assignee
  const tasksByAssignee = activeTasks.reduce((acc, task) => {
    const name = task.assignee_name || 'Не назначен';
    if (!acc[name]) acc[name] = [];
    acc[name].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const formatEuro = (val: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const currentDateStr = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());

  // Copy structured text to clipboard for Telegram / WhatsApp
  const handleCopyForMessenger = () => {
    let text = `🏗️ *PRERAB S.R.O. — СВОДНЫЙ ОТЧЕТ ДЛЯ КОМАНДЫ*\n`;
    text += `📅 ${currentDateStr}\n`;
    text += `👤 Составитель: ${currentUser?.name || 'Администратор'}\n\n`;

    text += `📊 *КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ:*\n`;
    text += `• Объектов в работе: ${activeProjects.length} шт.\n`;
    text += `• Задач в работе: ${activeTasks.length} (критических: ${criticalTasks.length})\n`;
    text += `• Поступлений: ${formatEuro(totalRevenuePaid)} | Расходов: ${formatEuro(totalExpensesSum)}\n`;
    text += `• Отработано часов мастерами: ${totalHoursLogged.toFixed(1)} ч.\n\n`;

    text += `📌 *АКТИВНЫЕ СТРОИТЕЛЬНЫЕ ОБЪЕКТЫ (${activeProjects.length}):*\n`;
    activeProjects.forEach((p, idx) => {
      const cName = clientMap.get(p.client_id) || 'Клиент не указан';
      const pExp = (expenses || [])
        .filter(e => e.project_id === p.id)
        .reduce((sum, e) => sum + (e.amount_with_vat || 0), 0);
      text += `${idx + 1}. *${p.title}* (${p.address || 'Братислава'})\n`;
      text += `   Заказчик: ${cName} | Смета: ${formatEuro(p.budget_estimated || 0)} | Факт. расход: ${formatEuro(pExp)}\n`;
    });
    text += `\n`;

    text += `⚡ *ФОКУС-ЗАДАЧИ ПО ОТВЕТСТВЕННЫМ:*\n`;
    Object.entries(tasksByAssignee).forEach(([assignee, userTasks]) => {
      text += `👤 *${assignee}:*\n`;
      userTasks.slice(0, 4).forEach(t => {
        const crit = t.priority === 'critical' ? ' 🔥' : '';
        const amt = t.money_amount ? ` [${formatEuro(t.money_amount)}]` : '';
        text += `   - ${t.title}${crit}${amt}\n`;
      });
    });

    text += `\n🔗 Prerab OS: https://prerab-os.vercel.app`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast({
        title: '📋 Сводка скопирована',
        message: 'Готовый отчет скопирован в буфер обмена. Можно вставлять в WhatsApp или Telegram!',
        type: 'success'
      });
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {
      alert('Не удалось скопировать текст в буфер');
    });
  };

  const handleDownloadCsv = () => {
    const success = downloadExcelCsvSummary();
    if (success) {
      setCsvDownloaded(true);
      showToast({
        title: '📊 Отчет Excel скачан',
        message: 'Сводная таблица объектов и задач сохранена в формате CSV/Excel!',
        type: 'success'
      });
      setTimeout(() => setCsvDownloaded(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        
        {/* Header Action Bar (Hidden on print) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Сводный отчет для команды</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500/20 text-brand-300 border border-brand-500/40">
                  LIVE DATA
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Полный управленческий и строительный срез Prerab s.r.o.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* WhatsApp / Telegram Copy Button */}
            <button
              onClick={handleCopyForMessenger}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                copied 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title="Скопировать готовый структурированный текст для отправки в Telegram или WhatsApp"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Скопировано в буфер!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>В Telegram / WhatsApp</span>
                </>
              )}
            </button>

            {/* Print / PDF Button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
              title="Распечатать или сохранить в PDF (A4)"
            >
              <Printer className="w-4 h-4" />
              <span>Печать / PDF</span>
            </button>

            {/* Excel CSV Button */}
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
              title="Выгрузить в Excel таблицу"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{csvDownloaded ? 'Выгружено!' : 'Excel'}</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto bg-slate-50/50 space-y-6">
          
          {/* Document Header Banner */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 p-2.5 border border-brand-500/30 flex items-center justify-center shrink-0 shadow-sm">
                <img src="/prerab-logo.png" alt="PRERAB" className="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Prerab s.r.o. &middot; Оперативный отчет
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Братислава, Словакия &middot; Реконструкция и отделка объектов
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-600 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200 w-full sm:w-auto">
              <div className="flex items-center sm:justify-end gap-1.5 font-bold text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-brand-500" />
                <span>{currentDateStr}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Подготовил: <span className="font-bold text-slate-800">{currentUser?.name || 'Керим & Ваня'}</span>
              </div>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Объекты в работе</span>
                <Building className="w-4 h-4 text-brand-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{activeProjects.length}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">из {projects.length} зарегистрированных</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Активные задачи</span>
                <CheckSquare className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{activeTasks.length}</div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 mt-0.5">
                {criticalTasks.length > 0 && <Flame className="w-3 h-3 animate-pulse" />}
                <span>{criticalTasks.length} с высшим приоритетом</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Текущий баланс</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className={`text-2xl font-black ${netMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatEuro(netMargin)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">поступило {formatEuro(totalRevenuePaid)}</p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Табель бригад</span>
                <Clock className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{totalHoursLogged.toFixed(0)} ч.</div>
              <p className="text-[11px] text-slate-400 mt-0.5">{workers.filter(w => w.active).length} активных мастеров</p>
            </div>
          </div>

          {/* Section 1: Active Construction Projects */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-brand-500" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  1. Активные объекты и стройплощадки
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                Всего: {activeProjects.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-2.5 pl-2">Объект и Адрес</th>
                    <th className="pb-2.5">Заказчик</th>
                    <th className="pb-2.5">Смета (€)</th>
                    <th className="pb-2.5">Затраты (€)</th>
                    <th className="pb-2.5">Остаток маржи</th>
                    <th className="pb-2.5 text-right pr-2">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeProjects.map((p) => {
                    const clientName = clientMap.get(p.client_id) || 'Не указан';
                    const pExp = (expenses || [])
                      .filter(e => e.project_id === p.id)
                      .reduce((sum, e) => sum + (e.amount_with_vat || 0), 0);
                    const est = p.budget_estimated || 0;
                    const margin = est - pExp;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pl-2 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>{p.title}</span>
                          </div>
                          {p.address && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-normal pl-3.5 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span>{p.address}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-slate-600 font-medium">
                          {clientName}
                        </td>
                        <td className="py-3 font-semibold text-slate-900">
                          {formatEuro(est)}
                        </td>
                        <td className="py-3 font-semibold text-rose-600">
                          {formatEuro(pExp)}
                        </td>
                        <td className="py-3 font-bold text-emerald-600">
                          {formatEuro(margin)}
                        </td>
                        <td className="py-3 text-right pr-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            В РАБОТЕ
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {activeProjects.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        Нет активных объектов со статусом «В работе»
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Team Tasks Roadmap */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-brand-500" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  2. План задач команды на неделю
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                В фокусе: {activeTasks.length} задач
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(tasksByAssignee).map(([assignee, userTasks]) => (
                <div key={assignee} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                      <div className="w-6 h-6 rounded-lg bg-brand-500 text-slate-950 flex items-center justify-center font-black text-[10px]">
                        {assignee.charAt(0)}
                      </div>
                      <span>{assignee}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-white rounded-md border border-slate-200 text-slate-600">
                      {userTasks.length} задач
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs">
                    {userTasks.map(t => (
                      <li key={t.id} className="p-2.5 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-slate-800 leading-snug">
                            {t.title}
                          </span>
                          {t.priority === 'critical' && (
                            <span className="shrink-0 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                              СРОЧНО
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{t.project_title || 'Общие задачи'}</span>
                          {t.money_amount && (
                            <span className="font-bold text-emerald-600">
                              {formatEuro(t.money_amount)}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {Object.keys(tasksByAssignee).length === 0 && (
                <div className="col-span-2 py-8 text-center text-slate-400 text-xs">
                  Все текущие задачи выполнены! Отличная работа команды.
                </div>
              )}
            </div>
          </div>

          {/* Document Footer */}
          <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-200">
            <p className="font-medium">
              Prerab OS &middot; Братислава &middot; Система управления строительными проектами &middot; prerab-os.vercel.app
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
