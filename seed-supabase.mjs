import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vomktsnufaatfxesbqfl.supabase.co';
const supabaseKey = 'sb_publishable_hlmExlU1508_IsiytG7vow_8sKJg62F';

const supabase = createClient(supabaseUrl, supabaseKey);

const INITIAL_CLIENTS = [
  {
    id: 'cli-01',
    type: 'person',
    name: 'Ing. Michal Kováč',
    address: 'Tomášikova 28',
    city: 'Bratislava - Ružinov',
    zip: '821 01',
    phone: '+421 911 223 344',
    email: 'michal.kovac@gmail.com',
    is_vat_payer: false,
    notes: 'Kompletná rekonštrukcia 3-izbového bytu 78m2. Preferuje prémiové materiály.',
    created_at: '2026-07-10T10:00:00Z',
  },
  {
    id: 'cli-02',
    type: 'company',
    name: 'Peter Horváth',
    company_name: 'Danubia Invest s.r.o.',
    ico: '47589632',
    dic: '2023987456',
    ic_dph: 'SK2023987456',
    address: 'Einsteinova 18',
    city: 'Bratislava - Petržalka',
    zip: '851 01',
    phone: '+421 903 555 888',
    email: 'horvath@danubiainvest.sk',
    is_vat_payer: true,
    notes: 'Rekonštrukcia kancelárskych priestorov 150m2. Platca DPH (Prenesenie dane § 69).',
    created_at: '2026-07-18T14:30:00Z',
  },
  {
    id: 'cli-03',
    type: 'person',
    name: 'Zuzana Nováková',
    address: 'Hviezdoslavova 45',
    city: 'Trnava',
    zip: '917 01',
    phone: '+421 948 777 999',
    email: 'zuzana.novakova@post.sk',
    is_vat_payer: false,
    notes: 'Kúpeľňa a samostatné WC na kľúč v rodinnom dome.',
    created_at: '2026-08-01T09:15:00Z',
  },
];

const INITIAL_PROJECTS = [
  {
    id: 'prj-01',
    title: 'Капитальный ремонт 3к квартиры (78 м²)',
    client_id: 'cli-01',
    status: 'in_progress',
    address: 'Tomášikova 28, byt č. 14',
    city: 'Bratislava - Ružinov',
    start_date: '2026-07-20',
    deadline: '2026-09-15',
    budget_estimated: 18450,
    budget_cost_estimated: 11200,
    budget_actual_spent: 7420,
    invoiced_total: 12000,
    paid_total: 12000,
    notes: 'Текущий этап: плиточные работы в санузле и малярные работы в гостиной.',
    created_at: '2026-07-10T10:00:00Z',
  },
  {
    id: 'prj-02',
    title: 'Ремонт офиса Danubia Invest (150 м²)',
    client_id: 'cli-02',
    status: 'in_progress',
    address: 'Einsteinova 18, 3. poschodie',
    city: 'Bratislava - Petržalka',
    start_date: '2026-08-05',
    deadline: '2026-09-30',
    budget_estimated: 26800,
    budget_cost_estimated: 16500,
    budget_actual_spent: 8900,
    invoiced_total: 15000,
    paid_total: 15000,
    notes: 'Стеклянные перегородки, ковролин, электрика и подвесные потолки.',
    created_at: '2026-07-18T14:30:00Z',
  }
];

async function seedData() {
  console.log('Pushing seed data to Supabase...');
  try {
    const { error: cErr } = await supabase.from('clients').upsert(INITIAL_CLIENTS, { onConflict: 'id' });
    if (cErr) console.error('Clients seed error:', cErr);
    else console.log('✓ Clients synced successfully!');

    const { error: pErr } = await supabase.from('projects').upsert(INITIAL_PROJECTS, { onConflict: 'id' });
    if (pErr) console.error('Projects seed error:', pErr);
    else console.log('✓ Projects synced successfully!');

    console.log('All cloud tables successfully synced!');
  } catch (err) {
    console.error('Seed error:', err);
  }
}

seedData();
