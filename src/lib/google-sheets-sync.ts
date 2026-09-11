import { Project, Expense, Invoice, Client, ExpenseCategory } from '@/types';
import { storage } from './storage';

export const DEFAULT_GOOGLE_SHEET_URL = 
  "https://docs.google.com/spreadsheets/d/1rT1tTCDIn39nAhk1vfbz5g4aGLNuknR78v3NrQFn5rk/export?format=csv&gid=1035036129";

export const GOOGLE_DRIVE_ROOT_URL = 
  "https://drive.google.com/drive/folders/1XvJtIS2pvWGuUuGr42WHOUKV-MvzQcbV";

// Real Active project identifiers
export const ACTIVE_PROJECTS_NAMES = [
  'RuzChem', 
  'Jaslovska', 
  'Kpt rašu', 
  'Hergovic', 
  'Bebravska',
  'PlisnakB3'
];

export function mapExpenseCategory(catRaw: string): ExpenseCategory {
  const c = (catRaw || '').toLowerCase();
  if (c.includes('дизайн')) return 'materials';
  if (c.includes('строй') || c.includes('материал')) return 'materials';
  if (c.includes('зарплата') || c.includes('робочих') || c.includes('остап') || c.includes('женя') || c.includes('борис') || c.includes('махмуд') || c.includes('эзис') || c.includes('андрей')) return 'labor';
  if (c.includes('мусор') || c.includes('викид') || c.includes('контейнер')) return 'waste_disposal';
  if (c.includes('інструмент') || c.includes('техник') || c.includes('перфоратор')) return 'tools_machinery';
  if (c.includes('транспорт') || c.includes('дизель') || c.includes('бензин') || c.includes('паливо') || c.includes('вито')) return 'transport_fuel';
  if (c.includes('аренда') || c.includes('офис') || c.includes('склад')) return 'overhead';
  return 'overhead';
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseAmount(val: string): number {
  if (!val) return 0;
  const clean = val.replace(/\s+/g, '').replace('€', '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function parseDateToIso(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const parts = dateStr.trim().split('.');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

// Friendly titles and client names
const PROJECT_METADATA: Record<string, { title: string; client: string; address: string; city: string }> = {
  'Jaslovska': { title: 'Реновация объекта ул. Jaslovská', client: 'Клиент Jaslovská', address: 'Jaslovská 14', city: 'Bratislava - Petržalka' },
  'RuzChem': { title: 'Ремонт объекта Chemická (RuzChem)', client: 'Клиент Chemická', address: 'Chemická 8', city: 'Bratislava - Ružinov' },
  'Kpt rašu': { title: 'Капремонт квартиры ул. Kpt. Rašu', client: 'Клиент Kpt. Rašu', address: 'Kpt. Nálepku / Rašu', city: 'Bratislava - Dúbravka' },
  'Hergovic': { title: 'Комплексный ремонт ул. Hergottova', client: 'Клиент Hergottova', address: 'Hergottova 6', city: 'Bratislava - Ružinov' },
  'Bebravska': { title: 'Ремонт объекта ул. Bebravská (Ожидание оплат)', client: 'Клиент Bebravská', address: 'Bebravská 12', city: 'Bratislava - Vrakuňa' },
  'PlisnakB3': { title: 'Ремонт объекта PlisnakB3 (Babuškova 3)', client: 'Клиент PlisnakB3', address: 'Babuškova 3', city: 'Bratislava - Ružinov' },
  'Sibirska': { title: 'Ремонт квартиры ул. Sibírska', client: 'Клиент Sibírska', address: 'Sibírska 35', city: 'Bratislava - Nové Mesto' },
  'Lotysska': { title: 'Ремонт квартиры ул. Lotyšská', client: 'Клиент Lotyšská', address: 'Lotyšská 19', city: 'Bratislava - Podunajské Biskupice' },
  'Ozvoldik': { title: 'Ремонт объекта Ozvoldíková', client: 'Клиент Ozvoldíková', address: 'Ozvoldíková 3', city: 'Bratislava - Dúbravka' },
  'Viglasska': { title: 'Ремонт объекта ул. Vígľašská', client: 'Клиент Vígľašská', address: 'Vígľašská 7', city: 'Bratislava - Petržalka' },
  'Nobelova': { title: 'Ремонт объекта ул. Nobelova', client: 'Клиент Nobelova', address: 'Nobelova 22', city: 'Bratislava - Nové Mesto' },
  'Mierova': { title: 'Ремонт объекта ул. Mierová', client: 'Клиент Mierová', address: 'Mierová 54', city: 'Bratislava - Ružinov' },
  'Dinda': { title: 'Ремонт объекта Dinda', client: 'Клиент Dinda', address: 'Bratislava', city: 'Bratislava' },
  'Podhajska': { title: 'Ремонт объекта Podhájska', client: 'Клиент Podhájska', address: 'Podhájska 11', city: 'Bratislava - Lamač' },
  'Sevcenkova': { title: 'Ремонт объекта ул. Ševčenkova', client: 'Клиент Ševčenkova', address: 'Ševčenkova 18', city: 'Bratislava - Petržalka' },
  'Armenska': { title: 'Ремонт объекта ул. Arménska', client: 'Клиент Arménska', address: 'Arménska 4', city: 'Bratislava - Vrakuňa' },
  'Jana Stanislava': { title: 'Ремонт объекта ул. Jána Stanislava', client: 'Клиент Jána Stanislava', address: 'Jána Stanislava 25', city: 'Bratislava - Karlova Ves' },
  'Polakova': { title: 'Ремонт объекта Poláková', client: 'Клиент Poláková', address: 'Bratislava', city: 'Bratislava' },
  'Urminsky': { title: 'Ремонт объекта Urminský', client: 'Клиент Urminský', address: 'Bratislava', city: 'Bratislava' },
};

/**
 * Объектом может быть только осмысленное название с буквами.
 * Суммы, даты и прочерки в колонке объекта означают, что в этой строке
 * формы объект не указан — такую запись ведем как общий расход фирмы.
 */
export function isLikelyProjectName(value?: string): boolean {
  const v = (value || '').trim();
  if (!v || v === '-' || v === '—') return false;
  if (v.length < 2) return false;
  if (/^[\d\s.,:/\\-]+$/.test(v)) return false;   // 520 | 166,05 | 22.08.2026 | 12:30
  if (!/[a-zа-яё]/i.test(v)) return false;         // без единой буквы — не название
  return true;
}

export function normalizeProjectKey(str: string): string {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function matchCanonicalProjectKey(rawProject: string): string {
  const norm = normalizeProjectKey(rawProject);
  if (!norm) return rawProject;

  if (norm.includes('plis') || norm.includes('babuskov')) return 'PlisnakB3';
  if (norm.includes('herg')) return 'Hergovic';
  if (norm.includes('chem') || norm.includes('ruzchem')) return 'RuzChem';
  if (norm.includes('jaslov')) return 'Jaslovska';
  if (norm.includes('bebrav')) return 'Bebravska';
  if (norm.includes('kpt') || norm.includes('rasu') || norm.includes('nalepk')) return 'Kpt rašu';
  if (norm.includes('sibir')) return 'Sibirska';
  if (norm.includes('loty')) return 'Lotysska';
  if (norm.includes('ozvold')) return 'Ozvoldik';
  if (norm.includes('vigla')) return 'Viglasska';
  if (norm.includes('nobel')) return 'Nobelova';
  if (norm.includes('mier')) return 'Mierova';
  if (norm.includes('dinda')) return 'Dinda';
  if (norm.includes('podhaj')) return 'Podhajska';
  if (norm.includes('sevcen')) return 'Sevcenkova';
  if (norm.includes('armen')) return 'Armenska';
  if (norm.includes('stanislav')) return 'Jana Stanislava';
  if (norm.includes('polak')) return 'Polakova';
  if (norm.includes('urmin')) return 'Urminsky';

  const exactMatch = Object.keys(PROJECT_METADATA).find(k => normalizeProjectKey(k) === norm);
  return exactMatch || rawProject;
}

export function getCanonicalProjectId(rawProject: string): string {
  const canonicalKey = matchCanonicalProjectKey(rawProject);
  return `prj-${normalizeProjectKey(canonicalKey)}`;
}

export function getCanonicalClientId(rawProject: string): string {
  const canonicalKey = matchCanonicalProjectKey(rawProject);
  return `cli-${normalizeProjectKey(canonicalKey)}`;
}

export async function syncFromGoogleSheets(customUrl?: string) {
  try {
    const sep = (customUrl || DEFAULT_GOOGLE_SHEET_URL).includes('?') ? '&' : '?';
    const cacheBuster = `${sep}_t=${Date.now()}`;
    const url = (customUrl || DEFAULT_GOOGLE_SHEET_URL) + cacheBuster;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return { success: false, message: `Ошибка загрузки таблицы: ${res.statusText}` };
    }

    const text = await res.text();
    const rawLines = text.split('\n').filter(l => l.trim().length > 0);
    if (rawLines.length < 2) {
      return { success: false, message: 'Таблица пуста' };
    }

    const existingClients = storage.getClients();
    const existingProjects = storage.getProjects();
    const existingExpenses = storage.getExpenses();
    const existingInvoices = storage.getInvoices();

    const projectsMap: Record<string, Project> = {};
    const clientsMap: Record<string, Client> = {};
    const expenses: Expense[] = [];
    const invoices: Invoice[] = [];

    // 1. FIRST: Load all existing clients from storage so user edits are NEVER lost
    existingClients.forEach(c => {
      clientsMap[c.id] = { ...c };
    });

    // 2. Load all existing projects from storage so custom titles, addresses, statuses are NEVER lost
    existingProjects.forEach(p => {
      // Filter out duplicate orphan IDs if present
      if (p.id === 'prj-1788766664312' || p.id === 'prj-jana_stanislava' || p.id === 'prj-kpt_ra_u') return;
      projectsMap[p.id] = {
        ...p,
        budget_estimated: 0,
        budget_cost_estimated: 0,
        budget_actual_spent: 0,
        invoiced_total: 0,
        paid_total: 0,
      };
    });

    // 3. Add default metadata for any project/client that doesn't exist yet
    Object.keys(PROJECT_METADATA).forEach(name => {
      const meta = PROJECT_METADATA[name];
      const projId = getCanonicalProjectId(name);
      const clientId = getCanonicalClientId(name);
      const isActive = ACTIVE_PROJECTS_NAMES.includes(name);

      if (!clientsMap[clientId]) {
        clientsMap[clientId] = {
          id: clientId,
          type: 'person',
          name: meta.client,
          address: meta.address,
          city: meta.city,
          zip: '811 01',
          phone: '',
          email: '',
          is_vat_payer: false,
          created_at: new Date().toISOString(),
        };
      }

      if (!projectsMap[projId]) {
        projectsMap[projId] = {
          id: projId,
          title: meta.title,
          client_id: clientId,
          status: isActive ? 'in_progress' : 'completed',
          address: meta.address,
          city: meta.city,
          start_date: '2026-04-01',
          deadline: isActive ? '2026-10-31' : '2026-08-01',
          budget_estimated: 0,
          budget_cost_estimated: 0,
          budget_actual_spent: 0,
          invoiced_total: 0,
          paid_total: 0,
          notes: `Сметы и файлы на Google Диске: ${GOOGLE_DRIVE_ROOT_URL}`,
          created_at: new Date().toISOString(),
        };
      }
    });

    // Parse all rows from Google Sheet
    for (let i = 1; i < rawLines.length; i++) {
      const row = parseCsvLine(rawLines[i]);
      if (!row || row.length < 5) continue;

      const timestamp = row[0] || '';
      const dateRaw = row[1] || '';
      const author = row[2] || '';
      const recordType = row[10] || '';

      // Колонки сводного блока листа «СТАТИСТИКА ФИН»:
      //   30 — Сума (число)          33 — Сума (зведено)
      //   31 — Об'єкт (зведено)      34 — Тип операції (зведено)
      //   32 — Категорія (зведено)   35 — Спосіб оплати   36 — Опис
      // Дальше идут запасные колонки исходных блоков формы (3..29).
      let rawProject = [row[31], row[3], row[11], row[23], row[29]].find(isLikelyProjectName) || '';
      let categoryRaw = row[32] || row[4] || row[13] || row[18] || row[22] || row[28] || 'Інше';
      let amount = parseAmount(row[33]) || parseAmount(row[30]) || parseAmount(row[6]) || parseAmount(row[14]) || parseAmount(row[19]) || parseAmount(row[24]);
      let type = row[34] || row[5] || (recordType.toLowerCase().includes('дохід') ? 'Дохід' : (recordType.toLowerCase().includes('розхід') ? 'Витрата' : '')) || (categoryRaw.toLowerCase().includes('дохід') || categoryRaw.toLowerCase().includes('аванс') ? 'Дохід' : 'Витрата');
      let paymentMethod = row[35] || row[7] || row[16] || row[20] || row[25] || 'Карта фірма';
      let description = row[36] || row[8] || row[17] || row[21] || row[26] || '';

      if (!amount && !description) continue;

      rawProject = rawProject.trim();
      const isGeneralCompanyExpense =
        !isLikelyProjectName(rawProject) ||
        rawProject.toLowerCase() === 'загальні' ||
        rawProject.toLowerCase().includes('загальні');

      const isIncome = type.toLowerCase().includes('дохід') || 
                       recordType.toLowerCase().includes('дохід') || 
                       categoryRaw.toLowerCase().includes('аванс') || 
                       categoryRaw.toLowerCase().includes('дохід');
      const isoDate = parseDateToIso(dateRaw || timestamp.split(' ')[0]);

      if (isGeneralCompanyExpense) {
        // GENERAL OVERHEAD (Not a client project)
        if (isIncome) {
          // General income
          invoices.push({
            id: `inv-g-${i}`,
            invoice_number: `INC-${i}`,
            type: 'invoice',
            project_id: '',
            client_id: '',
            issue_date: isoDate,
            delivery_date: isoDate,
            due_date: isoDate,
            variable_symbol: `2026${i.toString().padStart(4, '0')}`,
            constant_symbol: '0308',
            items: [{
              id: `ii-g-${i}`,
              description: description || categoryRaw,
              unit: 'kpl',
              quantity: 1,
              unit_price: amount,
              total_without_vat: amount,
              vat_rate: 0,
              vat_amount: 0,
              total_with_vat: amount,
            }],
            subtotal: amount,
            vat_rate: 0,
            vat_amount: 0,
            total_amount: amount,
            is_reverse_charge: false,
            payment_status: 'paid',
            paid_amount: amount,
            payment_method: paymentMethod.toLowerCase().includes('готівка') ? 'cash' : 'bank_transfer',
            notes: `Общий доход фирмы. Внес: ${author} (${paymentMethod})`,
          });
        } else {
          // General overhead expense (Office, Warehouse, Vito fuel, Ostap salary)
          expenses.push({
            id: `exp-g-${i}`,
            project_id: '', // EMPTY project ID = General Company Overhead
            category: mapExpenseCategory(categoryRaw),
            vendor: categoryRaw,
            description: description ? `${description} [${categoryRaw}]` : categoryRaw,
            amount_without_vat: amount,
            vat_rate: 0,
            vat_amount: 0,
            amount_with_vat: amount,
            receipt_number: `GF-GEN-${i}`,
            date: isoDate,
            paid_by: `${paymentMethod}${author ? ` (${author})` : ''}`,
            status: 'approved',
          });
        }
      } else {
        // SPECIFIC PROJECT
        const projKey = matchCanonicalProjectKey(rawProject);
        const defaultProjId = getCanonicalProjectId(rawProject);

        // Match existing project by canonical ID, raw key, title, or address
        const existingProject = existingProjects.find(p => 
          p.id === defaultProjId ||
          p.id === `prj-${normalizeProjectKey(rawProject)}` ||
          normalizeProjectKey(p.id) === normalizeProjectKey(defaultProjId) ||
          normalizeProjectKey(p.title) === normalizeProjectKey(projKey) ||
          normalizeProjectKey(p.title) === normalizeProjectKey(rawProject) ||
          (p.title && normalizeProjectKey(p.title).includes(normalizeProjectKey(projKey))) ||
          (p.address && normalizeProjectKey(p.address).includes('babuskov') && projKey === 'PlisnakB3')
        );

        const projId = existingProject ? existingProject.id : defaultProjId;
        const clientId = existingProject?.client_id || getCanonicalClientId(rawProject);
        const isActive = ACTIVE_PROJECTS_NAMES.includes(projKey) || existingProject?.status === 'in_progress';

        if (!projectsMap[projId]) {
          projectsMap[projId] = {
            id: projId,
            title: existingProject?.title || PROJECT_METADATA[projKey]?.title || `Объект ${projKey}`,
            client_id: clientId,
            status: existingProject?.status || (isActive ? 'in_progress' : 'completed'),
            address: existingProject?.address || PROJECT_METADATA[projKey]?.address || projKey,
            city: existingProject?.city || PROJECT_METADATA[projKey]?.city || 'Bratislava',
            start_date: existingProject?.start_date || '2026-04-01',
            deadline: existingProject?.deadline || (isActive ? '2026-11-30' : '2026-08-01'),
            budget_estimated: 0,
            budget_cost_estimated: 0,
            budget_actual_spent: 0,
            invoiced_total: 0,
            paid_total: 0,
            notes: existingProject?.notes || `Импортировано из Google Таблицы`,
            created_at: existingProject?.created_at || new Date().toISOString(),
          };
        }

        if (!clientsMap[clientId]) {
          const existingClient = existingClients.find(c => c.id === clientId);
          clientsMap[clientId] = existingClient ? { ...existingClient } : {
            id: clientId,
            type: 'person',
            name: `Клиент ${projKey}`,
            address: projKey,
            city: 'Bratislava',
            zip: '811 01',
            phone: '',
            email: '',
            is_vat_payer: false,
            created_at: new Date().toISOString(),
          };
        }

        if (isIncome) {
          projectsMap[projId].budget_estimated += amount;
          projectsMap[projId].invoiced_total += amount;
          projectsMap[projId].paid_total += amount;

          invoices.push({
            id: `inv-g-${i}`,
            invoice_number: `AV-${projKey.substring(0, 4).toUpperCase()}-${i}`,
            type: 'proforma',
            project_id: projId,
            client_id: clientId,
            issue_date: isoDate,
            delivery_date: isoDate,
            due_date: isoDate,
            variable_symbol: `2026${i.toString().padStart(4, '0')}`,
            constant_symbol: '0308',
            items: [{
              id: `ii-g-${i}`,
              description: description || `Аванс / Дохід по об'єкту ${projKey}`,
              unit: 'kpl',
              quantity: 1,
              unit_price: amount,
              total_without_vat: amount,
              vat_rate: 0,
              vat_amount: 0,
              total_with_vat: amount,
            }],
            subtotal: amount,
            vat_rate: 0,
            vat_amount: 0,
            total_amount: amount,
            is_reverse_charge: false,
            payment_status: 'paid',
            paid_amount: amount,
            payment_method: paymentMethod.toLowerCase().includes('готівка') ? 'cash' : 'bank_transfer',
            notes: `Внес: ${author} (${paymentMethod})`,
          });
        } else {
          projectsMap[projId].budget_actual_spent += amount;
          projectsMap[projId].budget_cost_estimated += amount;

          expenses.push({
            id: `exp-g-${i}`,
            project_id: projId,
            category: mapExpenseCategory(categoryRaw),
            vendor: description.length > 3 ? description.split(' ')[0] : categoryRaw,
            description: description ? `${description} [${categoryRaw}]` : categoryRaw,
            amount_without_vat: amount,
            vat_rate: 0,
            vat_amount: 0,
            amount_with_vat: amount,
            receipt_number: `GF-${i}`,
            date: isoDate,
            paid_by: `${paymentMethod}${author ? ` (${author})` : ''}`,
            status: 'approved',
          });
        }
      }
    }

    // Merge manual user expenses (which do not start with exp-g-) with Google Sheet expenses
    const manualExpenses = existingExpenses.filter(e => !e.id.startsWith('exp-g-'));
    manualExpenses.forEach(me => {
      if (me.project_id && projectsMap[me.project_id]) {
        projectsMap[me.project_id].budget_actual_spent += (me.amount_without_vat || 0);
      }
    });
    const allExpenses = [...manualExpenses, ...expenses].sort((a, b) => {
      const tA = new Date(a.date).getTime() || 0;
      const tB = new Date(b.date).getTime() || 0;
      if (tA !== tB) return tB - tA;
      return (b.receipt_number || '').localeCompare(a.receipt_number || '');
    });

    // Merge manual user invoices (which do not start with inv-g-) with Google Sheet invoices
    const manualInvoices = existingInvoices.filter(i => !i.id.startsWith('inv-g-'));
    manualInvoices.forEach(mi => {
      if (mi.project_id && projectsMap[mi.project_id]) {
        if (mi.payment_status === 'paid') {
          projectsMap[mi.project_id].paid_total += (mi.paid_amount || mi.total_amount || 0);
        }
        projectsMap[mi.project_id].invoiced_total += (mi.subtotal || mi.total_amount || 0);
      }
    });
    const allInvoices = [...manualInvoices, ...invoices].sort((a, b) => {
      const tA = new Date(a.issue_date).getTime() || 0;
      const tB = new Date(b.issue_date).getTime() || 0;
      if (tA !== tB) return tB - tA;
      return (b.invoice_number || '').localeCompare(a.invoice_number || '');
    });

    const projectsList = Object.values(projectsMap);
    const clientsList = Object.values(clientsMap);

    // Save cleanly to storage
    storage.saveClients(clientsList);
    storage.saveProjects(projectsList);
    storage.saveExpenses(allExpenses);
    storage.saveInvoices(allInvoices);

    return {
      success: true,
      activeProjectsCount: projectsList.filter(p => p.status === 'in_progress').length,
      completedProjectsCount: projectsList.filter(p => p.status === 'completed').length,
      expensesCount: expenses.length,
      invoicesCount: invoices.length,
      message: `Синхронизировано: ${projectsList.filter(p => p.status === 'in_progress').length} активных объектов (${ACTIVE_PROJECTS_NAMES.join(', ')}), ${projectsList.filter(p => p.status === 'completed').length} завершенных и ${expenses.length} записей расходов!`,
    };
  } catch (err: any) {
    console.error('Sync error:', err);
    return { success: false, message: `Ошибка синхронизации: ${err.message || err}` };
  }
}
