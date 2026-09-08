'use client';

import React, { useState } from 'react';
import { Project, Client, Expense } from '@/types';
import { 
  Plus, 
  FolderKanban, 
  Search, 
  Calendar, 
  MapPin, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  ExternalLink,
  DollarSign,
  Layers,
  ChevronRight,
  User
} from 'lucide-react';
import { formatSlovakEur } from '@/lib/slovak-vat';
import { GOOGLE_DRIVE_ROOT_URL } from '@/lib/google-sheets-sync';

export const PROJECT_STATUS_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: 'Черновик', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  quote_sent: { label: 'Смета отправлена (CP)', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  in_progress: { label: 'В работе', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  paused: { label: 'Приостановлен', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  completed: { label: 'Сдан / Завершен', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  cancelled: { label: 'Отменен', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
};

interface ProjectsTabProps {
  projects: Project[];
  clients: Client[];
  expenses?: Expense[];
  onOpenNewProject: () => void;
  onSelectProject: (projectId: string) => void;
  onSaveProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  projects,
  clients,
  expenses,
  onOpenNewProject,
  onSelectProject,
  onSaveProject,
  onDeleteProject,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'completed'>('in_progress');
  const [search, setSearch] = useState('');

  const filteredProjects = projects.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const client = clients.find(c => c.id === p.client_id);
      return (
        p.title.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        (client?.name.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const inProgressCount = projects.filter(p => p.status === 'in_progress').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Объекты и Проекты</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Всего: {projects.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Управление объектами реноваций в Братиславе, отслеживание бюджетов, расходов и оплат
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={GOOGLE_DRIVE_ROOT_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            <span>📁 Папка Google Диск со сметами</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Новый объект</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === 'in_progress'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300" />
            <span>В работе ({inProgressCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === 'completed'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Завершенные ({completedCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Все ({projects.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию, адресу..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((project) => {
          const client = clients.find(c => c.id === project.client_id);
          const revenue = project.paid_total || project.invoiced_total || project.budget_estimated || 0;
          const spent = project.budget_actual_spent || 0;
          const profit = revenue - spent;
          const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;

          return (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="surface-interactive p-5 hover:border-brand-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      project.status === 'in_progress'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {project.status === 'in_progress' ? 'В работе' : 'Завершен'}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-2 group-hover:text-brand-600 transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Address, City & Client */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{project.address}, {project.city}</span>
                  </span>
                  {client && (
                    <>
                      <span>&middot;</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <User className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        <span className="truncate">{client.company_name || client.name}</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Financial Summary Box */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Получено оплат:</span>
                    <span className="font-bold text-slate-900">{formatSlovakEur(revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Расходы на объект:</span>
                    <span className="font-bold text-amber-600">{formatSlovakEur(spent)}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-xs font-black">
                    <span className="text-slate-700">Маржа объекта:</span>
                    <span className={profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {formatSlovakEur(profit)} ({marginPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px]">
                  {project.deadline ? `Срок: ${project.deadline}` : 'Активный объект'}
                </span>

                <span className="text-[11px] font-bold text-brand-600 group-hover:underline inline-flex items-center gap-1">
                  <span>Открыть карточку</span>
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
