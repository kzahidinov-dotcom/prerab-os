'use client';

import React from 'react';
import { Task, UserProfile } from '@/types';
import { formatCurrency } from '@/lib/slovak-vat';
import { 
  CheckSquare, 
  Clock, 
  ArrowRight, 
  Check, 
  Building, 
  Plus, 
  Sparkles,
  DollarSign
} from 'lucide-react';

interface TodayTasksWidgetProps {
  tasks: Task[];
  currentUser?: UserProfile | null;
  onNavigateToPlanner: () => void;
  onToggleTaskStatus: (taskId: string) => void;
  onOpenNewTask: () => void;
}

export const TodayTasksWidget: React.FC<TodayTasksWidgetProps> = ({
  tasks,
  currentUser,
  onNavigateToPlanner,
  onToggleTaskStatus,
  onOpenNewTask,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Filter tasks: incomplete tasks that are due today or overdue, or in progress
  const activeTasks = safeTasks.filter(t => t && t.status !== 'done');
  const todayOrOverdue = activeTasks.filter(t => !t.due_date || t.due_date <= todayStr);
  const displayTasks = todayOrOverdue.slice(0, 4);
  const completedTodayCount = safeTasks.filter(t => t && t.status === 'done' && t.completed_at && t.completed_at.startsWith(todayStr)).length;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl space-y-4">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">
                Оперативный фокус дня (Задачи Керима и Вани)
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                {activeTasks.length} в работе
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Главные задачи на сегодня по объектам, сметам и оплатам
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewTask}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Задача</span>
          </button>

          <button
            onClick={onNavigateToPlanner}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md"
          >
            <span>В планировщик</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Rows */}
      <div className="space-y-2">
        {displayTasks.map((task) => {
          const isOverdue = task.due_date && task.due_date < todayStr;
          const isToday = task.due_date === todayStr;

          return (
            <div
              key={task.id}
              className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-2xl border border-slate-750 transition-all flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleTaskStatus(task.id)}
                  className="w-5 h-5 rounded-lg border border-slate-600 hover:border-brand-400 flex items-center justify-center shrink-0 transition-colors bg-slate-900"
                >
                  <Check className="w-3.5 h-3.5 text-transparent group-hover:text-slate-500" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors truncate">
                      {task.title}
                    </span>
                    {task.project_title && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-700/80 text-slate-300">
                        {task.project_title}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {task.money_amount && (
                  <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-lg">
                    {formatCurrency(task.money_amount)}
                  </span>
                )}

                {/* Assignee pill */}
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
                  <div className={`w-5 h-5 rounded-md text-white font-black text-[9px] flex items-center justify-center ${
                    task.assignee_id === 'usr-kerim' ? 'bg-amber-500' :
                    task.assignee_id === 'usr-vanya' ? 'bg-brand-500' :
                    task.assignee_id === 'usr-shofer' ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}>
                    {(task.assignee_name || 'К').substring(0, 1).toUpperCase()}
                  </div>
                  <span className="hidden md:inline">{task.assignee_name || 'Керим'}</span>
                </div>

                {isOverdue ? (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-950/50 border border-rose-800/50 px-2 py-0.5 rounded">
                    Просрочено
                  </span>
                ) : isToday ? (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/50 border border-amber-800/50 px-2 py-0.5 rounded">
                    Сегодня
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}

        {displayTasks.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-xs bg-slate-800/40 rounded-2xl border border-slate-800">
            🎉 На сегодня все главные задачи закрыты!
          </div>
        )}
      </div>
    </div>
  );
};
