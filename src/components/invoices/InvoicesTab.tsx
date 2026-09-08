'use client';

import React, { useState } from 'react';
import { Invoice, Project, Client, CompanySettings, InvoiceType } from '@/types';
import { formatCurrency, SLOVAK_VAT_RATES, calculateVat, formatDateDmY } from '@/lib/slovak-vat';
import { printInvoiceDocument } from '@/lib/pdf-generator';
import { generatePaymentQrCode } from '@/lib/pay-by-square';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  QrCode, 
  Trash2, 
  DollarSign, 
  Building,
  CreditCard,
  Percent
} from 'lucide-react';

interface InvoicesTabProps {
  invoices: Invoice[];
  projects: Project[];
  clients: Client[];
  settings: CompanySettings;
  onSaveInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onOpenNewInvoice: (projectId?: string) => void;
}

export const InvoicesTab: React.FC<InvoicesTabProps> = ({
  invoices,
  projects,
  clients,
  settings,
  onSaveInvoice,
  onDeleteInvoice,
  onOpenNewInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [qrModalInvoice, setQrModalInvoice] = useState<Invoice | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const filteredInvoices = invoices
    .filter(inv => {
      const client = clients.find(c => c.id === inv.client_id);
      const project = projects.find(p => p.id === inv.project_id);

      const matchesSearch = 
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.variable_symbol.includes(searchTerm) ||
        (client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project?.title || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' ? true : inv.type === typeFilter;
      const matchesStatus = statusFilter === 'all' ? true : inv.payment_status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      const tA = new Date(a.issue_date).getTime() || 0;
      const tB = new Date(b.issue_date).getTime() || 0;
      if (tA !== tB) return tB - tA;
      return (b.invoice_number || '').localeCompare(a.invoice_number || '');
    });

  const totalInvoiced = filteredInvoices.reduce((sum, i) => sum + i.total_amount, 0);
  const totalPaid = filteredInvoices
    .filter(i => i.payment_status === 'paid')
    .reduce((sum, i) => sum + (i.paid_amount || 0), 0);
  const totalPending = totalInvoiced - totalPaid;

  const handlePrint = async (inv: Invoice) => {
    const client = clients.find(c => c.id === inv.client_id);
    const project = projects.find(p => p.id === inv.project_id);

    let qrUrl = '';
    if (settings.iban) {
      qrUrl = await generatePaymentQrCode({
        iban: settings.iban,
        swift: settings.swift,
        amount: inv.total_amount,
        variableSymbol: inv.variable_symbol,
        beneficiaryName: settings.name,
      });
    }

    printInvoiceDocument(inv, client, project, settings, qrUrl);
  };

  const handleShowQr = async (inv: Invoice) => {
    setQrModalInvoice(inv);
    if (settings.iban) {
      const qrUrl = await generatePaymentQrCode({
        iban: settings.iban,
        swift: settings.swift,
        amount: inv.total_amount,
        variableSymbol: inv.variable_symbol,
        beneficiaryName: settings.name,
      });
      setQrDataUrl(qrUrl);
    }
  };

  const handleTogglePaid = (inv: Invoice) => {
    const isNowPaid = inv.payment_status !== 'paid';
    const updated: Invoice = {
      ...inv,
      payment_status: isNowPaid ? 'paid' : 'unpaid',
      paid_amount: isNowPaid ? inv.total_amount : 0,
    };
    onSaveInvoice(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Всего выставлено счетов</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(totalInvoiced)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Включая залоговые и итоговые</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 uppercase">Оплачено клиентами</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Поступило на расчетный счет</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-rose-600 uppercase">Ожидает оплаты (Дебиторка)</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {formatCurrency(totalPending)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Неоплаченные счета</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            <option value="all">Все статусы ({invoices.length})</option>
            <option value="unpaid">Ожидают оплаты</option>
            <option value="paid">Оплачены</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            <option value="all">Все типы документов</option>
            <option value="invoice">Vyúčtovacia faktúra (Острая)</option>
            <option value="proforma">Zálohová faktúra (Аванс)</option>
            <option value="credit_note">Dobropis (Корректировка)</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по номеру, VS, клиенту..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            onClick={() => onOpenNewInvoice()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Выставить счет</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Номер счета</th>
                <th className="p-3.5">Тип</th>
                <th className="p-3.5">Клиент / Объект</th>
                <th className="p-3.5">Даты (Выставлен / Срок)</th>
                <th className="p-3.5">Var. symbol</th>
                <th className="p-3.5 text-right">Сумма без DPH</th>
                <th className="p-3.5 text-right">Итого с DPH</th>
                <th className="p-3.5 text-center">Оплата</th>
                <th className="p-3.5 text-center">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInvoices.map((inv) => {
                const client = clients.find(c => c.id === inv.client_id);
                const project = projects.find(p => p.id === inv.project_id);
                const isPaid = inv.payment_status === 'paid';

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-extrabold text-slate-900">
                      {inv.invoice_number}
                      {inv.is_reverse_charge && (
                        <div className="text-[10px] text-amber-600 font-bold">§ 69 Prenesenie dane</div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        inv.type === 'proforma'
                          ? 'bg-purple-100 text-purple-800'
                          : inv.type === 'credit_note'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {inv.type === 'proforma' ? 'Zálohová' : inv.type === 'credit_note' ? 'Dobropis' : 'Faktúra'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{client?.company_name || client?.name || 'Клиент'}</div>
                      <div className="text-slate-500 text-[11px] line-clamp-1">{project?.title || '-'}</div>
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-500 font-mono">
                      <div>Выставлен: <span className="font-bold text-slate-800">{formatDateDmY(inv.issue_date)}</span></div>
                      <div className={`font-semibold ${isPaid ? 'text-slate-600' : 'text-rose-600 font-bold'}`}>
                        Срок: {formatDateDmY(inv.due_date)}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 font-bold">
                      {inv.variable_symbol}
                    </td>
                    <td className="p-3.5 text-right font-medium text-slate-600">
                      {formatCurrency(inv.subtotal)}
                    </td>
                    <td className="p-3.5 text-right font-black text-slate-900 text-sm">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleTogglePaid(inv)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        title="Нажмите, чтобы изменить статус оплаты"
                      >
                        {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        <span>{isPaid ? 'Оплачен' : 'Ожидает'}</span>
                      </button>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleShowQr(inv)}
                          className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Показать PAY by square QR-код"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(inv)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Печать официальной словацкой фактуры (PDF)"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Удалить счет ${inv.invoice_number}?`)) {
                              onDeleteInvoice(inv.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    Счетов не найдено.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal (PAY by square) */}
      {qrModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center relative shadow-2xl space-y-4">
            <button
              onClick={() => setQrModalInvoice(null)}
              className="absolute top-3 right-3 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 text-sm font-bold"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold text-brand-600 tracking-wider">
                Slovenský štandard
              </span>
              <h3 className="font-extrabold text-base text-slate-900">PAY by square</h3>
              <p className="text-xs text-slate-500">Счет {qrModalInvoice.invoice_number}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block shadow-inner">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="PAY by square" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                  Генерация QR...
                </div>
              )}
            </div>

            <div className="text-xs text-slate-700 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-left">
              <div><strong>Сумма:</strong> {formatCurrency(qrModalInvoice.total_amount)}</div>
              <div><strong>Variabilný symbol:</strong> {qrModalInvoice.variable_symbol}</div>
              <div><strong>IBAN:</strong> {settings.iban}</div>
            </div>

            <p className="text-[11px] text-slate-400">
              Клиент может отсканировать этот QR-код в мобильном приложении любого словацкого банка (SLSP, Tatra banka, VÚB, ČSOB, 365.bank).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
