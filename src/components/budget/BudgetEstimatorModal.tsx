'use client';

import React, { useState } from 'react';
import { 
  BudgetEstimate, 
  BudgetItem, 
  Project, 
  Client, 
  CompanySettings, 
  WorkCategory, 
  WorkUnit 
} from '@/types';
import { CONSTRUCTION_CATALOG, CatalogItem } from '@/lib/catalog';
import { formatCurrency, formatPercent, SLOVAK_VAT_RATES, calculateVat } from '@/lib/slovak-vat';
import { printQuoteDocument } from '@/lib/pdf-generator';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Printer, 
  Sparkles, 
  Save, 
  X, 
  Search, 
  Percent, 
  DollarSign,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface BudgetEstimatorModalProps {
  budget?: BudgetEstimate;
  projects: Project[];
  clients: Client[];
  settings: CompanySettings;
  onClose: () => void;
  onSaveBudget: (budget: BudgetEstimate) => void;
}

const COMMON_ROOMS = [
  'Вся квартира',
  'Ванная комната',
  'Санузел / WC',
  'Кухня',
  'Гостиная',
  'Спальня',
  'Коридор / Прихожая',
  'Балкон / Лоджия',
  'Фасад / Экстерьер',
  'Кровля',
];

export const BudgetEstimatorModal: React.FC<BudgetEstimatorModalProps> = ({
  budget,
  projects,
  clients,
  settings,
  onClose,
  onSaveBudget,
}) => {
  const [projectId, setProjectId] = useState<string>(
    budget?.project_id || (projects.length > 0 ? projects[0].id : '')
  );
  const [title, setTitle] = useState<string>(
    budget?.title || 'Смета и Выказ вымер (Výkaz výmer)'
  );
  const [vatRate, setVatRate] = useState<number>(budget?.vat_rate ?? 23);
  const [isReverseCharge, setIsReverseCharge] = useState<boolean>(
    budget?.is_reverse_charge ?? false
  );
  const [items, setItems] = useState<BudgetItem[]>(budget?.items || []);
  const [selectedRoom, setSelectedRoom] = useState<string>('Вся квартира');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');

  // Add Item from Catalog
  const handleAddCatalogItem = (catItem: CatalogItem) => {
    const defaultQty = 10;
    const laborCost = catItem.defaultCostLabor;
    const matCost = catItem.defaultCostMaterial;
    const clientPrice = catItem.defaultClientPrice;

    const totalCost = (laborCost + matCost) * defaultQty;
    const totalPrice = clientPrice * defaultQty;
    const marginAmount = totalPrice - totalCost;
    const marginPercent = totalPrice > 0 ? (marginAmount / totalPrice) * 100 : 0;

    const newItem: BudgetItem = {
      id: `bi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category: catItem.category,
      name: `${catItem.nameRu} (${catItem.nameSk})`,
      room: selectedRoom,
      unit: catItem.unit,
      quantity: defaultQty,
      unit_cost_labor: laborCost,
      unit_cost_material: matCost,
      unit_price_client: clientPrice,
      total_cost: Math.round(totalCost * 100) / 100,
      total_price_client: Math.round(totalPrice * 100) / 100,
      margin_amount: Math.round(marginAmount * 100) / 100,
      margin_percent: Math.round(marginPercent * 10) / 10,
    };

    setItems([...items, newItem]);
  };

  // Add Custom blank item
  const handleAddCustomItem = () => {
    const newItem: BudgetItem = {
      id: `bi-${Date.now()}`,
      category: 'other',
      name: 'Новая строительная работа / материал',
      room: selectedRoom,
      unit: 'm2',
      quantity: 1,
      unit_cost_labor: 10,
      unit_cost_material: 5,
      unit_price_client: 25,
      total_cost: 15,
      total_price_client: 25,
      margin_amount: 10,
      margin_percent: 40,
    };
    setItems([...items, newItem]);
  };

  // Update Item in state
  const handleUpdateItem = (index: number, field: keyof BudgetItem, val: any) => {
    const updated = [...items];
    const cur = { ...updated[index], [field]: val };

    const qty = Number(cur.quantity) || 0;
    const labor = Number(cur.unit_cost_labor) || 0;
    const mat = Number(cur.unit_cost_material) || 0;
    const clientPrice = Number(cur.unit_price_client) || 0;

    const totalCost = (labor + mat) * qty;
    const totalPrice = clientPrice * qty;
    const marginAmount = totalPrice - totalCost;
    const marginPercent = totalPrice > 0 ? (marginAmount / totalPrice) * 100 : 0;

    cur.total_cost = Math.round(totalCost * 100) / 100;
    cur.total_price_client = Math.round(totalPrice * 100) / 100;
    cur.margin_amount = Math.round(marginAmount * 100) / 100;
    cur.margin_percent = Math.round(marginPercent * 10) / 10;

    updated[index] = cur;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Totals calculations
  const totalLaborCost = items.reduce((sum, i) => sum + (i.unit_cost_labor * i.quantity), 0);
  const totalMaterialCost = items.reduce((sum, i) => sum + (i.unit_cost_material * i.quantity), 0);
  const totalCost = totalLaborCost + totalMaterialCost;
  const totalClientPrice = items.reduce((sum, i) => sum + i.total_price_client, 0);
  const totalMarginAmount = totalClientPrice - totalCost;
  const totalMarginPercent = totalClientPrice > 0 ? (totalMarginAmount / totalClientPrice) * 100 : 0;

  const vatCalc = calculateVat(totalClientPrice, vatRate, isReverseCharge);

  const handleSave = () => {
    if (!projectId) {
      alert('Выберите проект для привязки сметы');
      return;
    }

    const savedBudget: BudgetEstimate = {
      id: budget?.id || `bgt-${Date.now()}`,
      project_id: projectId,
      title,
      created_at: budget?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items,
      total_labor_cost: Math.round(totalLaborCost * 100) / 100,
      total_material_cost: Math.round(totalMaterialCost * 100) / 100,
      total_cost: Math.round(totalCost * 100) / 100,
      total_client_price: Math.round(totalClientPrice * 100) / 100,
      vat_rate: vatCalc.vatRate,
      vat_amount: vatCalc.vatAmount,
      total_with_vat: vatCalc.totalAmount,
      margin_amount: Math.round(totalMarginAmount * 100) / 100,
      margin_percent: Math.round(totalMarginPercent * 10) / 10,
      is_reverse_charge: isReverseCharge,
      status: 'approved',
    };

    onSaveBudget(savedBudget);
    onClose();
  };

  const handlePrint = () => {
    const currentProject = projects.find(p => p.id === projectId);
    const currentClient = clients.find(c => c.id === currentProject?.client_id);
    
    const draftBudget: BudgetEstimate = {
      id: budget?.id || 'bgt-draft',
      project_id: projectId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items,
      total_labor_cost: totalLaborCost,
      total_material_cost: totalMaterialCost,
      total_cost: totalCost,
      total_client_price: totalClientPrice,
      vat_rate: vatCalc.vatRate,
      vat_amount: vatCalc.vatAmount,
      total_with_vat: vatCalc.totalAmount,
      margin_amount: totalMarginAmount,
      margin_percent: totalMarginPercent,
      is_reverse_charge: isReverseCharge,
      status: 'approved',
    };

    printQuoteDocument(draftBudget, currentClient, currentProject, settings);
  };

  const filteredCatalog = CONSTRUCTION_CATALOG.filter(c => {
    const matchesSearch = 
      c.nameRu.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      c.nameSk.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesCat = catalogCategory === 'all' ? true : c.category === catalogCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Конструктор смет и Выказ вымер (Výkaz výmer)
              </h2>
              <p className="text-xs text-slate-400">
                Калькуляция себестоимости, расчет чистой маржи и экспорт Cenová ponuka
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Печать PDF</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Сохранить смету</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors text-xl font-bold"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Top Options Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 shrink-0 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Привязка к объекту</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Название сметы</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Смета на ремонт..."
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Ставка DPH Словакии</label>
            <select
              value={vatRate}
              disabled={isReverseCharge}
              onChange={(e) => setVatRate(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            >
              {SLOVAK_VAT_RATES.map((vr) => (
                <option key={vr.rate} value={vr.rate}>{vr.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isReverseCharge}
                onChange={(e) => setIsReverseCharge(e.target.checked)}
                className="rounded text-brand-500 focus:ring-brand-500"
              />
              <span className="font-bold text-slate-800">§ 69 Prenesenie dane (0% DPH)</span>
            </label>
          </div>
        </div>

        {/* Main Workspace: Left Catalog / Right Items Table */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Quick Catalog Picker */}
          <div className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  Справочник работ Словакии
                </span>
              </div>

              {/* Room selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Добавлять в помещение:
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-semibold text-slate-800"
                >
                  {COMMON_ROOMS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Catalog Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Поиск работы (плитка, стяжка...)"
                  className="w-full pl-8 pr-2 py-1 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Catalog Items List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredCatalog.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleAddCatalogItem(cat)}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-brand-50/40 cursor-pointer transition-all text-xs group"
                >
                  <div className="font-bold text-slate-900 group-hover:text-brand-600">
                    {cat.nameRu}
                  </div>
                  <div className="text-[11px] text-slate-400 italic">
                    {cat.nameSk}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Себестоимость: {cat.defaultCostLabor + cat.defaultCostMaterial} €/{cat.unit}</span>
                    <span className="font-bold text-brand-600">Клиенту: {cat.defaultClientPrice} €/{cat.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Items in Estimate */}
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            {/* Table Action Bar */}
            <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-800">
                Позиций в смете: {items.length} шт.
              </span>

              <button
                onClick={handleAddCustomItem}
                className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Добавить произвольную строку</span>
              </button>
            </div>

            {/* Items Table */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-semibold">
                    <tr>
                      <th className="p-2.5">Помещение</th>
                      <th className="p-2.5">Работа / Позиция</th>
                      <th className="p-2.5 w-20 text-center">Кол-во</th>
                      <th className="p-2.5 w-16 text-center">Ед.</th>
                      <th className="p-2.5 w-24 text-right">Мастер (€)</th>
                      <th className="p-2.5 w-24 text-right">Материал (€)</th>
                      <th className="p-2.5 w-28 text-right">Клиенту (€/ед)</th>
                      <th className="p-2.5 w-28 text-right">Всего клиенту</th>
                      <th className="p-2.5 w-24 text-right">Маржа %</th>
                      <th className="p-2.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.room || ''}
                            onChange={(e) => handleUpdateItem(idx, 'room', e.target.value)}
                            className="w-24 px-1.5 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-16 px-1.5 py-1 text-xs text-center border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value as WorkUnit)}
                            className="px-1 py-1 text-xs border border-slate-200 rounded font-semibold"
                          >
                            <option value="m2">m²</option>
                            <option value="m3">m³</option>
                            <option value="bm">bm</option>
                            <option value="ks">ks</option>
                            <option value="hod">hod</option>
                            <option value="kpl">kpl</option>
                          </select>
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="any"
                            value={item.unit_cost_labor}
                            onChange={(e) => handleUpdateItem(idx, 'unit_cost_labor', parseFloat(e.target.value) || 0)}
                            className="w-20 px-1.5 py-1 text-xs text-right border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-600"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="any"
                            value={item.unit_cost_material}
                            onChange={(e) => handleUpdateItem(idx, 'unit_cost_material', parseFloat(e.target.value) || 0)}
                            className="w-20 px-1.5 py-1 text-xs text-right border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-600"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="any"
                            value={item.unit_price_client}
                            onChange={(e) => handleUpdateItem(idx, 'unit_price_client', parseFloat(e.target.value) || 0)}
                            className="w-24 px-1.5 py-1 text-xs text-right border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 font-extrabold text-slate-900 bg-amber-50/40"
                          />
                        </td>
                        <td className="p-2 text-right font-extrabold text-slate-900">
                          {formatCurrency(item.total_price_client)}
                        </td>
                        <td className="p-2 text-right font-bold text-brand-600">
                          {formatPercent(item.margin_percent)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center py-10 text-slate-400">
                          Смета пуста. Выберите работы из каталога слева или добавьте произвольную строку.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Sticky Summary Dashboard */}
            <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0 shadow-lg">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Себестоимость (Затраты)</span>
                <div className="text-base font-extrabold text-slate-800 mt-0.5">
                  {formatCurrency(totalCost)}
                </div>
                <div className="text-[10px] text-slate-500">Работа: {formatCurrency(totalLaborCost)} | Мат: {formatCurrency(totalMaterialCost)}</div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-700">Чистая прибыль (Маржа)</span>
                <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                  {formatCurrency(totalMarginAmount)}
                </div>
                <div className="text-[10px] font-bold text-emerald-600">Рентабельность: {formatPercent(totalMarginPercent)}</div>
              </div>

              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[10px] uppercase font-bold text-blue-700">Сумма без НДС</span>
                <div className="text-base font-extrabold text-blue-900 mt-0.5">
                  {formatCurrency(totalClientPrice)}
                </div>
                <div className="text-[10px] text-blue-600">НДС ({vatCalc.vatRate}%): {formatCurrency(vatCalc.vatAmount)}</div>
              </div>

              <div className="p-2.5 bg-brand-500 text-white rounded-xl shadow-md">
                <span className="text-[10px] uppercase font-bold opacity-80">Итого с DPH для клиента</span>
                <div className="text-lg font-black mt-0.5">
                  {formatCurrency(vatCalc.totalAmount)}
                </div>
                <div className="text-[10px] opacity-90">{isReverseCharge ? '§ 69 Prenesenie dane' : 'Включая DPH'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
