import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vomktsnufaatfxesbqfl.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_hlmExlU1508_IsiytG7vow_8sKJg62F';

const supabase = createClient(supabaseUrl, supabaseKey);

// Приемник Google Формы.
//
// ВАЖНО: записи больше НЕ создаются здесь. Каждая отправка формы и так попадает
// в лист «СТАТИСТИКА ФИН» таблицы STATISTICS FINAL, откуда система забирает ее
// при синхронизации. Раньше запись создавалась обоими путями, и суммы в
// финансах удваивались. Эндпоинт оставлен живым, чтобы скрипт Google Форм не
// падал с ошибкой, и логирует поступившую заявку.
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('Заявка из Google Формы принята (запись берется из таблицы):', payload);

    return NextResponse.json({
      success: true,
      recorded: false,
      message: 'Принято. Запись попадет в систему из листа СТАТИСТИКА ФИН при ближайшей синхронизации.',
    });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Прежняя логика прямой записи в базу (отключена из-за двойного учета)
async function legacyDirectInsert(payload: any) {
  try {

    const {
      date,
      author,
      project,
      category,
      type,
      amount,
      paymentMethod,
      description,
    } = payload;

    const numAmount = parseFloat(amount) || 0;
    const isIncome = (type || '').toLowerCase().includes('дохід') || (category || '').toLowerCase().includes('аванс') || (category || '').toLowerCase().includes('дохід');
    const isGeneral = !project || project === '-' || project.toLowerCase() === 'загальні' || project.toLowerCase().includes('загальні');
    const projId = isGeneral ? '' : `prj-${project.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const clientId = isGeneral ? '' : `cli-${project.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const isoDate = date || new Date().toISOString().split('T')[0];

    if (isIncome) {
      // Auto-insert invoice / income
      const invoiceId = `inv-live-${Date.now()}`;
      await supabase.from('invoices').insert({
        id: invoiceId,
        invoice_number: `INC-${Date.now().toString().slice(-6)}`,
        type: 'proforma',
        project_id: projId,
        client_id: clientId,
        issue_date: isoDate,
        delivery_date: isoDate,
        due_date: isoDate,
        variable_symbol: `${Date.now().toString().slice(-8)}`,
        constant_symbol: '0308',
        items: [{
          id: `ii-live-${Date.now()}`,
          description: description || `Оплата / Аванс (${project || 'Фирма'})`,
          unit: 'kpl',
          quantity: 1,
          unit_price: numAmount,
          total_without_vat: numAmount,
          vat_rate: 0,
          vat_amount: 0,
          total_with_vat: numAmount,
        }],
        subtotal: numAmount,
        vat_rate: 0,
        vat_amount: 0,
        total_amount: numAmount,
        is_reverse_charge: false,
        payment_status: 'paid',
        paid_amount: numAmount,
        payment_method: (paymentMethod || '').toLowerCase().includes('готівка') ? 'cash' : 'bank_transfer',
        notes: `Внес: ${author || 'Сотрудник'} (${paymentMethod || 'Карта'})`,
      });
    } else {
      // Auto-insert expense
      const expenseId = `exp-live-${Date.now()}`;
      await supabase.from('expenses').insert({
        id: expenseId,
        project_id: projId,
        category: (category || '').toLowerCase().includes('строй') || (category || '').toLowerCase().includes('дизайн') ? 'materials' : 'overhead',
        vendor: description ? description.split(' ')[0] : (category || 'Расход'),
        description: description ? `${description} [${category || 'Расход'}]` : (category || 'Расход'),
        amount_without_vat: numAmount,
        vat_rate: 0,
        vat_amount: 0,
        amount_with_vat: numAmount,
        receipt_number: `GF-LIVE-${Date.now().toString().slice(-4)}`,
        date: isoDate,
        paid_by: `${paymentMethod || 'Карта'}${author ? ` (${author})` : ''}`,
        status: 'approved',
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('Legacy insert error:', err);
    return { success: false, error: err.message };
  }
}

export async function GET() {
  return NextResponse.json({ status: 'active', message: 'Prerab OS Live Webhook is running' });
}
