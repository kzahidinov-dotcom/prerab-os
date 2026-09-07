'use client';

import React, { useState } from 'react';
import { 
  ScheduleTemplate, 
  ScheduleTemplateStage, 
  Project, 
  UserProfile, 
  Task, 
  TaskCategory, 
  TaskPriority 
} from '@/types';
import { storage } from '@/lib/storage';
import { 
  Sparkles, 
  X, 
  Plus, 
  Trash2, 
  Copy, 
  RotateCcw, 
  Check, 
  Edit3, 
  Calendar, 
  Clock, 
  Users, 
  Layers, 
  GitBranch, 
  Building, 
  ArrowRight, 
  CheckSquare, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { showToast } from '@/components/ui/NotificationToast';

interface ScheduleTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  users: UserProfile[];
  initialProjectId?: string;
  onApplyTemplate: (tasks: Task[], targetProjectId: string) => void;
}

export const ScheduleTemplateModal: React.FC<ScheduleTemplateModalProps> = ({
  isOpen,
  onClose,
  projects,
  users,
  initialProjectId,
  onApplyTemplate,
}) => {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>(() => storage.getScheduleTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || 'tmpl-vasilich-renovation'
  );
  const [mode, setMode] = useState<'list' | 'edit' | 'apply'>('list');

  // Edit State
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null);

  // Apply State
  const [targetProjectId, setTargetProjectId] = useState<string>(
    initialProjectId || (projects[0]?.id || '')
  );
  const [applyStartDate, setApplyStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [applyAssigneeId, setApplyAssigneeId] = useState<string>('usr-vanya');

  if (!isOpen) return null;

  const currentTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  const handleSaveEditedTemplate = () => {
    if (!editingTemplate) return;
    if (!editingTemplate.title.trim()) {
      alert('Укажите название шаблона');
      return;
    }

    const updated = templates.map(t => t.id === editingTemplate.id ? {
      ...editingTemplate,
      updated_at: new Date().toISOString(),
    } : t);

    // If new template
    if (!templates.some(t => t.id === editingTemplate.id)) {
      updated.push({
        ...editingTemplate,
        updated_at: new Date().toISOString(),
      });
    }

    storage.saveScheduleTemplates(updated);
    setTemplates(updated);
    setSelectedTemplateId(editingTemplate.id);
    setMode('list');
    setEditingTemplate(null);

    showToast({
      title: '💾 Шаблон сохранен в облако',
      message: `Шаблон «${editingTemplate.title}» успешно сохранен и синхронизирован!`,
      type: 'success'
    });
  };

  const handleDuplicateTemplate = (tmpl: ScheduleTemplate) => {
    const copy: ScheduleTemplate = {
      ...tmpl,
      id: `tmpl-custom-${Date.now()}`,
      title: `${tmpl.title} (Копия)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stages: tmpl.stages.map((s, idx) => ({
        ...s,
        id: `stg-${Date.now()}-${idx}`
      }))
    };
    const updated = [copy, ...templates];
    storage.saveScheduleTemplates(updated);
    setTemplates(updated);
    setSelectedTemplateId(copy.id);

    showToast({
      title: '📋 Шаблон продублирован',
      message: `Создана копия «${copy.title}». Теперь вы можете ее отредактировать.`,
      type: 'info'
    });
  };

  const handleDeleteTemplate = (tmplId: string) => {
    if (templates.length <= 1) {
      alert('Нельзя удалить единственный шаблон в системе.');
      return;
    }
    if (!confirm('Вы уверены, что хотите удалить этот шаблон?')) return;

    const updated = templates.filter(t => t.id !== tmplId);
    storage.saveScheduleTemplates(updated);
    setTemplates(updated);
    setSelectedTemplateId(updated[0]?.id || '');

    showToast({
      title: '🗑️ Шаблон удален',
      message: 'Шаблон удален из системы и облака.',
      type: 'info'
    });
  };

  const handleResetToVasilichDefaults = () => {
    if (!confirm('Сбросить все шаблоны к исходным эталонам с нормами Василича?')) return;
    storage.resetScheduleTemplates();
    const fresh = storage.getScheduleTemplates();
    setTemplates(fresh);
    setSelectedTemplateId(fresh[0]?.id || '');

    showToast({
      title: '🔄 Нормы Василича восстановлены',
      message: 'Заводские технологические нормы и тайминги загружены из базы.',
      type: 'success'
    });
  };

  const handleCreateNewTemplate = () => {
    const newTmpl: ScheduleTemplate = {
      id: `tmpl-custom-${Date.now()}`,
      title: 'Новый строительный график',
      description: 'Пользовательский график этапов работ',
      category: 'custom',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stages: [
        {
          id: `stg-${Date.now()}-0`,
          title: '1. Демонтажные и подготовительные работы',
          description: 'Очистка помещений, вынос мусора',
          duration_days: 2,
          duration_hours: 16,
          workers_count: 2,
          norm_notes: 'Подготовка объекта',
          category: 'construction',
          priority: 'high',
          depends_on_indices: [],
          default_assignee_id: 'usr-vanya',
        }
      ]
    };
    setEditingTemplate(newTmpl);
    setMode('edit');
  };

  // Stage editing inside template editor
  const handleAddStage = () => {
    if (!editingTemplate) return;
    const newStageIdx = editingTemplate.stages.length;
    const prevIdx = newStageIdx > 0 ? newStageIdx - 1 : undefined;

    const newStage: ScheduleTemplateStage = {
      id: `stg-${Date.now()}-${newStageIdx}`,
      title: `${newStageIdx + 1}. Новый технологический этап`,
      description: 'Описание и специфика работ этапа',
      duration_days: 3,
      duration_hours: 24,
      workers_count: 1,
      norm_notes: '',
      category: 'construction',
      priority: 'high',
      depends_on_indices: prevIdx !== undefined ? [prevIdx] : [],
      default_assignee_id: 'usr-vanya',
    };

    setEditingTemplate({
      ...editingTemplate,
      stages: [...editingTemplate.stages, newStage]
    });
  };

  const handleUpdateStage = (idx: number, patch: Partial<ScheduleTemplateStage>) => {
    if (!editingTemplate) return;
    const updatedStages = [...editingTemplate.stages];
    updatedStages[idx] = { ...updatedStages[idx], ...patch };
    setEditingTemplate({
      ...editingTemplate,
      stages: updatedStages
    });
  };

  const handleDeleteStage = (idx: number) => {
    if (!editingTemplate) return;
    if (editingTemplate.stages.length <= 1) {
      alert('В графике должен оставаться минимум один этап.');
      return;
    }
    const updatedStages = editingTemplate.stages.filter((_, i) => i !== idx);
    setEditingTemplate({
      ...editingTemplate,
      stages: updatedStages
    });
  };

  // Preview and Apply template logic
  const calculateStagesTimeline = (template: ScheduleTemplate, startStr: string) => {
    const baseDate = new Date(startStr);
    const calculated: {
      stage: ScheduleTemplateStage;
      startDate: string;
      dueDate: string;
      predecessorTitles: string[];
    }[] = [];

    const endDatesByIndex: Date[] = [];

    template.stages.forEach((stage, idx) => {
      let stageStart = new Date(baseDate);

      // Check dependencies
      if (stage.depends_on_indices && stage.depends_on_indices.length > 0) {
        let maxPredEnd = new Date(baseDate);
        stage.depends_on_indices.forEach(pIdx => {
          if (endDatesByIndex[pIdx] && endDatesByIndex[pIdx] > maxPredEnd) {
            maxPredEnd = new Date(endDatesByIndex[pIdx]);
          }
        });

        // Stage starts the next day after latest predecessor
        const nextDay = new Date(maxPredEnd);
        nextDay.setDate(nextDay.getDate() + 1);
        stageStart = nextDay;
      }

      const stageEnd = new Date(stageStart);
      stageEnd.setDate(stageEnd.getDate() + Math.max(0, stage.duration_days - 1));
      endDatesByIndex[idx] = stageEnd;

      const predTitles = (stage.depends_on_indices || [])
        .map(pIdx => template.stages[pIdx]?.title)
        .filter(Boolean);

      calculated.push({
        stage,
        startDate: stageStart.toISOString().split('T')[0],
        dueDate: stageEnd.toISOString().split('T')[0],
        predecessorTitles: predTitles,
      });
    });

    return calculated;
  };

  const handleExecuteApply = () => {
    if (!currentTemplate) return;
    const targetProj = projects.find(p => p.id === targetProjectId);
    if (!targetProj) {
      alert('Пожалуйста, выберите строительный объект!');
      return;
    }

    const calculated = calculateStagesTimeline(currentTemplate, applyStartDate);
    const createdTaskIds: string[] = [];
    const newTasks: Task[] = [];

    // Pre-generate Task IDs so dependencies reference real UUIDs
    calculated.forEach((_, idx) => {
      createdTaskIds.push(`tsk-tmpl-${Date.now()}-${idx}`);
    });

    const assigneeUser = users.find(u => u.id === applyAssigneeId);

    calculated.forEach((item, idx) => {
      const taskId = createdTaskIds[idx];
      const predTaskIds = (item.stage.depends_on_indices || [])
        .map(pIdx => createdTaskIds[pIdx])
        .filter(Boolean);

      const taskAssigneeId = item.stage.default_assignee_id || applyAssigneeId;
      const taskAssignee = users.find(u => u.id === taskAssigneeId) || assigneeUser;

      const checklistItems = (item.stage.checklist || []).map((text, cIdx) => ({
        id: `chk-${Date.now()}-${idx}-${cIdx}`,
        title: text,
        completed: false
      }));

      const fullDesc = [
        item.stage.description || '',
        item.stage.norm_notes ? `\n\n📌 Норма / Заметка: ${item.stage.norm_notes}` : '',
        item.stage.workers_count ? `\n👥 Состав бригады: ${item.stage.workers_count} чел.` : ''
      ].filter(Boolean).join('');

      const newTask: Task = {
        id: taskId,
        title: item.stage.title,
        description: fullDesc.trim() || undefined,
        status: idx === 0 ? 'in_progress' : 'todo',
        priority: item.stage.priority,
        category: item.stage.category,
        assignee_id: taskAssignee?.id || 'usr-vanya',
        assignee_name: taskAssignee?.name || 'Ваня',
        project_id: targetProj.id,
        project_title: targetProj.title,
        start_date: item.startDate,
        due_date: item.dueDate,
        duration_days: item.stage.duration_days,
        depends_on: predTaskIds.length > 0 ? predTaskIds : undefined,
        checklist: checklistItems,
        created_by: 'Керим',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      newTasks.push(newTask);
    });

    onApplyTemplate(newTasks, targetProj.id);
    onClose();

    showToast({
      title: '🏗️ График работ успешно запущен!',
      message: `Создано ${newTasks.length} связанных этапов для объекта «${targetProj.title}» без наложений!`,
      type: 'success',
      duration: 8000
    });
  };

  const totalTemplateDays = currentTemplate ? currentTemplate.stages.reduce((sum, s) => sum + s.duration_days, 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">
                  {mode === 'list' && 'Шаблоны планирования и нормы Василича'}
                  {mode === 'edit' && (editingTemplate?.id.includes('custom') ? 'Создание нового шаблона' : 'Редактирование шаблона')}
                  {mode === 'apply' && `Применить график на объект: ${currentTemplate?.title}`}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  ОБЛАКО
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Технологические цепочки этапов, хронометраж и автоматическое связывание в планер
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode !== 'list' && (
              <button
                onClick={() => {
                  setMode('list');
                  setEditingTemplate(null);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                Назад к списку
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* VIEW 1: TEMPLATES LIST & DETAIL */}
          {mode === 'list' && currentTemplate && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: Template Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Доступные шаблоны ({templates.length})
                  </span>
                  <button
                    onClick={handleCreateNewTemplate}
                    className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Создать</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {templates.map((tmpl) => {
                    const isSelected = tmpl.id === selectedTemplateId;
                    const days = tmpl.stages.reduce((acc, s) => acc + s.duration_days, 0);

                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => setSelectedTemplateId(tmpl.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                          isSelected
                            ? 'bg-brand-50/50 border-brand-500 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                            {tmpl.title}
                          </h4>
                          {tmpl.category === 'renovation' && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                              ВАСИЛИЧ
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                          {tmpl.description}
                        </p>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                          <span className="font-semibold flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-400" />
                            {tmpl.stages.length} этапов
                          </span>
                          <span className="font-bold text-slate-900 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            ~{days} дн.
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reset to Vasilich Button */}
                <button
                  onClick={handleResetToVasilichDefaults}
                  className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Сбросить к нормам Василича</span>
                </button>
              </div>

              {/* Right Column: Template Stages View & Actions */}
              <div className="md:col-span-2 space-y-4">
                
                {/* Template Info Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        {currentTemplate.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {currentTemplate.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingTemplate(JSON.parse(JSON.stringify(currentTemplate)));
                          setMode('edit');
                        }}
                        title="Редактировать этапы и нормы"
                        className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Изменить</span>
                      </button>

                      <button
                        onClick={() => handleDuplicateTemplate(currentTemplate)}
                        title="Дублировать шаблон"
                        className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all shadow-xs"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteTemplate(currentTemplate.id)}
                        title="Удалить шаблон"
                        className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded-xl transition-all shadow-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Norms Highlight banner */}
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                    <span className="text-base">🔨</span>
                    <div>
                      <span className="font-extrabold">Реальные нормы стройки Василича: </span>
                      <span className="text-slate-700">
                        Демонтаж 57м² (12ч) &middot; Железные рамы (1.5ч) &middot; Сантехника (2 дня) &middot; Geberit (3ч) &middot; Нивелир 40 мешков (1 день на 2 чел) &middot; Шпаклевка с сушкой (от 3 часов).
                      </span>
                    </div>
                  </div>

                  {/* Apply Button in Header */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Всего этапов: <strong className="text-slate-900">{currentTemplate.stages.length}</strong> &middot; Продолжительность: <strong className="text-slate-900">{totalTemplateDays} дн.</strong>
                    </div>

                    <button
                      onClick={() => setMode('apply')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-black shadow-md transition-all hover:scale-[1.02]"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Применить на объект...</span>
                    </button>
                  </div>
                </div>

                {/* Stages List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Технологическая цепочка этапов ({currentTemplate.stages.length}):
                  </h4>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {currentTemplate.stages.map((stage, idx) => {
                      const predTitles = (stage.depends_on_indices || [])
                        .map(pIdx => currentTemplate.stages[pIdx]?.title)
                        .filter(Boolean);

                      return (
                        <div 
                          key={stage.id}
                          className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="font-extrabold text-xs text-slate-900">
                                  {stage.title}
                                </div>
                                {stage.description && (
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    {stage.description}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-black">
                                {stage.duration_days} дн.
                              </span>
                            </div>
                          </div>

                          {/* Norm notes & dependencies */}
                          <div className="flex flex-wrap items-center gap-2 text-[11px] pt-2 border-t border-slate-100">
                            {stage.norm_notes && (
                              <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-md font-medium">
                                📊 Норма: {stage.norm_notes}
                              </span>
                            )}
                            {predTitles.length > 0 ? (
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-md font-bold flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                <span>После: {predTitles.join(', ')}</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                Стартовый этап (без предшественников)
                              </span>
                            )}
                            {stage.workers_count !== undefined && stage.workers_count > 0 && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-semibold flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{stage.workers_count} чел.</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* VIEW 2: TEMPLATE EDITOR (MODIFY / CREATE) */}
          {mode === 'edit' && editingTemplate && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Название шаблона:
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.title}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                    placeholder="Например: Капремонт 2-комнатной квартиры"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Описание шаблона:
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.description}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                    placeholder="Краткое описание специфики работ..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Stages Editor List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Этапы графика ({editingTemplate.stages.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Укажите название, длительность в днях, норму выработки и выберите, после какого этапа начинается работа
                    </p>
                  </div>

                  <button
                    onClick={handleAddStage}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить этап</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {editingTemplate.stages.map((stage, idx) => (
                    <div 
                      key={stage.id}
                      className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={stage.title}
                            onChange={(e) => handleUpdateStage(idx, { title: e.target.value })}
                            placeholder="Название этапа..."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDeleteStage(idx)}
                            title="Удалить этап"
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Detail inputs grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        
                        {/* Duration Days */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Длительность (дней):
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            value={stage.duration_days}
                            onChange={(e) => handleUpdateStage(idx, { duration_days: parseInt(e.target.value) || 1 })}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 text-center"
                          />
                        </div>

                        {/* Workers Count */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Количество рабочих:
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={stage.workers_count || 1}
                            onChange={(e) => handleUpdateStage(idx, { workers_count: parseInt(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-center"
                          />
                        </div>

                        {/* Dependency Predecessor */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Начинается только после этапа:
                          </label>
                          <select
                            value={stage.depends_on_indices && stage.depends_on_indices.length > 0 ? stage.depends_on_indices[0] : -1}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              handleUpdateStage(idx, {
                                depends_on_indices: val >= 0 ? [val] : []
                              });
                            }}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none"
                          >
                            <option value="-1">🏁 Стартовый (без предшественников)</option>
                            {editingTemplate.stages.slice(0, idx).map((prevStage, pIdx) => (
                              <option key={prevStage.id} value={pIdx}>
                                После этапа {pIdx + 1}: {prevStage.title}
                              </option>
                            ))}
                          </select>
                        </div>

                      </div>

                      {/* Norms & notes */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Реальная норма выработки / заметка мастера (Василича):
                        </label>
                        <input
                          type="text"
                          value={stage.norm_notes || ''}
                          onChange={(e) => handleUpdateStage(idx, { norm_notes: e.target.value })}
                          placeholder="Например: 40 мешков нивелира на квартиру — 1 день 2 человека..."
                          className="w-full px-3 py-1.5 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMode('list');
                    setEditingTemplate(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedTemplate}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-black rounded-xl shadow-md transition-all"
                >
                  Сохранить шаблон в облако
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: APPLY TEMPLATE TO PROJECT */}
          {mode === 'apply' && currentTemplate && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500 text-slate-950 flex items-center justify-center font-bold">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Параметры запуска графика на объекте
                    </h3>
                    <p className="text-xs text-slate-500">
                      Система сгенерирует взаимосвязанные этапы с автоматическим расчетом дат без наложений
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Select Object */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Строительный объект:
                    </label>
                    <select
                      value={targetProjectId}
                      onChange={(e) => setTargetProjectId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          🏗️ {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Дата начала ремонта:
                    </label>
                    <input
                      type="date"
                      value={applyStartDate}
                      onChange={(e) => setApplyStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Default Assignee */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ответственный бригадир:
                    </label>
                    <select
                      value={applyAssigneeId}
                      onChange={(e) => setApplyAssigneeId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role === 'admin' ? 'Директор' : 'Бригадир'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Calculated Preview Timeline Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Предварительный расчет цепочки этапов ({currentTemplate.stages.length} задач):
                </h4>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 w-8">#</th>
                        <th className="p-2.5">Этап работ</th>
                        <th className="p-2.5 text-center">Старт</th>
                        <th className="p-2.5 text-center">Финиш</th>
                        <th className="p-2.5 text-center">Дней</th>
                        <th className="p-2.5">Зависимость</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {calculateStagesTimeline(currentTemplate, applyStartDate).map((item, idx) => (
                        <tr key={item.stage.id} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-2.5">
                            <div className="font-extrabold text-slate-900">{item.stage.title}</div>
                            {item.stage.norm_notes && (
                              <div className="text-[10px] text-amber-700 font-medium">
                                {item.stage.norm_notes}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-800 whitespace-nowrap">
                            {item.startDate}
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-800 whitespace-nowrap">
                            {item.dueDate}
                          </td>
                          <td className="p-2.5 text-center font-black text-brand-600">
                            {item.stage.duration_days} дн.
                          </td>
                          <td className="p-2.5 text-[11px]">
                            {item.predecessorTitles.length > 0 ? (
                              <span className="text-purple-700 font-bold flex items-center gap-1">
                                <GitBranch className="w-3 h-3" />
                                <span>После: {item.predecessorTitles.join(', ')}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">Стартовый</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Execution Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Назад
                </button>
                <button
                  type="button"
                  onClick={handleExecuteApply}
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-black rounded-xl shadow-md transition-all hover:scale-[1.02]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Запустить график в планер & Гант</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
