'use client';

import React, { useState } from 'react';
import { Task, TaskPriority, TaskCategory, TaskStatus, Project, ChecklistItem, UserProfile } from '@/types';
import { 
  CheckSquare, 
  X, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  User, 
  Building, 
  Tag, 
  Flame, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  CalendarRange,
  GitBranch,
  AlertTriangle
} from 'lucide-react';
import { storage } from '@/lib/storage';

interface TaskModalProps {
  task?: Task;
  allTasks?: Task[];
  projects: Project[];
  users: UserProfile[];
  currentUserId?: string;
  initialProjectId?: string;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  allTasks,
  projects,
  users,
  currentUserId,
  initialProjectId,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditing = !!task;

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'high');
  const [category, setCategory] = useState<TaskCategory>(task?.category || 'construction');
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id || currentUserId || 'usr-kerim');
  const [projectId, setProjectId] = useState(task?.project_id || initialProjectId || '');
  const [startDate, setStartDate] = useState(task?.start_date || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(task?.due_date || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]);
  const [dependsOn, setDependsOn] = useState<string[]>(Array.isArray(task?.depends_on) ? task.depends_on : []);
  const [dueTime, setDueTime] = useState(task?.due_time || '');
  const [moneyAmount, setMoneyAmount] = useState<string>(task?.money_amount ? task.money_amount.toString() : '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(Array.isArray(task?.checklist) ? task.checklist : []);
  const [newChecklistText, setNewChecklistText] = useState('');

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: newChecklistText.trim(),
      completed: false,
    };
    setChecklist([...(checklist || []), newItem]);
    setNewChecklistText('');
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist((checklist || []).map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleDeleteChecklist = (id: string) => {
    setChecklist((checklist || []).filter(item => item.id !== id));
  };

  const calcDurationDays = (s: string, e: string): number => {
    if (!s || !e) return 1;
    const sDate = new Date(s).getTime();
    const eDate = new Date(e).getTime();
    const diff = Math.round((eDate - sDate) / 86400000);
    return diff >= 0 ? diff + 1 : 1;
  };

  const handleSetDuration = (days: number) => {
    const s = new Date(startDate || new Date().toISOString().split('T')[0]);
    s.setDate(s.getDate() + (days - 1));
    setDueDate(s.toISOString().split('T')[0]);
  };

  const candidateTasks = (allTasks || storage.getTasks()).filter(t => {
    if (task && t.id === task.id) return false;
    if (projectId) return t.project_id === projectId;
    return true;
  });

  const handleToggleDependency = (depId: string) => {
    if (dependsOn.includes(depId)) {
      setDependsOn(dependsOn.filter(id => id !== depId));
    } else {
      setDependsOn([...dependsOn, depId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedUser = users.find(u => u.id === assigneeId);
    const selectedProject = projects.find(p => p.id === projectId);
    const duration = calcDurationDays(startDate, dueDate);

    const savedTask: Task = {
      id: task?.id || `tsk-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      category,
      assignee_id: assigneeId,
      assignee_name: selectedUser?.name || 'Керим',
      project_id: projectId || undefined,
      project_title: selectedProject?.title || undefined,
      start_date: startDate || undefined,
      due_date: dueDate || undefined,
      duration_days: duration,
      depends_on: dependsOn.length > 0 ? dependsOn : undefined,
      due_time: dueTime || undefined,
      money_amount: moneyAmount ? parseFloat(moneyAmount) : undefined,
      checklist: checklist || [],
      created_by: task?.created_by || (users.find(u => u.id === currentUserId)?.name || 'Керим'),
      created_at: task?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: status === 'done' ? (task?.completed_at || new Date().toISOString()) : undefined,
    };

    onSave(savedTask);
  };

  const completedChecklistCount = (checklist || []).filter(c => c && c.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                {isEditing ? 'Редактировать задачу' : 'Новая оперативная задача'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Планировщик Prerab OS &middot; Керим и Ваня
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          
          {/* Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Название задачи / Что нужно сделать:*
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Забрать остаток оплаты по Jaslovska (9 701 €)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Детали и комментарии к задаче:
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Контакты, нюансы, что проверить перед выездом..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
          </div>

          {/* Grid: Assignee & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ответственный / Исполнитель:*
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.role === 'admin' ? `👑 ${u.name}` : u.role === 'driver' ? `🚛 ${u.name}` : `👷 ${u.name}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Привязка к объекту:
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">🏢 Общефирменная задача (Без объекта)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    🏗️ {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid: Status, Priority, Category */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Статус:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="todo">📋 К выполнению</option>
                <option value="in_progress">⚡ В работе</option>
                <option value="waiting">⏳ Ожидание</option>
                <option value="done">✅ Выполнено</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Приоритет:</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="critical">🔥 Срочно (Горит)</option>
                <option value="high">⚡ Высокий</option>
                <option value="medium">🔹 Обычный</option>
                <option value="low">☕ Низкий</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Категория:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="finance">💶 Финансы / Оплаты</option>
                <option value="construction">🏗️ Стройка / Контроль</option>
                <option value="supply">🚚 Снабжение</option>
                <option value="docs">📋 Документы</option>
                <option value="urgent">🔥 Срочный выезд</option>
                <option value="general">📌 Общее</option>
              </select>
            </div>
          </div>

          {/* GANTT DATES & TIMELINE */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <CalendarRange className="w-4 h-4 text-brand-600" />
                <span>Сроки выполнения этапа (План-график)</span>
              </label>
              <div className="flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-100/60 px-2 py-0.5 rounded-lg border border-brand-200">
                <span>Длительность: {calcDurationDays(startDate, dueDate)} дн.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Дата начала работ (Старт):
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Дата окончания работ (Финиш):
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Quick duration presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-bold">Быстрый срок:</span>
              {[
                { label: '3 дня', days: 3 },
                { label: '7 дней (1 нед.)', days: 7 },
                { label: '14 дней (2 нед.)', days: 14 },
                { label: '30 дней (1 мес.)', days: 30 }
              ].map(preset => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => handleSetDuration(preset.days)}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-300 text-[10px] font-semibold text-slate-700 hover:text-brand-700 transition-colors"
                >
                  +{preset.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Время сдачи / встречи:</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Сумма (€, если привязана оплата):</label>
                <input
                  type="number"
                  step="any"
                  value={moneyAmount}
                  onChange={(e) => setMoneyAmount(e.target.value)}
                  placeholder="9700"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* TASK DEPENDENCIES (После каких этапов) */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-sky-600" />
                <span>Технологические зависимости этапа</span>
              </label>
              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                Выбрано: {dependsOn.length}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              Укажите, какие этапы должны быть завершены перед началом этой работы (например: <i>«Штукатурка может начаться только после завершения электрики»</i>).
            </p>

            {candidateTasks.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {candidateTasks.map((cand) => {
                  const isChecked = dependsOn.includes(cand.id);
                  const isConflict = cand.due_date && startDate && cand.due_date > startDate;

                  return (
                    <div
                      key={cand.id}
                      onClick={() => handleToggleDependency(cand.id)}
                      className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        isChecked 
                          ? 'bg-sky-50 border-sky-300 text-sky-950 font-bold' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-brand-600 pointer-events-none"
                        />
                        <span className="truncate">{cand.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                        <span className="text-slate-400 font-normal">до {cand.due_date || 'нет срока'}</span>
                        {isChecked && isConflict && (
                          <span 
                            title="Предшественник заканчивается позже, чем начало этой задачи!"
                            className="flex items-center gap-0.5 text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-bold"
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Наложение</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                Нет других задач для установки зависимостей
              </div>
            )}
          </div>

          {/* Interactive Checklist Sub-tasks */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Чек-лист подзадач ({completedChecklistCount}/{checklist.length})</span>
              </label>
              {checklist.length > 0 && (
                <span className="text-[10px] font-bold text-slate-500">
                  {Math.round((completedChecklistCount / checklist.length) * 100)}% готово
                </span>
              )}
            </div>

            {/* Checklist Items */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/70 transition-colors"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklist(item.id)}
                      className="w-4 h-4 rounded text-brand-500 focus:ring-brand-400 border-slate-300 rounded cursor-pointer"
                    />
                    <span className={`text-xs ${item.completed ? 'line-through text-slate-400 font-medium' : 'text-slate-800 font-semibold'}`}>
                      {item.title}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleDeleteChecklist(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Checklist Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem(e);
                  }
                }}
                placeholder="Добавить подпункт (нажмите Enter)..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Пункт</span>
              </button>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Удалить задачу "${task.title}"?`)) {
                    onDelete(task.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-colors flex items-center gap-1.5 text-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Удалить</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors text-xs"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-black shadow-md transition-all text-xs flex items-center gap-1.5"
              >
                <CheckSquare className="w-4 h-4" />
                <span>{isEditing ? 'Сохранить изменения' : 'Создать задачу'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
