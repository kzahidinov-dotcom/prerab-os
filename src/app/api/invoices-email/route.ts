import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  RawInvoiceEmail,
  buildSupplierInvoiceFromEmail,
  looksLikeInvoiceEmail,
  invoiceDedupeKey,
} from '@/lib/invoice-parser';
import { SupplierInvoice } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vomktsnufaatfxesbqfl.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_hlmExlU1508_IsiytG7vow_8sKJg62F';

const supabase = createClient(supabaseUrl, supabaseKey);

const CLOUD_DOC_ID = 'bgt-system-supplier-invoices-cloud';

// Читает текущий список фактур из облака (сначала отдельная таблица, потом универсальный документ)
async function readCloudInvoices(): Promise<{ list: SupplierInvoice[]; hasTable: boolean }> {
  try {
    const { data, error } = await supabase.from('supplier_invoices').select('*').range(0, 9999);
    if (!error && Array.isArray(data)) {
      return { list: data as SupplierInvoice[], hasTable: true };
    }
  } catch (e) {
    // таблицы нет — идем в универсальный документ
  }

  try {
    const { data } = await supabase.from('budgets').select('*').eq('id', CLOUD_DOC_ID).single();
    if (data && Array.isArray(data.items)) {
      return { list: data.items as SupplierInvoice[], hasTable: false };
    }
  } catch (e) {
    // документа еще нет — значит, список пустой
  }

  return { list: [], hasTable: false };
}

// Сохраняет полный список фактур обратно в облако.
// Бросает ошибку, если сохранить не удалось — тогда скрипт Gmail НЕ пометит письма
// обработанными и пришлет их снова при следующем запуске (фактура не потеряется).
async function writeCloudInvoices(list: SupplierInvoice[], hasTable: boolean): Promise<void> {
  let tableSaved = false;

  if (hasTable) {
    const sanitized = list.map(i => ({ ...i, project_id: i.project_id && i.project_id.trim() ? i.project_id : null }));
    const { error } = await supabase.from('supplier_invoices').upsert(sanitized, { onConflict: 'id' });
    if (error) {
      console.warn('Не удалось записать в таблицу supplier_invoices:', error.message);
    } else {
      tableSaved = true;
    }
  }

  const { error: docError } = await supabase.from('budgets').upsert([{
    id: CLOUD_DOC_ID,
    project_id: null,
    title: 'Cloud Supplier Invoices Storage (Faktúry na úhradu)',
    items: list,
    total_labor_cost: 0,
    total_material_cost: 0,
    total_cost: 0,
    total_client_price: 0,
    vat_rate: 23,
    vat_amount: 0,
    total_with_vat: 0,
    margin_amount: 0,
    margin_percent: 0,
    is_reverse_charge: false,
    status: 'approved',
    updated_at: new Date().toISOString(),
  }], { onConflict: 'id' });

  if (docError && !tableSaved) {
    throw new Error(`Облачная база недоступна, фактуры не сохранены: ${docError.message}`);
  }
}

function normalizeEmails(payload: any): RawInvoiceEmail[] {
  const raw = Array.isArray(payload) ? payload : (payload?.emails || payload?.messages || [payload]);
  return (raw || [])
    .filter((e: any) => e && typeof e === 'object')
    .map((e: any): RawInvoiceEmail => ({
      from: e.from || e.sender || e.From,
      subject: e.subject || e.Subject || '',
      body: e.body || e.text || e.plain || e.snippet || '',
      html: e.html || e.bodyHtml || '',
      received_at: e.received_at || e.date || e.Date || new Date().toISOString(),
      message_id: e.message_id || e.messageId || e.id || e['Message-Id'],
      thread_id: e.thread_id || e.threadId,
      attachment_name: e.attachment_name || e.attachmentName || (Array.isArray(e.attachments) ? e.attachments[0]?.name : undefined),
      attachment_url: e.attachment_url || e.attachmentUrl || (Array.isArray(e.attachments) ? e.attachments[0]?.url : undefined),
      attachment_text: e.attachment_text || e.attachmentText || (Array.isArray(e.attachments) ? e.attachments[0]?.text : undefined),
    }));
}

/**
 * Прием фактур с почты.
 * Сюда шлет письма скрипт Google Apps Script (scripts/gmail-invoice-sync.gs),
 * который раз в 15 минут просматривает почтовый ящик фирмы.
 *
 * POST body: одно письмо или { emails: [...] }
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Необязательная защита эндпоинта: если задан INVOICE_INBOX_SECRET, письма без ключа не принимаем
    const requiredSecret = process.env.INVOICE_INBOX_SECRET;
    if (requiredSecret) {
      const provided = req.headers.get('x-prerab-secret') || payload?.secret;
      if (provided !== requiredSecret) {
        return NextResponse.json({ success: false, error: 'Неверный ключ доступа' }, { status: 401 });
      }
    }

    const emails = normalizeEmails(payload);
    if (emails.length === 0) {
      return NextResponse.json({ success: false, error: 'Пустой запрос: нет писем для разбора' }, { status: 400 });
    }

    const { list: existing, hasTable } = await readCloudInvoices();
    const keys = new Set(existing.map(i => invoiceDedupeKey(i)));

    const added: SupplierInvoice[] = [];
    let skippedDuplicates = 0;
    let skippedNotInvoice = 0;

    emails.forEach((email, index) => {
      if (!looksLikeInvoiceEmail(email)) {
        skippedNotInvoice++;
        return;
      }

      const invoice = buildSupplierInvoiceFromEmail(email, `${index}`);
      const key = invoiceDedupeKey(invoice);
      if (keys.has(key)) {
        skippedDuplicates++;
        return;
      }
      keys.add(key);
      added.push(invoice);
    });

    if (added.length > 0) {
      await writeCloudInvoices([...added, ...existing], hasTable);
    }

    return NextResponse.json({
      success: true,
      added: added.length,
      skipped_duplicates: skippedDuplicates,
      skipped_not_invoice: skippedNotInvoice,
      invoices: added.map(i => ({
        id: i.id,
        supplier: i.supplier_name,
        invoice_number: i.invoice_number,
        amount: i.amount_with_vat,
        due_date: i.due_date,
      })),
    });
  } catch (err: any) {
    console.error('Ошибка приема фактуры с почты:', err);
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

// Проверка живости эндпоинта + сколько фактур уже в базе
export async function GET() {
  const { list } = await readCloudInvoices();
  const unpaid = list.filter(i => i.payment_status !== 'paid');
  return NextResponse.json({
    status: 'active',
    message: 'Prerab OS: прием фактур с почты работает',
    total_invoices: list.length,
    unpaid_invoices: unpaid.length,
    unpaid_amount: Math.round(unpaid.reduce((sum, i) => sum + (Number(i.amount_with_vat) || 0), 0) * 100) / 100,
  });
}
