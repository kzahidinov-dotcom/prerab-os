'use client';

import React, { useState } from 'react';
import { Client, Project, ClientType } from '@/types';
import { lookupIcoSlovakia } from '@/lib/ico-lookup';
import { formatCurrency } from '@/lib/slovak-vat';
import { 
  Users, 
  Plus, 
  Building2, 
  User, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  FolderKanban,
  Edit2,
  Trash2,
  ExternalLink,
  Kanban,
  List
} from 'lucide-react';

interface CrmTabProps {
  clients: Client[];
  projects: Project[];
  onSaveClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onSelectProject: (projectId: string) => void;
  onOpenNewProjectWithClient: (clientId: string) => void;
}

export const CrmTab: React.FC<CrmTabProps> = ({
  clients,
  projects,
  onSaveClient,
  onDeleteClient,
  onSelectProject,
  onOpenNewProjectWithClient,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'person' | 'company'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Client>>({
    type: 'person',
    name: '',
    company_name: '',
    ico: '',
    dic: '',
    ic_dph: '',
    is_vat_payer: false,
    address: '',
    city: 'Bratislava',
    zip: '811 01',
    phone: '+421 ',
    email: '',
    notes: '',
  });

  const [isSearchingIco, setIsSearchingIco] = useState(false);
  const [icoSuccessMsg, setIcoSuccessMsg] = useState('');

  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.ico || '').includes(searchTerm) ||
      (c.phone || '').includes(searchTerm) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' ? true : c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({
      type: 'person',
      name: '',
      company_name: '',
      ico: '',
      dic: '',
      ic_dph: '',
      is_vat_payer: false,
      address: '',
      city: 'Bratislava',
      zip: '811 01',
      phone: '+421 ',
      email: '',
      notes: '',
    });
    setIcoSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setIcoSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleLookupIco = async () => {
    if (!formData.ico) return;
    setIsSearchingIco(true);
    setIcoSuccessMsg('');

    try {
      const res = await lookupIcoSlovakia(formData.ico);
      if (res) {
        setFormData(prev => ({
          ...prev,
          type: 'company',
          company_name: res.name,
          address: res.address || prev.address,
          city: res.city || prev.city,
          zip: res.zip || prev.zip,
          dic: res.dic || prev.dic,
          ic_dph: res.ic_dph || prev.ic_dph,
          is_vat_payer: res.is_vat_payer,
        }));
        setIcoSuccessMsg(`Данные компании "${res.name}" успешно подгружены из реестра!`);
      } else {
        alert('Компания с таким IČO не найдена в реестре Словакии.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingIco(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name && !formData.company_name) {
      alert('Укажите имя клиента или название компании');
      return;
    }

    const clientToSave: Client = {
      id: editingClient ? editingClient.id : `cli-${Date.now()}`,
      type: formData.type || 'person',
      name: formData.name || formData.company_name || 'Клиент',
      company_name: formData.company_name || '',
      ico: formData.ico || '',
      dic: formData.dic || '',
      ic_dph: formData.ic_dph || '',
      is_vat_payer: !!formData.is_vat_payer,
      address: formData.address || '',
      city: formData.city || 'Bratislava',
      zip: formData.zip || '',
      phone: formData.phone || '',
      email: formData.email || '',
      notes: formData.notes || '',
      created_at: editingClient ? editingClient.created_at : new Date().toISOString(),
    };

    onSaveClient(clientToSave);
    setIsModalOpen(false);
  };

  // Pipeline columns for Kanban view
  const PIPELINE_STAGES = [
    { id: 'lead', label: '1. Новая заявка / Лид', color: 'border-blue-500 bg-blue-50/40 text-blue-800' },
    { id: 'survey', label: '2. Замер и осмотр', color: 'border-purple-500 bg-purple-50/40 text-purple-800' },
    { id: 'quote_sent', label: '3. Смета отправлена', color: 'border-amber-500 bg-amber-50/40 text-amber-800' },
    { id: 'contract_signed', label: '4. Договор подписан', color: 'border-indigo-500 bg-indigo-50/40 text-indigo-800' },
    { id: 'in_progress', label: '5. В работе (Ремонт)', color: 'border-brand-500 bg-brand-50/40 text-brand-800' },
    { id: 'completed', label: '6. Сдан и закрыт', color: 'border-emerald-500 bg-emerald-50/40 text-emerald-800' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Список ({clients.length})</span>
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'pipeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Воронка сделок</span>
            </button>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Все клиенты</option>
            <option value="person">Физ. лица</option>
            <option value="company">Компании (s.r.o. / a.s.)</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по имени, IČO, телефону..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Новый клиент</span>
          </button>
        </div>
      </div>

      {/* View: Clients List */}
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const clientProjects = projects.filter(p => p.client_id === client.id);
            const totalProjectValue = clientProjects.reduce((sum, p) => sum + p.budget_estimated, 0);

            return (
              <div 
                key={client.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Top: Type Badge & Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      client.type === 'company'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {client.type === 'company' ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {client.type === 'company' ? 'Компания' : 'Физ. лицо'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        title="Редактировать"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Удалить клиента "${client.name}"?`)) {
                            onDeleteClient(client.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Client Name & Legal details */}
                  <h3 className="text-base font-bold text-slate-900">
                    {client.company_name || client.name}
                  </h3>
                  {client.company_name && (
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      Контакт: {client.name}
                    </div>
                  )}

                  {client.ico && (
                    <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-0.5">
                      <div><strong>IČO:</strong> {client.ico} &nbsp;|&nbsp; <strong>DIČ:</strong> {client.dic}</div>
                      {client.ic_dph && <div><strong>IČ DPH:</strong> {client.ic_dph} ({client.is_vat_payer ? 'Плательщик НДС' : 'Неплательщик'})</div>}
                    </div>
                  )}

                  {/* Contacts */}
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`tel:${client.phone}`} className="hover:text-brand-600 font-medium">
                          {client.phone}
                        </a>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`mailto:${client.email}`} className="hover:text-brand-600 truncate">
                          {client.email}
                        </a>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{client.address}, {client.city}</span>
                      </div>
                    )}
                  </div>

                  {client.notes && (
                    <div className="mt-3 text-xs text-slate-500 italic bg-amber-50/50 p-2 rounded border border-amber-100/50">
                      "{client.notes}"
                    </div>
                  )}
                </div>

                {/* Bottom: Client Projects Summary */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Проектов: {clientProjects.length}</div>
                    <div className="text-xs font-bold text-slate-800">{formatCurrency(totalProjectValue)}</div>
                  </div>

                  <button
                    onClick={() => onOpenNewProjectWithClient(client.id)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Создать проект</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* View: Pipeline / Kanban */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const stageProjects = projects.filter(p => p.status === stage.id);
            const stageTotal = stageProjects.reduce((sum, p) => sum + p.budget_estimated, 0);

            return (
              <div key={stage.id} className="bg-slate-100/70 rounded-xl p-3 flex flex-col min-w-[220px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">{stage.label}</span>
                  <span className="text-[11px] font-bold px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full">
                    {stageProjects.length}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mb-2 font-medium">
                  Сумма: <strong>{formatCurrency(stageTotal)}</strong>
                </div>

                {/* Project Cards in Stage */}
                <div className="space-y-2 flex-1">
                  {stageProjects.map((p) => {
                    const client = clients.find(c => c.id === p.client_id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => onSelectProject(p.id)}
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow cursor-pointer transition-all hover:border-brand-300"
                      >
                        <div className="font-bold text-xs text-slate-900 line-clamp-2">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {client?.company_name || client?.name || 'Клиент'}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                          <span className="font-extrabold text-slate-900">{formatCurrency(p.budget_estimated)}</span>
                          <span className="text-[10px] text-brand-600 font-semibold">{p.city}</span>
                        </div>
                      </div>
                    );
                  })}
                  {stageProjects.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      Нет сделок
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingClient ? 'Редактировать данные клиента' : 'Добавить нового клиента'}
                </h3>
                <p className="text-xs text-slate-400">
                  Словацкие реквизиты, автопоиск по IČO, контакты
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Type Switcher */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="client_type"
                    checked={formData.type === 'person'}
                    onChange={() => setFormData({ ...formData, type: 'person' })}
                    className="text-brand-500 focus:ring-brand-500"
                  />
                  <span>Физическое лицо (Частный заказчик)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="client_type"
                    checked={formData.type === 'company'}
                    onChange={() => setFormData({ ...formData, type: 'company' })}
                    className="text-brand-500 focus:ring-brand-500"
                  />
                  <span>Юридическое лицо (s.r.o. / a.s. / SZČO)</span>
                </label>
              </div>

              {/* IČO Search Box (for companies or auto-fill) */}
              <div className="bg-brand-50/60 p-3.5 rounded-xl border border-brand-200/60">
                <label className="block text-xs font-bold text-brand-900 mb-1">
                  🔍 IČO Словакии (Автопоиск по реестру)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.ico || ''}
                    onChange={(e) => setFormData({ ...formData, ico: e.target.value })}
                    placeholder="Например: 53123456 или 35763469"
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-brand-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleLookupIco}
                    disabled={isSearchingIco || !formData.ico}
                    className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSearchingIco ? 'Поиск...' : 'Заполнить по IČO'}</span>
                  </button>
                </div>
                {icoSuccessMsg && (
                  <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{icoSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Company Name */}
              {formData.type === 'company' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Название компании (Obchodné meno)*
                  </label>
                  <input
                    type="text"
                    value={formData.company_name || ''}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Например: Danubia Invest s.r.o."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              {/* Contact Person Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {formData.type === 'company' ? 'Контактное лицо (ФИО)' : 'ФИО Клиента*'}
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Например: Ing. Peter Horváth"
                  required
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Tax details (DIČ / IČ DPH / VAT Payer) */}
              {formData.type === 'company' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">DIČ</label>
                    <input
                      type="text"
                      value={formData.dic || ''}
                      onChange={(e) => setFormData({ ...formData, dic: e.target.value })}
                      placeholder="2021567890"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">IČ DPH</label>
                    <input
                      type="text"
                      value={formData.ic_dph || ''}
                      onChange={(e) => setFormData({ ...formData, ic_dph: e.target.value })}
                      placeholder="SK2021567890"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_vat_payer || false}
                        onChange={(e) => setFormData({ ...formData, is_vat_payer: e.target.checked })}
                        className="rounded text-brand-500 focus:ring-brand-500"
                      />
                      <span>Плательщик DPH</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Улица и дом</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Tomášikova 28"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Город / PSČ</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Bratislava"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Телефон</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+421 905 123 456"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="klient@email.sk"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Заметки и пожелания</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Особенности объекта, желаемые сроки, требования заказчика..."
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-lg shadow-sm transition-all"
                >
                  {editingClient ? 'Сохранить изменения' : 'Создать клиента'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
