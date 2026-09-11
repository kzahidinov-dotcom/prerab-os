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
  'PlisnakB3',
  'MikMelit'
];

export function mapExpenseCategory(catRaw: string): ExpenseCategory {
  const c = (catRaw || '').toLowerCase();
  if (c.includes('дизайн')) return 'materials';
  if (c.includes('строй') || c.includes('материал')) return 'materials';
  if (c.includes('зарплата') || c.includes('робочих') || c.includes('остап') || c.includes('женя') || c.includes('борис') || c.includes('махмуд') || c.includes('эзис') || c.includes('андрей') || c.includes('хюршит') || c.includes('юра')) return 'labor';
  if (c.includes('мусор') || c.includes('викид') || c.includes('контейнер')) return 'waste_disposal';
  if (c.includes('інструмент') || c.includes('инструмент') || c.includes('техник') || c.includes('перфоратор')) return 'tools_machinery';
  if (c.includes('транспорт') || c.includes('дизель') || c.includes('бензин') || c.includes('паливо') || c.includes('вито') || c.includes('bmw')) return 'transport_fuel';
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
export const PROJECT_METADATA: Record<string, { title: string; client: string; address: string; city: string }> = {
  'Jaslovska': { title: 'Реновация объекта ул. Jaslovská', client: 'Клиент Jaslovská', address: 'Jaslovská 14', city: 'Bratislava - Petržalka' },
  'RuzChem': { title: 'Ремонт объекта Chemická (RuzChem)', client: 'Клиент Chemická', address: 'Chemická 8', city: 'Bratislava - Ružinov' },
  'Kpt rašu': { title: 'Капремонт квартиры ул. Kpt. Rašu', client: 'Клиент Kpt. Rašu', address: 'Kpt. Nálepku / Rašu', city: 'Bratislava - Dúbravka' },
  'Hergovic': { title: 'Комплексный ремонт ул. Hergottova', client: 'Клиент Hergottova', address: 'Hergottova 6', city: 'Bratislava - Ružinov' },
  'Bebravska': { title: 'Ремонт объекта ул. Bebravská (Ожидание оплат)', client: 'Клиент Bebravská', address: 'Bebravská 12', city: 'Bratislava - Vrakuňa' },
  'PlisnakB3': { title: 'Ремонт объекта PlisnakB3 (Babuškova 3)', client: 'Клиент PlisnakB3', address: 'Babuškova 3', city: 'Bratislava - Ružinov' },
  'MikMelit': { title: 'Ремонт объекта MikMelit', client: 'Клиент MikMelit', address: 'Bratislava', city: 'Bratislava' },
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
  if (/^[\d\s.,:/\\-]+$/.test(v)) return false;
  if (!/[a-zа-яё]/i.test(v)) return false;
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
  if (norm.includes('mikmelit') || norm.includes('melit')) return 'MikMelit';
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

export interface GoogleSheetParsedRow {
  date: string;
  author: string;
  rawProject: string;
  project: string;
  category: string;
  amount: number;
  type: 'Дохід' | 'Витрата';
  isGeneral: boolean;
  paymentMethod: string;
  description: string;
}

export function extractRowData(row: string[]): GoogleSheetParsedRow {
  const recordType = (row[10] || '').trim();

  let project = '';
  let category = '';
  let amountStr = '';
  let type = '';
  let paymentMethod = '';
  let description = '';

  if (recordType === 'Проектний розхід') {
    project = row[11] || '';
    category = row[13] || '';
    amountStr = row[14] || '';
    type = 'Витрата';
    paymentMethod = row[16] || '';
    description = row[17] || '';
  } else if (recordType === 'Загальний розхід фірми') {
    project = '';
    category = row[18] || '';
    amountStr = row[19] || '';
    type = 'Витрата';
    paymentMethod = row[20] || '';
    description = row[21] || '';
  } else if (recordType === 'Дохід') {
    category = row[22] || '';
    project = row[23] || '';
    amountStr = row[24] || '';
    type = 'Дохід';
    paymentMethod = row[25] || '';
    description = row[26] || '';
  } else {
    // Early rows or rows where col 10 is empty
    if (row[31] || row[32] || row[33] || row[34]) {
      project = row[31] || '';
      category = row[32] || '';
      amountStr = row[33] || '';
      type = row[34] || '';
      paymentMethod = row[35] || '';
      description = row[36] || '';
    } else {
      project = row[3] || row[29] || '';
      category = row[4] || row[28] || '';
      amountStr = row[6] || row[30] || '';
      type = row[5] || '';
      paymentMethod = row[7] || '';
      description = row[8] || '';
    }
  }

  const amount = parseAmount(amountStr);
  const rawProjTrimmed = project.trim();
  const isGeneral = !rawProjTrimmed || 
                    rawProjTrimmed === '-' || 
                    rawProjTrimmed.toLowerCase() === 'загальні' || 
                    rawProjTrimmed.toLowerCase().includes('загальні');

  const canonicalProject = isGeneral ? '' : matchCanonicalProjectKey(rawProjTrimmed);

  const isIncome = type.toLowerCase().includes('дохід') || 
                   recordType.toLowerCase().includes('дохід') || 
                   category.toLowerCase().includes('аванс') || 
                   category.toLowerCase().includes('дохід');

  return {
    date: row[1] || '',
    author: row[2] || '',
    rawProject: rawProjTrimmed,
    project: canonicalProject,
    category: category.trim(),
    amount,
    type: isIncome ? 'Дохід' : 'Витрата',
    isGeneral,
    paymentMethod: paymentMethod.trim(),
    description: description.trim(),
  };
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

    const projectsMap: Record<string, Project> = {};
    const clientsMap: Record<string, Client> = {};
    const expenses: Expense[] = [];
    const invoices: Invoice[] = [];

    // 1. Load existing clients from storage so user edits are preserved
    existingClients.forEach(c => {
      clientsMap[c.id] = { ...c };
    });

    // 2. Initialize all 20 canonical projects cleanly (with 0 financial metrics)
    Object.keys(PROJECT_METADATA).forEach(name => {
      const meta = PROJECT_METADATA[name];
      const projId = getCanonicalProjectId(name);
      const clientId = getCanonicalClientId(name);
      const isActive = ACTIVE_PROJECTS_NAMES.includes(name);

      const existingProject = existingProjects.find(p => 
        p.id === projId ||
        p.id === `prj-${normalizeProjectKey(name)}` ||
        normalizeProjectKey(p.title) === normalizeProjectKey(name) ||
        (name === 'PlisnakB3' && p.id.includes('plis'))
      );

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

      projectsMap[projId] = {
        id: projId,
        title: existingProject?.title || meta.title,
        client_id: clientId,
        status: isActive ? 'in_progress' : (existingProject?.status || 'completed'),
        address: existingProject?.address || meta.address,
        city: existingProject?.city || meta.city,
        start_date: existingProject?.start_date || '2026-04-01',
        deadline: existingProject?.deadline || (isActive ? '2026-11-30' : '2026-08-01'),
        budget_estimated: 0,
        budget_cost_estimated: 0,
        budget_actual_spent: 0,
        invoiced_total: 0,
        paid_total: 0,
        notes: existingProject?.notes || `Импортировано из Google Таблицы STATISTICS FINAL`,
        created_at: existingProject?.created_at || new Date().toISOString(),
      };
    });

    // 3. Parse all rows from Google Sheet strictly and exclusively
    for (let i = 1; i < rawLines.length; i++) {
      const row = parseCsvLine(rawLines[i]);
      if (!row || row.length < 5) continue;

      const item = extractRowData(row);
      if (!item.amount && !item.description) continue;

      const isoDate = parseDateToIso(item.date);

      if (item.isGeneral) {

        // GENERAL OVERHEAD (Not a client project)
        if (item.type === 'Дохід') {
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
              description: item.description || item.category || 'Общий доход',
              unit: 'kpl',
              quantity: 1,
              unit_price: item.amount,
              total_without_vat: item.amount,
              vat_rate: 0,
              vat_amount: 0,
              total_with_vat: item.amount,
            }],
            subtotal: item.amount,
            vat_rate: 0,
            vat_amount: 0,
            total_amount: item.amount,
            is_reverse_charge: false,
            payment_status: 'paid',
            paid_amount: item.amount,
            payment_method: item.paymentMethod.toLowerCase().includes('готівка') ? 'cash' : 'bank_transfer',
            notes: `Общий доход фирмы. Внес: ${item.author} (${item.paymentMethod})`,
          });
        } else {
          expenses.push({
            id: `exp-g-${i}`,
            project_id: '', // EMPTY project ID = General Company Overhead
            category: mapExpenseCategory(item.category),
            vendor: item.category || 'Общие расходы',
            description: item.description ? `${item.description} [${item.category}]` : item.category,
            amount_without_vat: item.amount,
            vat_rate: 0,
            vat_amount: 0,
            amount_with_vat: item.amount,
            receipt_number: `GF-GEN-${i}`,
            date: isoDate,
            paid_by: `${item.paymentMethod}${item.author ? ` (${item.author})` : ''}`,
            status: 'approved',
          });
        }
      } else {
        // SPECIFIC PROJECT
        const projKey = item.project;
        const projId = getCanonicalProjectId(projKey);
        const clientId = getCanonicalClientId(projKey);

        if (!projectsMap[projId]) {
          const isActive = ACTIVE_PROJECTS_NAMES.includes(projKey);
          projectsMap[projId] = {
            id: projId,
            title: PROJECT_METADATA[projKey]?.title || `Объект ${projKey}`,
            client_id: clientId,
            status: isActive ? 'in_progress' : 'completed',
            address: PROJECT_METADATA[projKey]?.address || projKey,
            city: PROJECT_METADATA[projKey]?.city || 'Bratislava',
            start_date: '2026-04-01',
            deadline: isActive ? '2026-11-30' : '2026-08-01',
            budget_estimated: 0,
            budget_cost_estimated: 0,
            budget_actual_spent: 0,
            invoiced_total: 0,
            paid_total: 0,
            notes: `Импортировано из Google Таблицы STATISTICS FINAL`,
            created_at: new Date().toISOString(),
          };
        }

        if (item.type === 'Дохід') {
          projectsMap[projId].budget_estimated += item.amount;
          projectsMap[projId].invoiced_total += item.amount;
          projectsMap[projId].paid_total += item.amount;

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
              description: item.description || `Аванс / Оплата по объекту ${projKey}`,
              unit: 'kpl',
              quantity: 1,
              unit_price: item.amount,
              total_without_vat: item.amount,
              vat_rate: 0,
              vat_amount: 0,
              total_with_vat: item.amount,
            }],
            subtotal: item.amount,
            vat_rate: 0,
            vat_amount: 0,
            total_amount: item.amount,
            is_reverse_charge: false,
            payment_status: 'paid',
            paid_amount: item.amount,
            payment_method: item.paymentMethod.toLowerCase().includes('готівка') ? 'cash' : 'bank_transfer',
            notes: `Внес: ${item.author} (${item.paymentMethod})`,
          });
        } else {
          projectsMap[projId].budget_actual_spent += item.amount;
          projectsMap[projId].budget_cost_estimated += item.amount;

          expenses.push({
            id: `exp-g-${i}`,
            project_id: projId,
            category: mapExpenseCategory(item.category),
            vendor: item.description.length > 3 ? item.description.split(' ')[0] : item.category,
            description: item.description ? `${item.description} [${item.category}]` : item.category,
            amount_without_vat: item.amount,
            vat_rate: 0,
            vat_amount: 0,
            amount_with_vat: item.amount,
            receipt_number: `GF-${i}`,
            date: isoDate,
            paid_by: `${item.paymentMethod}${item.author ? ` (${item.author})` : ''}`,
            status: 'approved',
          });
        }
      }
    }

    // Sort descending by date (newest first)
    const allExpenses = expenses.sort((a, b) => {
      const tA = new Date(a.date).getTime() || 0;
      const tB = new Date(b.date).getTime() || 0;
      if (tA !== tB) return tB - tA;
      return (b.receipt_number || '').localeCompare(a.receipt_number || '');
    });

    const allInvoices = invoices.sort((a, b) => {
      const tA = new Date(a.issue_date).getTime() || 0;
      const tB = new Date(b.issue_date).getTime() || 0;
      if (tA !== tB) return tB - tA;
      return (b.invoice_number || '').localeCompare(a.invoice_number || '');
    });

    const projectsList = Object.values(projectsMap);
    const clientsList = Object.values(clientsMap);

    // Save cleanly to storage & sync to Supabase
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
      message: `Синхронизировано со STATISTICS FINAL: ${projectsList.filter(p => p.status === 'in_progress').length} активных объектов (${ACTIVE_PROJECTS_NAMES.join(', ')}), ${projectsList.filter(p => p.status === 'completed').length} сданных и ${expenses.length} записей расходов!`,
    };
  } catch (err: any) {
    console.error('Sync error:', err);
    return { success: false, message: `Ошибка синхронизации: ${err.message || err}` };
  }
}

