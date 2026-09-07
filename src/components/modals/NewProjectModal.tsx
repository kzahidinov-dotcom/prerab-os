'use client';

import React, { useState } from 'react';
import { Project, Client, ProjectStatus } from '@/types';
import { PROJECT_STATUS_MAP } from '../projects/ProjectsTab';
import { Building, Calendar, MapPin, DollarSign, X } from 'lucide-react';

interface NewProjectModalProps {
  clients: Client[];
  initialClientId?: string;
  onClose: () => void;
  onSave: (project: Project) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  clients,
  initialClientId,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    client_id: initialClientId || (clients[0]?.id || ''),
    status: 'in_progress' as ProjectStatus,
    address: '',
    city: 'Bratislava',
    start_date: new Date().toISOString().split('T')[0],
    deadline: '',
    budget_estimated: 12000,
    budget_cost_estimated: 7500,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.client_id) {
      alert('Заполните название объекта и выберите заказчика');
      return;
    }

    const newProject: Project = {
      id: `prj-${Date.now()}`,
      title: formData.title,
      client_id: formData.client_id,
      status: formData.status,
      address: formData.address || 'Адрес объекта',
      city: formData.city || 'Bratislava',
      start_date: formData.start_date,
      deadline: formData.deadline,
      budget_estimated: Number(formData.budget_estimated) || 0,
      budget_cost_estimated: Number(formData.budget_cost_estimated) || (Number(formData.budget_estimated) * 0.65),
      budget_actual_spent: 0,
      invoiced_total: 0,
      paid_total: 0,
      notes: formData.notes,
      created_at: new Date().toISOString(),
    };

    onSave(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-sm">Создать новый объект / Проект</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Название объекта / Проекта*</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Например: Ремонт 3к квартиры, Ružinov"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Заказчик / Клиент*</label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Начальный статус</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                {Object.entries(PROJECT_STATUS_MAP).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Улица и номер дома</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Tomášikova 28"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Город</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Bratislava"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Дата начала</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Срок сдачи объекта</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ориентировочная сумма договора (€)</label>
              <input
                type="number"
                step="any"
                value={formData.budget_estimated}
                onChange={(e) => setFormData({ ...formData, budget_estimated: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-extrabold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Лимит себестоимости (€)</label>
              <input
                type="number"
                step="any"
                value={formData.budget_cost_estimated}
                onChange={(e) => setFormData({ ...formData, budget_cost_estimated: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Заметки и особенности</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ключи у консьержа, парковка во дворе..."
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
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
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg shadow-sm"
            >
              Создать объект
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
