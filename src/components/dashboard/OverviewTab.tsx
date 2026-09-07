'use client';

import React from 'react';
import { Project, Expense, Invoice, Client } from '@/types';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building2, 
  Clock, 
  FolderKanban,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  Wrench,
  Layers,
  ArrowRight,
  User
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { formatSlovakEur } from '@/lib/slovak-vat';
import { GOOGLE_DRIVE_ROOT_URL } from '@/lib/google-sheets-sync';
import { Task, UserProfile } from '@/types';
import { TodayTasksWidget } from './TodayTasksWidget';

interface OverviewTabProps {
  projects: Project[];
  expenses: Expense[];
  invoices: Invoice[];
  clients: Client[];
  budgets?: any[];
  tasks?: Task[];
  currentUser?: UserProfile | null;
  onSelectProject: (projectId: string) => void;
  onOpenNewExpense?: () => void;
  onOpenNewInvoice?: () => void;
  onNavigateTab?: (tab: any) => void;
  onSyncGoogleSheets?: () => void;
  onToggleTaskStatus?: (taskId: string) => void;
  onOpenNewTask?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  projects,
  expenses,
  invoices,
  clients,
  budgets,
  tasks = [],
  currentUser,
  onSelectProject,
  onOpenNewExpense,
  onOpenNewInvoice,
  onNavigateTab,
  onSyncGoogleSheets,
  onToggleTaskStatus,
  onOpenNewTask,
}) => {
  // 1. Total Revenue (Paid + Invoiced)
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.paid_amount || inv.total_amount || 0), 0);
  
  // 2. Direct Project Costs (Expenses assigned to a project)
  const projectExpenses = expenses.filter(e => e.project_id && e.project_id.length > 0);
  const totalProjectExpenses = projectExpenses.reduce((sum, exp) => sum + (exp.amount_without_vat || 0), 0);

  // 3. General Company Overhead (Expenses with NO project_id: Rent, Warehouse, Vito diesel, Ostap salary, Tools)
  const generalExpenses = expenses.filter(e => !e.project_id || e.project_id.length === 0);
  const totalGeneralExpenses = generalExpenses.reduce((sum, exp) => sum + (exp.amount_without_vat || 0), 0);

  // 4. Total all expenses
  const totalAllExpenses = totalProjectExpenses + totalGeneralExpenses;

  // 5. Gross Margin (Revenue - Direct Project Costs)
  const grossProfit = totalRevenue - totalProjectExpenses;
  const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // 6. Real Net Profit (Gross Margin - General Overhead)
  const netProfit = totalRevenue - totalAllExpenses;
  const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Active Projects
  const activeProjects = projects.filter(p => p.status === 'in_progress');
  const completedProjects = projects.filter(p => p.status === 'completed');

  // Breakdown of Overhead
  const overheadCategories = [
    { name: 'Аренда офиса и склада', sum: generalExpenses.filter(e => (e.description || '').toLowerCase().includes('аренда') || (e.description || '').toLowerCase().includes('склад')).reduce((s, e) => s + e.amount_without_vat, 0) },
    { name: 'Зарплаты персонала (Остап, Женя, Водитель)', sum: generalExpenses.filter(e => (e.description || '').toLowerCase().includes('зарплата') || (e.description || '').toLowerCase().includes('остап') || (e.description || '').toLowerCase().includes('женя') || (e.description || '').toLowerCase().includes('шофер')).reduce((s, e) => s + e.amount_without_vat, 0) },
    { name: 'Транспорт и Дизель (Vito)', sum: generalExpenses.filter(e => (e.description || '').toLowerCase().includes('транспорт') || (e.description || '').toLowerCase().includes('дизель') || (e.description || '').toLowerCase().includes('паливо')).reduce((s, e) => s + e.amount_without_vat, 0) },
    { name: 'Инструменты и оснастка', sum: generalExpenses.filter(e => (e.description || '').toLowerCase().includes('інструмент') || (e.description || '').toLowerCase().includes('перфоратор') || (e.description || '').toLowerCase().includes('палета')).reduce((s, e) => s + e.amount_without_vat, 0) },
    { name: 'Прочие общефирменные траты', sum: generalExpenses.filter(e => !(e.description || '').toLowerCase().includes('аренда') && !(e.description || '').toLowerCase().includes('склад') && !(e.description || '').toLowerCase().includes('зарплата') && !(e.description || '').toLowerCase().includes('дизель') && !(e.description || '').toLowerCase().includes('інструмент')).reduce((s, e) => s + e.amount_without_vat, 0) },
  ].filter(c => c.sum > 0);

  // Top Active Projects with Margins
  const activeProjectsFinancials = activeProjects.map(prj => {
    const prjInvoices = invoices.filter(i => i.project_id === prj.id);
    const revenue = prjInvoices.reduce((s, i) => s + (i.paid_amount || i.total_amount || 0), 0) || prj.budget_estimated;
    
    const prjExps = expenses.filter(e => e.project_id === prj.id);
    const spent = prjExps.reduce((s, e) => s + e.amount_without_vat, 0) || prj.budget_actual_spent;
    
    const profit = revenue - spent;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      project: prj,
      revenue,
      spent,
      profit,
      margin,
    };
  });

  return (
    <div className="space-y-8">
      {/* Top Banner / Sync Info */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-6 text-white border border-brand-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white">
                Prerab OS &middot; Сводка компании
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 uppercase tracking-wider">
                Live Cloud Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Актуальные данные по объектам Братиславы, заказам материалов и накладным расходам фирмы.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={GOOGLE_DRIVE_ROOT_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-all shadow-sm"
          >
            <span>📁 Google Диск со сметами</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onSyncGoogleSheets}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-brand-400 hover:bg-brand-300 rounded-xl transition-all shadow-md font-bold"
          >
            <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
            <span>Синхронизировать с Google</span>
          </button>
        </div>
      </div>

      {/* Daily Executive Focus Widget (Kerim & Vanya Tasks) */}
      <TodayTasksWidget
        tasks={tasks}
        currentUser={currentUser}
        onNavigateToPlanner={() => onNavigateTab?.('planner')}
        onToggleTaskStatus={(taskId) => onToggleTaskStatus?.(taskId)}
        onOpenNewTask={() => onOpenNewTask?.()}
      />

      {/* KPI Cards (4 Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Incomes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Выручка / Оплаты клиентов
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatSlovakEur(totalRevenue)}
            </div>
            <p className="text-xs text-emerald-800 font-semibold mt-1">
              {invoices.length} зафиксированных оплат и авансов
            </p>
          </div>
        </div>

        {/* Direct Project Expenses */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Прямые расходы на объекты
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatSlovakEur(totalProjectExpenses)}
            </div>
            <p className="text-xs text-slate-700 mt-1">
              Стройматериалы, дизайн, зарплаты мастеров, мусор
            </p>
          </div>
        </div>

        {/* Company Overhead */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Общие расходы фирмы
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatSlovakEur(totalGeneralExpenses)}
            </div>
            <p className="text-xs text-slate-700 mt-1">
              Аренда офиса/склада, Vito, водитель, инструмент
            </p>
          </div>
        </div>

        {/* Gross Margin & Profit */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-brand-500/40 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-300 uppercase tracking-wider">
              Валовая прибыль объектов
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              {formatSlovakEur(grossProfit)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                Маржа {grossMarginPercent.toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400">по всем объектам</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: ACTIVE PROJECTS IN PROGRESS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Текущие активные объекты в работе ({activeProjects.length})</span>
            </h3>
            <p className="text-xs text-slate-700 mt-0.5">
              RuzChem, Jaslovska, Kpt. Rašu, Hergovic, Bebravska (ожидание оплат)
            </p>
          </div>

          <button
            onClick={() => onNavigateTab?.('projects')}
            className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>Все объекты ({projects.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {activeProjectsFinancials.map(({ project, revenue, spent, profit, margin }) => {
            const client = clients.find(c => c.id === project.client_id);
            return (
            <div 
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="p-5 hover:bg-slate-50/80 transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors">
                    {project.title}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    В работе
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>{project.address}, {project.city}</span>
                  {client && (
                    <>
                      <span>&middot;</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{client.company_name || client.name}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Numbers */}
              <div className="flex flex-wrap items-center gap-6 text-xs">
                <div>
                  <div className="text-[11px] text-slate-600 font-medium">Получено оплат:</div>
                  <div className="text-sm font-bold text-slate-900">{formatSlovakEur(revenue)}</div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-600 font-medium">Расходы на объект:</div>
                  <div className="text-sm font-bold text-amber-700">{formatSlovakEur(spent)}</div>
                </div>

                <div className="min-w-[120px]">
                  <div className="text-[11px] text-slate-600 font-medium">Прибыль / Маржа:</div>
                  <div className={`text-sm font-black ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatSlovakEur(profit)} ({margin.toFixed(1)}%)
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-700 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: COMPANY OVERHEAD BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overhead Breakdown Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-500" />
                <span>Структура общих расходов фирмы ({formatSlovakEur(totalGeneralExpenses)})</span>
              </h3>
              <p className="text-xs text-slate-700 mt-0.5">
                Постоянные затраты, не привязанные к конкретным объектам клиентов
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {overheadCategories.map((cat, idx) => {
              const pct = totalGeneralExpenses > 0 ? (cat.sum / totalGeneralExpenses) * 100 : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{cat.name}</span>
                    <span className="text-slate-900 font-bold">{formatSlovakEur(cat.sum)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-500 to-amber-500 rounded-full" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completed Projects Archive */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Завершенные и сданные объекты ({completedProjects.length})</span>
              </h3>
              <p className="text-xs text-slate-700 mt-0.5">
                Sibirska, Lotysska, Ozvoldik, Viglasska, Nobelova, Mierova, Dinda...
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {completedProjects.slice(0, 8).map(prj => {
              const prjInvs = invoices.filter(i => i.project_id === prj.id);
              const rev = prjInvs.reduce((s, i) => s + (i.paid_amount || i.total_amount || 0), 0) || prj.budget_estimated;
              const prjExps = expenses.filter(e => e.project_id === prj.id);
              const exp = prjExps.reduce((s, e) => s + e.amount_without_vat, 0) || prj.budget_actual_spent;
              const prof = rev - exp;

              return (
                <div 
                  key={prj.id}
                  onClick={() => onSelectProject(prj.id)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors border border-slate-200/60"
                >
                  <div className="font-bold text-slate-800 truncate">{prj.address}</div>
                  <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
                    Маржа: +{formatSlovakEur(prof)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
