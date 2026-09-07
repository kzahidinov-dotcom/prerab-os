'use client';

import React, { useState, useMemo } from 'react';
import { Task, Project, UserProfile, TaskStatus } from '@/types';
import { 
  CalendarRange, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  GitBranch, 
  Building, 
  User, 
  Flame, 
  Layers,
  Wand2,
  Calendar as CalendarIcon,
  Search,
  Check
} from 'lucide-react';
import { TaskModal } from './TaskModal';
import { ScheduleTemplateModal } from './ScheduleTemplateModal';
import { storage } from '@/lib/storage';
import { showToast } from '@/components/ui/NotificationToast';

interface GanttChartProps {
  tasks: Task[];
  projects: Project[];
  users: UserProfile[];
  currentUserId?: string;
  onSaveTask: (task: Task) => void;
  onSaveTasksBatch?: (tasks: Task[]) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskStatus: (taskId: string) => void;
  initialProjectId?: string;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  projects,
  users,
  currentUserId,
  onSaveTask,
  onSaveTasksBatch,
  onDeleteTask,
  onToggleTaskStatus,
  initialProjectId,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || 'all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [onlyProjectsFilter, setOnlyProjectsFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeScale, setTimeScale] = useState<'days' | 'weeks'>('days');
  const [startDateOffset, setStartDateOffset] = useState<number>(0); // days from today
  
  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateTargetProjectId, setTemplateTargetProjectId] = useState<string>(
    initialProjectId || (projects[0]?.id || '')
  );

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Number of days to display in the chart
  const viewDaysCount = timeScale === 'days' ? 28 : 56;

  // Compute timeline window start and end
  const timelineStartDate = useMemo(() => {
    const d = new Date(today);
    // Start slightly before today (e.g. -4 days) so current context is visible
    d.setDate(d.getDate() - 4 + startDateOffset);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [startDateOffset]);

  const timelineDays = useMemo(() => {
    const days: { date: Date; dateStr: string; dayNum: number; dayName: string; isWeekend: boolean; isToday: boolean }[] = [];
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    for (let i = 0; i < viewDaysCount; i++) {
      const d = new Date(timelineStartDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      days.push({
        date: d,
        dateStr,
        dayNum: d.getDate(),
        dayName: dayNames[dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [timelineStartDate, viewDaysCount, todayStr]);

  const timelineEndDate = timelineDays[timelineDays.length - 1]?.date || new Date();

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (selectedProjectId !== 'all' && t.project_id !== selectedProjectId) return false;
      if (onlyProjectsFilter && !t.project_id) return false;
      if (assigneeFilter !== 'all' && t.assignee_id !== assigneeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = t.title.toLowerCase().includes(q) || (t.project_title || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    }).sort((a, b) => {
      const startA = a.start_date || a.due_date || a.created_at;
      const startB = b.start_date || b.due_date || b.created_at;
      return startA.localeCompare(startB);
    });
  }, [tasks, selectedProjectId, onlyProjectsFilter, assigneeFilter, searchQuery]);

  // Dependency mapping and conflict detection
  const taskMap = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);

  const taskConflicts = useMemo(() => {
    const conflicts: { taskId: string; message: string; predId: string }[] = [];
    filteredTasks.forEach(task => {
      if (task.depends_on && task.depends_on.length > 0) {
        task.depends_on.forEach(predId => {
          const pred = taskMap.get(predId);
          if (pred && pred.due_date && task.start_date) {
            if (task.start_date < pred.due_date) {
              conflicts.push({
                taskId: task.id,
                predId: pred.id,
                message: `Этап «${task.title}» начинается ${task.start_date}, но предшественник «${pred.title}» заканчивается ${pred.due_date}!`,
              });
            }
          }
        });
      }
    });
    return conflicts;
  }, [filteredTasks, taskMap]);

  // Calculate task bar position on timeline
  const getTaskBarPosition = (task: Task) => {
    const startStr = task.start_date || task.created_at?.split('T')[0] || todayStr;
    const dueStr = task.due_date || startStr;

    const startDate = new Date(startStr);
    const dueDate = new Date(dueStr);

    const msPerDay = 86400000;
    const startOffsetMs = startDate.getTime() - timelineStartDate.getTime();
    const durationMs = Math.max(msPerDay, dueDate.getTime() - startDate.getTime() + msPerDay);

    const totalTimelineMs = viewDaysCount * msPerDay;

    const leftPercent = (startOffsetMs / totalTimelineMs) * 100;
    const widthPercent = Math.max(1.8, (durationMs / totalTimelineMs) * 100);

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      isVisible: leftPercent + widthPercent > 0 && leftPercent < 100,
    };
  };

  // Auto-shift dates to resolve dependency overlaps
  const handleAutoAlignDependencies = () => {
    if (taskConflicts.length === 0) {
      showToast({
        title: '✅ Все сроки согласованы',
        message: 'Наложений и конфликтов этапов не обнаружено!',
        type: 'info'
      });
      return;
    }

    const updatedTasksMap = new Map(tasks.map(t => [t.id, { ...t }]));
    const updatedBatch: Task[] = [];

    taskConflicts.forEach(conf => {
      const task = updatedTasksMap.get(conf.taskId);
      const pred = updatedTasksMap.get(conf.predId);

      if (task && pred && pred.due_date) {
        // Shift task start to next day after pred due date
        const predEnd = new Date(pred.due_date);
        predEnd.setDate(predEnd.getDate() + 1);
        const newStartStr = predEnd.toISOString().split('T')[0];

        const dur = task.duration_days || 5;
        const newDue = new Date(predEnd);
        newDue.setDate(newDue.getDate() + (dur - 1));
        const newDueStr = newDue.toISOString().split('T')[0];

        task.start_date = newStartStr;
        task.due_date = newDueStr;
        task.updated_at = new Date().toISOString();

        updatedTasksMap.set(task.id, task);
        updatedBatch.push(task);
      }
    });

    if (updatedBatch.length > 0) {
      if (onSaveTasksBatch) {
        onSaveTasksBatch(updatedBatch);
      } else {
        storage.saveTasksBatch(updatedBatch);
        updatedBatch.forEach(t => onSaveTask(t));
      }
    }

    showToast({
      title: '🪄 Сроки автоматически выровнены',
      message: `Исправлено наложений: ${updatedBatch.length}. Этапы сдвинуты по технологической цепочке!`,
      type: 'success'
    });
  };

  // Apply Schedule Template with Vasilich Norms
  const handleApplyTemplate = (newTasks: Task[], targetProjId: string) => {
    if (onSaveTasksBatch) {
      onSaveTasksBatch(newTasks);
    } else {
      storage.saveTasksBatch(newTasks);
      newTasks.forEach(t => onSaveTask(t));
    }
    setSelectedProjectId(targetProjId);
  };

  const getStatusColor = (status: TaskStatus, isConflict: boolean) => {
    if (isConflict) return 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600 shadow-sm';
    switch (status) {
      case 'done': return 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600';
      case 'in_progress': return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600';
      case 'waiting': return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600';
      default: return 'bg-slate-700 hover:bg-slate-800 text-white border-slate-800';
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Action Bar & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Title & Stats */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 border border-brand-500/20 flex items-center justify-center shrink-0 shadow-xs">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>План-график объектов &middot; Диаграмма Ганта</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                  {filteredTasks.length} этапов
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Контроль сроков, технологические зависимости и предотвращение наложения этапов
              </p>
            </div>
          </div>

          {/* Buttons: Add Stage, Renovation Template, Auto-Align */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Auto Align Dependencies */}
            {taskConflicts.length > 0 && (
              <button
                onClick={handleAutoAlignDependencies}
                title="Автоматически сдвинуть задачи вперед, устранив наложения"
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition-all animate-pulse"
              >
                <Wand2 className="w-4 h-4" />
                <span>Выровнять сроки ({taskConflicts.length})</span>
              </button>
            )}

            {/* Renovation Template Button */}
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Шаблоны & Нормы Василича</span>
            </button>

            {/* Add Task Button */}
            <button
              onClick={() => {
                setEditingTask(undefined);
                setIsTaskModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Новый этап / задача</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Project Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">Все строительные объекты</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    🏗️ {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Only Projects Toggle */}
            <button
              onClick={() => setOnlyProjectsFilter(!onlyProjectsFilter)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                onlyProjectsFilter
                  ? 'bg-brand-500 text-slate-950 border-brand-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
            >
              <span>🏗️ Только этапы объектов</span>
            </button>

            {/* Assignee Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">Все исполнители</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'admin' ? 'Директор' : u.role === 'driver' ? 'Водитель' : 'Бригадир'})
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex items-center relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск этапа..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Timeline Navigation & Scale */}
          <div className="flex items-center gap-2">
            
            {/* Scale Toggle: Days vs Weeks */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setTimeScale('days')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  timeScale === 'days' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                По дням
              </button>
              <button
                onClick={() => setTimeScale('weeks')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  timeScale === 'weeks' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                По неделям
              </button>
            </div>

            {/* Timeline Arrow Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setStartDateOffset(prev => prev - 7)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200"
                title="Назад на 1 неделю"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setStartDateOffset(0)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition-colors border border-slate-200"
              >
                Сегодня
              </button>

              <button
                onClick={() => setStartDateOffset(prev => prev + 7)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200"
                title="Вперед на 1 неделю"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Conflict / Overlap Banner */}
      {taskConflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-950">
                Внимание: Обнаружено технологическое наложение этапов ({taskConflicts.length})!
              </h4>
              <p className="text-amber-800 mt-0.5">
                {taskConflicts[0]?.message}
              </p>
            </div>
          </div>

          <button
            onClick={handleAutoAlignDependencies}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs transition-all shrink-0"
          >
            Автоматически устранить наложения
          </button>
        </div>
      )}

      {/* Master Gantt Chart Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        
        <div className="overflow-x-auto">
          <div className="min-w-[1100px]">
            
            {/* Table Header: Task Title Column + Timeline Columns */}
            <div className="flex border-b border-slate-200 bg-slate-900 text-white text-xs select-none">
              
              {/* Left Title Header */}
              <div className="w-96 shrink-0 p-3 font-bold uppercase tracking-wider text-[11px] text-slate-300 border-r border-slate-800 flex items-center justify-between">
                <span>Этапы работ / Задачи</span>
                <span className="text-[10px] text-slate-400 font-normal">Сроки &middot; Связи</span>
              </div>

              {/* Right Days Header */}
              <div className="flex-1 flex">
                {timelineDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 text-center py-2 px-0.5 border-r border-slate-800/80 text-[10px] flex flex-col items-center justify-center transition-colors ${
                      day.isToday 
                        ? 'bg-brand-500 text-slate-950 font-black' 
                        : day.isWeekend 
                        ? 'bg-slate-950/60 text-slate-400 font-semibold' 
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="opacity-80 text-[9px]">{day.dayName}</span>
                    <span className="font-bold leading-tight">{day.dayNum}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* Task Rows */}
            <div className="divide-y divide-slate-100">
              {filteredTasks.map((task) => {
                const pos = getTaskBarPosition(task);
                const hasConflicts = taskConflicts.some(c => c.taskId === task.id);
                const predTasks = (task.depends_on || [])
                  .map(id => taskMap.get(id))
                  .filter(Boolean) as Task[];

                const isDone = task.status === 'done';

                return (
                  <div 
                    key={task.id}
                    className="flex hover:bg-slate-50/70 transition-colors group relative items-center text-xs"
                  >
                    {/* Left Task Info Panel */}
                    <div 
                      onClick={() => {
                        setEditingTask(task);
                        setIsTaskModalOpen(true);
                      }}
                      className="w-96 shrink-0 p-3 pr-4 border-r border-slate-200 cursor-pointer flex flex-col justify-center"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTaskStatus(task.id);
                            }}
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isDone ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-slate-300 hover:border-brand-500'
                            }`}
                          >
                            {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>

                          <span className={`font-bold truncate text-slate-900 ${isDone ? 'line-through text-slate-400' : ''}`}>
                            {task.title}
                          </span>
                        </div>

                        {/* Priority Badge */}
                        {task.priority === 'critical' && (
                          <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                            <Flame className="w-2.5 h-2.5" />
                            <span>СРОЧНО</span>
                          </span>
                        )}
                      </div>

                      {/* Sub-line: Project & Dates & Dependencies */}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                        {task.project_title && (
                          <span className="font-semibold text-slate-700 truncate max-w-[140px]">
                            🏗️ {task.project_title}
                          </span>
                        )}

                        <span>
                          {task.start_date ? task.start_date.substring(5) : '...'} &rarr; {task.due_date ? task.due_date.substring(5) : '...'}
                        </span>

                        <span className="font-bold text-slate-700">
                          ({task.duration_days || 1} дн.)
                        </span>

                        {predTasks.length > 0 && (
                          <span 
                            title={`Начинается после: ${predTasks.map(p => p.title).join(', ')}`}
                            className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-200"
                          >
                            <GitBranch className="w-2.5 h-2.5" />
                            <span>После: {predTasks[0]?.title.substring(0, 14)}...</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Timeline Canvas with Gantt Bar */}
                    <div className="flex-1 relative h-14 flex items-center">
                      
                      {/* Vertical Grid Columns */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {timelineDays.map((day, idx) => (
                          <div
                            key={idx}
                            className={`flex-1 border-r border-slate-100 h-full ${
                              day.isWeekend ? 'bg-slate-50/50' : ''
                            } ${day.isToday ? 'bg-brand-50/20' : ''}`}
                          />
                        ))}
                      </div>

                      {/* Red Today Line */}
                      {timelineDays.some(d => d.isToday) && (
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 pointer-events-none"
                          style={{
                            left: `${(timelineDays.findIndex(d => d.isToday) / viewDaysCount) * 100 + (1 / viewDaysCount * 50)}%`
                          }}
                        >
                          <div className="w-2 h-2 rounded-full bg-rose-500 -ml-[3px] -mt-1 shadow-xs" />
                        </div>
                      )}

                      {/* Gantt Bar */}
                      {pos.isVisible && (
                        <div
                          onClick={() => {
                            setEditingTask(task);
                            setIsTaskModalOpen(true);
                          }}
                          style={{ left: pos.left, width: pos.width }}
                          title={`${task.title} (${task.start_date || '...'} - ${task.due_date || '...'}, ${task.duration_days || 1} дн.)`}
                          className={`absolute h-7 rounded-xl px-2.5 flex items-center justify-between cursor-pointer shadow-sm transition-all hover:scale-[1.01] hover:shadow-md border z-20 overflow-hidden ${getStatusColor(
                            task.status,
                            hasConflicts
                          )}`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-extrabold text-[11px] truncate leading-none">
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] font-bold shrink-0 opacity-90 pl-1">
                            {hasConflicts && <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce" />}
                            <span>{task.duration_days || 1} дн.</span>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}

              {filteredTasks.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Нет этапов или задач, соответствующих выбранным фильтрам.
                  <div className="mt-3">
                    <button
                      onClick={() => setIsTemplateModalOpen(true)}
                      className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition-colors"
                    >
                      Загрузить типовой план ремонта объекта
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Task Create / Edit Modal */}
      {isTaskModalOpen && (
        <TaskModal
          task={editingTask}
          allTasks={tasks}
          projects={projects}
          users={users}
          currentUserId={currentUserId}
          initialProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(undefined);
          }}
          onSave={(saved) => {
            onSaveTask(saved);
            setIsTaskModalOpen(false);
            setEditingTask(undefined);
          }}
          onDelete={(id) => {
            onDeleteTask(id);
            setIsTaskModalOpen(false);
            setEditingTask(undefined);
          }}
        />
      )}

      {/* Schedule Templates Modal with Vasilich Norms & Editor */}
      <ScheduleTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        projects={projects}
        users={users}
        initialProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
        onApplyTemplate={handleApplyTemplate}
      />

    </div>
  );
};
