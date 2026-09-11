'use client';

import React, { useState } from 'react';
import { SupplierInvoice, Project, ExpenseCategory } from '@/types';
import { calculateVat, SLOVAK_VAT_RATES, formatCurrency } from '@/lib/slovak-vat';
import { FileInput, X } from 'lucide-react';

interface SupplierInvoiceModalProps {
  invoice?: SupplierInvoice;         // Если передана — режим редактирования
  projects: Project[];
  onClose: () => void;
  onSave: (invoice: SupplierInvoice) => void;
}

const todayIso = () => new Date().toISOString().split('T')[0];

const addDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return todayIso();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const SupplierInvoiceModal: React.FC<SupplierInvoiceModalProps> = ({
  invoice,
  projects,
  onClose,
  onSave,
}) => {
  const isEdit = !!invoice;

  const [form, setForm] = useState({
    supplier_name: invoice?.supplier_name || '',
    supplier_ico: invoice?.supplier_ico || '',
    supplier_iban: invoice?.supplier_iban || '',
    invoice_number: invoice?.invoice_number || '',
    variable_symbol: invoice?.variable_symbol || '',
    issue_date: invoice?.issue_date || todayIso(),
    due_date: invoice?.due_date || addDays(todayIso(), 14),
    amount_without_vat: invoice?.amount_without_vat ?? 0,
    vat_rate: invoice?.vat_rate ?? 23,
    project_id: invoice?.project_id || '',
    category: (invoice?.category || 'materials') as ExpenseCategory,
    attachment_url: invoice?.attachment_url || '',
    attachment_name: invoice?.attachment_name || '',
    notes: invoice?.notes || '',
  });

  const vatCalc = calculateVat(Number(form.amount_without_vat) || 0, Number(form.vat_rate) || 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(prev => ({
        ...prev,
        attachment_url: event.target?.result as string,
        attachment_name: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier_name.trim() || !form.invoice_number.trim()) {
      alert('Укажите поставщика и номер фактуры');
      return;
    }

    const now = new Date().toISOString();
    const saved: SupplierInvoice = {
      id: invoice?.id || `sinv-${Date.now()}`,
      supplier_name: form.supplier_name.trim(),
      supplier_ico: form.supplier_ico.trim() || undefined,
      supplier_iban: form.supplier_iban.replace(/\s+/g, '').toUpperCase() || undefined,
      invoice_number: form.invoice_number.trim(),
      variable_symbol: form.variable_symbol.trim() || undefined,
      constant_symbol: invoice?.constant_symbol || '0308',
      issue_date: form.issue_date,
      due_date: form.due_date,
      amount_without_vat: vatCalc.baseAmount,
      vat_rate: vatCalc.vatRate,
      vat_amount: vatCalc.vatAmount,
      amount_with_vat: vatCalc.totalAmount,
      currency: invoice?.currency || 'EUR',
      project_id: form.project_id,
      category: form.category,
      payment_status: invoice?.payment_status || 'unpaid',
      paid_amount: invoice?.paid_amount || 0,
      paid_at: invoice?.paid_at,
      paid_by: invoice?.paid_by,
      payment_method: invoice?.payment_method,
      source: invoice?.source || 'manual',
      email_from: invoice?.email_from,
      email_subject: invoice?.email_subject,
      email_message_id: invoice?.email_message_id,
      email_received_at: invoice?.email_received_at,
      attachment_name: form.attachment_name || undefined,
      attachment_url: form.attachment_url || undefined,
      expense_id: invoice?.expense_id,
      notes: form.notes.trim() || undefined,
      created_at: invoice?.created_at || now,
      updated_at: now,
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileInput className="w-5 h-5 text-brand-400" />
            <h3 className="font-bold text-sm">
              {isEdit ? 'Редактировать фактуру на уплату' : 'Новая фактура на уплату (от поставщика)'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Поставщик / Магазин*</label>
              <input
                type="text"
                required
                value={form.supplier_name}
                onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                placeholder="Hornbach, OBI, SIKO, Stavmat..."
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">IČO поставщика</label>
              <input
                type="text"
                value={form.supplier_ico}
                onChange={(e) => setForm({ ...form, supplier_ico: e.target.value })}
                placeholder="12345678"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Номер фактуры*</label>
              <input
                type="text"
                required
                value={form.invoice_number}
                onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                placeholder="2026001234"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Variabilný symbol</label>
              <input
                type="text"
                value={form.variable_symbol}
                onChange={(e) => setForm({ ...form, variable_symbol: e.target.value })}
                placeholder="2026001234"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">IBAN для оплаты</label>
              <input
                type="text"
                value={form.supplier_iban}
                onChange={(e) => setForm({ ...form, supplier_iban: e.target.value })}
                placeholder="SK89 0200 0000 0000 0000 0000"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Дата выставления</label>
              <input
                type="date"
                value={form.issue_date}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value, due_date: addDays(e.target.value, 14) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Оплатить до (Splatnosť)*</label>
              <input
                type="date"
                required
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Сумма без DPH (€)*</label>
              <input
                type="number"
                step="any"
                required
                value={form.amount_without_vat}
                onChange={(e) => setForm({ ...form, amount_without_vat: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ставка DPH</label>
              <select
                value={form.vat_rate}
                onChange={(e) => setForm({ ...form, vat_rate: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {SLOVAK_VAT_RATES.map(v => (
                  <option key={v.rate} value={v.rate}>{v.rate}%</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Итого к уплате</label>
              <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg font-black text-slate-900">
                {formatCurrency(vatCalc.totalAmount)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Объект / Проект</label>
              <select
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Общий расход фирмы (без объекта)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Категория расхода</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="materials">Стройматериалы</option>
                <option value="labor">Выплаты мастерам</option>
                <option value="subcontractor">Субподрядчики</option>
                <option value="waste_disposal">Вывоз мусора</option>
                <option value="tools_machinery">Аренда техники / Инструмент</option>
                <option value="transport_fuel">Транспорт и топливо</option>
                <option value="overhead">Накладные расходы</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">PDF фактуры / фото документа</label>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={handleFileUpload}
              className="w-full text-[11px] text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold hover:file:bg-slate-200"
            />
            {form.attachment_name && (
              <div className="mt-1 text-[11px] text-emerald-600 font-semibold">Прикреплено: {form.attachment_name}</div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Заметка</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Плитка на объект Jaslovská, согласовано с Керимом"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-slate-950 rounded-lg text-xs font-bold shadow-sm active:scale-95"
            >
              {isEdit ? 'Сохранить изменения' : 'Добавить фактуру'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
