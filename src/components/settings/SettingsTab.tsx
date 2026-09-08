'use client';

import React, { useState } from 'react';
import { CompanySettings } from '@/types';
import { storage } from '@/lib/storage';
import { getSupabaseClient } from '@/lib/supabase';
import { 
  Settings, 
  Building, 
  ShieldCheck, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Cloud, 
  Lock,
  FileCode,
  Save,
  ArrowUpCircle,
  ArrowDownCircle,
  Key,
  ExternalLink,
  Copy,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  CalendarCheck,
  Bell
} from 'lucide-react';
import { soundManager } from '@/lib/sound';
import { getBackupStatus, downloadJsonBackup, downloadExcelCsvSummary } from '@/lib/backup';
import { showToast } from '@/components/ui/NotificationToast';

interface SettingsTabProps {
  settings: CompanySettings;
  onSaveSettings: (settings: CompanySettings) => void;
  onReloadAllData: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onSaveSettings,
  onReloadAllData,
}) => {
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; message: string; error?: boolean } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSoundActive, setIsSoundActive] = useState(() => soundManager.isEnabled());
  const [backupInfo, setBackupInfo] = useState(() => getBackupStatus());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const jsonStr = storage.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prerab_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setBackupSuccess(true);
    setTimeout(() => setBackupSuccess(false), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storage.importBackup(content);
      if (success) {
        setImportStatus('База данных успешно восстановлена из бэкапа!');
        onReloadAllData();
      } else {
        setImportStatus('Ошибка: неверный формат файла бэкапа.');
      }
      setTimeout(() => setImportStatus(''), 4000);
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (confirm('Вы уверены? Это полностью очистит все тестовые проекты, сметы и чеки.')) {
      storage.clearAllData();
      onReloadAllData();
      alert('Все тестовые данные удалены! База полностью чистая.');
    }
  };

  // Push local data to Supabase
  const handlePushToCloud = async () => {
    setSyncStatus({ loading: true, message: 'Отправка данных в облако Supabase...' });
    const res = await storage.pushAllToSupabase();
    setSyncStatus({ loading: false, message: res.message, error: !res.success });
    setTimeout(() => setSyncStatus(null), 5000);
  };

  // Pull cloud data down to Local
  const handlePullFromCloud = async () => {
    setSyncStatus({ loading: true, message: 'Получение данных из облака Supabase...' });
    const res = await storage.pullAllFromSupabase();
    if (res.success) {
      onReloadAllData();
    }
    setSyncStatus({ loading: false, message: res.message, error: !res.success });
    setTimeout(() => setSyncStatus(null), 5000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Security & Zero Cost Info Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-6 text-white border border-brand-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight">
                Безопасность и Конфиденциальность данных (0 € затрат)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                100% Защита RLS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
              Ваши сметы, расценки, реальные маржи и база клиентов защищены шифрованием. Данные хранятся локально на этом устройстве и синхронизируются с вашим защищенным облаком Supabase.
            </p>
          </div>
        </div>
      </div>

      {/* CLOUD STORAGE (SUPABASE) CONFIGURATION */}
      <div className="surface p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-brand-500" />
              <span>Бесплатное облачное хранилище (Supabase Cloud 0 €/мес)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Позволяет вводить данные с телефона на стройке, а смотреть с компьютера в офисе в реальном времени.
            </p>
          </div>

          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>Регистрация в Supabase (Free)</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Credentials Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={formData.supabase_url || ''}
              onChange={(e) => setFormData({ ...formData, supabase_url: e.target.value })}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Supabase Anon / Public Key
            </label>
            <input
              type="password"
              value={formData.supabase_anon_key || ''}
              onChange={(e) => setFormData({ ...formData, supabase_anon_key: e.target.value })}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-slate-800"
            />
          </div>
        </div>

        {/* Sync Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handlePushToCloud}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Отправить все данные в облако (Push)</span>
          </button>

          <button
            type="button"
            onClick={handlePullFromCloud}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Загрузить данные из облака (Pull)</span>
          </button>
        </div>

        {syncStatus && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            syncStatus.error ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}>
            {syncStatus.error ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{syncStatus.message}</span>
          </div>
        )}
      </div>

      {/* SECTION: WEEKLY FRIDAY AUTO-BACKUP */}
      <div className="surface p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Еженедельный автоматический архив (Каждую пятницу)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                АКТИВНО
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Каждую пятницу при открытии системы копия всех данных (объекты, сметы, чеки, счета, задачи) автоматически выгружается на ваш компьютер.
            </p>
          </div>

          <div className="text-left sm:text-right text-xs">
            <span className="text-slate-400 font-medium">Последний архив:</span>
            <div className="font-bold text-slate-800 font-mono">
              {backupInfo.lastBackupDate ? backupInfo.lastBackupDate : 'Ожидает первой пятницы'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              downloadJsonBackup();
              showToast({
                title: '💾 Архив сохранен',
                message: 'Полная база данных Prerab s.r.o. успешно скачана в формате JSON!',
                type: 'success'
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Скачать архив прямо сейчас (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              downloadExcelCsvSummary();
              showToast({
                title: '📊 Таблица сохранена',
                message: 'Сводка объектов и задач выгружена в формате Excel CSV!',
                type: 'success'
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Выгрузка для Excel (CSV)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 transition-all">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Восстановить из архива</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* SECTION: SOUND & NOTIFICATIONS */}
      <div className="surface p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-500" />
              <span>Элегантные звуковые и визуальные уведомления</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Мягкий звуковой сигнал (Web Audio API) и всплывающие карточки в правом верхнем углу при изменениях от партнера в реальном времени.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !isSoundActive;
              soundManager.setEnabled(next);
              setIsSoundActive(next);
              if (next) soundManager.playNotificationChime('gentle');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              isSoundActive 
                ? 'bg-brand-50 text-brand-700 border-brand-200' 
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {isSoundActive ? (
              <>
                <Volume2 className="w-4 h-4 text-brand-600" />
                <span>Звук включен</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span>Звук отключен</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundManager.playNotificationChime('gentle');
              showToast({
                title: '🔔 Тест уведомления',
                message: 'Элегантный двухтональный звоночек Web Audio API и визуальный тост работают безупречно!',
                type: 'info'
              });
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
          >
            <Volume2 className="w-3.5 h-3.5 text-brand-600" />
            <span>Проверить звук звоночка</span>
          </button>

          <button
            type="button"
            onClick={handleResetDemo}
            className="flex items-center gap-1.5 px-3.5 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors border border-rose-200 ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Очистить тестовые данные</span>
          </button>
        </div>

        {importStatus && (
          <div className="text-xs text-brand-600 font-semibold flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{importStatus}</span>
          </div>
        )}
      </div>

      {/* Company Requisites Form */}
      <form onSubmit={handleSave} className="surface p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-500" />
              <span>Реквизиты компании в Словакии (Prerab)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Используются для официальных счетов (Faktúry), смет (Cenové ponuky) и генератора PAY by square
            </p>
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Сохранить настройки</span>
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Настройки и реквизиты успешно сохранены!</span>
          </div>
        )}

        {/* Company Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Торговое название фирмы</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Юридическое наименование (s.r.o.)</label>
            <input
              type="text"
              value={formData.legal_name}
              onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>
        </div>

        {/* Tax IDs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">IČO</label>
            <input
              type="text"
              value={formData.ico}
              onChange={(e) => setFormData({ ...formData, ico: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">DIČ</label>
            <input
              type="text"
              value={formData.dic}
              onChange={(e) => setFormData({ ...formData, dic: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">IČ DPH (SK...)</label>
            <input
              type="text"
              value={formData.ic_dph}
              onChange={(e) => setFormData({ ...formData, ic_dph: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold text-brand-600"
            />
          </div>
        </div>

        {/* Bank & PAY by square settings */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="text-xs font-bold text-slate-800">
            💳 Банковские реквизиты для PAY by square QR-кодов
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">IBAN банка*</label>
              <input
                type="text"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                placeholder="SK940200..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SWIFT / BIC</label>
              <input
                type="text"
                value={formData.swift}
                onChange={(e) => setFormData({ ...formData, swift: e.target.value })}
                placeholder="SUBASKBX"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Address & Contacts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Улица и номер</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Город</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">PSČ (Индекс)</label>
            <input
              type="text"
              value={formData.zip}
              onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </form>
    </div>
  );
};
