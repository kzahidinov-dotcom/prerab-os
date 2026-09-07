'use client';

import React, { useState } from 'react';
import { 
  Project, 
  Client, 
  BudgetEstimate, 
  Expense, 
  Invoice, 
  Worker, 
  WorkLog, 
  CompanySettings,
  ProjectStatus 
} from '@/types';
import { formatCurrency, formatPercent } from '@/lib/slovak-vat';
import { printInvoiceDocument, printQuoteDocument } from '@/lib/pdf-generator';
import { generatePaymentQrCode } from '@/lib/pay-by-square';
import { PROJECT_STATUS_MAP } from './ProjectsTab';
import { 
  Building, 
  X, 
  Calendar, 
  MapPin, 
  User, 
  Calculator, 
  Receipt, 
  FileText, 
  HardHat, 
  TrendingUp, 
  Plus, 
  Printer, 
  CheckCircle2, 
  AlertTriangle,
  QrCode,
  DollarSign,
  Clock,
  Sparkles,
  CalendarRange
} from 'lucide-react';
import { Task } from '@/types';
import { GanttChart } from '@/components/planner/GanttChart';
import { auth } from '@/lib/auth';

interface ProjectDetailModalProps {
  project: Project;
  client: Client | undefined;
  budgets: BudgetEstimate[];
  expenses: Expense[];
  invoices: Invoice[];
  workers: Worker[];
  workLogs: WorkLog[];
  tasks?: Task[];
  settings: CompanySettings;
  onClose: () => void;
  onUpdateProject: (updated: Project) => void;
  onUpdateClient?: (updated: Client) => void;
  onSaveTask?: (task: Task) => void;
  onSaveTasksBatch?: (tasks: Task[]) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleTaskStatus?: (taskId: string) => void;
  onOpenBudgetEstimator: (budget?: BudgetEstimate) => void;
  onOpenNewExpense: (projectId: string) => void;
  onOpenNewInvoice: (projectId: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  client,
  budgets,
  expenses,
  invoices,
  workers,
  workLogs,
  tasks,
  settings,
  onClose,
  onUpdateProject,
  onUpdateClient,
  onSaveTask,
  onSaveTasksBatch,
  onDeleteTask,
  onToggleTaskStatus,
  onOpenBudgetEstimator,
  onOpenNewExpense,
  onOpenNewInvoice,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'gantt' | 'budget' | 'expenses' | 'invoices' | 'workers'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(project.title);
  const [editStatus, setEditStatus] = useState<ProjectStatus>(project.status);
  const [editAddress, setEditAddress] = useState(project.address);
  const [editCity, setEditCity] = useState(project.city);
  const [editClientName, setEditClientName] = useState(client?.company_name || client?.name || '');
  const [editClientPhone, setEditClientPhone] = useState(client?.phone || '');
  const [editClientEmail, setEditClientEmail] = useState(client?.email || '');

  const handleSaveHeaderEdits = (e: React.FormEvent) => {
    e.preventDefault();
    const clientId = project.client_id || `cli-${project.id.replace('prj-', '')}`;

    onUpdateProject({
      ...project,
      client_id: clientId,
      status: editStatus,
      title: editTitle.trim() || project.title,
      address: editAddress.trim() || project.address,
      city: editCity.trim() || project.city,
    });

    if (onUpdateClient) {
      const clientObj: Client = client ? {
        ...client,
        id: client.id || clientId,
        name: editClientName.trim() || client.name,
        company_name: client.type === 'company' ? editClientName.trim() : (client.company_name || ''),
        phone: editClientPhone.trim(),
        email: editClientEmail.trim(),
        address: editAddress.trim() || client.address,
        city: editCity.trim() || client.city,
      } : {
        id: clientId,
        type: 'person',
        name: editClientName.trim() || 'Клиент',
        company_name: '',
        ico: '',
        dic: '',
        ic_dph: '',
        is_vat_payer: false,
        address: editAddress.trim() || project.address,
        city: editCity.trim() || project.city,
        zip: '811 01',
        phone: editClientPhone.trim(),
        email: editClientEmail.trim(),
        notes: '',
        created_at: new Date().toISOString(),
      };

      onUpdateClient(clientObj);
    }

    setIsEditModalOpen(false);
  };

  const projectBudgets = budgets.filter(b => b.project_id === project.id);
  const projectExpenses = expenses.filter(e => e.project_id === project.id);
  const projectInvoices = invoices.filter(i => i.project_id === project.id);
  const projectWorkLogs = workLogs.filter(w => w.project_id === project.id);
  const projectTasks = (tasks || []).filter(t => t.project_id === project.id);

  const totalSpent = projectExpenses.reduce((sum, e) => sum + e.amount_without_vat, 0);
  const totalInvoiced = projectInvoices.reduce((sum, i) => sum + i.subtotal, 0);
  const totalPaid = projectInvoices
    .filter(i => i.payment_status === 'paid')
    .reduce((sum, i) => sum + (i.paid_amount || 0), 0);

  const contractPrice = project.budget_estimated || 0;
  const currentNetProfit = contractPrice - totalSpent;
  const currentMarginPercent = contractPrice > 0 ? (currentNetProfit / contractPrice) * 100 : 0;

  const handleStatusChange = (newStatus: ProjectStatus) => {
    onUpdateProject({ ...project, status: newStatus });
  };

  const handlePrintInvoice = async (invoice: Invoice) => {
    let qrUrl = '';
    if (settings.iban) {
      qrUrl = await generatePaymentQrCode({
        iban: settings.iban,
        swift: settings.swift,
        amount: invoice.total_amount,
        variableSymbol: invoice.variable_symbol,
        beneficiaryName: settings.name,
      });
    }
    printInvoiceDocument(invoice, client, project, settings, qrUrl);
  };

  const handlePrintBudget = (budget: BudgetEstimate) => {
    printQuoteDocument(budget, client, project, settings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-tight">{project.title}</h2>
                <select
                  value={project.status}
                  onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                  className="text-xs bg-slate-800 text-brand-400 font-bold border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                >
                  {Object.entries(PROJECT_STATUS_MAP).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setEditTitle(project.title);
                    setEditAddress(project.address);
                    setEditCity(project.city);
                    setEditClientName(client?.company_name || client?.name || '');
                    setEditClientPhone(client?.phone || '');
                    setEditClientEmail(client?.email || '');
                    setIsEditModalOpen(true);
                  }}
                  className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-brand-400 hover:text-brand-300 text-[11px] font-bold border border-slate-700 transition-colors flex items-center gap-1"
                  title="Изменить название объекта или данные клиента"
                >
                  <span>✏️ Изменить</span>
                </button>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{project.address}, {project.city}</span>
                </span>
                <span>&middot;</span>
                <span className="flex items-center gap-1 font-semibold text-slate-300">
                  <User className="w-3.5 h-3.5 text-brand-400" />
                  <span>{client?.company_name || client?.name || 'Клиент'}</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors text-xl font-bold"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-slate-50 flex items-center gap-2 shrink-0 overflow-x-auto">
          {[
            { id: 'overview', label: 'Обзор и Маржа', icon: TrendingUp },
            { id: 'gantt', label: `План-график & Гант (${projectTasks.length})`, icon: CalendarRange },
            { id: 'budget', label: `Смета & Výkaz (${projectBudgets.length})`, icon: Calculator },
            { id: 'expenses', label: `Чеки и Затраты (${projectExpenses.length})`, icon: Receipt },
            { id: 'invoices', label: `Счета & DPH (${projectInvoices.length})`, icon: FileText },
            { id: 'workers', label: `Мастера и Часы (${projectWorkLogs.length})`, icon: HardHat },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all shrink-0 ${
                  isActive
                    ? 'border-brand-500 text-brand-600 bg-white shadow-sm'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
          {/* TAB 1: OVERVIEW */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial KPI Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Сумма контракта</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {formatCurrency(contractPrice)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">По утвержденной смете</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-amber-600 uppercase">Потрачено затрат</span>
                  <div className="text-xl font-extrabold text-amber-600 mt-1">
                    {formatCurrency(totalSpent)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">По чекам и выплатам</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase">Чистая маржа (€)</span>
                  <div className="text-xl font-extrabold text-emerald-600 mt-1">
                    {formatCurrency(currentNetProfit)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Прибыль компании</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-brand-600 uppercase">Рентабельность %</span>
                  <div className="text-xl font-extrabold text-brand-600 mt-1">
                    {formatPercent(currentMarginPercent)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Текущая маржинальность</div>
                </div>
              </div>

              {/* Invoicing Progress */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Движение оплат и счетов</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-slate-500">Выставлено счетов:</div>
                    <div className="text-base font-bold text-slate-800 mt-1">{formatCurrency(totalInvoiced)}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="text-emerald-700">Оплачено клиентом:</div>
                    <div className="text-base font-bold text-emerald-800 mt-1">{formatCurrency(totalPaid)}</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="text-amber-700">Остаток к получению:</div>
                    <div className="text-base font-bold text-amber-800 mt-1">{formatCurrency(contractPrice - totalPaid)}</div>
                  </div>
                </div>
              </div>

              {/* Project Notes & Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">График объекта</h4>
                  <div className="text-xs space-y-2 text-slate-600">
                    <div className="flex justify-between">
                      <span>Дата начала:</span>
                      <strong>{project.start_date || 'Не указана'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Плановая сдача:</span>
                      <strong className="text-brand-600">{project.deadline || 'Не указана'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Создан в системе:</span>
                      <span>{project.created_at.split('T')[0]}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Заметки и особенности</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {project.notes || 'Нет дополнительных заметок по объекту.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GANTT CHART (ПЛАН-ГРАФИК ОБЪЕКТА) */}
          {activeSubTab === 'gantt' && (
            <div className="space-y-4">
              <GanttChart
                tasks={tasks || []}
                projects={[project]}
                users={auth.getUsers()}
                currentUserId="usr-kerim"
                onSaveTask={onSaveTask || (() => {})}
                onSaveTasksBatch={onSaveTasksBatch}
                onDeleteTask={onDeleteTask || (() => {})}
                onToggleTaskStatus={onToggleTaskStatus || (() => {})}
                initialProjectId={project.id}
              />
            </div>
          )}

          {/* TAB 3: BUDGET (VÝKAZ VÝMER) */}
          {activeSubTab === 'budget' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Смета и Výkaz výmer</h3>
                  <p className="text-xs text-slate-500">Позиции работ, расценки для клиента и плановая маржа</p>
                </div>

                <button
                  onClick={() => onOpenBudgetEstimator(projectBudgets[0])}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{projectBudgets.length > 0 ? 'Редактировать смету' : 'Создать смету'}</span>
                </button>
              </div>

              {projectBudgets.length > 0 ? (
                projectBudgets.map((bgt) => (
                  <div key={bgt.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{bgt.title}</div>
                        <div className="text-[11px] text-slate-500">Позиций: {bgt.items.length} &middot; Создана: {bgt.created_at.split('T')[0]}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintBudget(bgt)}
                          className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Печать Cenová ponuka (PDF)</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Работа / Материал</th>
                            <th className="p-2.5">Помещение</th>
                            <th className="p-2.5 text-center">Объем</th>
                            <th className="p-2.5 text-right">Себестоимость (€)</th>
                            <th className="p-2.5 text-right">Цена клиенту (€)</th>
                            <th className="p-2.5 text-right">Прибыль (€)</th>
                            <th className="p-2.5 text-right">Маржа %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {bgt.items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/60">
                              <td className="p-2.5 font-medium text-slate-900">{item.name}</td>
                              <td className="p-2.5 text-slate-500">{item.room || 'Общее'}</td>
                              <td className="p-2.5 text-center font-bold">{item.quantity} {item.unit}</td>
                              <td className="p-2.5 text-right text-slate-500">{formatCurrency(item.total_cost)}</td>
                              <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(item.total_price_client)}</td>
                              <td className="p-2.5 text-right font-bold text-emerald-600">{formatCurrency(item.margin_amount)}</td>
                              <td className="p-2.5 text-right font-bold text-brand-600">{formatPercent(item.margin_percent)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div>
                        Себестоимость: <strong className="text-slate-700">{formatCurrency(bgt.total_cost)}</strong>
                      </div>
                      <div>
                        Плановая чистая маржа: <strong className="text-emerald-700">{formatCurrency(bgt.margin_amount)} ({formatPercent(bgt.margin_percent)})</strong>
                      </div>
                      <div className="text-sm font-extrabold text-slate-900">
                        Итого для клиента (с DPH {bgt.vat_rate}%): {formatCurrency(bgt.total_with_vat)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center">
                  <Calculator className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 mb-3">Для этого объекта еще не составлена смета.</p>
                  <button
                    onClick={() => onOpenBudgetEstimator()}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                  >
                    Составить Výkaz výmer
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXPENSES & RECEIPTS */}
          {activeSubTab === 'expenses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Чеки и Затраты объекта</h3>
                  <p className="text-xs text-slate-500">Все закупки стройматериалов, вывоз мусора и выплаты</p>
                </div>

                <button
                  onClick={() => onOpenNewExpense(project.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить чек / расход</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Дата</th>
                      <th className="p-3">Категория</th>
                      <th className="p-3">Поставщик / Описание</th>
                      <th className="p-3">Оплачено</th>
                      <th className="p-3 text-right">Сумма (€)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {projectExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/60">
                        <td className="p-3 text-slate-500 font-medium whitespace-nowrap">{exp.date}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{exp.vendor}</div>
                          <div className="text-slate-500 text-[11px]">{exp.description}</div>
                        </td>
                        <td className="p-3 text-slate-500">{exp.paid_by}</td>
                        <td className="p-3 text-right font-black text-slate-900 text-sm">
                          {formatCurrency(exp.amount_with_vat || exp.amount_without_vat)}
                        </td>
                      </tr>
                    ))}
                    {projectExpenses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-400">
                          Чеков по этому объекту пока нет.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {projectExpenses.length > 0 && (
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">
                      Итого прямых затрат по объекту ({projectExpenses.length} чеков):
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      {formatCurrency(totalSpent)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: INVOICES & TAXES */}
          {activeSubTab === 'invoices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Счета-фактуры и DPH</h3>
                  <p className="text-xs text-slate-500">Залоговые и итоговые счета со словацким PAY by square</p>
                </div>

                <button
                  onClick={() => onOpenNewInvoice(project.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Выставить новый счет</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Номер счета</th>
                      <th className="p-3">Тип</th>
                      <th className="p-3">Даты</th>
                      <th className="p-3">Статус оплаты</th>
                      <th className="p-3 text-right">Сумма с DPH</th>
                      <th className="p-3 text-center">Печать / QR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {projectInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-bold text-slate-900">{inv.invoice_number}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700">
                            {inv.type === 'proforma' ? 'Zálohová faktúra' : 'Faktúra'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          <div>Выставлен: {inv.issue_date}</div>
                          <div className="font-semibold text-slate-700">Срок: {inv.due_date}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            inv.payment_status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.payment_status === 'paid' ? 'Оплачен' : 'Ожидает оплаты'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-extrabold text-slate-900">
                          {formatCurrency(inv.total_amount)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handlePrintInvoice(inv)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold text-[11px]"
                            title="Печать официальной фактуры с QR-кодом"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>PDF / Tlač</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {projectInvoices.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400">
                          Счетов по этому объекту пока не выставлено.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: WORKERS & HOURS */}
          {activeSubTab === 'workers' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Мастера и отработанные часы</h3>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Дата</th>
                      <th className="p-3">Мастер</th>
                      <th className="p-3">Выполненная работа</th>
                      <th className="p-3 text-center">Часы / Объем</th>
                      <th className="p-3 text-right">Начислено (€)</th>
                      <th className="p-3 text-center">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {projectWorkLogs.map((wl) => {
                      const worker = workers.find(w => w.id === wl.worker_id);
                      return (
                        <tr key={wl.id} className="hover:bg-slate-50/60">
                          <td className="p-3 text-slate-500 font-medium">{wl.date}</td>
                          <td className="p-3 font-bold text-slate-900">{worker?.name || 'Мастер'}</td>
                          <td className="p-3 text-slate-600">{wl.work_description}</td>
                          <td className="p-3 text-center font-semibold">
                            {wl.unit_done ? `${wl.unit_done} ${wl.unit_type || 'm2'}` : `${wl.hours_worked} ч.`}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-600">
                            {formatCurrency(wl.total_earned)}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              wl.is_paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {wl.is_paid ? 'Выплачено' : 'К выплате'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {projectWorkLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400">
                          Записей о работах мастеров на этом объекте пока нет.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* INLINE EDIT MODAL: PROJECT & CLIENT DETAILS */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>✏️ Изменить объект и клиента</span>
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveHeaderEdits} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Название объекта:
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Статус объекта:</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {Object.entries(PROJECT_STATUS_MAP).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ФИО Заказчика / Название компании:
                  </label>
                  <input
                    type="text"
                    required
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    placeholder="Например: Ing. Peter Horváth"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Адрес объекта:</label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Город / Район:</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Телефон клиента:</label>
                    <input
                      type="text"
                      value={editClientPhone}
                      onChange={(e) => setEditClientPhone(e.target.value)}
                      placeholder="+421 905 123 456"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email клиента:</label>
                    <input
                      type="email"
                      value={editClientEmail}
                      onChange={(e) => setEditClientEmail(e.target.value)}
                      placeholder="klient@email.sk"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors text-xs"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-black rounded-xl shadow-md transition-all text-xs"
                  >
                    Сохранить изменения
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
