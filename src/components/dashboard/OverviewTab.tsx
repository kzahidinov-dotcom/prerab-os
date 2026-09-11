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
  User,
  FileSpreadsheet
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
import { GOOGLE_DRIVE_ROOT_URL, matchCanonicalProjectKey, normalizeProjectKey } from '@/lib/google-sheets-sync';
import { FinanceDashboardData, FinanceProjectRow } from '@/lib/finance-dashboard';
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
  // Готовые цифры из листа «ФІНАНСОВИЙ ДАШБОРД ФІРМИ» таблицы STATISTICS FINAL
  finance?: FinanceDashboardData | null;
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
  finance,
  onSelectProject,
  onOpenNewExpense,
  onOpenNewInvoice,
  onNavigateTab,
  onSyncGoogleSheets,
  onToggleTaskStatus,
  onOpenNewTask,
}) => {
  // 1. Total Revenue (Paid + Invoiced) strictly from Google Sheet invoices
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.paid_amount || inv.total_amount || 0), 0);
  
  // 2. Direct Project Costs (Expenses assigned to a project in Google Sheet)
  const projectExpenses = expenses.filter(e => e.project_id && e.project_id.length > 0);
  const totalProjectExpenses = projectExpenses.reduce((sum, exp) => sum + (exp.amount_without_vat || 0), 0);

  // 3. General Company Overhead (Expenses with NO project_id in Google Sheet)
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

  // Breakdown of Overhead based on real categories from STATISTICS FINAL
  const overheadCategoriesMap: Record<string, number> = {};
  generalExpenses.forEach(e => {
    const rawVendor = (e.vendor || '').trim();
    let catName = rawVendor;
    const lower = rawVendor.toLowerCase();
    if (lower.includes('транспорт') || lower.includes('дизель') || lower.includes('паливо') || lower.includes('bmw')) {
      catName = 'Транспорт и топливо (Vito, BMW)';
    } else if (lower.includes('інструмент') || lower.includes('инструмент') || lower.includes('перфоратор')) {
      catName = 'Инструменты и оснастка';
    } else if (lower.includes('офис') || lower.includes('склад')) {
      catName = 'Аренда офиса и склада';
    } else if (lower.includes('остап')) {
      catName = 'Зарплата Остапа';
    } else if (lower.includes('бухгалтер')) {
      catName = 'Бухгалтерия';
    } else if (lower.includes('смм') || lower.includes('таргет') || lower.includes('реклам')) {
      catName = 'Маркетинг, SMM и таргет';
    } else if (lower.includes('зв\'язок') || lower.includes('связ')) {
      catName = 'Мобильная связь';
    } else if (lower.includes('робочих') || lower.includes('рабочих')) {
      catName = 'Общие рабочие бригады';
    } else if (lower.includes('канцеляр') || lower.includes('підписк')) {
      catName = 'Канцелярия и подписки';
    } else {
      catName = rawVendor || 'Прочие общефирменные траты';
    }
    overheadCategoriesMap[catName] = (overheadCategoriesMap[catName] || 0) + (e.amount_without_vat || 0);
  });

  const overheadCategories = Object.entries(overheadCategoriesMap)
    .map(([name, sum]) => ({ name, sum }))
    .sort((a, b) => b.sum - a.sum);

  // Финансовые показатели рассчитываются напрямую из Google Таблицы STATISTICS FINAL
  const displayRevenue = finance ? finance.total_income : totalRevenue;
  const displayProjectExpenses = finance ? finance.project_expenses : totalProjectExpenses;
  const displayOverhead = finance ? finance.overhead_expenses : totalGeneralExpenses;
  const displayProfit = finance ? finance.net_profit : netProfit;
  const displayMargin = finance ? finance.margin_percent : netMarginPercent;

  const financeByProject = new Map<string, FinanceProjectRow>();
  (finance?.projects || []).forEach(row => {
    financeByProject.set(normalizeProjectKey(matchCanonicalProjectKey(row.name)), row);
  });
  const financeRowFor = (title: string): FinanceProjectRow | undefined =>
    financeByProject.get(normalizeProjectKey(matchCanonicalProjectKey(title)));

  const overheadRows = (finance && finance.overhead.length > 0)
    ? finance.overhead.map(o => ({ name: o.category, sum: o.amount }))
    : overheadCategories;

  // Деньги по объектам берутся напрямую из Google Таблицы STATISTICS FINAL
  const activeProjectsFinancials = activeProjects.map(prj => {
    const sheetRow = financeRowFor(prj.title);
    const prjInvoices = invoices.filter(i => i.project_id === prj.id);
    const fallbackRevenue = prjInvoices.reduce((s, i) => s + (i.paid_amount || i.total_amount || 0), 0) || prj.budget_estimated || 0;
    
    const prjExps = expenses.filter(e => e.project_id === prj.id);
    const fallbackSpent = prjExps.reduce((s, e) => s + (e.amount_without_vat || 0), 0) || prj.budget_actual_spent || 0;

    const revenue = sheetRow ? sheetRow.income : fallbackRevenue;
    const spent = sheetRow ? sheetRow.total_expense : fallbackSpent;
    const profit = sheetRow ? sheetRow.balance : (revenue - spent);
    const margin = sheetRow
      ? sheetRow.margin_percent
      : (revenue > 0 ? ((revenue - spent) / revenue) * 100 : 0);

    return {
      project: prj,
      revenue,
      spent,
      profit,
      margin,
      hasMoney: true,
    };
  }).sort((a, b) => b.revenue - a.revenue);


  return (
    <div className="space-y-8">
      {/* Откуда берутся деньги на дашборде */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <FileSpreadsheet className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900">Цифры взяты напрямую из вашей Google Таблицы STATISTICS FINAL</span> —
          все доходы, авансы, прямые расходы по объектам и общефирменный оверхед рассчитываются в реальном времени исключительно из таблицы.
          {finance?.fetched_at && (
            <span className="text-slate-500">
              {' '}Обновлено: {new Date(finance.fetched_at).toLocaleString('ru-RU')}.
            </span>
          )}
        </div>
      </div>

      {/* Top Banner / Sync Info */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-6 text-white border border-white/5 shadow-card-hover flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="mesh-glow" />
        <div className="absolute inset-0 bg-grain mix-blend-overlay opacity-[0.03] pointer-events-none" />

        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/15 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-display font-bold tracking-tight text-white">
                Prerab OS &middot; Сводка компании
              </h2>
              <span className="badge bg-brand-500/15 text-brand-300 border-brand-500/30 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 max-w-lg">
              Актуальные данные по объектам Братиславы, заказам материалов и накладным расходам фирмы.
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <a
            href={GOOGLE_DRIVE_ROOT_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white bg-white/[0.06] hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            <span>📁 Google Диск со сметами</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onSyncGoogleSheets}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-b from-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400 rounded-xl transition-all shadow-gold"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
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
        <div className="stat-tile text-emerald-500">
          <div className="flex items-center justify-between">
            <span className="section-heading">
              Выручка / Оплаты клиентов
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[26px] font-display font-bold text-slate-900 tracking-tight tnum">
              {formatSlovakEur(displayRevenue)}
            </div>
            <p className="text-xs text-emerald-700 font-semibold mt-1.5">
              По данным таблицы STATISTICS FINAL
            </p>
          </div>
        </div>

        {/* Direct Project Expenses */}
        <div className="stat-tile text-amber-500">
          <div className="flex items-center justify-between">
            <span className="section-heading">
              Прямые расходы на объекты
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[26px] font-display font-bold text-slate-900 tracking-tight tnum">
              {formatSlovakEur(displayProjectExpenses)}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1.5">
              Стройматериалы, дизайн, зарплаты мастеров, мусор
            </p>
          </div>
        </div>

        {/* Company Overhead */}
        <div className="stat-tile text-rose-500">
          <div className="flex items-center justify-between">
            <span className="section-heading">
              Общие расходы фирмы
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[26px] font-display font-bold text-slate-900 tracking-tight tnum">
              {formatSlovakEur(displayOverhead)}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1.5">
              {finance?.top_overhead
                ? `Самая большая статья: ${finance.top_overhead}`
                : 'Аренда офиса/склада, Vito, водитель, инструмент'}
            </p>
          </div>
        </div>

        {/* Gross Margin & Profit */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-brand-500/40 shadow-card-hover">
          <div className="mesh-glow opacity-70" />
          <div className="relative flex items-center justify-between">
            <span className="text-[13px] font-extrabold uppercase tracking-wider text-brand-300">
              Чистая прибыль фирмы
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="relative mt-3">
            <div className="text-[26px] font-display font-bold text-white tracking-tight tnum">
              {formatSlovakEur(displayProfit)}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="badge text-emerald-400 bg-emerald-500/15 border-emerald-500/30">
                Маржа {displayMargin.toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400">
                чистая рентабельность
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: ACTIVE PROJECTS IN PROGRESS */}
      <div className="surface overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="relative flex w-2.5 h-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span>Текущие активные объекты в работе ({activeProjects.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeProjects.map(p => p.title.replace('Ремонт объекта ', '').replace('Реновация объекта ', '').replace('Капремонт квартиры ', '').replace('Комплексный ремонт ', '')).join(', ')}
            </p>

          </div>

          <button
            onClick={() => onNavigateTab?.('projects')}
            className="flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>Все объекты ({projects.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {activeProjectsFinancials.map(({ project, revenue, spent, profit, margin, hasMoney }) => {
            const client = clients.find(c => c.id === project.client_id);
            return (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="group p-5 hover:bg-slate-50/80 transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                    {project.title}
                  </h4>
                  <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200">
                    В работе
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{project.address}, {project.city}</span>
                  {client && (
                    <>
                      <span>&middot;</span>
                      <span className="font-semibold text-slate-600 flex items-center gap-1">
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
                  <div className="text-[11px] text-slate-500 font-medium">Получено оплат:</div>
                  <div className="text-sm font-bold text-slate-900 tnum">{formatSlovakEur(revenue)}</div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Расходы на объект:</div>
                  <div className="text-sm font-bold text-amber-700 tnum">{formatSlovakEur(spent)}</div>
                </div>

                <div className="min-w-[120px]">
                  <div className="text-[11px] text-slate-500 font-medium">Прибыль / Маржа:</div>
                  <div className={`text-sm font-black tnum ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {profit >= 0 ? '+' : ''}{formatSlovakEur(profit)} ({margin.toFixed(1)}%)
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand-600 group-hover:bg-brand-50 transition-colors">
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
        <div className="surface p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-500" />
                <span>Структура общих расходов фирмы ({formatSlovakEur(displayOverhead)})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Постоянные затраты, не привязанные к конкретным объектам клиентов
              </p>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            {overheadRows.length === 0 ? (
              <div className="text-xs text-slate-400 font-semibold py-6 text-center">
                Нет записей общих расходов
              </div>
            ) : (
              overheadRows.map((cat, idx) => {
                const pct = displayOverhead > 0 ? (cat.sum / displayOverhead) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600">{cat.name}</span>
                      <span className="text-slate-900 font-bold tnum">{formatSlovakEur(cat.sum)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Completed Projects Archive */}
        <div className="surface p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Завершенные и сданные объекты ({completedProjects.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sibirska, Lotysska, Ozvoldik, Viglasska, Nobelova, Mierova, Dinda...
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {completedProjects.slice(0, 10).map(prj => {
              const sheetRow = financeRowFor(prj.title);
              const prjInvs = invoices.filter(i => i.project_id === prj.id);
              const rev = sheetRow ? sheetRow.income : (prjInvs.reduce((s, i) => s + (i.paid_amount || i.total_amount || 0), 0) || prj.budget_estimated || 0);
              const prjExps = expenses.filter(e => e.project_id === prj.id);
              const exp = sheetRow ? sheetRow.total_expense : (prjExps.reduce((s, e) => s + (e.amount_without_vat || 0), 0) || prj.budget_actual_spent || 0);
              const prof = sheetRow ? sheetRow.balance : (rev - exp);

              return (
                <div
                  key={prj.id}
                  onClick={() => onSelectProject(prj.id)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-white hover:shadow-card cursor-pointer transition-all border border-slate-200/60"
                >
                  <div className="font-bold text-slate-800 truncate">{prj.address || prj.title}</div>
                  <div className={`text-[11px] font-bold mt-0.5 tnum ${prof >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Маржа: {prof >= 0 ? '+' : ''}{formatSlovakEur(prof)}
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
