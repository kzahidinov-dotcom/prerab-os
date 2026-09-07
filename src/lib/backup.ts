// Automated Friday Backup & Database Archiver for Prerab OS
import { storage } from './storage';
import { showToast } from '@/components/ui/NotificationToast';

export interface BackupStatus {
  isFriday: boolean;
  lastBackupDate: string | null;
  hasRunToday: boolean;
}

export const getLastFridayBackupDate = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('prerab_friday_backup_date');
};

export const getBackupStatus = (): BackupStatus => {
  if (typeof window === 'undefined') {
    return { isFriday: false, lastBackupDate: null, hasRunToday: false };
  }
  const today = new Date();
  const isFriday = today.getDay() === 5;
  const todayStr = today.toISOString().split('T')[0];
  const lastBackup = localStorage.getItem('prerab_friday_backup_date');
  return {
    isFriday,
    lastBackupDate: lastBackup,
    hasRunToday: lastBackup === todayStr,
  };
};

// Export full backup as JSON file and trigger browser download
export const downloadJsonBackup = (customFilename?: string): boolean => {
  try {
    const backupJson = storage.exportFullBackup();
    const todayStr = new Date().toISOString().split('T')[0];
    const filename = customFilename || `Prerab_Backup_Пятница_${todayStr}.json`;

    const blob = new Blob([backupJson], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error('Error downloading JSON backup:', e);
    return false;
  }
};

// Export structured company summary as CSV (compatible with Excel via UTF-8 BOM)
export const downloadExcelCsvSummary = (customFilename?: string): boolean => {
  try {
    const projects = storage.getProjects();
    const clients = storage.getClients();
    const expenses = storage.getExpenses();
    const invoices = storage.getInvoices();
    const tasks = storage.getTasks();
    const workers = storage.getWorkers();

    const clientMap = new Map(clients.map(c => [c.id, c.name]));

    let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel

    // SECTION 1: ОБЪЕКТЫ И ПРОЕКТЫ
    csvContent += '=== СТРОИТЕЛЬНЫЕ ОБЪЕКТЫ PRERAB S.R.O. ===\r\n';
    csvContent += 'ID;Название;Адрес;Клиент;Статус;Смета (€);Себестоимость (€);Факт. расходы (€);Оплачено счетов (€)\r\n';
    
    projects.forEach(p => {
      const clientName = clientMap.get(p.client_id) || 'Не указан';
      const projExpenses = expenses
        .filter(e => e.project_id === p.id)
        .reduce((sum, e) => sum + (e.amount_with_vat || 0), 0);
      const projInvoicesPaid = invoices
        .filter(i => i.project_id === p.id && i.payment_status === 'paid')
        .reduce((sum, i) => sum + (i.total_amount || 0), 0);

      const statusRu = 
        p.status === 'in_progress' ? 'В работе' :
        p.status === 'completed' ? 'Завершен' :
        p.status === 'lead' ? 'Лид / Заявка' :
        p.status === 'quote_sent' ? 'Смета отправлена' :
        p.status === 'contract_signed' ? 'Договор подписан' :
        p.status === 'survey' ? 'Замер / Осмотр' : p.status;

      csvContent += `"${p.id}";"${p.title.replace(/"/g, '""')}";"${(p.address || '').replace(/"/g, '""')}";"${clientName}";"${statusRu}";${p.budget_estimated || 0};${p.budget_cost_estimated || 0};${projExpenses};${projInvoicesPaid}\r\n`;
    });

    csvContent += '\r\n';

    // SECTION 2: ЗАДАЧИ КОМАНДЫ
    csvContent += '=== ЗАДАЧИ И ПЛАНИРОВЩИК ===\r\n';
    csvContent += 'ID;Название задачи;Ответственный;Приоритет;Статус;Срок;Сумма (€)\r\n';
    tasks.forEach(t => {
      const statusRu = t.status === 'done' ? 'Выполнено' : t.status === 'in_progress' ? 'В работе' : 'К выполнению';
      csvContent += `"${t.id}";"${t.title.replace(/"/g, '""')}";"${t.assignee_name}";"${t.priority}";"${statusRu}";"${t.due_date || ''}";${t.money_amount || 0}\r\n`;
    });

    csvContent += '\r\n';

    // SECTION 3: ТАБЕЛЬ И БРИГАДЫ
    csvContent += '=== МАСТЕРА И БРИГАДЫ ===\r\n';
    csvContent += 'Имя;Специальность;Телефон;Ставка (€);Статус\r\n';
    workers.forEach(w => {
      csvContent += `"${w.name}";"${w.role || ''}";"${w.phone || ''}";${w.rate || 0};"${w.active ? 'Активен' : 'В архиве'}"\r\n`;
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const filename = customFilename || `Prerab_Сводка_Excel_Пятница_${todayStr}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error('Error downloading CSV backup:', e);
    return false;
  }
};

// Check if today is Friday and automatically trigger backup once per Friday
export const checkAndPerformFridayBackup = (): boolean => {
  if (typeof window === 'undefined') return false;

  const today = new Date();
  const isFriday = today.getDay() === 5; // 5 is Friday
  const todayStr = today.toISOString().split('T')[0];
  const lastFridayBackup = localStorage.getItem('prerab_friday_backup_date');

  if (isFriday && lastFridayBackup !== todayStr) {
    // Perform backup download
    const success = downloadJsonBackup(`Prerab_АвтоАрхив_Пятница_${todayStr}.json`);
    if (success) {
      localStorage.setItem('prerab_friday_backup_date', todayStr);
      showToast({
        title: '💾 Пятничный автоархив сохранен',
        message: 'Полная резервная копия всех данных компании Prerab s.r.o. успешно сохранена на ваш компьютер!',
        type: 'success',
        duration: 8000
      });
      return true;
    }
  }
  return false;
};
