// -------------------------------------------------------------
// РАЗБОР ФАКТУР ИЗ ПИСЕМ (Parser došlých faktúr z e-mailu)
// Работает и на сервере (API route), и в браузере — без обращений к window.
// Понимает словацкие, чешские, английские и русские формулировки фактур.
// -------------------------------------------------------------

import { ExpenseCategory, SupplierInvoice } from '@/types';

export interface RawInvoiceEmail {
  from?: string;              // "Hornbach <faktury@hornbach.sk>"
  subject?: string;
  body?: string;              // Текст письма (plain text или HTML)
  html?: string;              // HTML-версия письма (если передана отдельно)
  received_at?: string;       // Дата письма (ISO)
  message_id?: string;        // Gmail Message ID — ключ защиты от дублей
  attachment_name?: string;   // faktura_2026001.pdf
  attachment_url?: string;    // Ссылка на PDF (Google Drive) или data:URL
  attachment_text?: string;   // Извлеченный текст PDF (если отправитель его прислал)
}

export interface ParsedInvoiceFields {
  supplier_name: string;
  supplier_ico?: string;
  supplier_iban?: string;
  invoice_number: string;
  variable_symbol?: string;
  constant_symbol?: string;
  issue_date: string;
  due_date: string;
  amount_without_vat: number;
  vat_rate: number;
  vat_amount: number;
  amount_with_vat: number;
  category: ExpenseCategory;
  confidence: number;         // 0..1 — насколько уверенно распознана сумма и номер
}

// Известные поставщики: домен письма / имя отправителя -> Название и категория расхода
const KNOWN_VENDORS: { match: string[]; name: string; category: ExpenseCategory }[] = [
  { match: ['hornbach'], name: 'Hornbach', category: 'materials' },
  { match: ['obi.sk', 'obi.cz', '@obi'], name: 'OBI', category: 'materials' },
  { match: ['bauhaus'], name: 'Bauhaus', category: 'materials' },
  { match: ['siko'], name: 'SIKO Kúpeľne', category: 'materials' },
  { match: ['stavebninydek'], name: 'Stavebniny DEK', category: 'materials' },
  { match: ['maxparket'], name: 'MAX Parket', category: 'materials' },
  { match: ['marcustrade'], name: 'MARCUS TRADE', category: 'materials' },
  { match: ['top-obaly', 'topobaly'], name: 'TOP OBALY', category: 'materials' },
  { match: ['harko', 'saniland'], name: 'HARKO / Saniland', category: 'materials' },
  { match: ['lzcech'], name: 'L&Z Čech', category: 'materials' },
  { match: ['ikea'], name: 'IKEA', category: 'materials' },
  { match: ['faxcopy'], name: 'FaxCOPY', category: 'overhead' },
  { match: ['websupport'], name: 'Websupport (hosting)', category: 'overhead' },
  { match: ['merkury'], name: 'Merkury Market', category: 'materials' },
  { match: ['woodcote'], name: 'Woodcote', category: 'materials' },
  { match: ['stavmat'], name: 'Stavmat', category: 'materials' },
  { match: ['pro-dom', 'prodom'], name: 'PRO-DOM', category: 'materials' },
  { match: ['dek.sk', 'dek.cz', '@dek'], name: 'DEK Stavebniny', category: 'materials' },
  { match: ['ptacek', 'ptáček'], name: 'PTÁČEK', category: 'materials' },
  { match: ['baumit'], name: 'Baumit', category: 'materials' },
  { match: ['knauf'], name: 'Knauf', category: 'materials' },
  { match: ['rigips'], name: 'Rigips', category: 'materials' },
  { match: ['slovnaft'], name: 'Slovnaft', category: 'transport_fuel' },
  { match: ['omv'], name: 'OMV', category: 'transport_fuel' },
  { match: ['shell'], name: 'Shell', category: 'transport_fuel' },
  { match: ['orlen', 'benzina'], name: 'Orlen', category: 'transport_fuel' },
  { match: ['ramirent', 'boels', 'pozicovna'], name: 'Аренда техники', category: 'tools_machinery' },
  { match: ['marius pedersen', 'odpad', 'kontajner'], name: 'Вывоз мусора', category: 'waste_disposal' },
  { match: ['orange', 'telekom', 'o2.sk', '4ka'], name: 'Мобильная связь', category: 'overhead' },
  { match: ['zse', 'sse.sk', 'vse.sk', 'spp.sk', 'energie'], name: 'Энергия и коммуналка', category: 'overhead' },
];

const CATEGORY_KEYWORDS: { words: string[]; category: ExpenseCategory }[] = [
  { words: ['nafta', 'benzín', 'benzin', 'palivo', 'дизель', 'бензин', 'tankovanie'], category: 'transport_fuel' },
  { words: ['kontajner', 'odvoz odpadu', 'skládka', 'мусор'], category: 'waste_disposal' },
  { words: ['prenájom', 'požičovňa', 'аренда', 'lešenie', 'náradie'], category: 'tools_machinery' },
  { words: ['subdodáv', 'субподряд'], category: 'subcontractor' },
  { words: ['mzda', 'výplata', 'зарплат'], category: 'labor' },
  { words: ['telefón', 'internet', 'poistenie', 'nájom kancelárie', 'účtovníctvo'], category: 'overhead' },
];

// Надежные признаки фактуры: само слово «фактура» или «налоговый документ»
const INVOICE_MARKERS = [
  'faktúra', 'faktura', 'faktúru', 'faktúry', 'fakturu', 'faktúrou',
  'daňový doklad', 'danovy doklad', 'danový doklad', 'zálohová faktúra', 'proforma',
  'invoice', 'фактура', 'счет на оплату', 'счёт на оплату',
];

// Слабые признаки: встречаются и в обычных письмах магазинов
// («ваш заказ ждет оплаты»), поэтому засчитываются только вместе с вложением
const WEAK_INVOICE_MARKERS = [
  'na úhradu', 'na uhradu', 'k úhrade', 'k uhrade', 'splatnosť', 'splatnost',
  'к оплате', 'amount due',
];

export function stripHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|td|th|li|h[1-6]|table)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Превращает европейское написание суммы в число.
 * "1 234,56" -> 1234.56 | "1.234,56" -> 1234.56 | "1,234.56" -> 1234.56
 */
export function parseAmount(raw?: string | number | null): number {
  if (typeof raw === 'number') return isFinite(raw) ? raw : 0;
  if (!raw) return 0;

  let s = String(raw).replace(/[\s €]|EUR|Eur|eur/g, '').trim();
  if (!s) return 0;

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    // Разделителем дробной части является последний встреченный знак
    const decimalSep = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.';
    const thousandSep = decimalSep === ',' ? '.' : ',';
    s = s.split(thousandSep).join('');
    s = s.replace(decimalSep, '.');
  } else if (hasComma) {
    s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.split(',').join('');
  } else if (hasDot) {
    if (!/\.\d{1,2}$/.test(s)) s = s.split('.').join('');
  }

  const num = parseFloat(s.replace(/[^0-9.\-]/g, ''));
  return isFinite(num) ? Math.round((num + Number.EPSILON) * 100) / 100 : 0;
}

/**
 * Приводит любую дату из письма к формату YYYY-MM-DD.
 */
export function parseDateToIso(raw?: string | null): string {
  if (!raw) return '';
  const clean = String(raw).trim();
  if (!clean) return '';

  // YYYY-MM-DD (возможно с временем)
  const iso = clean.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // DD.MM.YYYY / D. M. YYYY / DD/MM/YYYY
  const dmy = clean.match(/(\d{1,2})\s*[.\/-]\s*(\d{1,2})\s*[.\/-]\s*(\d{2,4})/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    let year = dmy[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return '';
}

export function addDaysIso(isoDate: string, days: number): string {
  const base = isoDate ? new Date(`${isoDate}T00:00:00Z`) : new Date();
  if (isNaN(base.getTime())) return new Date().toISOString().split('T')[0];
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().split('T')[0];
}

const AMOUNT_PATTERN = '([0-9][0-9\\s\\u00A0.,]*[0-9]|[0-9])';

function findLabeledAmount(text: string, labels: string[]): number {
  for (const label of labels) {
    const re = new RegExp(
      `${label}[^0-9\\-]{0,40}${AMOUNT_PATTERN}`,
      'i'
    );
    const m = text.match(re);
    if (m) {
      const value = parseAmount(m[1]);
      if (value > 0) return value;
    }
  }
  return 0;
}

function findLabeledValue(text: string, labels: string[], valuePattern: string): string {
  for (const label of labels) {
    const re = new RegExp(`${label}[^0-9A-Za-zÀ-ž]{0,20}(${valuePattern})`, 'i');
    const m = text.match(re);
    if (m && m[1]) return m[1].trim();
  }
  return '';
}

export function detectVendor(from?: string, subject?: string, body?: string): { name: string; category: ExpenseCategory } {
  const haystack = `${from || ''} ${subject || ''} ${(body || '').slice(0, 600)}`.toLowerCase();

  for (const vendor of KNOWN_VENDORS) {
    if (vendor.match.some(token => haystack.includes(token))) {
      return { name: vendor.name, category: vendor.category };
    }
  }

  // Имя из поля From: "Stavebniny XY <faktury@xy.sk>"
  const named = (from || '').match(/^\s*"?([^"<]+?)"?\s*</);
  if (named && named[1] && named[1].trim().length > 1) {
    return { name: named[1].trim(), category: 'materials' };
  }

  // Иначе — домен отправителя: faktury@stavmat.sk -> Stavmat
  const domain = (from || '').match(/@([a-z0-9.-]+)\./i);
  if (domain && domain[1]) {
    const clean = domain[1].split('.').pop() || domain[1];
    return { name: clean.charAt(0).toUpperCase() + clean.slice(1), category: 'materials' };
  }

  return { name: 'Неизвестный поставщик', category: 'materials' };
}

function detectCategory(fallback: ExpenseCategory, text: string): ExpenseCategory {
  const lower = text.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.words.some(w => lower.includes(w))) return entry.category;
  }
  return fallback;
}

/**
 * Проверяет, похоже ли письмо на фактуру на уплату (а не на рекламу магазина).
 */
export function looksLikeInvoiceEmail(email: RawInvoiceEmail): boolean {
  const subject = (email.subject || '').toLowerCase();
  const body = stripHtml(email.body || email.html || '').toLowerCase();
  const attachment = (email.attachment_name || '').toLowerCase();
  // Текст, распознанный из PDF: письмо может быть пустым, а фактура — внутри вложения
  const attachmentText = (email.attachment_text || '').slice(0, 4000).toLowerCase();

  const hasStrongMarker =
    INVOICE_MARKERS.some(m => subject.includes(m)) ||
    INVOICE_MARKERS.some(m => body.includes(m)) ||
    INVOICE_MARKERS.some(m => attachmentText.includes(m)) ||
    /fakt|invoice|фактур/i.test(attachment);

  // «Ваш заказ ждет оплаты» — это напоминание магазина, а не фактура.
  // Такие слова принимаем в расчет, только если к письму приложен документ.
  const hasAttachment = !!(email.attachment_name || email.attachment_url || email.attachment_text);
  const hasWeakMarker =
    hasAttachment &&
    (WEAK_INVOICE_MARKERS.some(m => subject.includes(m)) ||
      WEAK_INVOICE_MARKERS.some(m => body.includes(m)) ||
      WEAK_INVOICE_MARKERS.some(m => attachmentText.includes(m)));

  if (!hasStrongMarker && !hasWeakMarker) return false;

  // Рекламные рассылки отсекаем
  const spamMarkers = ['newsletter', 'akcia týždňa', 'zľava', 'výpredaj', 'reklam', 'unsubscribe z newsletter'];
  const isPureAd = spamMarkers.some(m => subject.includes(m)) && !subject.includes('fakt');
  if (isPureAd) return false;

  // «Objednávka ... čaká na úhradu», «platba nebola dokončená» — напоминания
  // интернет-магазина об оплате заказа, документа в них нет
  const isOrderReminder =
    /(objedn[áa]vka|objedn[áa]vku|zamow|заказ).{0,60}(ča?k[áa]|čeká|ceka)/i.test(subject) ||
    /nebola dokončená platba|platba nebola dokončená|dokončite platbu|nedokončená objednávka/i.test(`${subject} ${body}`);
  if (isOrderReminder && !/fakt|invoice|daňov[ýy] doklad/i.test(`${subject} ${(email.attachment_name || '')}`)) {
    return false;
  }

  return true;
}

// Длина IBAN по странам — отсекает случайные наборы символов из ссылок в письмах
const IBAN_LENGTHS: Record<string, number> = {
  SK: 24, CZ: 24, AT: 20, DE: 22, HU: 28, PL: 28, SI: 19, HR: 21,
};

/**
 * Достает IBAN получателя: сначала рядом с меткой «IBAN», потом по формату.
 * Результат проверяется по длине для страны, поэтому мусор из ссылок не пройдет.
 */
export function extractIban(text: string): string {
  const shape = '[A-Z]{2}[ \\u00A0]?[0-9]{2}(?:[ \\u00A0]?[A-Z0-9]{4}){2,7}[ \\u00A0]?[A-Z0-9]{0,4}';
  const candidates: string[] = [];

  const labeled = text.match(new RegExp(`IBAN[^A-Za-z0-9]{0,12}(${shape})`, 'i'));
  if (labeled) candidates.push(labeled[1]);

  const generic = text.match(/\b(?:SK|CZ|AT|DE|HU|PL|SI|HR)[ \u00A0]?[0-9]{2}(?:[ \u00A0]?[A-Z0-9]{4}){2,7}/g);
  if (generic) candidates.push(...generic);

  for (const candidate of candidates) {
    const clean = candidate.replace(/[\s\u00A0]/g, '').toUpperCase();
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(clean)) continue;
    const expected = IBAN_LENGTHS[clean.slice(0, 2)];
    if (expected) {
      if (clean.length !== expected) continue;
    } else if (clean.length < 15 || clean.length > 34) {
      continue;
    }
    return clean;
  }
  return '';
}

/**
 * Главный разбор письма: достает поставщика, номер, суммы, VS, IBAN и сроки.
 */
export function parseInvoiceEmail(email: RawInvoiceEmail): ParsedInvoiceFields {
  const bodyText = stripHtml(email.body || email.html || '');
  const text = `${email.subject || ''}\n${bodyText}\n${email.attachment_text || ''}`;

  const vendor = detectVendor(email.from, email.subject, bodyText);
  const receivedIso = parseDateToIso(email.received_at) || new Date().toISOString().split('T')[0];

  // 1. Итоговая сумма к уплате
  let totalWithVat = findLabeledAmount(text, [
    'celkom\\s*k\\s*úhrade', 'celkom\\s*k\\s*uhrade', 'spolu\\s*k\\s*úhrade',
    'suma\\s*na\\s*úhradu', 'suma\\s*na\\s*uhradu', 'k\\s*úhrade', 'k\\s*uhrade',
    'celkom\\s*s\\s*dph', 'spolu\\s*s\\s*dph', 'celková\\s*suma', 'celkova\\s*suma',
    'cena\\s*celkom', 'zostáva\\s*uhradiť', 'к\\s*оплате', 'итого\\s*к\\s*оплате',
    'total\\s*amount', 'amount\\s*due', 'total',
    // Последняя очередь: короткие метки без уточнения («Celkom 450,00 EUR»).
    // Отрицательная проверка не дает поймать строку «Celkom bez DPH».
    'suma\\s*celkom', 'celkom(?!\\s*bez)', 'spolu(?!\\s*bez)', 'итого(?!\\s*без)',
  ]);

  // 2. База без DPH
  let baseAmount = findLabeledAmount(text, [
    'základ\\s*dane', 'zaklad\\s*dane', 'celkom\\s*bez\\s*dph', 'spolu\\s*bez\\s*dph',
    'cena\\s*bez\\s*dph', 'suma\\s*bez\\s*dph', 'без\\s*ндс', 'без\\s*dph',
  ]);

  // 3. Сумма DPH и ставка
  const vatAmount = findLabeledAmount(text, ['dph\\s*\\d{1,2}\\s*%', 'daň\\s*spolu', 'výška\\s*dph', 'suma\\s*dph', 'сумма\\s*ндс']);
  const rateMatch = text.match(/(?:sadzba\s*dph|dph|ндс|vat)[^0-9%]{0,12}(\d{1,2})\s*%/i) || text.match(/(\d{1,2})\s*%\s*dph/i);
  let vatRate = rateMatch ? parseInt(rateMatch[1], 10) : 23;
  if (![0, 5, 19, 23].includes(vatRate)) vatRate = 23;

  // Достраиваем недостающие суммы
  if (!totalWithVat && baseAmount) {
    totalWithVat = Math.round((baseAmount * (1 + vatRate / 100) + Number.EPSILON) * 100) / 100;
  }
  if (!baseAmount && totalWithVat) {
    baseAmount = Math.round((totalWithVat / (1 + vatRate / 100) + Number.EPSILON) * 100) / 100;
  }
  const finalVatAmount = vatAmount || Math.round((totalWithVat - baseAmount + Number.EPSILON) * 100) / 100;

  // 4. Номер фактуры (значение обязано содержать цифру, иначе поймаем случайное слово)
  const INVOICE_NO_VALUE = '(?=[A-Z0-9\\-\\/]*[0-9])[A-Z0-9][A-Z0-9\\-\\/]{3,24}';
  let invoiceNumber = findLabeledValue(text, [
    'číslo\\s*faktúry', 'cislo\\s*faktury', 'č\\.\\s*faktúry',
    'faktúra\\s*(?:č\\.?|číslo)', 'faktura\\s*(?:c\\.?|cislo)',
    'doklad\\s*č\\.?', 'invoice\\s*(?:no\\.?|number|#)', 'номер\\s*фактуры', 'фактура\\s*№',
    'fakt[úu]ra\\s*na\\s*[úu]hradu', 'fakt[úu]r\\w*', 'invoice',
  ], INVOICE_NO_VALUE);

  // 5. Variabilný symbol
  const variableSymbol = findLabeledValue(text, [
    'variabilný\\s*symbol', 'variabilny\\s*symbol', 'var\\.?\\s*symbol', '\\bvs\\b',
  ], '\\d{4,12}');

  const constantSymbol = findLabeledValue(text, ['konštantný\\s*symbol', 'konstantny\\s*symbol', '\\bks\\b'], '\\d{3,4}');

  if (!invoiceNumber && variableSymbol) invoiceNumber = variableSymbol;
  if (!invoiceNumber) {
    const fromSubject = (email.subject || '').match(/\b([A-Z]{0,3}[0-9]{6,12})\b/);
    invoiceNumber = fromSubject ? fromSubject[1] : `EMAIL-${receivedIso.replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`;
  }

  // 6. IBAN и IČO поставщика
  const supplierIban = extractIban(text);
  const icoMatch = text.match(/i[čc]o[^0-9]{0,10}(\d{8})/i);

  // 7. Даты
  const issueDate = parseDateToIso(findLabeledValue(text, [
    'dátum\\s*vystavenia', 'datum\\s*vystavenia', 'vystavené\\s*dňa', 'dátum\\s*vyhotovenia',
    'date\\s*of\\s*issue', 'дата\\s*выставления',
  ], '[0-9]{1,2}\\s*[.\\/-]\\s*[0-9]{1,2}\\s*[.\\/-]\\s*[0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2}')) || receivedIso;

  const dueDate = parseDateToIso(findLabeledValue(text, [
    'dátum\\s*splatnosti', 'datum\\s*splatnosti', 'splatnosť\\s*(?:dňa|do)?', 'splatnost',
    'splatná\\s*do', 'termín\\s*úhrady', 'due\\s*date', 'срок\\s*оплаты', 'оплатить\\s*до',
  ], '[0-9]{1,2}\\s*[.\\/-]\\s*[0-9]{1,2}\\s*[.\\/-]\\s*[0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2}')) || addDaysIso(issueDate, 14);

  // Насколько можно доверять разбору (нужна ручная проверка, если 0 суммы)
  let confidence = 0.4;
  if (totalWithVat > 0) confidence += 0.35;
  if (variableSymbol) confidence += 0.1;
  if (supplierIban) confidence += 0.1;
  if (invoiceNumber && !invoiceNumber.startsWith('EMAIL-')) confidence += 0.05;

  return {
    supplier_name: vendor.name,
    supplier_ico: icoMatch ? icoMatch[1] : undefined,
    supplier_iban: supplierIban || undefined,
    invoice_number: invoiceNumber,
    variable_symbol: variableSymbol || undefined,
    constant_symbol: constantSymbol || '0308',
    issue_date: issueDate,
    due_date: dueDate,
    amount_without_vat: baseAmount,
    vat_rate: vatRate,
    vat_amount: finalVatAmount > 0 ? finalVatAmount : 0,
    amount_with_vat: totalWithVat,
    category: detectCategory(vendor.category, text),
    confidence: Math.min(1, Math.round(confidence * 100) / 100),
  };
}

/**
 * Собирает готовую запись «Фактура на уплату» из письма.
 */
export function buildSupplierInvoiceFromEmail(email: RawInvoiceEmail, idSuffix?: string): SupplierInvoice {
  const parsed = parseInvoiceEmail(email);
  const now = new Date().toISOString();
  const receivedIso = email.received_at || now;

  return {
    id: `sinv-${Date.now()}-${idSuffix || Math.random().toString(36).slice(2, 7)}`,
    supplier_name: parsed.supplier_name,
    supplier_ico: parsed.supplier_ico,
    supplier_iban: parsed.supplier_iban,
    invoice_number: parsed.invoice_number,
    variable_symbol: parsed.variable_symbol,
    constant_symbol: parsed.constant_symbol,
    issue_date: parsed.issue_date,
    due_date: parsed.due_date,
    amount_without_vat: parsed.amount_without_vat,
    vat_rate: parsed.vat_rate,
    vat_amount: parsed.vat_amount,
    amount_with_vat: parsed.amount_with_vat,
    currency: 'EUR',
    project_id: '',
    category: parsed.category,
    payment_status: 'unpaid',
    paid_amount: 0,
    source: 'email',
    email_from: email.from,
    email_subject: email.subject,
    email_message_id: email.message_id,
    email_received_at: receivedIso,
    attachment_name: email.attachment_name,
    attachment_url: email.attachment_url,
    notes: buildNotes(email, parsed),
    created_at: now,
    updated_at: now,
  };
}

// Подсказка бухгалтеру: залоговая фактура — предоплата до поставки товара
function buildNotes(email: RawInvoiceEmail, parsed: ParsedInvoiceFields): string | undefined {
  const haystack = `${email.subject || ''} ${stripHtml(email.body || email.html || '').slice(0, 2000)} ${(email.attachment_text || '').slice(0, 2000)}`.toLowerCase();
  const notes: string[] = [];

  if (/z[áa]lohov|proforma|predfakt/.test(haystack)) {
    notes.push('Залоговая фактура (предоплата до поставки).');
  }
  // SIKO и другие шлют «Daňový doklad k platbe» уже ПОСЛЕ оплаты картой
  if (/doklad k platbe|k prijatej platbe|potvrdenie o platbe|doklad k zaplaten/.test(haystack)) {
    notes.push('Похоже, документ об уже произведенной оплате — проверьте, не оплатите второй раз.');
  }
  if (parsed.confidence < 0.6 || parsed.amount_with_vat <= 0) {
    notes.push('Автоприем с почты: проверьте сумму и срок оплаты вручную.');
  }

  return notes.length > 0 ? notes.join(' ') : undefined;
}

/**
 * Ключ защиты от дублей: одно и то же письмо не должно завестись дважды.
 */
export function invoiceDedupeKey(inv: Pick<SupplierInvoice, 'email_message_id' | 'supplier_name' | 'invoice_number' | 'amount_with_vat'>): string {
  if (inv.email_message_id) return `msg:${inv.email_message_id}`;
  return `inv:${(inv.supplier_name || '').toLowerCase().trim()}|${(inv.invoice_number || '').toLowerCase().trim()}|${inv.amount_with_vat}`;
}
