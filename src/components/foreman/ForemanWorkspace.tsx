'use client';

import React, { useState } from 'react';
import { UserProfile, Project, Expense, Worker } from '@/types';
import { storage } from '@/lib/storage';
import { 
  HardHat, 
  Camera, 
  Plus, 
  CheckCircle2, 
  LogOut, 
  Users, 
  Building, 
  Layers, 
  Receipt, 
  Clock, 
  MapPin, 
  Package, 
  DollarSign,
  Save
} from 'lucide-react';
import { formatEur } from '@/lib/slovak-vat';

interface ForemanWorkspaceProps {
  user: UserProfile;
  projects: Project[];
  workers: Worker[];
  onLogout: () => void;
  onExpenseAdded: () => void;
}

export const ForemanWorkspace: React.FC<ForemanWorkspaceProps> = ({
  user,
  projects,
  workers,
  onLogout,
  onExpenseAdded,
}) => {
  const [activeTab, setActiveTab] = useState<'receipt' | 'timesheet' | 'warehouse'>('receipt');

  // Filter projects (show active projects or assigned)
  const activeProjects = projects.filter(p => p.status === 'in_progress');

  // Receipt state
  const [selectedProjectId, setSelectedProjectId] = useState(activeProjects[0]?.id || '');
  const [expenseCategory, setExpenseCategory] = useState<'materials' | 'labor' | 'waste_disposal' | 'tools_machinery'>('materials');
  const [vendor, setVendor] = useState('Hornbach');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Карта фірма');
  const [receiptSaved, setReceiptSaved] = useState(false);

  // Timesheet state
  const [selectedWorker, setSelectedWorker] = useState(workers[0]?.name || 'Махмуд');
  const [workerHours, setWorkerHours] = useState('8');
  const [workType, setWorkType] = useState('Укладка плитки');
  const [timesheetSaved, setTimesheetSaved] = useState(false);

  // Warehouse request state
  const [warehouseItem, setWarehouseItem] = useState('Клей плиточный (мешки)');
  const [warehouseQty, setWarehouseQty] = useState('10');
  const [warehouseSent, setWarehouseSent] = useState(false);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) return;

    const prj = projects.find(p => p.id === selectedProjectId);
    const newExp: Expense = {
      id: `exp-fm-${Date.now()}`,
      project_id: selectedProjectId,
      category: expenseCategory,
      vendor: vendor,
      description: description ? `${description} (${vendor})` : `Покупка на объект (${vendor})`,
      amount_without_vat: numAmount,
      vat_rate: 0,
      vat_amount: 0,
      amount_with_vat: numAmount,
      receipt_number: `RCP-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      paid_by: `${paymentMethod} (Внес: ${user.name})`,
      status: 'approved',
    };

    const exps = storage.getExpenses();
    storage.saveExpenses([newExp, ...exps]);
    onExpenseAdded();

    setAmount('');
    setDescription('');
    setReceiptSaved(true);
    setTimeout(() => setReceiptSaved(false), 3000);
  };

  const handleSaveTimesheet = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(workerHours) || 0;
    const earned = hours * 14; // базовая ставка

    const newExp: Expense = {
      id: `exp-wrk-${Date.now()}`,
      project_id: selectedProjectId,
      category: 'labor',
      vendor: `Мастер: ${selectedWorker}`,
      description: `Работа: ${workType} (${hours} ч.). Бригадир: ${user.name}`,
      amount_without_vat: earned,
      vat_rate: 0,
      vat_amount: 0,
      amount_with_vat: earned,
      date: new Date().toISOString().split('T')[0],
      paid_by: 'Карта ліва',
      status: 'approved',
    };

    const exps = storage.getExpenses();
    storage.saveExpenses([newExp, ...exps]);
    onExpenseAdded();

    setTimesheetSaved(true);
    setTimeout(() => setTimesheetSaved(false), 3000);
  };

  const handleSendWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    setWarehouseSent(true);
    setTimeout(() => setWarehouseSent(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 pb-20 max-w-xl mx-auto space-y-6">
      {/* Top Foreman Header */}
      <div className="bg-slate-850 rounded-2xl p-5 border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center shadow-lg">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white">{user.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Бригадир / Прораб
              </span>
            </div>
            <p className="text-xs text-slate-400">Внесение чеков и табель рабочих</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors"
          title="Сменить профиль"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-850 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('receipt')}
          className={`py-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeTab === 'receipt'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Внести чек</span>
        </button>

        <button
          onClick={() => setActiveTab('timesheet')}
          className={`py-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeTab === 'timesheet'
              ? 'bg-brand-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Табель смены</span>
        </button>

        <button
          onClick={() => setActiveTab('warehouse')}
          className={`py-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeTab === 'warehouse'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Заказ со склада</span>
        </button>
      </div>

      {/* TAB 1: ADD RECEIPT */}
      {activeTab === 'receipt' && (
        <form onSubmit={handleSaveExpense} className="bg-slate-850 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-lg">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Быстрый чек с объекта</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Сумма сразу запишется в расходы выбранного объекта
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Выберите объект:*</label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-white font-bold text-sm"
              >
                {activeProjects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.address})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Сумма по чеку (€)*</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="45.90"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-750 rounded-xl font-mono text-base font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Магазин / Поставщик</label>
                <select
                  value={vendor}
                  onChange={e => setVendor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-white font-bold"
                >
                  <option value="Hornbach">Hornbach</option>
                  <option value="OBI">OBI</option>
                  <option value="Prespor">Prespor</option>
                  <option value="Siko">Siko</option>
                  <option value="Ikea">Ikea</option>
                  <option value="Мусор Хемицка">Мусор Хемицка</option>
                  <option value="Другой">Другой магазин</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Категория</label>
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-white font-bold"
                >
                  <option value="materials">Материалы СТРОЙ</option>
                  <option value="materials">Материалы ДИЗАЙН</option>
                  <option value="waste_disposal">Вывоз мусора</option>
                  <option value="tools_machinery">Инструмент</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Что куплено (описание):</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Клей для плитки C2TE (5 мешков), крестики"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Способ оплаты:</label>
              <div className="grid grid-cols-3 gap-2">
                {['Карта фірма', 'Карта ліва', 'Готівка'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 rounded-xl text-[11px] font-bold border transition-all ${
                      paymentMethod === m
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-900 border-slate-750 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Сохранить чек по объекту</span>
          </button>

          {receiptSaved && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Чек успешно добавлен в расходы объекта!</span>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: TIMESHEET */}
      {activeTab === 'timesheet' && (
        <form onSubmit={handleSaveTimesheet} className="bg-slate-850 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-lg">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" />
              <span>Табель рабочих на объекте</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Отметка отработанных часов мастерами за сегодня
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Выберите объект:*</label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-white font-bold"
              >
                {activeProjects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Имя мастера:</label>
              <div className="grid grid-cols-2 gap-2">
                {['Махмуд', 'Эзис', 'Борис', 'Андрей'].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSelectedWorker(w)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedWorker === w
                        ? 'bg-brand-500 border-brand-400 text-slate-950'
                        : 'bg-slate-900 border-slate-750 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Часов отработано:</label>
              <div className="grid grid-cols-4 gap-2">
                {['4', '6', '8', '10'].map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setWorkerHours(h)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      workerHours === h
                        ? 'bg-brand-500 border-brand-400 text-slate-950'
                        : 'bg-slate-900 border-slate-750 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {h} ч.
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Что выполнялось:</label>
              <input
                type="text"
                value={workType}
                onChange={e => setWorkType(e.target.value)}
                placeholder="Укладка плитки в санузле"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Записать смену мастера</span>
          </button>

          {timesheetSaved && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Часы мастера записаны в расходы объекта!</span>
            </div>
          )}
        </form>
      )}

      {/* TAB 3: WAREHOUSE REQUEST */}
      {activeTab === 'warehouse' && (
        <form onSubmit={handleSendWarehouse} className="bg-slate-850 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-lg">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              <span>Заказ материалов со склада</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Водитель Vito получит уведомление на доставку
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Куда доставить (объект):</label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-white font-bold"
              >
                {activeProjects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Материал:</label>
              <select
                value={warehouseItem}
                onChange={e => setWarehouseItem(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-white font-bold"
              >
                <option value="Клей плиточный (мешки)">Клей плиточный (мешки)</option>
                <option value="Гипсокартон 12.5мм (листы)">Гипсокартон 12.5мм (листы)</option>
                <option value="Профиль CD/UD">Профиль CD/UD</option>
                <option value="Кабель ВВГ 3х2.5 (бухта)">Кабель ВВГ 3х2.5 (бухта)</option>
                <option value="Мешки для мусора">Мешки для мусора</option>
                <option value="Грунтовка глубокого проникновения">Грунтовка глубокого проникновения</option>
                <option value="Плёнка защитная">Плёнка защитная</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Количество:</label>
              <input
                type="text"
                value={warehouseQty}
                onChange={e => setWarehouseQty(e.target.value)}
                placeholder="10 шт / мешков"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-white font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span>Отправить заявку на доставку водителю</span>
          </button>

          {warehouseSent && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Заявка передана водителю на склад!</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
