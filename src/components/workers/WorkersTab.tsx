'use client';

import React, { useState } from 'react';
import { Worker, WorkLog, Project, WorkerRole, WageType } from '@/types';
import { formatCurrency } from '@/lib/slovak-vat';
import { 
  HardHat, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Edit2, 
  Calendar, 
  DollarSign,
  UserCheck,
  Building
} from 'lucide-react';

interface WorkersTabProps {
  workers: Worker[];
  workLogs: WorkLog[];
  projects: Project[];
  onSaveWorker: (worker: Worker) => void;
  onDeleteWorker: (workerId: string) => void;
  onSaveWorkLog: (log: WorkLog) => void;
  onDeleteWorkLog: (logId: string) => void;
}

const ROLE_MAP: Record<WorkerRole, string> = {
  foreman: 'Прораб / Бригадир',
  tiler: 'Плиточник (Obkladač)',
  plasterer: 'Штукатур / Маляр',
  drywaller: 'Гипсокартонщик',
  electrician: 'Электрик',
  plumber: 'Сантехник',
  mason: 'Каменщик / Общестрой',
  helper: 'Разнорабочий / Подсобник',
  subcontractor: 'Субподрядчик (SZČO)',
};

export const WorkersTab: React.FC<WorkersTabProps> = ({
  workers,
  workLogs,
  projects,
  onSaveWorker,
  onDeleteWorker,
  onSaveWorkLog,
  onDeleteWorkLog,
}) => {
  const [activeTab, setActiveTab] = useState<'workers' | 'logs'>('workers');
  const [searchTerm, setSearchTerm] = useState('');
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Worker Form State
  const [workerFormData, setWorkerFormData] = useState<Partial<Worker>>({
    name: '',
    phone: '+421 ',
    role: 'tiler',
    wage_type: 'hourly',
    rate: 12,
    ico: '',
    notes: '',
    active: true,
  });

  // Work Log Form State
  const [logFormData, setLogFormData] = useState<Partial<WorkLog>>({
    worker_id: workers.length > 0 ? workers[0].id : '',
    project_id: projects.length > 0 ? projects[0].id : '',
    date: new Date().toISOString().split('T')[0],
    hours_worked: 8,
    work_description: '',
    unit_done: 0,
    unit_type: 'm2',
    total_earned: 0,
    is_paid: false,
  });

  const handleOpenNewWorker = () => {
    setWorkerFormData({
      name: '',
      phone: '+421 ',
      role: 'tiler',
      wage_type: 'hourly',
      rate: 12,
      ico: '',
      notes: '',
      active: true,
    });
    setIsWorkerModalOpen(true);
  };

  const handleOpenNewLog = () => {
    const defaultWorker = workers[0];
    const initialRate = defaultWorker ? defaultWorker.rate : 10;
    setLogFormData({
      worker_id: defaultWorker?.id || '',
      project_id: projects[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      hours_worked: 8,
      work_description: '',
      unit_done: 0,
      unit_type: 'm2',
      total_earned: defaultWorker?.wage_type === 'hourly' ? initialRate * 8 : initialRate * 10,
      is_paid: false,
    });
    setIsLogModalOpen(true);
  };

  const handleSubmitWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerFormData.name) return;

    const newWorker: Worker = {
      id: workerFormData.id || `wrk-${Date.now()}`,
      name: workerFormData.name,
      phone: workerFormData.phone || '',
      role: workerFormData.role || 'helper',
      wage_type: workerFormData.wage_type || 'hourly',
      rate: Number(workerFormData.rate) || 10,
      ico: workerFormData.ico || '',
      notes: workerFormData.notes || '',
      active: true,
    };

    onSaveWorker(newWorker);
    setIsWorkerModalOpen(false);
  };

  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logFormData.worker_id || !logFormData.project_id) return;

    const worker = workers.find(w => w.id === logFormData.worker_id);
    const rate = worker ? worker.rate : 10;

    let earned = Number(logFormData.total_earned) || 0;
    if (!earned) {
      if (worker?.wage_type === 'hourly') {
        earned = (Number(logFormData.hours_worked) || 0) * rate;
      } else {
        earned = (Number(logFormData.unit_done) || 0) * rate;
      }
    }

    const newLog: WorkLog = {
      id: `wl-${Date.now()}`,
      worker_id: logFormData.worker_id,
      project_id: logFormData.project_id,
      date: logFormData.date || new Date().toISOString().split('T')[0],
      hours_worked: Number(logFormData.hours_worked) || 0,
      work_description: logFormData.work_description || 'Строительно-монтажные работы',
      unit_done: Number(logFormData.unit_done) || undefined,
      unit_type: logFormData.unit_type || 'm2',
      total_earned: earned,
      is_paid: !!logFormData.is_paid,
    };

    onSaveWorkLog(newLog);
    setIsLogModalOpen(false);
  };

  const handleToggleLogPaid = (log: WorkLog) => {
    onSaveWorkLog({ ...log, is_paid: !log.is_paid });
  };

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.ico || '').includes(searchTerm)
  );

  const totalEarnedAll = workLogs.reduce((sum, l) => sum + l.total_earned, 0);
  const totalPaidAll = workLogs.filter(l => l.is_paid).reduce((sum, l) => sum + l.total_earned, 0);
  const totalPendingPayout = totalEarnedAll - totalPaidAll;

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Всего начислено мастерам</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(totalEarnedAll)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">По табелю и выполненным объемам</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 uppercase">Выплачено зарплат</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(totalPaidAll)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Закрытые наряды</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-amber-600 uppercase">Остаток к выплате</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {formatCurrency(totalPendingPayout)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Ожидает выдачи зарплаты</div>
        </div>
      </div>

      {/* Action and Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('workers')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'workers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            База мастеров ({workers.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'logs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Табель работ и часы ({workLogs.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenNewWorker}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Новый мастер</span>
          </button>
          <button
            onClick={handleOpenNewLog}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Записать часы / объем</span>
          </button>
        </div>
      </div>

      {/* TAB 1: WORKERS LIST */}
      {activeTab === 'workers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredWorkers.map((worker) => {
            const workerLogs = workLogs.filter(l => l.worker_id === worker.id);
            const earned = workerLogs.reduce((sum, l) => sum + l.total_earned, 0);
            const paid = workerLogs.filter(l => l.is_paid).reduce((sum, l) => sum + l.total_earned, 0);
            const balance = earned - paid;

            return (
              <div key={worker.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {ROLE_MAP[worker.role]}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Удалить мастера ${worker.name}?`)) {
                          onDeleteWorker(worker.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{worker.name}</h3>
                  <div className="text-xs text-slate-500 mt-1">{worker.phone}</div>

                  {worker.ico && (
                    <div className="text-[11px] text-slate-400 mt-1">SZČO / IČO: {worker.ico}</div>
                  )}

                  <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ставка:</span>
                      <strong className="text-slate-800">
                        {worker.rate} € / {worker.wage_type === 'hourly' ? 'час' : 'м²'}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Начислено:</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(earned)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">К выплате:</div>
                    <div className={`font-extrabold ${balance > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                      {formatCurrency(balance)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: WORK LOGS TABLE */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Дата</th>
                <th className="p-3.5">Мастер</th>
                <th className="p-3.5">Объект</th>
                <th className="p-3.5">Описание работы</th>
                <th className="p-3.5 text-center">Отработано</th>
                <th className="p-3.5 text-right">Начислено (€)</th>
                <th className="p-3.5 text-center">Выплата</th>
                <th className="p-3.5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {workLogs.map((log) => {
                const worker = workers.find(w => w.id === log.worker_id);
                const project = projects.find(p => p.id === log.project_id);

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="p-3.5 text-slate-500 font-medium whitespace-nowrap">{log.date}</td>
                    <td className="p-3.5 font-bold text-slate-900">{worker?.name || 'Мастер'}</td>
                    <td className="p-3.5 text-slate-700 font-medium">{project?.title || 'Объект'}</td>
                    <td className="p-3.5 text-slate-600">{log.work_description}</td>
                    <td className="p-3.5 text-center font-bold text-slate-800">
                      {log.unit_done ? `${log.unit_done} ${log.unit_type || 'm2'}` : `${log.hours_worked} ч.`}
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-slate-900">
                      {formatCurrency(log.total_earned)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleToggleLogPaid(log)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                          log.is_paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                      >
                        {log.is_paid ? 'Выплачено' : 'К выдаче'}
                      </button>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onDeleteWorkLog(log.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: New Worker */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Добавить мастера / специалиста</h3>
              <button onClick={() => setIsWorkerModalOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleSubmitWorker} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ФИО мастера*</label>
                <input
                  type="text"
                  required
                  value={workerFormData.name}
                  onChange={(e) => setWorkerFormData({ ...workerFormData, name: e.target.value })}
                  placeholder="Ján Molnár"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Специализация / Роль</label>
                <select
                  value={workerFormData.role}
                  onChange={(e) => setWorkerFormData({ ...workerFormData, role: e.target.value as WorkerRole })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {Object.entries(ROLE_MAP).map(([key, val]) => (
                    <option key={key} value={key}>{val}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Тип оплаты</label>
                  <select
                    value={workerFormData.wage_type}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, wage_type: e.target.value as WageType })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="hourly">Почасовая (€/час)</option>
                    <option value="piecework">Сдельная (€/м²)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Базовая ставка (€)</label>
                  <input
                    type="number"
                    step="any"
                    value={workerFormData.rate}
                    onChange={(e) => setWorkerFormData({ ...workerFormData, rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Телефон</label>
                <input
                  type="text"
                  value={workerFormData.phone}
                  onChange={(e) => setWorkerFormData({ ...workerFormData, phone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">IČO (если работает по Živnosť)</label>
                <input
                  type="text"
                  value={workerFormData.ico || ''}
                  onChange={(e) => setWorkerFormData({ ...workerFormData, ico: e.target.value })}
                  placeholder="51298411"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg"
                >
                  Добавить мастера
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Work Log */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Запись выполненных работ / часов</h3>
              <button onClick={() => setIsLogModalOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleSubmitLog} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Мастер*</label>
                <select
                  value={logFormData.worker_id}
                  onChange={(e) => setLogFormData({ ...logFormData, worker_id: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({ROLE_MAP[w.role]})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Объект*</label>
                <select
                  value={logFormData.project_id}
                  onChange={(e) => setLogFormData({ ...logFormData, project_id: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Дата</label>
                  <input
                    type="date"
                    value={logFormData.date}
                    onChange={(e) => setLogFormData({ ...logFormData, date: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Отработано часов</label>
                  <input
                    type="number"
                    step="any"
                    value={logFormData.hours_worked}
                    onChange={(e) => setLogFormData({ ...logFormData, hours_worked: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Описание работы</label>
                <input
                  type="text"
                  value={logFormData.work_description}
                  onChange={(e) => setLogFormData({ ...logFormData, work_description: e.target.value })}
                  placeholder="Шпаклевка стен, укладка плитки, штробление..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Сумма к начислению (€)*</label>
                <input
                  type="number"
                  step="any"
                  value={logFormData.total_earned}
                  onChange={(e) => setLogFormData({ ...logFormData, total_earned: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-extrabold text-brand-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg"
                >
                  Сохранить запись
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
