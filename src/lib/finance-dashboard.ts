// -------------------------------------------------------------
// ФИНАНСОВЫЙ ДАШБОРД ИЗ GOOGLE ТАБЛИЦЫ (STATISTICS FINAL)
//
// Система больше ничего не пересчитывает сама: она показывает те же
// цифры, что и лист «ФІНАНСОВИЙ ДАШБОРД ФІРМИ» в таблице фирмы.
// Учет ведется вручную в таблице — здесь только зеркало.
// -------------------------------------------------------------

export const FINANCE_SHEET_ID = '1rT1tTCDIn39nAhk1vfbz5g4aGLNuknR78v3NrQFn5rk';

// Возможные названия вкладки с финансовым дашбордом — система сама
// найдет рабочее и запомнит его, чтобы больше не искать
const SHEET_NAME_CANDIDATES = [
  'ФІНАНСОВИЙ ДАШБОРД ФІРМИ',
  'ФІНАНСОВИЙ ДАШБОРД',
  'ФИНАНСОВЫЙ ДАШБОРД',
  'ДАШБОРД ФІРМИ',
  'ДАШБОРД',
  'Дашборд',
  'DASHBOARD',
  'Dashboard',
];

const CACHE_KEY = 'prerab_finance_dashboard_v1';
const URL_KEY = 'prerab_finance_dashboard_url_v1';

export interface FinanceProjectRow {
  name: string;
  income: number;
  materials_build: number;
  materials_design: number;
  wages: number;
  repair_payment: number;
  other: number;
  total_expense: number;
  balance: number;
  margin_percent: number;
}

export interface FinanceOverheadRow {
  category: string;
  amount: number;
  percent: number;
}

export interface FinanceDashboardData {
  total_income: number;
  project_expenses: number;
  overhead_expenses: number;
  net_profit: number;
  margin_percent: number;
  best_project: string;
  top_overhead: string;
  projects: FinanceProjectRow[];
  overhead: FinanceOverheadRow[];
  source_url: string;
  fetched_at: string;
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

/** «130 234,00 €» -> 130234, «-16,08 €» -> -16.08, «13,5%» -> 13.5 */
export function parseMoney(raw?: string): number {
  if (!raw) return 0;
  let s = String(raw).replace(/[\s  ]/g, '').replace(/€|%/g, '').trim();
  if (!s) return 0;

  const negative = s.startsWith('-') || s.startsWith('−') || s.startsWith('(');
  s = s.replace(/[()−-]/g, '');

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    const decimalSep = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.';
    const thousandSep = decimalSep === ',' ? '.' : ',';
    s = s.split(thousandSep).join('').replace(decimalSep, '.');
  } else if (hasComma) {
    s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.split(',').join('');
  } else if (hasDot && !/\.\d{1,2}$/.test(s)) {
    s = s.split('.').join('');
  }

  const num = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (!isFinite(num)) return 0;
  return negative ? -num : num;
}

const norm = (s?: string): string => (s || '').toLowerCase().replace(/[\s '’ʼ`"]/g, '');

/** Ищет строку по началу первой ячейки и отдает значение из следующей непустой */
function findLabeledValue(rows: string[][], labels: string[]): string {
  for (const row of rows) {
    const key = norm(row[0]);
    if (!key) continue;
    if (labels.some(l => key.startsWith(norm(l)))) {
      const value = row.slice(1).find(c => c && c.trim().length > 0);
      if (value) return value;
    }
  }
  return '';
}

export function parseFinanceDashboardCsv(csv: string, sourceUrl: string): FinanceDashboardData | null {
  const rows = csv
    .split('\n')
    .filter(l => l.trim().length > 0)
    .map(parseCsvLine);

  const totalIncomeRaw = findLabeledValue(rows, ['Загальний дохід', 'Общий доход']);
  if (!totalIncomeRaw) return null; // не тот лист

  const projects: FinanceProjectRow[] = [];
  const overhead: FinanceOverheadRow[] = [];

  // Таблица объектов: от заголовка с «Матеріали» до строки «ІТОГО ПО ОБ'ЄКТАХ»
  const projectsHeader = rows.findIndex(r => norm(r[0]).startsWith(norm("Об'єкт")) && r.some(c => norm(c).includes('матеріали')));
  if (projectsHeader >= 0) {
    for (let i = projectsHeader + 1; i < rows.length; i++) {
      const row = rows[i];
      const name = (row[0] || '').trim();
      if (!name) continue;
      if (norm(name).startsWith(norm('ІТОГО'))) break;
      if (norm(name).startsWith(norm('ЗАГАЛЬНІ ВИТРАТИ'))) break;

      projects.push({
        name,
        income: parseMoney(row[1]),
        materials_build: parseMoney(row[2]),
        materials_design: parseMoney(row[3]),
        wages: parseMoney(row[4]),
        repair_payment: parseMoney(row[5]),
        other: parseMoney(row[6]),
        total_expense: parseMoney(row[7]),
        balance: parseMoney(row[8]),
        margin_percent: parseMoney(row[9]),
      });
    }
  }

  // Таблица общих затрат: от заголовка «Категорія | Сума | % від загальних витрат»
  const overheadHeader = rows.findIndex(r => norm(r[0]) === norm('Категорія') && r.some(c => norm(c).includes('відзагальнихвитрат')));
  if (overheadHeader >= 0) {
    for (let i = overheadHeader + 1; i < rows.length; i++) {
      const row = rows[i];
      const category = (row[0] || '').trim();
      if (!category) continue;
      if (norm(category).startsWith(norm('ІТОГО'))) break;

      overhead.push({
        category,
        amount: parseMoney(row[1]),
        percent: parseMoney(row[2]),
      });
    }
  }

  return {
    total_income: parseMoney(totalIncomeRaw),
    project_expenses: parseMoney(findLabeledValue(rows, ['Витрати по об', 'Расходы по об'])),
    overhead_expenses: parseMoney(findLabeledValue(rows, ['Загальні витрати фірми', 'Общие расходы фирмы'])),
    net_profit: parseMoney(findLabeledValue(rows, ['ЧИСТИЙ ПРИБУТОК', 'ЧИСТАЯ ПРИБЫЛЬ'])),
    margin_percent: parseMoney(findLabeledValue(rows, ['Маржа фірми', 'Маржа фирмы'])),
    best_project: findLabeledValue(rows, ['Найприбутковіший об', 'Самый прибыльный об']),
    top_overhead: findLabeledValue(rows, ['Найбільша стаття', 'Самая большая статья']),
    projects,
    overhead,
    source_url: sourceUrl,
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Находит вкладку с финансовым дашбордом, не зная ее названия.
 * Открывает список листов таблицы, собирает их номера (gid) и по очереди
 * проверяет, какой лист похож на финансовый дашборд.
 */
async function discoverDashboardUrls(): Promise<string[]> {
  const listUrls = [
    `https://docs.google.com/spreadsheets/d/${FINANCE_SHEET_ID}/htmlview`,
    `https://docs.google.com/spreadsheets/d/${FINANCE_SHEET_ID}/pubhtml`,
  ];

  for (const listUrl of listUrls) {
    try {
      const res = await fetch(`${listUrl}?_t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) continue;
      const html = await res.text();

      const gids = new Set<string>();
      const patterns = [/[#&?]gid=(\d+)/g, /sheet-button-(\d+)/g];
      patterns.forEach(re => {
        let m: RegExpExecArray | null;
        while ((m = re.exec(html)) !== null) {
          gids.add(m[1]);
        }
      });

      if (gids.size > 0) {
        return Array.from(gids)
          .slice(0, 20)
          .map(gid => `https://docs.google.com/spreadsheets/d/${FINANCE_SHEET_ID}/export?format=csv&gid=${gid}`);
      }
    } catch (e) {
      // пробуем следующий способ
    }
  }

  return [];
}

function buildCandidateUrls(): string[] {
  const urls: string[] = [];

  // 1. Ранее найденная (или заданная вручную) ссылка
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(URL_KEY);
      if (saved) urls.push(saved);
    } catch (e) {
      // localStorage недоступен — не страшно
    }
  }

  // 2. Поиск вкладки по названию
  SHEET_NAME_CANDIDATES.forEach(name => {
    urls.push(`https://docs.google.com/spreadsheets/d/${FINANCE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`);
  });

  return urls;
}

/** Приводит ссылку на вкладку (с #gid=...) к ссылке выгрузки CSV */
export function toCsvExportUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('output=csv') || trimmed.includes('out:csv') || trimmed.includes('format=csv')) return trimmed;

  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = trimmed.match(/[#&?]gid=(\d+)/);
  const id = idMatch ? idMatch[1] : FINANCE_SHEET_ID;

  if (gidMatch) {
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gidMatch[1]}`;
  }
  if (/^\d+$/.test(trimmed)) {
    return `https://docs.google.com/spreadsheets/d/${FINANCE_SHEET_ID}/export?format=csv&gid=${trimmed}`;
  }
  return trimmed;
}

export function getCachedFinanceDashboard(): FinanceDashboardData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as FinanceDashboardData) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Забирает финансовый дашборд из таблицы. Пробует сохраненную ссылку,
 * затем ищет вкладку по названию. Найденную ссылку запоминает.
 */
export async function loadFinanceDashboard(explicitUrl?: string): Promise<FinanceDashboardData | null> {
  const candidates = explicitUrl ? [toCsvExportUrl(explicitUrl)] : buildCandidateUrls();

  const found = await tryCandidates(candidates);
  if (found) return found;

  // Названия вкладки угадать не удалось — перебираем листы таблицы по номерам
  if (!explicitUrl) {
    const discovered = await discoverDashboardUrls();
    return await tryCandidates(discovered);
  }

  return null;
}

async function tryCandidates(candidates: string[]): Promise<FinanceDashboardData | null> {
  for (const url of candidates) {
    if (!url) continue;
    try {
      const sep = url.includes('?') ? '&' : '?';
      const res = await fetch(`${url}${sep}_t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) continue;

      const csv = await res.text();
      const data = parseFinanceDashboardCsv(csv, url);
      if (!data) continue;

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(URL_KEY, url);
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (e) {
          // не критично
        }
      }
      return data;
    } catch (e) {
      // пробуем следующий вариант
    }
  }

  return null;
}
