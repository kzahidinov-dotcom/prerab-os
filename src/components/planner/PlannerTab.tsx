'use client';

import React, { useState } from 'react';
import { Task, TaskPriority, TaskCategory, TaskStatus, Project, UserProfile } from '@/types';
import { formatCurrency } from '@/lib/slovak-vat';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Kanban, 
  Calendar as CalendarIcon, 
  Clock, 
  Flame, 
  User, 
  Building, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Check, 
  MoreVertical, 
  Layers, 
  AlertTriangle,
  Sparkles,
  DollarSign,
  CalendarRange,
  GitBranch
} from 'lucide-react';
import { TaskModal } from './TaskModal';
import { GanttChart } from './GanttChart';

interface PlannerTabProps {
  tasks: Task[];
  projects: Project[];
  users: UserProfile[];
  currentUserId?: string;
  onSaveTask: (task: Task) => void;
  onSaveTasksBatch?: (tasks: Task[]) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskStatus: (taskId: string) => void;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; text: string; bg: string; border: string; icon: string }> = {
  critical: { label: 'Срочно (Горит)', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: '🔥' },
  high: { label: 'Высокий', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: '⚡' },
  medium: { label: 'Обычный', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: '🔹' },
  low: { label: 'Низкий', text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: '☕' },
};

const CATEGORY_CONFIG: Record<TaskCategory, { label: string; bg: string }> = {
  finance: { label: '💶 Финансы / Сметы', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  construction: { label: '🏗️ Стройка / Контроль', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  supply: { label: '🚚 Снабжение', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
  docs: { label: '📋 Договоры / Акты', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
  urgent: { label: '🔥 Срочный выезд', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
  general: { label: '📌 Общие дела', bg: 'bg-slate-100 text-slate-800 border-slate-200' },
};

const COLUMNS: { id: TaskStatus; title: string; subtitle: string; bg: string; border: string; text: string }[] = [
  { id: 'todo', title: 'К выполнению', subtitle: 'Бэклог и новые задачи', bg: 'bg-slate-50/80', border: 'border-slate-200', text: 'text-slate-800' },
  { id: 'in_progress', title: 'В работе', subtitle: 'В процессе выполнения', bg: 'bg-amber-50/40', border: 'border-amber-200', text: 'text-amber-900' },
  { id: 'waiting', title: 'Ожидание', subtitle: 'Ждем поставку / ответ / оплату', bg: 'bg-blue-50/40', border: 'border-blue-200', text: 'text-blue-900' },
  { id: 'done', title: 'Выполнено', subtitle: 'Сдано и закрыто', bg: 'bg-emerald-50/40', border: 'border-emerald-200', text: 'text-emerald-900' },
];

export const PlannerTab: React.FC<PlannerTabProps> = ({
  tasks,
  projects,
  users,
  currentUserId,
  onSaveTask,
  onSaveTasksBatch,
  onDeleteTask,
  onToggleTaskStatus,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'agenda' | 'gantt'>('kanban');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeTaskForEdit, setActiveTaskForEdit] = useState<Task | undefined>(undefined);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = 
        task.title.toLowerCase().includes(q) ||
        (task.description || '').toLowerCase().includes(q) ||
        task.assignee_name.toLowerCase().includes(q) ||
        (task.project_title || '').toLowerCase().includes(q);
      if (!matches) return false;
    }

    // Assignee
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'admin_kerim' && task.assignee_id !== 'usr-kerim') return false;
      if (assigneeFilter === 'admin_vanya' && task.assignee_id !== 'usr-vanya') return false;
      if (assigneeFilter === 'staff' && (task.assignee_id === 'usr-kerim' || task.assignee_id === 'usr-vanya')) return false;
      if (assigneeFilter === 'my' && task.assignee_id !== currentUserId) return false;
    }

    // Project
    if (projectFilter !== 'all') {
      if (projectFilter === 'none' && task.project_id) return false;
      if (projectFilter !== 'none' && task.project_id !== projectFilter) return false;
    }

    // Category
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

    return true;
  });

  const handleOpenNewTask = (initialStatus?: TaskStatus) => {
    setActiveTaskForEdit(undefined);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setActiveTaskForEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleMoveStatus = (task: Task, nextStatus: TaskStatus) => {
    const updated: Task = {
      ...task,
      status: nextStatus,
      updated_at: new Date().toISOString(),
      completed_at: nextStatus === 'done' ? new Date().toISOString() : undefined,
    };
    onSaveTask(updated);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const getDueDateBadge = (dueDate?: string) => {
    if (!dueDate) return null;
    const isToday = dueDate === todayStr;
    const isPast = dueDate < todayStr;

    if (isPast) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3" />
          <span>Просрочено ({dueDate})</span>
        </span>
      );
    }
    if (isToday) {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
          <Clock className="w-3 h-3" />
          <span>Сегодня</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
        <CalendarIcon className="w-3 h-3" />
        <span>{dueDate}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 text-slate-950 font-black flex items-center justify-center shadow-lg">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black tracking-tight text-white">
                Планировщик задач и контроль объектов
              </h2>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
                Керим &middot; Ваня &middot; Команда
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Канбан-доска, оперативный фокус дня, поручения бригадирам и контроль оплат.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700 text-xs font-bold">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-brand-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Канбан</span>
            </button>

            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'agenda'
                  ? 'bg-brand-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>По срокам</span>
            </button>

            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'gantt'
                  ? 'bg-brand-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Диаграмма Ганта</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenNewTask()}
            className="px-4 py-2.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg transition-all flex items-center gap-2 shrink-0 ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Новая задача</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Assignee Quick Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold">
          <button
            onClick={() => setAssigneeFilter('all')}
            className={`px-3 py-1.5 rounded-xl border transition-all ${
              assigneeFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Все ({tasks.length})
          </button>

          <button
            onClick={() => setAssigneeFilter('admin_kerim')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
              assigneeFilter === 'admin_kerim'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>👑 Керим</span>
            <span className="text-[10px] opacity-80">({tasks.filter(t => t.assignee_id === 'usr-kerim').length})</span>
          </button>

          <button
            onClick={() => setAssigneeFilter('admin_vanya')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
              assigneeFilter === 'admin_vanya'
                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                : 'bg-brand-50 text-brand-800 border-brand-200 hover:bg-brand-100'
            }`}
          >
            <span>👑 Ваня</span>
            <span className="text-[10px] opacity-80">({tasks.filter(t => t.assignee_id === 'usr-vanya').length})</span>
          </button>

          <button
            onClick={() => setAssigneeFilter('staff')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
              assigneeFilter === 'staff'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <span>👷 Бригадиры / Шофер</span>
            <span className="text-[10px] opacity-80">({tasks.filter(t => t.assignee_id !== 'usr-kerim' && t.assignee_id !== 'usr-vanya').length})</span>
          </button>
        </div>

        {/* Dropdown Filters & Search */}
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Все объекты ({projects.length})</option>
            <option value="none">🏢 Без объекта (Общие)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Все категории</option>
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск задач..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);

            return (
              <div
                key={col.id}
                className={`${col.bg} border ${col.border} rounded-3xl p-4 shadow-sm min-h-[550px] flex flex-col`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-black text-sm ${col.text}`}>{col.title}</h3>
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-white shadow-sm border border-slate-200/80 text-slate-700">
                        {colTasks.length}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{col.subtitle}</p>
                  </div>

                  <button
                    onClick={() => handleOpenNewTask(col.id)}
                    className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-sm transition-colors"
                    title={`Добавить задачу в ${col.title}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Task Cards Column */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                  {colTasks.map((task) => {
                    const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                    const categoryCfg = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.general;
                    const safeChecklist = Array.isArray(task.checklist) ? task.checklist : [];
                    const completedChecklist = safeChecklist.filter(c => c && c.completed).length;
                    const assigneeName = task.assignee_name || 'Керим';

                    return (
                      <div
                        key={task.id}
                        onClick={() => handleOpenEditTask(task)}
                        className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-brand-500/50 transition-all cursor-pointer space-y-3 group"
                      >
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${priorityCfg.bg} ${priorityCfg.text} ${priorityCfg.border}`}>
                            {priorityCfg.icon} {priorityCfg.label}
                          </span>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${categoryCfg.bg}`}>
                            {categoryCfg.label}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Project Badge */}
                        {task.project_title && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{task.project_title}</span>
                          </div>
                        )}

                        {/* Technological Dependency Badge */}
                        {task.depends_on && task.depends_on.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            {(() => {
                              const preds = task.depends_on.map(pId => tasks.find(t => t.id === pId)).filter(Boolean) as Task[];
                              const allDone = preds.length > 0 && preds.every(p => p.status === 'done');
                              const pendingPred = preds.find(p => p.status !== 'done');

                              if (allDone) {
                                return (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span className="truncate">Готово к старту (после {preds[0]?.title})</span>
                                  </span>
                                );
                              }

                              return (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 truncate max-w-full">
                                  <GitBranch className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span className="truncate">Ждет: {pendingPred?.title || 'предшественника'}</span>
                                </span>
                              );
                            })()}
                          </div>
                        )}

                        {/* Checklist Progress Bar */}
                        {safeChecklist.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                              <span>Чек-лист:</span>
                              <span>{completedChecklist}/{safeChecklist.length}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${(completedChecklist / safeChecklist.length) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Money Amount Tag */}
                        {task.money_amount && (
                          <div className="flex items-center gap-1 font-black text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>{formatCurrency(task.money_amount)}</span>
                          </div>
                        )}

                        {/* Card Footer: Due Date, Assignee, Quick Advance */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Assignee Avatar */}
                            <div
                              title={`Ответственный: ${assigneeName}`}
                              className={`w-6 h-6 rounded-lg text-white font-black text-[10px] flex items-center justify-center shadow-xs ${
                                task.assignee_id === 'usr-kerim' ? 'bg-amber-500' :
                                task.assignee_id === 'usr-vanya' ? 'bg-brand-500' :
                                task.assignee_id === 'usr-shofer' ? 'bg-blue-600' : 'bg-emerald-600'
                              }`}
                            >
                              {assigneeName.substring(0, 1).toUpperCase()}
                            </div>

                            <span className="text-[11px] font-bold text-slate-700">
                              {assigneeName}
                            </span>
                          </div>

                          {/* Due Date */}
                          {getDueDateBadge(task.due_date)}
                        </div>

                        {/* Quick Step Buttons */}
                        <div className="flex items-center justify-between pt-1 gap-1">
                          {col.id !== 'todo' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const prev = col.id === 'done' ? 'waiting' : col.id === 'waiting' ? 'in_progress' : 'todo';
                                handleMoveStatus(task, prev);
                              }}
                              className="text-[10px] text-slate-400 hover:text-slate-700 px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                              &larr; Назад
                            </button>
                          )}

                          {col.id !== 'done' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const next = col.id === 'todo' ? 'in_progress' : col.id === 'in_progress' ? 'waiting' : 'done';
                                handleMoveStatus(task, next);
                              }}
                              className="text-[10px] font-extrabold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition-colors ml-auto flex items-center gap-1"
                            >
                              <span>{col.id === 'waiting' ? 'Выполнить ✓' : 'Далее →'}</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 ml-auto">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Выполнено</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200/80 rounded-2xl">
                      Нет задач в этой колонке
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: AGENDA / TIMELINE BY DEADLINE */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>Задачи по срокам и приоритету</span>
              </h3>
              <p className="text-xs text-slate-500">Список дел на сегодня, эту неделю и горящие дедлайны</p>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              const isDone = task.status === 'done';

              return (
                <div
                  key={task.id}
                  onClick={() => handleOpenEditTask(task)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isDone
                      ? 'bg-slate-50/60 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-brand-500/50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTaskStatus(task.id);
                      }}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-brand-500'
                      }`}
                    >
                      {isDone && <Check className="w-4 h-4" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-xs font-extrabold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityCfg.bg} ${priorityCfg.text} ${priorityCfg.border}`}>
                          {priorityCfg.icon} {priorityCfg.label}
                        </span>
                        {task.project_title && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            🏗️ {task.project_title}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {task.money_amount && (
                      <span className="font-black text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {formatCurrency(task.money_amount)}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <div className={`w-6 h-6 rounded-lg text-white font-black text-[10px] flex items-center justify-center ${
                        task.assignee_id === 'usr-kerim' ? 'bg-amber-500' :
                        task.assignee_id === 'usr-vanya' ? 'bg-brand-500' :
                        task.assignee_id === 'usr-shofer' ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}>
                        {task.assignee_name.substring(0, 1).toUpperCase()}
                      </div>
                      <span>{task.assignee_name}</span>
                    </div>

                    {getDueDateBadge(task.due_date)}
                  </div>
                </div>
              );
            })}

            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                Задач по выбранным фильтрам не найдено.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: GANTT CHART */}
      {viewMode === 'gantt' && (
        <GanttChart
          tasks={tasks}
          projects={projects}
          users={users}
          currentUserId={currentUserId}
          onSaveTask={onSaveTask}
          onSaveTasksBatch={onSaveTasksBatch}
          onDeleteTask={onDeleteTask}
          onToggleTaskStatus={onToggleTaskStatus}
          initialProjectId={projectFilter !== 'all' && projectFilter !== 'none' ? projectFilter : undefined}
        />
      )}

      {/* Task Create / Edit Modal */}
      {isTaskModalOpen && (
        <TaskModal
          task={activeTaskForEdit}
          allTasks={tasks}
          projects={projects}
          users={users}
          currentUserId={currentUserId}
          initialProjectId={projectFilter !== 'all' && projectFilter !== 'none' ? projectFilter : undefined}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={(task) => {
            onSaveTask(task);
            setIsTaskModalOpen(false);
          }}
          onDelete={(id) => {
            onDeleteTask(id);
            setIsTaskModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
