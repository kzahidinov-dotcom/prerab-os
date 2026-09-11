'use client';

import React, { useMemo, useState } from 'react';
import { SupplierInvoice, SupplierInvoiceStatus, Project, ExpenseCategory, CompanySettings } from '@/types';
import { formatCurrency, formatDateDmY } from '@/lib/slovak-vat';
import { generatePaymentQrCode } from '@/lib/pay-by-square';
import {
  Inbox,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mail,
  Paperclip,
  QrCode,
  Undo2,
  Pencil,
  Receipt,
  RefreshCw,
  CalendarClock,
} from 'lucide-react';

interface SupplierInvoicesTabProps {
  supplierInvoices: SupplierInvoice[];
  projects: Project[];
  settings: CompanySettings;
  onSaveSupplierInvoice: (invoice: SupplierInvoice) => void;
  onDeleteSupplierInvoice: (invoiceId: string) => void;
  onMarkPaid: (invoiceId: string, payment: { paid_at: string; paid_amount: number; paid_by: string; payment_method: 'bank_transfer' | 'cash' | 'card' }) => void;
  onMarkUnpaid: (invoiceId: string) => void;
  onPushToExpenses: (invoiceId: string) => void;
  onOpenNewInvoice: () => void;
  onEditInvoice: (invoice: SupplierInvoice) => void;
  onRefresh: () => void;
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  materials: 'Стройматериалы',
  labor: 'Выплаты мастерам',
  subcontractor: 'Субподрядчики',
  tools_machinery: 'Техника / Инструмент',
  transport_fuel: 'Транспорт и топливо',
  waste_disposal: 'Вывоз мусора',
  overhead: 'Накладные расходы',
};

const todayIso = () => new Date().toISOString().split('T')[0];

// Сколько дней осталось до срока оплаты (отрицательное число = просрочено)
export function daysUntilDue(dueDate?: string): number {
  if (!dueDate) return 9999;
  const due = new Date(`${dueDate}T00:00:00`);
  if (isNaN(due.getTime())) return 9999;
  const now = new Date(`${todayIso()}T00:00:00`);
  return Math.round((due.getTime() - now.getTime()) / 86400000);
}

export const isOverdue = (inv: SupplierInvoice): boolean =>
  inv.payment_status !== 'paid' && daysUntilDue(inv.due_date) < 0;

type StatusFilter = 'all' | 'unpaid' | 'overdue' | 'paid';

export const SupplierInvoicesTab: React.FC<SupplierInvoicesTabProps> = ({
  supplierInvoices,
  projects,
  settings,
  onDeleteSupplierInvoice,
  onMarkPaid,
  onMarkUnpaid,
  onPushToExpenses,
  onOpenNewInvoice,
  onEditInvoice,
  onRefresh,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unpaid');
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [payModalInvoice, setPayModalInvoice] = useState<SupplierInvoice | null>(null);
  const [qrInvoice, setQrInvoice] = useState<SupplierInvoice | null>(null);
  const [qrImage, setQrImage] = useState<string>('');

  const [payForm, setPayForm] = useState({
    paid_at: todayIso(),
    paid_amount: 0,
    paid_by: 'Карта фирмы',
    payment_method: 'bank_transfer' as 'bank_transfer' | 'cash' | 'card',
  });

  const list = Array.isArray(supplierInvoices) ? supplierInvoices : [];

  const stats = useMemo(() => {
    const unpaid = list.filter(i => i.payment_status !== 'paid');
    const overdue = unpaid.filter(isOverdue);
    const thisMonth = todayIso().slice(0, 7);
    const paidThisMonth = list.filter(i => i.payment_status === 'paid' && (i.paid_at || '').startsWith(thisMonth));
    const dueSoon = unpaid
      .filter(i => !isOverdue(i))
      .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))[0];

    const sum = (arr: SupplierInvoice[]) => arr.reduce((acc, i) => acc + (Number(i.amount_with_vat) || 0) - (i.payment_status === 'partial' ? Number(i.paid_amount) || 0 : 0), 0);

    return {
      unpaidCount: unpaid.length,
      unpaidAmount: sum(unpaid),
      overdueCount: overdue.length,
      overdueAmount: sum(overdue),
      paidThisMonthCount: paidThisMonth.length,
      paidThisMonthAmount: paidThisMonth.reduce((acc, i) => acc + (Number(i.paid_amount) || Number(i.amount_with_vat) || 0), 0),
      nextDue: dueSoon,
    };
  }, [list]);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return list
      .filter(inv => {
        if (statusFilter === 'unpaid' && inv.payment_status === 'paid') return false;
        if (statusFilter === 'paid' && inv.payment_status !== 'paid') return false;
        if (statusFilter === 'overdue' && !isOverdue(inv)) return false;
        if (projectFilter === 'general' && inv.project_id) return false;
        if (projectFilter !== 'all' && projectFilter !== 'general' && inv.project_id !== projectFilter) return false;

        if (!term) return true;
        return (
          (inv.supplier_name || '').toLowerCase().includes(term) ||
          (inv.invoice_number || '').toLowerCase().includes(term) ||
          (inv.variable_symbol || '').toLowerCase().includes(term) ||
          (inv.email_subject || '').toLowerCase().includes(term) ||
          (inv.notes || '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        // Не уплаченные — сверху, внутри группы по сроку оплаты (самое горящее первым)
        const aPaid = a.payment_status === 'paid' ? 1 : 0;
        const bPaid = b.payment_status === 'paid' ? 1 : 0;
        if (aPaid !== bPaid) return aPaid - bPaid;
        if (aPaid === 1) return (b.paid_at || '').localeCompare(a.paid_at || '');
        return (a.due_date || '').localeCompare(b.due_date || '');
      });
  }, [list, statusFilter, searchTerm, projectFilter]);

  const openPayModal = (inv: SupplierInvoice) => {
    const remaining = (Number(inv.amount_with_vat) || 0) - (Number(inv.paid_amount) || 0);
    setPayForm({
      paid_at: todayIso(),
      paid_amount: Math.round((remaining > 0 ? remaining : Number(inv.amount_with_vat) || 0) * 100) / 100,
      paid_by: 'Карта фирмы',
      payment_method: 'bank_transfer',
    });
    setPayModalInvoice(inv);
  };

  const confirmPayment = () => {
    if (!payModalInvoice) return;
    const alreadyPaid = payModalInvoice.payment_status === 'partial' ? Number(payModalInvoice.paid_amount) || 0 : 0;
    onMarkPaid(payModalInvoice.id, {
      paid_at: payForm.paid_at || todayIso(),
      paid_amount: Math.round((alreadyPaid + (Number(payForm.paid_amount) || 0)) * 100) / 100,
      paid_by: payForm.paid_by,
      payment_method: payForm.payment_method,
    });
    setPayModalInvoice(null);
  };

  const openQr = async (inv: SupplierInvoice) => {
    setQrInvoice(inv);
    setQrImage('');
    const img = await generatePaymentQrCode({
      iban: inv.supplier_iban || '',
      amount: Math.max(0, (Number(inv.amount_with_vat) || 0) - (Number(inv.paid_amount) || 0)),
      variableSymbol: inv.variable_symbol || inv.invoice_number,
      constantSymbol: inv.constant_symbol || '0308',
      beneficiaryName: inv.supplier_name,
      note: `Faktúra ${inv.invoice_number}`,
    });
    setQrImage(img);
  };

  const statusBadge = (inv: SupplierInvoice) => {
    if (inv.payment_status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          Уплачено {inv.paid_at ? formatDateDmY(inv.paid_at) : ''}
        </span>
      );
    }
    if (inv.payment_status === 'partial') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
          <Clock className="w-3 h-3" />
          Частично {formatCurrency(Number(inv.paid_amount) || 0)}
        </span>
      );
    }
    if (isOverdue(inv)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
          <AlertTriangle className="w-3 h-3" />
          Просрочено {Math.abs(daysUntilDue(inv.due_date))} дн.
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
        <Clock className="w-3 h-3" />
        Не уплачено
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Верхние карточки статистики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase">К оплате всего</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(stats.unpaidAmount)}</div>
          <div className="text-xs text-slate-500 mt-0.5">{stats.unpaidCount} неоплаченных фактур</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm">
          <span className="text-[11px] font-bold text-rose-600 uppercase">Просрочено</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(stats.overdueAmount)}</div>
          <div className="text-xs text-slate-500 mt-0.5">{stats.overdueCount} фактур с истекшим сроком</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 uppercase">Уплачено в этом месяце</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(stats.paidThisMonthAmount)}</div>
          <div className="text-xs text-slate-500 mt-0.5">{stats.paidThisMonthCount} фактур закрыто</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-amber-600 uppercase">Ближайший срок оплаты</span>
          <div className="text-lg font-black text-slate-900 mt-1 truncate">
            {stats.nextDue ? formatDateDmY(stats.nextDue.due_date) : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">
            {stats.nextDue
              ? `${stats.nextDue.supplier_name} · ${formatCurrency(Number(stats.nextDue.amount_with_vat) || 0)}`
              : 'Все фактуры оплачены'}
          </div>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {([
              { key: 'unpaid' as StatusFilter, label: 'Не уплачено' },
              { key: 'overdue' as StatusFilter, label: 'Просрочено' },
              { key: 'paid' as StatusFilter, label: 'Уплачено' },
              { key: 'all' as StatusFilter, label: 'Все' },
            ]).map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === tab.key
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            <option value="all">Все объекты</option>
            <option value="general">Без объекта (общие)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск: поставщик, № фактуры, VS..."
              className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 w-52 sm:w-72"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all active:scale-95"
            title="Проверить почту и обновить список фактур из облака"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Обновить с почты</span>
          </button>

          <button
            onClick={onOpenNewInvoice}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-slate-950 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить фактуру</span>
          </button>
        </div>
      </div>

      {/* Таблица фактур */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Поставщик</th>
                <th className="p-3.5">№ фактуры / VS</th>
                <th className="p-3.5">Объект</th>
                <th className="p-3.5">Выставлена</th>
                <th className="p-3.5">Оплатить до</th>
                <th className="p-3.5 text-right">Сумма с DPH</th>
                <th className="p-3.5">Статус оплаты</th>
                <th className="p-3.5 text-center">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(inv => {
                const project = projects.find(p => p.id === inv.project_id);
                const days = daysUntilDue(inv.due_date);
                const overdue = isOverdue(inv);
                const dueSoon = inv.payment_status !== 'paid' && !overdue && days <= 3;

                return (
                  <tr key={inv.id} className={`hover:bg-slate-50/70 transition-colors ${overdue ? 'bg-rose-50/40' : ''}`}>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{inv.supplier_name}</span>
                        {inv.source === 'email' && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200"
                            title={`Принято автоматически с почты: ${inv.email_from || ''}`}
                          >
                            <Mail className="w-2.5 h-2.5" />
                            Почта
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px]">{CATEGORY_LABELS[inv.category] || 'Расход'}</div>
                      {inv.notes && (
                        <div className="text-amber-600 text-[10px] mt-0.5 line-clamp-1" title={inv.notes}>{inv.notes}</div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="font-mono font-bold text-slate-900">{inv.invoice_number}</div>
                      {inv.variable_symbol && (
                        <div className="text-slate-400 text-[11px] font-mono">VS: {inv.variable_symbol}</div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">{project?.title || 'Общий расход фирмы'}</div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap">{formatDateDmY(inv.issue_date)}</td>

                    <td className="p-3.5 whitespace-nowrap">
                      <div className={`font-mono font-bold ${overdue ? 'text-rose-600' : dueSoon ? 'text-amber-600' : 'text-slate-900'}`}>
                        {formatDateDmY(inv.due_date)}
                      </div>
                      {inv.payment_status !== 'paid' && (
                        <div className={`text-[11px] font-semibold ${overdue ? 'text-rose-600' : dueSoon ? 'text-amber-600' : 'text-slate-400'}`}>
                          {overdue
                            ? `просрочка ${Math.abs(days)} дн.`
                            : days === 0
                              ? 'платить сегодня'
                              : `осталось ${days} дн.`}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="font-black text-slate-900 text-sm">{formatCurrency(Number(inv.amount_with_vat) || 0)}</div>
                      <div className="text-slate-400 text-[11px]">
                        без DPH {formatCurrency(Number(inv.amount_without_vat) || 0)}
                      </div>
                    </td>

                    <td className="p-3.5">{statusBadge(inv)}</td>

                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1">
                        {inv.payment_status !== 'paid' ? (
                          <button
                            onClick={() => openPayModal(inv)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-[11px] font-bold transition-all active:scale-95"
                            title="Отметить фактуру уплаченной и записать дату оплаты"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Уплачено
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (confirm(`Снять отметку об оплате с фактуры ${inv.invoice_number}?`)) {
                                onMarkUnpaid(inv.id);
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold transition-all active:scale-95"
                            title="Вернуть в неоплаченные"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            Отменить
                          </button>
                        )}

                        <button
                          onClick={() => openQr(inv)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                          title="QR-код для оплаты в банковском приложении"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        {inv.attachment_url && (
                          <a
                            href={inv.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title={`Открыть вложение: ${inv.attachment_name || 'PDF фактуры'}`}
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => onPushToExpenses(inv.id)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          title="Провести фактуру в «Расходы и Чеки» (в себестоимость объекта)"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onEditInvoice(inv)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title="Редактировать фактуру"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Удалить фактуру ${inv.invoice_number} от ${inv.supplier_name}?`)) {
                              onDeleteSupplierInvoice(inv.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-slate-400">
                    <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <div className="font-semibold text-slate-500">Фактур по заданным условиям нет</div>
                    <div className="text-[11px] mt-1">
                      Фактуры приходят сюда автоматически с почты фирмы или заводятся кнопкой «Добавить фактуру».
                    </div>
                  </td>
                </tr>
              )}

              {filtered.length > 0 && (
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-slate-600">
                  <td colSpan={5} className="p-3.5">
                    Показано <span className="font-black text-slate-900">{filtered.length}</span> из{' '}
                    <span className="font-black text-slate-900">{list.length}</span> фактур
                  </td>
                  <td className="p-3.5 text-right font-black text-slate-900 text-sm">
                    {formatCurrency(filtered.reduce((sum, i) => sum + (Number(i.amount_with_vat) || 0), 0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Подсказка по автоприему с почты */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Mail className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900">Автоприем фактур с почты.</span>{' '}
          Скрипт Gmail (<span className="font-mono text-[11px]">scripts/gmail-invoice-sync.gs</span>) каждые 15 минут
          просматривает почту фирмы, находит письма с фактурами, сохраняет PDF на Google Drive и присылает их сюда.
          Система сама распознает поставщика, номер фактуры, VS, IBAN, сумму и срок оплаты. Дубли не создаются.
          Инструкция по подключению — в разделе «Настройки» и в README.
        </div>
      </div>

      {/* Модальное окно отметки об оплате */}
      {payModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Отметить фактуру уплаченной</h3>
              </div>
              <button onClick={() => setPayModalInvoice(null)} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">{payModalInvoice.supplier_name}</div>
                <div className="text-slate-500 font-mono text-[11px]">
                  Фактура {payModalInvoice.invoice_number}
                  {payModalInvoice.variable_symbol ? ` · VS ${payModalInvoice.variable_symbol}` : ''}
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-slate-500">К оплате:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {formatCurrency(Number(payModalInvoice.amount_with_vat) || 0)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                  <CalendarClock className="w-3 h-3" />
                  Срок оплаты: {formatDateDmY(payModalInvoice.due_date)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Когда уплачено*</label>
                  <input
                    type="date"
                    value={payForm.paid_at}
                    onChange={(e) => setPayForm({ ...payForm, paid_at: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Сумма платежа (€)</label>
                  <input
                    type="number"
                    step="any"
                    value={payForm.paid_amount}
                    onChange={(e) => setPayForm({ ...payForm, paid_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Чем уплачено</label>
                  <select
                    value={payForm.payment_method}
                    onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value as 'bank_transfer' | 'cash' | 'card' })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="bank_transfer">Банковский перевод</option>
                    <option value="card">Карта фирмы</option>
                    <option value="cash">Наличные из кассы</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Кто уплатил</label>
                  <input
                    type="text"
                    value={payForm.paid_by}
                    onChange={(e) => setPayForm({ ...payForm, paid_by: e.target.value })}
                    placeholder="Керим / Ваня / Бухгалтер"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                Если указать сумму меньше полной, фактура останется в статусе «Уплачено частично».
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setPayModalInvoice(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmPayment}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Подтвердить оплату
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR-код для оплаты фактуры поставщику */}
      {qrInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-sm">Оплата через банк (PAY by square)</h3>
              </div>
              <button onClick={() => setQrInvoice(null)} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>

            <div className="p-6 text-center text-xs">
              {qrInvoice.supplier_iban ? (
                <>
                  {qrImage ? (
                    <img src={qrImage} alt="QR оплаты" className="w-52 h-52 mx-auto rounded-lg border border-slate-200" />
                  ) : (
                    <div className="w-52 h-52 mx-auto rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                      Генерация QR...
                    </div>
                  )}
                  <div className="mt-3 font-bold text-slate-900 text-sm">{qrInvoice.supplier_name}</div>
                  <div className="font-mono text-[11px] text-slate-500 break-all">{qrInvoice.supplier_iban}</div>
                  <div className="mt-1 text-slate-600">
                    Сумма: <span className="font-black text-slate-900">{formatCurrency(Number(qrInvoice.amount_with_vat) || 0)}</span>
                    {qrInvoice.variable_symbol ? ` · VS ${qrInvoice.variable_symbol}` : ''}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Отсканируйте код в мобильном банке (SLSP, Tatra banka, VÚB, ČSOB, 365.bank).
                  </div>
                </>
              ) : (
                <div className="py-8 text-slate-500">
                  <AlertTriangle className="w-7 h-7 mx-auto mb-2 text-amber-500" />
                  У фактуры не указан IBAN поставщика.<br />
                  Добавьте его через «Редактировать фактуру» — и QR-код сформируется автоматически.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
