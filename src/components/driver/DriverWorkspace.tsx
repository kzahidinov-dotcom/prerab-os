'use client';

import React, { useState } from 'react';
import { UserProfile, Expense } from '@/types';
import { storage } from '@/lib/storage';
import { 
  Truck, 
  Clock, 
  Fuel, 
  Plus, 
  CheckCircle2, 
  Camera, 
  LogOut, 
  Navigation, 
  Calendar, 
  DollarSign, 
  Gauge, 
  Layers,
  MapPin,
  Save
} from 'lucide-react';
import { formatEur } from '@/lib/slovak-vat';

interface DriverWorkspaceProps {
  user: UserProfile;
  onLogout: () => void;
  onExpenseAdded: () => void;
}

export const DriverWorkspace: React.FC<DriverWorkspaceProps> = ({
  user,
  onLogout,
  onExpenseAdded,
}) => {
  const [activeTab, setActiveTab] = useState<'shift' | 'fuel' | 'deliveries'>('shift');
  
  // Shift state
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shiftHours, setShiftHours] = useState('8');
  const [startKm, setStartKm] = useState('241500');
  const [endKm, setEndKm] = useState('241620');
  const [shiftNotes, setShiftNotes] = useState('');
  const [shiftSaved, setShiftSaved] = useState(false);

  // Fuel form state
  const [fuelAmount, setFuelAmount] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelKm, setFuelKm] = useState('241580');
  const [gasStation, setGasStation] = useState('Slovnaft');
  const [paymentMethod, setPaymentMethod] = useState('Карта фірма');
  const [fuelSaved, setFuelSaved] = useState(false);

  // Deliveries checklist
  const [deliveries, setDeliveries] = useState([
    { id: 'del-1', from: 'Склад Prerab', to: 'Объект Jaslovska', item: '15 мешков клея C2TE, грунтовка Mapei', status: 'completed' },
    { id: 'del-2', from: 'Prespor Bratislava', to: 'Объект Hergovic', item: 'Гипсокартон 12.5мм (20 листов), профили CD/UD', status: 'pending' },
    { id: 'del-3', from: 'Siko Kúpeľne', to: 'Объект Kpt. Rašu', item: 'Керамогранит 60х120 (8 коробок), трап душевой', status: 'pending' },
  ]);

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(shiftHours) || 0;
    const earned = hours * 7; // 7 €/час ставка водителя

    // Save as general company expense (Зарплата водителя)
    const newExp: Expense = {
      id: `exp-drv-${Date.now()}`,
      project_id: '', // General overhead
      category: 'labor',
      vendor: `Зарплата: ${user.name}`,
      description: `Смена водителя Vito: ${hours} ч. (${startKm} - ${endKm} км). ${shiftNotes}`,
      amount_without_vat: earned,
      vat_rate: 0,
      vat_amount: 0,
      amount_with_vat: earned,
      date: new Date().toISOString().split('T')[0],
      paid_by: 'Готівка',
      status: 'approved',
    };

    const exps = storage.getExpenses();
    storage.saveExpenses([newExp, ...exps]);
    onExpenseAdded();

    setShiftSaved(true);
    setTimeout(() => setShiftSaved(false), 3000);
  };

  const handleSaveFuel = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(fuelAmount) || 0;
    if (amount <= 0) return;

    // Save as general company expense (Дизель Vito)
    const newExp: Expense = {
      id: `exp-fuel-${Date.now()}`,
      project_id: '', // General overhead
      category: 'transport_fuel',
      vendor: `АЗС ${gasStation}`,
      description: `Дизель Vito (${fuelLiters || 'полный бак'} л, ${fuelKm} км). Заправил: ${user.name}`,
      amount_without_vat: amount,
      vat_rate: 0,
      vat_amount: 0,
      amount_with_vat: amount,
      receipt_number: `GAS-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      paid_by: paymentMethod,
      status: 'approved',
    };

    const exps = storage.getExpenses();
    storage.saveExpenses([newExp, ...exps]);
    onExpenseAdded();

    setFuelAmount('');
    setFuelLiters('');
    setFuelSaved(true);
    setTimeout(() => setFuelSaved(false), 3000);
  };

  const toggleDelivery = (id: string) => {
    setDeliveries(deliveries.map(d => d.id === id ? { ...d, status: d.status === 'completed' ? 'pending' : 'completed' } : d));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 pb-20 max-w-xl mx-auto space-y-6">
      {/* Top Driver Header */}
      <div className="bg-slate-850 rounded-2xl p-5 border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center shadow-lg">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white">{user.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Mercedes Vito
              </span>
            </div>
            <p className="text-xs text-slate-400">Кабинет водителя и снабжения</p>
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

      {/* Mode Switcher Tabs (3 Big Touch Buttons) */}
      <div className="grid grid-cols-3 gap-2 bg-slate-850 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('shift')}
          className={`py-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeTab === 'shift'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Мои часы</span>
        </button>

        <button
          onClick={() => setActiveTab('fuel')}
          className={`py-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeTab === 'fuel'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>Заправка Vito</span>
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`py-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
            activeTab === 'deliveries'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Доставки</span>
        </button>
      </div>

      {/* TAB 1: SHIFT / HOURS WORKED */}
      {activeTab === 'shift' && (
        <form onSubmit={handleSaveShift} className="bg-slate-850 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-lg">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Запись часов работы за сегодня</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ставка: 7 € / час &middot; Дата: {new Date().toLocaleDateString('sk-SK')}
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Сколько часов отработано сегодня:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['6', '8', '10', '12'].map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setShiftHours(h)}
                    className={`py-2.5 rounded-xl font-bold border transition-all ${
                      shiftHours === h
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-900 border-slate-750 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {h} часов
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Пробег утром (км)</label>
                <input
                  type="number"
                  value={startKm}
                  onChange={e => setStartKm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl font-mono text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Пробег вечером (км)</label>
                <input
                  type="number"
                  value={endKm}
                  onChange={e => setEndKm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Комментарий к дню (объекты / маршрут)</label>
              <input
                type="text"
                value={shiftNotes}
                onChange={e => setShiftNotes(e.target.value)}
                placeholder="Склад -> Jaslovska -> Prespor -> Hergovic"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="p-3.5 bg-blue-950/40 rounded-xl border border-blue-800/40 flex items-center justify-between text-xs font-bold">
            <span className="text-blue-300">Заработано за смену:</span>
            <span className="text-base text-white font-black">
              {(parseFloat(shiftHours) || 0) * 7} €
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Сохранить смену в табель</span>
          </button>

          {shiftSaved && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Часы успешно записаны и добавлены в расходы фирмы!</span>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: FUEL / VITO EXPENSE */}
      {activeTab === 'fuel' && (
        <form onSubmit={handleSaveFuel} className="bg-slate-850 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-lg">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Fuel className="w-4 h-4 text-amber-400" />
              <span>Внесение чека за дизель (Vito)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Сумма сразу запишется в транспортные расходы компании
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Сумма по чеку (€)*</label>
              <input
                type="number"
                step="0.01"
                required
                value={fuelAmount}
                onChange={e => setFuelAmount(e.target.value)}
                placeholder="75.50"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-750 rounded-xl font-mono text-base font-bold text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Литров дизеля</label>
                <input
                  type="number"
                  step="0.1"
                  value={fuelLiters}
                  onChange={e => setFuelLiters(e.target.value)}
                  placeholder="50"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl font-mono text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Заправка (АЗС)</label>
                <select
                  value={gasStation}
                  onChange={e => setGasStation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-white font-bold"
                >
                  <option value="Slovnaft">Slovnaft</option>
                  <option value="OMV">OMV</option>
                  <option value="Shell">Shell</option>
                  <option value="Orlen">Orlen</option>
                  <option value="Другая АЗС">Другая АЗС</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Чем оплатили:</label>
              <div className="grid grid-cols-3 gap-2">
                {['Карта фірма', 'Карта ліва', 'Готівка'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 rounded-xl text-[11px] font-bold border transition-all ${
                      paymentMethod === m
                        ? 'bg-amber-600 border-amber-500 text-white'
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
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Сохранить чек на дизель</span>
          </button>

          {fuelSaved && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Чек на дизель успешно сохранен в базе!</span>
            </div>
          )}
        </form>
      )}

      {/* TAB 3: DELIVERIES */}
      {activeTab === 'deliveries' && (
        <div className="bg-slate-850 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-lg">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>Список доставок и закупки материалов</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Нажмите на доставку, чтобы отметить выполнение
            </p>
          </div>

          <div className="space-y-2.5">
            {deliveries.map(del => (
              <div
                key={del.id}
                onClick={() => toggleDelivery(del.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  del.status === 'completed'
                    ? 'bg-slate-900/60 border-slate-800 opacity-60'
                    : 'bg-slate-900 border-slate-750 hover:border-emerald-500/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 ${
                  del.status === 'completed'
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'border-slate-600'
                }`}>
                  {del.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-slate-400">{del.from}</span>
                    <span className="text-brand-400">&rarr;</span>
                    <span className="text-emerald-400">{del.to}</span>
                  </div>
                  <p className="text-slate-300">{del.item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
