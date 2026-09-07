'use client';

import React, { useState } from 'react';
import { Invoice, InvoiceItem, Project, Client, CompanySettings, InvoiceType } from '@/types';
import { calculateVat, SLOVAK_VAT_RATES } from '@/lib/slovak-vat';
import { FileText, Plus, Trash2, X, DollarSign } from 'lucide-react';

interface NewInvoiceModalProps {
  projects: Project[];
  clients: Client[];
  settings: CompanySettings;
  initialProjectId?: string;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
}

export const NewInvoiceModal: React.FC<NewInvoiceModalProps> = ({
  projects,
  clients,
  settings,
  initialProjectId,
  onClose,
  onSave,
}) => {
  const selectedProject = projects.find(p => p.id === (initialProjectId || projects[0]?.id));
  
  const [projectId, setProjectId] = useState<string>(
    initialProjectId || (projects[0]?.id || '')
  );
  const [type, setType] = useState<InvoiceType>('invoice');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    `VF-2026/00${Math.floor(Math.random() * 90 + 10)}`
  );
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [variableSymbol, setVariableSymbol] = useState<string>(
    `2026${Math.floor(Math.random() * 900 + 100)}`
  );
  const [vatRate, setVatRate] = useState<number>(settings.default_vat_rate || 23);
  const [isReverseCharge, setIsReverseCharge] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('Ďakujeme za spoluprácu.');

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: `ii-1`,
      description: 'Stavebné a montážne práce podľa zmluvy o dielo',
      unit: 'kpl',
      quantity: 1,
      unit_price: selectedProject ? selectedProject.budget_estimated : 3000,
      total_without_vat: selectedProject ? selectedProject.budget_estimated : 3000,
      vat_rate: 23,
      vat_amount: 0,
      total_with_vat: 0,
    }
  ]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `ii-${Date.now()}`,
        description: 'Položka stavebných prác / materiál',
        unit: 'm2',
        quantity: 10,
        unit_price: 25,
        total_without_vat: 250,
        vat_rate: vatRate,
        vat_amount: 0,
        total_with_vat: 0,
      }
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const totalNet = qty * price;
    
    item.total_without_vat = Math.round(totalNet * 100) / 100;
    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Recalculate totals
  const subtotal = items.reduce((sum, i) => sum + i.total_without_vat, 0);
  const vatResult = calculateVat(subtotal, vatRate, isReverseCharge);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentProj = projects.find(p => p.id === projectId);
    if (!currentProj) {
      alert('Выберите проект');
      return;
    }

    const calculatedItems = items.map(item => {
      const itemVat = calculateVat(item.total_without_vat, vatRate, isReverseCharge);
      return {
        ...item,
        vat_rate: isReverseCharge ? 0 : vatRate,
        vat_amount: itemVat.vatAmount,
        total_with_vat: itemVat.totalAmount,
      };
    });

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoice_number: invoiceNumber,
      type,
      project_id: projectId,
      client_id: currentProj.client_id,
      issue_date: issueDate,
      delivery_date: deliveryDate,
      due_date: dueDate,
      variable_symbol: variableSymbol,
      constant_symbol: '0308',
      items: calculatedItems,
      subtotal: vatResult.baseAmount,
      vat_rate: vatResult.vatRate,
      vat_amount: vatResult.vatAmount,
      total_amount: vatResult.totalAmount,
      is_reverse_charge: isReverseCharge,
      payment_status: 'unpaid',
      paid_amount: 0,
      payment_method: 'bank_transfer',
      notes,
    };

    onSave(newInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm">Выставить счет (Faktúra / Záloha)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden text-xs">
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {/* Top Row: Project, Type, Number */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Объект / Проект*</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Тип документа</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as InvoiceType)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  <option value="invoice">Vyúčtovacia faktúra (Итоговая)</option>
                  <option value="proforma">Zálohová faktúra (Авансовая)</option>
                  <option value="credit_note">Dobropis (Корректировка)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Номер счета</label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold font-mono"
                />
              </div>
            </div>

            {/* Dates & Var Symbol */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Дата выставления</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Дата поставки (Dodanie)</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Срок оплаты (Splatnosť)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold text-rose-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Variabilný symbol</label>
                <input
                  type="text"
                  value={variableSymbol}
                  onChange={(e) => setVariableSymbol(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            {/* VAT & Reverse Charge */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700">Ставка DPH:</span>
                <select
                  value={vatRate}
                  disabled={isReverseCharge}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                >
                  {SLOVAK_VAT_RATES.map(v => (
                    <option key={v.rate} value={v.rate}>{v.label}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isReverseCharge}
                  onChange={(e) => setIsReverseCharge(e.target.checked)}
                  className="rounded text-brand-500 focus:ring-brand-500"
                />
                <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                  § 69 Prenesenie daňovej povinnosti (Stavebné práce)
                </span>
              </label>
            </div>

            {/* Invoice Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">Позиции счета</span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Добавить строку</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Описание работы / услуги</th>
                      <th className="p-2.5 w-20 text-center">Кол-во</th>
                      <th className="p-2.5 w-16 text-center">Ед.</th>
                      <th className="p-2.5 w-28 text-right">Цена без DPH</th>
                      <th className="p-2.5 w-28 text-right">Всего (€)</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-16 px-1.5 py-1 text-center border border-slate-200 rounded font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                            className="w-12 px-1 py-1 text-center border border-slate-200 rounded"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="any"
                            value={item.unit_price}
                            onChange={(e) => handleUpdateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-24 px-1.5 py-1 text-right border border-slate-200 rounded font-bold"
                          />
                        </td>
                        <td className="p-2 text-right font-extrabold text-slate-900">
                          {item.total_without_vat.toFixed(2)} €
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Примечание на счете</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Bottom Totals & Submit */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-slate-500">Без DPH:</span>
                <span className="font-bold text-slate-800 ml-1">{vatResult.baseAmount.toFixed(2)} €</span>
              </div>
              {!isReverseCharge && (
                <div>
                  <span className="text-slate-500">DPH ({vatResult.vatRate}%):</span>
                  <span className="font-bold text-slate-800 ml-1">{vatResult.vatAmount.toFixed(2)} €</span>
                </div>
              )}
              <div className="text-sm">
                <span className="font-extrabold text-slate-900">К оплате:</span>
                <span className="text-base font-black text-brand-600 ml-1.5">{vatResult.totalAmount.toFixed(2)} €</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
              >
                Сформировать счет
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
