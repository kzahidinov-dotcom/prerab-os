'use client';

import React, { useState } from 'react';
import { Expense, Project, ExpenseCategory } from '@/types';
import { formatCurrency, calculateVat, SLOVAK_VAT_RATES } from '@/lib/slovak-vat';
import { 
  Receipt, 
  Plus, 
  Search, 
  Camera, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  Tag, 
  Image as ImageIcon,
  Building,
  DollarSign
} from 'lucide-react';

interface CostTrackingTabProps {
  expenses: Expense[];
  projects: Project[];
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onOpenNewExpense: (projectId?: string) => void;
}

const CATEGORY_MAP: Record<ExpenseCategory, { label: string; bg: string }> = {
  materials: { label: 'Стройматериалы', bg: 'bg-orange-100 text-orange-800' },
  labor: { label: 'Выплаты мастерам', bg: 'bg-blue-100 text-blue-800' },
  subcontractor: { label: 'Субподрядчики', bg: 'bg-purple-100 text-purple-800' },
  waste_disposal: { label: 'Вывоз мусора', bg: 'bg-slate-100 text-slate-800' },
  tools_machinery: { label: 'Аренда техники / Инструмент', bg: 'bg-emerald-100 text-emerald-800' },
  transport_fuel: { label: 'Транспорт и бензин', bg: 'bg-amber-100 text-amber-800' },
  overhead: { label: 'Накладные расходы', bg: 'bg-pink-100 text-pink-800' },
};

export const CostTrackingTab: React.FC<CostTrackingTabProps> = ({
  expenses,
  projects,
  onSaveExpense,
  onDeleteExpense,
  onOpenNewExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const filteredExpenses = expenses.filter(e => {
    const project = projects.find(p => p.id === e.project_id);
    const matchesSearch = 
      e.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.receipt_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project?.title || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProj = projectFilter === 'all' ? true : e.project_id === projectFilter;
    const matchesCat = categoryFilter === 'all' ? true : e.category === categoryFilter;

    return matchesSearch && matchesProj && matchesCat;
  });

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + (e.amount_with_vat || e.amount_without_vat || 0), 0);
  const totalProjectCosts = filteredExpenses.filter(e => e.project_id).reduce((sum, e) => sum + (e.amount_with_vat || e.amount_without_vat || 0), 0);
  const totalOverheadCosts = filteredExpenses.filter(e => !e.project_id).reduce((sum, e) => sum + (e.amount_with_vat || e.amount_without_vat || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Всего расходов по чекам</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(totalAmount)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Фактически потрачено по кассе / картам</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 uppercase">Прямые затраты на объекты</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(totalProjectCosts)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Стройматериалы, мусор, зарплаты мастеров</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-amber-600 uppercase">Накладные расходы фирмы</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {formatCurrency(totalOverheadCosts)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Склад, офис, дизель Vito, персонал</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            <option value="all">Все объекты ({projects.length})</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            <option value="all">Все категории</option>
            {Object.entries(CATEGORY_MAP).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по магазину, чеку..."
              className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 w-48 sm:w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenNewExpense()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Записать чек / расход</span>
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Дата</th>
                <th className="p-3.5">Объект</th>
                <th className="p-3.5">Категория</th>
                <th className="p-3.5">Поставщик / Описание</th>
                <th className="p-3.5">Оплачено</th>
                <th className="p-3.5 text-right">Сумма (€)</th>
                <th className="p-3.5 text-center">Чек / Фото</th>
                <th className="p-3.5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredExpenses.map((exp) => {
                const project = projects.find(p => p.id === exp.project_id);
                const catInfo = CATEGORY_MAP[exp.category] || CATEGORY_MAP.materials;

                return (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 text-slate-500 font-medium whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{project?.title || 'Общий расход'}</div>
                      <div className="text-slate-400 text-[11px]">{project?.city || '-'}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${catInfo.bg}`}>
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{exp.vendor}</div>
                      <div className="text-slate-500 text-[11px] line-clamp-1">{exp.description}</div>
                      {exp.receipt_number && (
                        <span className="text-[10px] text-slate-400 font-mono">Док: {exp.receipt_number}</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">
                      {exp.paid_by}
                    </td>
                    <td className="p-3.5 text-right font-black text-slate-900 text-sm">
                      {formatCurrency(exp.amount_with_vat || exp.amount_without_vat)}
                    </td>
                    <td className="p-3.5 text-center">
                      {exp.receipt_photo_url ? (
                        <button
                          onClick={() => setPreviewPhoto(exp.receipt_photo_url || null)}
                          className="p-1.5 text-brand-600 hover:bg-brand-50 rounded transition-colors"
                          title="Посмотреть фото чека"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-300 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Удалить расход "${exp.description}"?`)) {
                            onDeleteExpense(exp.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400">
                    Расходов по заданным критериям не найдено.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-4 max-w-lg w-full relative shadow-2xl">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700"
            >
              ✕
            </button>
            <h4 className="font-bold text-sm text-slate-900 mb-3">Фото чека / накладной</h4>
            <img src={previewPhoto} alt="Чек" className="w-full h-auto rounded-lg max-h-[70vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
