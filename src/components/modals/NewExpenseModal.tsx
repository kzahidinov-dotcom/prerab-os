'use client';

import React, { useState } from 'react';
import { Expense, Project, ExpenseCategory } from '@/types';
import { calculateVat, SLOVAK_VAT_RATES } from '@/lib/slovak-vat';
import { Receipt, Camera, Upload, X, CheckCircle2 } from 'lucide-react';

interface NewExpenseModalProps {
  projects: Project[];
  initialProjectId?: string;
  onClose: () => void;
  onSave: (expense: Expense) => void;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  projects,
  initialProjectId,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    project_id: initialProjectId || (projects[0]?.id || ''),
    category: 'materials' as ExpenseCategory,
    vendor: 'Hornbach Bratislava',
    description: '',
    amount_without_vat: 100,
    vat_rate: 23,
    receipt_number: '',
    paid_by: 'Карта фирмы',
    receipt_photo_url: '',
  });

  const vatCalc = calculateVat(Number(formData.amount_without_vat) || 0, formData.vat_rate);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, receipt_photo_url: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.vendor) {
      alert('Укажите объект и поставщика');
      return;
    }

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      project_id: formData.project_id,
      category: formData.category,
      vendor: formData.vendor,
      description: formData.description || formData.vendor,
      amount_without_vat: vatCalc.baseAmount,
      vat_rate: vatCalc.vatRate,
      vat_amount: vatCalc.vatAmount,
      amount_with_vat: vatCalc.totalAmount,
      receipt_number: formData.receipt_number,
      receipt_photo_url: formData.receipt_photo_url,
      date: new Date().toISOString().split('T')[0],
      paid_by: formData.paid_by,
      status: 'approved',
    };

    onSave(newExpense);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm">Записать чек / Расход со стройки</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Объект / Проект*</label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Категория расхода</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="materials">Стройматериалы</option>
                <option value="labor">Выплаты мастерам</option>
                <option value="subcontractor">Субподрядчики</option>
                <option value="waste_disposal">Вывоз мусора</option>
                <option value="tools_machinery">Аренда техники / Инструмент</option>
                <option value="transport_fuel">Транспорт и бензин</option>
                <option value="overhead">Накладные расходы</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Поставщик / Магазин*</label>
              <input
                type="text"
                required
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="Hornbach, OBI, Woodcote..."
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Что куплено / Описание</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Клей для плитки, кабель CYKY, штукатурка..."
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Сумма без НДС (€)*</label>
              <input
                type="number"
                step="any"
                required
                value={formData.amount_without_vat}
                onChange={(e) => setFormData({ ...formData, amount_without_vat: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ставка DPH</label>
              <select
                value={formData.vat_rate}
                onChange={(e) => setFormData({ ...formData, vat_rate: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {SLOVAK_VAT_RATES.map(v => (
                  <option key={v.rate} value={v.rate}>{v.rate}%</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Итого с DPH (€)</label>
              <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg font-black text-slate-900">
                {vatCalc.totalAmount.toFixed(2)} €
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Номер чека / документа</label>
              <input
                type="text"
                value={formData.receipt_number}
                onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                placeholder="HB-998821"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Кто / чем оплатил</label>
              <select
                value={formData.paid_by}
                onChange={(e) => setFormData({ ...formData, paid_by: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Карта фирмы">Карта фирмы</option>
                <option value="Банковский перевод">Банковский перевод</option>
                <option value="Наличные из кассы">Наличные из кассы</option>
                <option value="Оплатил мастер">Оплатил мастер (под аванс)</option>
              </select>
            </div>
          </div>

          {/* Photo attachment */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Фото чека / накладной</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer border border-slate-200 font-semibold transition-colors">
                <Camera className="w-4 h-4 text-brand-500" />
                <span>{formData.receipt_photo_url ? 'Заменить фото' : 'Сфотографировать / Загрузить'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {formData.receipt_photo_url && (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Фото прикреплено
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-sm"
            >
              Записать расход
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
