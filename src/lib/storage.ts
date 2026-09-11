import { 
  Client, 
  Project, 
  BudgetEstimate, 
  Expense, 
  Invoice, 
  Worker, 
  WorkLog, 
  CompanySettings,
  Task,
  ScheduleTemplate,
  ScheduleTemplateStage,
  SupplierInvoice
} from '@/types';
import { getSupabaseClient } from './supabase';
import { invoiceDedupeKey } from './invoice-parser';

const STORAGE_KEYS = {
  CLIENTS: 'prerab_clients_v1',
  PROJECTS: 'prerab_projects_v1',
  BUDGETS: 'prerab_budgets_v1',
  EXPENSES: 'prerab_expenses_v1',
  INVOICES: 'prerab_invoices_v1',
  WORKERS: 'prerab_workers_v1',
  WORK_LOGS: 'prerab_work_logs_v1',
  SETTINGS: 'prerab_settings_v1',
  TASKS: 'prerab_tasks_v1',
  SCHEDULE_TEMPLATES: 'prerab_schedule_templates_v1',
  SCHEDULE_STAGES: 'prerab_schedule_stages_v1',
  SUPPLIER_INVOICES: 'prerab_supplier_invoices_v1',
};

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: 'Prerab s.r.o.',
  legal_name: 'Prerab s.r.o. - Stavebné a rekonštrukčné práce',
  ico: '',
  dic: '',
  ic_dph: '',
  is_vat_payer: true,
  iban: '',
  swift: '',
  bank_name: '',
  address: 'Vajnorská',
  city: 'Bratislava',
  zip: '831 04',
  phone: '+421 ',
  email: 'info@prerab.sk',
  web: 'www.prerab.sk',
  default_vat_rate: 23,
  invoice_prefix: 'VF-2026/',
  quote_prefix: 'CP-2026/',
  reverse_charge_text: 'Prenesenie daňovej povinnosti podľa § 69 ods. 12 písm. j zákona č. 222/2004 Z. z. o DPH.',
  supabase_url: 'https://vomktsnufaatfxesbqfl.supabase.co',
  supabase_anon_key: 'sb_publishable_hlmExlU1508_IsiytG7vow_8sKJg62F',
};

export const DEFAULT_TASKS: Task[] = [
  {
    id: 'tsk-1',
    title: 'Забрать остаток оплаты по Jaslovská (9 701 €)',
    description: 'Встретиться с заказчиком после завершения укладки плитки и подписания акта сдачи этапа.',
    status: 'in_progress',
    priority: 'critical',
    category: 'finance',
    assignee_id: 'usr-kerim',
    assignee_name: 'Керим',
    project_id: 'prj-jaslovska',
    project_title: 'Реновация объекта ул. Jaslovská',
    start_date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    duration_days: 5,
    due_time: '15:00',
    money_amount: 9701,
    checklist: [
      { id: 'c1', title: 'Проверить завершение санузлов', completed: true },
      { id: 'c2', title: 'Подготовить акт сдачи-приемки', completed: true },
      { id: 'c3', title: 'Подписать акт и получить оплату', completed: false },
    ],
    created_by: 'Керим',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tsk-2',
    title: 'Заказать керамогранит 60х120 в Siko для объекта Hergovic',
    description: 'Уточнить наличие в Siko Bratislava и заказать доставку через шофера Vito к четвергу.',
    status: 'todo',
    priority: 'high',
    category: 'supply',
    assignee_id: 'usr-vanya',
    assignee_name: 'Ваня',
    project_id: 'prj-hergovic',
    project_title: 'Комплексный ремонт ул. Hergottova',
    start_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    duration_days: 3,
    money_amount: 1450,
    checklist: [
      { id: 'c4', title: 'Сверить артикул с дизайнером', completed: true },
      { id: 'c5', title: 'Оформить счет в Siko', completed: false },
      { id: 'c6', title: 'Дать задачу водителю забрать со склада', completed: false },
    ],
    created_by: 'Ваня',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tsk-3',
    title: 'Приемка стяжки пола на объекте Kpt. Rašu',
    description: 'Проверить лазерным уровнем плоскость и перепады перед монтажом паркетной доски.',
    status: 'todo',
    priority: 'high',
    category: 'construction',
    assignee_id: 'usr-vanya',
    assignee_name: 'Ваня',
    project_id: 'prj-kpt_rasu',
    project_title: 'Капремонт квартиры ул. Kpt. Rašu',
    start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    duration_days: 4,
    checklist: [
      { id: 'c7', title: 'Замер влажности стяжки влагомером', completed: false },
      { id: 'c8', title: 'Проверка правилом 2м', completed: false },
    ],
    created_by: 'Керим',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tsk-4',
    title: 'Подготовить смету (CP) по объекту Bebravska',
    description: 'Посчитать демонтаж, сантехнику и чистовые работы по новому чертежу.',
    status: 'in_progress',
    priority: 'high',
    category: 'finance',
    assignee_id: 'usr-kerim',
    assignee_name: 'Керим',
    project_id: 'prj-bebravska',
    project_title: 'Ремонт объекта ул. Bebravská',
    start_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    duration_days: 4,
    checklist: [
      { id: 'c9', title: 'Внести замеры помещений в сметчик', completed: true },
      { id: 'c10', title: 'Сформировать PDF и отправить клиенту', completed: false },
    ],
    created_by: 'Керим',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tsk-5',
    title: 'Заказ контейнера для вывоза мусора (RuzChem)',
    description: 'Организовать контейнер 7м3 на четверг утро к объекту Chemická.',
    status: 'waiting',
    priority: 'medium',
    category: 'supply',
    assignee_id: 'usr-shofer',
    assignee_name: 'Шофер Vito',
    project_id: 'prj-ruzchem',
    project_title: 'Ремонт объекта Chemická (RuzChem)',
    start_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    duration_days: 4,
    depends_on: ['tsk-2'],
    checklist: [],
    created_by: 'Ваня',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const DEFAULT_SCHEDULE_STAGES: Task[] = [
  {
    id: 'stg-jas-1',
    title: 'Демонтаж покрытий, дверей и вынос мусора в машину',
    description: 'Снятие плитки и ламината 57м² (12 ч), срезка железных коробок (1.5ч/дверь), демонтаж дверей (20мин)',
    status: 'done',
    priority: 'high',
    category: 'construction',
    assignee_id: 'usr-vanya',
    assignee_name: 'Ваня',
    project_id: 'prj-jaslovska',
    project_title: 'Реновация объекта ул. Jaslovská',
    start_date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
    due_date: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0],
    duration_days: 2,
    checklist: [],
    created_by: 'Василич',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    is_stage: true,
  },
  {
    id: 'stg-jas-2',
    title: 'Черновая сантехника и монтаж инсталляции Geberit',
    description: 'Разводка труб ГВС, ХВС и канализации (2 дня на 1 чел), Geberit (3ч)',
    status: 'done',
    priority: 'high',
    category: 'construction',
    assignee_id: 'usr-vanya',
    assignee_name: 'Ваня',
    project_id: 'prj-jaslovska',
    project_title: 'Реновация объекта ул. Jaslovská',
    start_date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    due_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    duration_days: 2,
    depends_on: ['stg-jas-1'],
    checklist: [],
    created_by: 'Василич',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    is_stage: true,
  },
  {
    id: 'stg-jas-3',
    title: 'Заливка самовыравнивающегося пола (Вылевной нивелир 40 мешков)',
    description: 'Заливка 40 мешков нивелира бригадой из 2 человек за 1 рабочий день',
    status: 'done',
    priority: 'high',
    category: 'construction',
    assignee_id: 'usr-vanya',
    assignee_name: 'Ваня',
    project_id: 'prj-jaslovska',
    project_title: 'Реновация объекта ул. Jaslovská',
    start_date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    due_date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    duration_days: 1,
    depends_on: ['stg-jas-2'],
    checklist: [],
    created_by: 'Василич',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    is_stage: true,
  },
  {
    id: 'stg-jas-4',
    title: 'Технологическая пауза: Высыхание нивелира (48ч)',
    description: 'Сушка пола без сквозняков перед тяжелыми нагрузками',
    status: 'done',
    priority: 'medium',
    category: 'construction',
    assignee_id: 'usr-vanya',
    assignee_name: 'Ваня',
    project_id: 'prj-jaslovska',
    project_title: 'Реновация объекта ул. Jaslovská',
    start_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    due_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    duration_days: 2,
    depends_on: ['stg-jas-3'],
    checklist: [],
    created_by: 'Василич',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    is_stage: true,
  },
  {
    id: 'stg-jas-5',
    title: 'Укладка плитки и керамогранита в санузле',
    description: 'Облицовка плиткой 60х120, запилы под 45 градусов, затирка швов',
    status: 'in_progress',
    priority: 'high',
    category: 'construction',
    assignee_id: 'usr-boris',
    assignee_name: 'Борис',
    project_id: 'prj-jaslovska',
    project_title: 'Реновация объекта ул. Jaslovská',
    start_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    duration_days: 5,
    depends_on: ['stg-jas-4'],
    checklist: [],
    created_by: 'Василич',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_stage: true,
  },
  {
    id: 'stg-jas-6',
    title: 'Чистовая сантехника на Geberit, электрика и сдача',
    description: 'Подвесной унитаз, смесители, душевая перегородка, розетки, уборка и сдача',
    status: 'todo',
    priority: 'high',
    category: 'construction',
    assignee_id: 'usr-vanya',
    assignee_name: 'Ваня',
    project_id: 'prj-jaslovska',
    project_title: 'Реновация объекта ул. Jaslovská',
    start_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    duration_days: 3,
    depends_on: ['stg-jas-5'],
    checklist: [],
    created_by: 'Василич',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_stage: true,
  }
];

export const isPlannerStage = (t: Task): boolean => {
  if (!t) return false;
  if (t.is_stage) return true;
  if (typeof t.id === 'string' && (t.id.startsWith('tsk-tmpl-') || t.id.startsWith('stg-'))) return true;
  const stageKeywords = [
    'Демонтаж покрытий',
    'Черновая сантехника',
    'Заливка самовыравнивающегося пола',
    'Технологическая пауза',
    'Штукатурка стен по маякам',
    'Шпаклевка стен и потолков',
    'Технологическая сушка шпаклевки',
    'Укладка плитки и керамогранита',
    'Чистовая покраска',
    'Укладка напольных покрытий',
    'Чистовая сантехника, электрика и сдача',
    'Монтаж гипсокартонных коробов',
    'Гидроизоляция санузла'
  ];
  if (typeof t.title === 'string' && stageKeywords.some(k => t.title.toLowerCase().includes(k.toLowerCase()))) {
    return true;
  }
  return false;
};

export const DEFAULT_SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  {
    id: 'tmpl-vasilich-renovation',
    title: 'Капитальный ремонт квартиры (Реальные нормы Василича)',
    description: 'Полный технологический цикл капремонта квартиры по хронометражу и нормам Василича со стройки (демонтаж, разводка сантехники, инсталляция Geberit, нивелир 40 мешков, шпаклевка с сушкой).',
    category: 'renovation',
    created_at: '2026-09-01T08:00:00.000Z',
    updated_at: '2026-09-07T12:00:00.000Z',
    stages: [
      {
        id: 'stg-1',
        title: 'Демонтаж покрытий, дверей и вынос мусора в машину',
        description: 'Снятие плитки и ламината 57м² (12 ч), срезка железных коробок (1.5ч/дверь), демонтаж дверей (20мин), снятие старой краски (50м² за 2ч)',
        duration_days: 2,
        duration_hours: 16,
        workers_count: 2,
        norm_notes: '57 м² плитки/ламината в мешки и вынос в авто — 12ч; срезка железных коробок — 1.5ч/дверь; деревянные двери — 20мин; сдирание краски — 50м² за 2ч',
        category: 'construction',
        priority: 'high',
        depends_on_indices: [],
        default_assignee_id: 'usr-vanya',
        checklist: [
          'Сдирание старой краски со стен (50 м² за 2 часа)',
          'Демонтаж плитки и ламината (57 м²)',
          'Фасовка в строительные мешки и вынос в машину (12 часов)',
          'Вырезание железных дверных рам (1.5 ч/дверь)',
          'Демонтаж обычных деревянных дверей (20 мин/дверь)'
        ]
      },
      {
        id: 'stg-2',
        title: 'Черновая сантехника и монтаж инсталляции Geberit',
        description: 'Разводка труб ГВС, ХВС и канализации (2 дня на 1 человека), установка инсталляции Geberit (3 часа)',
        duration_days: 2,
        duration_hours: 16,
        workers_count: 1,
        norm_notes: 'Сантехника — 2 полных рабочих дня на 1 человека; инсталляция Geberit — 3 часа',
        category: 'construction',
        priority: 'high',
        depends_on_indices: [0],
        default_assignee_id: 'usr-vanya',
        checklist: [
          'Разводка труб ГВС, ХВС и канализации (2 рабочих дня, 1 чел.)',
          'Монтаж и выставление по уровню инсталляции Geberit (3 часа)',
          'Опрессовка системы под давлением'
        ]
      },
      {
        id: 'stg-3',
        title: 'Заливка самовыравнивающегося пола (Вылевной нивелир)',
        description: 'Заливка нивелирующей смеси (~40 мешков) по всей квартире кроме с/у за 1 рабочий день',
        duration_days: 1,
        duration_hours: 8,
        workers_count: 2,
        norm_notes: 'Вылевной нивелир (40 шт) на всю площадь кроме туалета и ванной — 1 день работы для 2 человек',
        category: 'construction',
        priority: 'high',
        depends_on_indices: [1],
        default_assignee_id: 'usr-vanya',
        checklist: [
          'Обеспыливание и грунтовка основания пола',
          'Монтаж демпферной ленты по периметру',
          'Замешивание и заливка 40 мешков нивелира (2 человека)',
          'Прокатка игольчатым валиком для удаления пузырьков'
        ]
      },
      {
        id: 'stg-4',
        title: 'Технологическая пауза: Высыхание нивелира',
        description: 'Технологическая пауза перед нагрузкой пола и установкой лесов/стремянок',
        duration_days: 2,
        duration_hours: 48,
        workers_count: 0,
        norm_notes: '48 часов на высыхание нивелира без сквозняков перед заносом тяжелого инструмента',
        category: 'general',
        priority: 'medium',
        depends_on_indices: [2],
        default_assignee_id: 'usr-vanya',
        checklist: [
          'Контроль влажности стяжки перед следующим этапом'
        ]
      },
      {
        id: 'stg-5',
        title: 'Штукатурка стен по маякам и выведение углов 90°',
        description: 'Грунтовка стен, выставление маяков, оштукатуривание, геометрия санузла и кухни под 90°',
        duration_days: 5,
        duration_hours: 40,
        workers_count: 2,
        norm_notes: 'Штукатурка стен по маякам с проверкой двухметровым правилом',
        category: 'construction',
        priority: 'high',
        depends_on_indices: [3],
        default_assignee_id: 'usr-vanya',
        checklist: [
          'Грунтование бетонных и кирпичных стен бетоноконтактом',
          'Выставление маяков лазерным нивелиром',
          'Оштукатуривание и стягивание по маякам'
        ]
      },
      {
        id: 'stg-6',
        title: 'Шпаклевка стен и потолков (2 слоя с межслойной сушкой)',
        description: 'Детская: 2 дня с сушкой (~4 ведра). Спальня: 1 день 2 слоя со временем высыхания от 3 часов. Кухня: локально.',
        duration_days: 4,
        duration_hours: 32,
        workers_count: 2,
        norm_notes: 'Шпаклевка 4 ведра: детская вся (1 день, с высыханием 2 дня); спальня стены+потолок 2 слоя с сушкой от 3 часов; кухня локально',
        category: 'construction',
        priority: 'high',
        depends_on_indices: [4],
        default_assignee_id: 'usr-vanya',
        checklist: [
          'Шпаклевка детской комнаты (1-й и 2-й слой, 4 ведра, 2 дня с сушкой)',
          'Шпаклевка спальни: стены и потолок 2 слоя с межслойной сушкой 3 часа',
          'Локальная шпаклевка кухни и прихожей',
          'Зачистка и шлифовка под проявочный свет'
        ]
      },
      {
        id: 'stg-7',
        title: 'Технологическая сушка шпаклевки и грунтовка',
        description: 'Полная просушка шпаклевочных слоев, шлифование и глубокая грунтовка перед финишем',
        duration_days: 2,
        duration_hours: 24,
        workers_count: 1,
        norm_notes: 'Сушка шпаклевки перед покраской во избежание пятен и отслоений',
        category: 'general',
        priority: 'medium',
        depends_on_indices: [5],
        default_assignee_id: 'usr-vanya',
        checklist: [
          'Проверка сухих зон влагомером/визуально',
          'Грунтование глубокого проникновения'
        ]
      },
      {
        id: 'stg-8',
        title: 'Укладка плитки и керамогранита в санузле',
        description: 'Гидроизоляция мокрых зон, укладка плитки, запил углов под 45°, затирка швов',
        duration_days: 5,
        duration_hours: 40,
        workers_count: 1,
        norm_notes: 'Облицовка плиткой стен и пола, заусовка углов 45°, затирка',
        category: 'construction',
        priority: 'high',
        depends_on_indices: [6],
        default_assignee_id: 'usr-vanya',
        checklist: [
          'Гидроизоляция душевой и пола санузла',
          'Укладка плитки на стены и пол',
          'Затирка межплиточных швов'
        ]
      },
      {
        id: 'stg-9',
        title: 'Чистовая покраска потолков и стен',
        description: 'Покраска потолков в 2 слоя, покраска стен матовыми моющимися красками',
        duration_days: 3,
        duration_hours: 24,
        workers_count: 1,
        norm_notes: 'Качественная покраска в 2 слоя валиком/аппаратом',
        category: 'construction',
        priority: 'high',
        depends_on_indices: [6],
        default_assignee_id: 'usr-vanya',
        checklist: [
          'Покраска потолков белой матовой краской',
          'Покраска стен в комнатах по проекту'
        ]
      },
      {
        id: 'stg-10',
        title: 'Укладка напольных покрытий (ламинат / паркет / плинтусы)',
        description: 'Настил подложки, укладка ламината/паркетной доски во всех комнатах, монтаж плинтусов',
        duration_days: 2,
        duration_hours: 16,
        workers_count: 2,
        norm_notes: 'Укладка ламината/паркета по выровненному нивелиром полу, монтаж плинтусов',
        category: 'construction',
        priority: 'high',
        depends_on_indices: [8],
        default_assignee_id: 'usr-vanya',
        checklist: [
          'Укладка акустической подложки',
          'Монтаж напольного покрытия с термозазорами',
          'Установка напольных плинтусов и стыковочных профилей'
        ]
      },
      {
        id: 'stg-11',
        title: 'Чистовая сантехника, электрика, генеральный клининг и сдача',
        description: 'Монтаж унитаза на Geberit, раковины, смесителей, розеток, светильников и сдача объекта',
        duration_days: 2,
        duration_hours: 16,
        workers_count: 2,
        norm_notes: 'Чистовая сантехника на Geberit, чистовая электрика, вынос остатков и сдача заказчику',
        category: 'finance',
        priority: 'critical',
        depends_on_indices: [7, 9],
        default_assignee_id: 'usr-kerim',
        checklist: [
          'Установка подвесного унитаза на инсталляцию Geberit',
          'Установка смесителей и подключение сифонов',
          'Установка розеток, выключателей и светильников',
          'Генеральная уборка квартиры',
          'Подписание акта сдачи-приемки и получение остатка оплаты'
        ]
      }
    ]
  },
  {
    id: 'tmpl-bathroom-turnkey',
    title: 'Санузел под ключ (Geberit + Сантехника + Плитка)',
    description: 'Оптимизированный технологический график ремонта санузла по нормам Василича.',
    category: 'bathroom',
    created_at: '2026-09-01T08:00:00.000Z',
    updated_at: '2026-09-07T12:00:00.000Z',
    stages: [
      {
        id: 'bstg-1',
        title: 'Демонтаж старой плитки, сантехники и вынос мусора',
        description: 'Сбивка старой плитки, демонтаж ванны/унитаза, фасовка в мешки',
        duration_days: 1,
        duration_hours: 8,
        workers_count: 1,
        norm_notes: 'Демонтаж плитки и сантехприборов за 1 рабочий день',
        category: 'construction',
        priority: 'high',
        depends_on_indices: [],
        default_assignee_id: 'usr-vanya',
      },
      {
        id: 'bstg-2',
        title: 'Разводка труб и монтаж инсталляции Geberit',
        description: 'Черновой водопровод, канализация и монтаж рамы инсталляции Geberit (3ч)',
        duration_days: 2,
        duration_hours: 16,
        workers_count: 1,
        norm_notes: 'Сантехника 2 дня полных 1 чел, Geberit 3 часа',
        category: 'construction',
        priority: 'high',
        depends_on_indices: [0],
        default_assignee_id: 'usr-vanya',
      },
      {
        id: 'bstg-3',
        title: 'Штукатурка стен по маякам под 90° и гидроизоляция',
        description: 'Выведение углов 90° под ванну/поддон, 2 слоя гидроизоляции с лентами',
        duration_days: 2,
        duration_hours: 16,
        workers_count: 1,
        norm_notes: 'Идеальная геометрия стен и сушка гидроизоляции',
        category: 'construction',
        priority: 'high',
        depends_on_indices: [1],
        default_assignee_id: 'usr-vanya',
      },
      {
        id: 'bstg-4',
        title: 'Укладка плитки, запилы 45° и затирка швов',
        description: 'Облицовка стен и пола плиткой, затирка',
        duration_days: 4,
        duration_hours: 32,
        workers_count: 1,
        norm_notes: 'Высокоточная укладка плитки и затирка швов',
        category: 'construction',
        priority: 'high',
        depends_on_indices: [2],
        default_assignee_id: 'usr-vanya',
      },
      {
        id: 'bstg-5',
        title: 'Чистовой монтаж Geberit, сантехники и сдача',
        description: 'Монтаж чаши унитаза на Geberit, смесителей, стеклянной шторки, сдача',
        duration_days: 1,
        duration_hours: 8,
        workers_count: 1,
        norm_notes: 'Чистовой монтаж и сдача санузла',
        category: 'finance',
        priority: 'critical',
        depends_on_indices: [3],
        default_assignee_id: 'usr-kerim',
      }
    ]
  }
];

class StorageManager {
  private cache: Record<string, any> = {};
  private realtimeChannel: any = null;

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private getItem<T>(key: string, defaultValue: T): T {
    if (this.cache[key] !== undefined && this.cache[key] !== null) {
      return this.cache[key];
    }
    if (!this.isBrowser()) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      if (!item || item === 'undefined' || item === 'null') {
        this.cache[key] = defaultValue;
        return defaultValue;
      }
      const val = JSON.parse(item);
      this.cache[key] = (val !== undefined && val !== null) ? val : defaultValue;
      return this.cache[key];
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    this.cache[key] = value;
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new Event('prerab_storage_update'));
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  public initSeedData(): void {
    if (!this.isBrowser()) return;
    // Set minimal defaults if storage is completely empty
    if (!this.getItem(STORAGE_KEYS.SETTINGS, null)) {
      this.setItem(STORAGE_KEYS.SETTINGS, DEFAULT_COMPANY_SETTINGS);
    }
    // Initialize Schedule Stages if not set
    if (!this.getItem(STORAGE_KEYS.SCHEDULE_STAGES, null)) {
      this.setItem(STORAGE_KEYS.SCHEDULE_STAGES, DEFAULT_SCHEDULE_STAGES);
    }
    // Purge planner stages from tasks so Tasks & Kanban is completely clean
    this.purgePlannerStagesFromTasks();
  }

  // Tasks (Operational Tasks only - Kanban & To-do)
  public getTasks(): Task[] {
    const res = this.getItem<Task[]>(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
    const list = Array.isArray(res) && res.length > 0 ? res : DEFAULT_TASKS;
    return list
      .filter(t => !isPlannerStage(t))
      .map(t => ({
        ...t,
        checklist: Array.isArray(t?.checklist) ? t.checklist : []
      }));
  }

  public saveTasks(tasks: Task[]): void {
    const cleanOnly = (tasks || []).filter(t => !isPlannerStage(t));
    const normalized = cleanOnly.map(t => ({
      ...t,
      checklist: Array.isArray(t?.checklist) ? t.checklist : []
    }));
    this.setItem(STORAGE_KEYS.TASKS, normalized);
    this.syncTasksToCloud(normalized);
  }

  public createTask(task: Task): void {
    if (isPlannerStage(task)) {
      this.saveScheduleStage(task);
      return;
    }
    const tasks = this.getTasks();
    this.saveTasks([task, ...tasks]);
  }

  public updateTask(updated: Task): void {
    if (isPlannerStage(updated)) {
      this.saveScheduleStage(updated);
      return;
    }
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === updated.id);
    if (index >= 0) {
      tasks[index] = updated;
      this.saveTasks([...tasks]);
    } else {
      this.saveTasks([updated, ...tasks]);
    }
  }

  public deleteTask(taskId: string): void {
    const tasks = this.getTasks().filter(t => t.id !== taskId);
    this.saveTasks(tasks);
    this.deleteFromSupabase('tasks', taskId);
  }

  public toggleTaskStatus(taskId: string): void {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      if (task.status === 'done') {
        task.status = 'in_progress';
        task.completed_at = undefined;
      } else {
        task.status = 'done';
        task.completed_at = new Date().toISOString();
      }
      task.updated_at = new Date().toISOString();
      this.saveTasks([...tasks]);
    }
  }

  // Atomic batch save tasks (prevents loop overwrite / stale closure issues)
  public saveTasksBatch(newTasks: Task[]): void {
    const cleanOnly = (newTasks || []).filter(t => !isPlannerStage(t));
    const current = this.getTasks();
    const taskMap = new Map<string, Task>();
    current.forEach(t => taskMap.set(t.id, t));
    cleanOnly.forEach(t => taskMap.set(t.id, t));
    const merged = Array.from(taskMap.values());
    this.saveTasks(merged);
  }

  // Purge planner stages from tasks (keeps Tasks independent and clean)
  public purgePlannerStagesFromTasks(): { purgedCount: number; cleanTasks: Task[] } {
    const rawTasks = this.getItem<Task[]>(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
    const plannerStages = (rawTasks || []).filter(isPlannerStage);
    const cleanTasks = (rawTasks || []).filter(t => !isPlannerStage(t));

    if (plannerStages.length > 0) {
      this.setItem(STORAGE_KEYS.TASKS, cleanTasks);
      this.syncTasksToCloud(cleanTasks).catch(e => console.warn('Clean tasks sync error:', e));

      // Move extracted stages into schedule stages if needed
      const existingStages = this.getItem<Task[]>(STORAGE_KEYS.SCHEDULE_STAGES, []);
      const stagesMap = new Map<string, Task>();
      existingStages.forEach(s => stagesMap.set(s.id, s));
      plannerStages.forEach(s => stagesMap.set(s.id, { ...s, is_stage: true }));
      const merged = Array.from(stagesMap.values());
      this.setItem(STORAGE_KEYS.SCHEDULE_STAGES, merged);
      this.syncScheduleStagesToCloud(merged).catch(e => console.warn('Clean stages sync error:', e));
    }
    return { purgedCount: plannerStages.length, cleanTasks };
  }

  // -------------------------------------------------------------
  // Schedule Stages (План-график объектов / Диаграмма Ганта)
  // -------------------------------------------------------------
  public getScheduleStages(): Task[] {
    const res = this.getItem<Task[]>(STORAGE_KEYS.SCHEDULE_STAGES, DEFAULT_SCHEDULE_STAGES);
    const list = Array.isArray(res) && res.length > 0 ? res : DEFAULT_SCHEDULE_STAGES;
    return list.map(s => ({
      ...s,
      is_stage: true,
      checklist: Array.isArray(s?.checklist) ? s.checklist : []
    }));
  }

  public saveScheduleStages(stages: Task[]): void {
    const normalized = (stages || []).map(s => ({
      ...s,
      is_stage: true,
      checklist: Array.isArray(s?.checklist) ? s.checklist : []
    }));
    this.setItem(STORAGE_KEYS.SCHEDULE_STAGES, normalized);
    this.syncScheduleStagesToCloud(normalized);
  }

  public saveScheduleStagesBatch(batch: Task[]): void {
    const current = this.getScheduleStages();
    const stageMap = new Map<string, Task>();
    current.forEach(s => stageMap.set(s.id, s));
    batch.forEach(s => stageMap.set(s.id, { ...s, is_stage: true }));
    const merged = Array.from(stageMap.values());
    this.saveScheduleStages(merged);
  }

  public saveScheduleStage(stage: Task): void {
    const current = this.getScheduleStages();
    const idx = current.findIndex(s => s.id === stage.id);
    const marked = { ...stage, is_stage: true };
    let updated: Task[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = marked;
    } else {
      updated = [marked, ...current];
    }
    this.saveScheduleStages(updated);
  }

  public deleteScheduleStage(stageId: string): void {
    const current = this.getScheduleStages().filter(s => s.id !== stageId);
    this.saveScheduleStages(current);
  }

  public toggleScheduleStageStatus(stageId: string): void {
    const stages = this.getScheduleStages();
    const stage = stages.find(s => s.id === stageId);
    if (stage) {
      if (stage.status === 'done') {
        stage.status = 'in_progress';
        stage.completed_at = undefined;
      } else {
        stage.status = 'done';
        stage.completed_at = new Date().toISOString();
      }
      stage.updated_at = new Date().toISOString();
      this.saveScheduleStages([...stages]);
    }
  }

  // Schedule Templates (Vasilich Norms & Custom Templates)
  public getScheduleTemplates(): ScheduleTemplate[] {
    const res = this.getItem<ScheduleTemplate[]>(STORAGE_KEYS.SCHEDULE_TEMPLATES, DEFAULT_SCHEDULE_TEMPLATES);
    return Array.isArray(res) && res.length > 0 ? res : DEFAULT_SCHEDULE_TEMPLATES;
  }
  public saveScheduleTemplates(templates: ScheduleTemplate[]): void {
    this.setItem(STORAGE_KEYS.SCHEDULE_TEMPLATES, templates);
    this.syncScheduleTemplatesToCloud(templates);
  }
  public resetScheduleTemplates(): void {
    this.setItem(STORAGE_KEYS.SCHEDULE_TEMPLATES, DEFAULT_SCHEDULE_TEMPLATES);
    this.syncScheduleTemplatesToCloud(DEFAULT_SCHEDULE_TEMPLATES);
  }

  // Clients
  public getClients(): Client[] {
    const res = this.getItem<Client[]>(STORAGE_KEYS.CLIENTS, []);
    return Array.isArray(res) ? res : [];
  }
  public saveClients(clients: Client[]): void {
    this.setItem(STORAGE_KEYS.CLIENTS, Array.isArray(clients) ? clients : []);
    this.syncToSupabase('clients', clients);
  }
  public deleteClient(clientId: string): void {
    const remaining = this.getClients().filter(c => c.id !== clientId);
    this.setItem(STORAGE_KEYS.CLIENTS, remaining);
    this.deleteFromSupabase('clients', clientId);
  }

  // Projects
  public getProjects(): Project[] {
    const res = this.getItem<Project[]>(STORAGE_KEYS.PROJECTS, []);
    return Array.isArray(res) ? res : [];
  }
  public saveProjects(projects: Project[]): void {
    this.setItem(STORAGE_KEYS.PROJECTS, Array.isArray(projects) ? projects : []);
    this.syncToSupabase('projects', projects);
  }
  public deleteProject(projectId: string): void {
    const remaining = this.getProjects().filter(p => p.id !== projectId);
    this.setItem(STORAGE_KEYS.PROJECTS, remaining);
    this.deleteFromSupabase('projects', projectId);
  }

  // Budgets
  public getBudgets(): BudgetEstimate[] {
    const res = this.getItem<BudgetEstimate[]>(STORAGE_KEYS.BUDGETS, []);
    return Array.isArray(res) ? res : [];
  }
  public saveBudgets(budgets: BudgetEstimate[]): void {
    this.setItem(STORAGE_KEYS.BUDGETS, Array.isArray(budgets) ? budgets : []);
    this.syncToSupabase('budgets', budgets);
  }
  public deleteBudget(budgetId: string): void {
    const remaining = this.getBudgets().filter(b => b.id !== budgetId);
    this.setItem(STORAGE_KEYS.BUDGETS, remaining);
    this.deleteFromSupabase('budgets', budgetId);
  }

  // Expenses
  public getExpenses(): Expense[] {
    const res = this.getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    return Array.isArray(res) ? res : [];
  }
  public saveExpenses(expenses: Expense[]): void {
    this.setItem(STORAGE_KEYS.EXPENSES, Array.isArray(expenses) ? expenses : []);
    this.syncToSupabase('expenses', expenses);
  }
  public deleteExpense(expenseId: string): void {
    const remaining = this.getExpenses().filter(e => e.id !== expenseId);
    this.setItem(STORAGE_KEYS.EXPENSES, remaining);
    this.deleteFromSupabase('expenses', expenseId);
  }

  // Invoices
  public getInvoices(): Invoice[] {
    const res = this.getItem<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    return Array.isArray(res) ? res : [];
  }
  public saveInvoices(invoices: Invoice[]): void {
    this.setItem(STORAGE_KEYS.INVOICES, Array.isArray(invoices) ? invoices : []);
    this.syncToSupabase('invoices', invoices);
  }
  public deleteInvoice(invoiceId: string): void {
    const remaining = this.getInvoices().filter(i => i.id !== invoiceId);
    this.setItem(STORAGE_KEYS.INVOICES, remaining);
    this.deleteFromSupabase('invoices', invoiceId);
  }

  // -------------------------------------------------------------
  // Фактуры на уплату (Входящие фактуры от поставщиков / Došlé faktúry)
  // -------------------------------------------------------------
  public getSupplierInvoices(): SupplierInvoice[] {
    const res = this.getItem<SupplierInvoice[]>(STORAGE_KEYS.SUPPLIER_INVOICES, []);
    return Array.isArray(res) ? res : [];
  }

  public saveSupplierInvoices(list: SupplierInvoice[]): void {
    const normalized = (Array.isArray(list) ? list : []).map(i => ({
      ...i,
      currency: i.currency || 'EUR',
      paid_amount: Number(i.paid_amount) || 0,
      payment_status: i.payment_status || 'unpaid',
    }));
    this.setItem(STORAGE_KEYS.SUPPLIER_INVOICES, normalized);
    this.syncSupplierInvoicesToCloud(normalized);
  }

  public saveSupplierInvoice(invoice: SupplierInvoice): void {
    const current = this.getSupplierInvoices();
    const idx = current.findIndex(i => i.id === invoice.id);
    const stamped = { ...invoice, updated_at: new Date().toISOString() };
    let updated: SupplierInvoice[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = stamped;
    } else {
      updated = [stamped, ...current];
    }
    this.saveSupplierInvoices(updated);
  }

  public deleteSupplierInvoice(invoiceId: string): void {
    const remaining = this.getSupplierInvoices().filter(i => i.id !== invoiceId);
    this.saveSupplierInvoices(remaining);
    this.deleteFromSupabase('supplier_invoices', invoiceId);
  }

  // Отметить фактуру уплаченной (с фиксацией даты и способа оплаты)
  public markSupplierInvoicePaid(
    invoiceId: string,
    payment: { paid_at?: string; paid_amount?: number; paid_by?: string; payment_method?: 'bank_transfer' | 'cash' | 'card' }
  ): SupplierInvoice | null {
    const list = this.getSupplierInvoices();
    const idx = list.findIndex(i => i.id === invoiceId);
    if (idx < 0) return null;

    const invoice = list[idx];
    const total = Number(invoice.amount_with_vat) || 0;
    const paidAmount = payment.paid_amount !== undefined ? Number(payment.paid_amount) || 0 : total;
    const status: SupplierInvoice['payment_status'] =
      paidAmount <= 0 ? 'unpaid' : (paidAmount + 0.009 < total ? 'partial' : 'paid');

    const updatedInvoice: SupplierInvoice = {
      ...invoice,
      payment_status: status,
      paid_amount: paidAmount,
      paid_at: status === 'unpaid' ? undefined : (payment.paid_at || new Date().toISOString().split('T')[0]),
      paid_by: status === 'unpaid' ? undefined : (payment.paid_by || invoice.paid_by),
      payment_method: status === 'unpaid' ? invoice.payment_method : (payment.payment_method || invoice.payment_method || 'bank_transfer'),
      updated_at: new Date().toISOString(),
    };

    const updated = [...list];
    updated[idx] = updatedInvoice;
    this.saveSupplierInvoices(updated);
    return updatedInvoice;
  }

  // Снять отметку об оплате (ошибочно отметили)
  public markSupplierInvoiceUnpaid(invoiceId: string): SupplierInvoice | null {
    return this.markSupplierInvoicePaid(invoiceId, { paid_amount: 0 });
  }

  // Добавление фактур с почты без дублей (по Message-ID письма или номеру фактуры)
  public addSupplierInvoices(incoming: SupplierInvoice[]): { added: number; skipped: number } {
    const current = this.getSupplierInvoices();
    const keys = new Set(current.map(i => invoiceDedupeKey(i)));
    const fresh: SupplierInvoice[] = [];
    let skipped = 0;

    (incoming || []).forEach(inv => {
      const key = invoiceDedupeKey(inv);
      if (keys.has(key) || current.some(c => c.id === inv.id)) {
        skipped++;
        return;
      }
      keys.add(key);
      fresh.push(inv);
    });

    if (fresh.length > 0) {
      this.saveSupplierInvoices([...fresh, ...current]);
    }
    return { added: fresh.length, skipped };
  }

  // Провести уплаченную фактуру в «Расходы и Чеки» (чтобы попала в себестоимость объекта)
  public pushSupplierInvoiceToExpenses(invoiceId: string): Expense | null {
    const invoice = this.getSupplierInvoices().find(i => i.id === invoiceId);
    if (!invoice) return null;
    if (invoice.expense_id && this.getExpenses().some(e => e.id === invoice.expense_id)) return null;

    const expense: Expense = {
      id: `exp-sinv-${invoice.id}`,
      project_id: invoice.project_id || '',
      category: invoice.category || 'materials',
      vendor: invoice.supplier_name,
      description: `Фактура ${invoice.invoice_number} (${invoice.supplier_name})`,
      amount_without_vat: invoice.amount_without_vat,
      vat_rate: invoice.vat_rate,
      vat_amount: invoice.vat_amount,
      amount_with_vat: invoice.amount_with_vat,
      receipt_number: invoice.invoice_number,
      receipt_photo_url: invoice.attachment_url,
      date: invoice.paid_at || invoice.issue_date,
      paid_by: invoice.paid_by || 'Банковский перевод',
      status: 'approved',
    };

    const expenses = this.getExpenses();
    const idx = expenses.findIndex(e => e.id === expense.id);
    const updatedExpenses = idx >= 0
      ? expenses.map(e => (e.id === expense.id ? expense : e))
      : [expense, ...expenses];
    this.saveExpenses(updatedExpenses);

    this.saveSupplierInvoice({ ...invoice, expense_id: expense.id });
    return expense;
  }

  // Облачная синхронизация фактур на уплату
  public async syncSupplierInvoicesToCloud(list: SupplierInvoice[]): Promise<void> {
    try {
      const sb = getSupabaseClient();
      if (!sb) return;

      // 1. Отдельная таблица supplier_invoices (если создана из supabase/schema.sql)
      try {
        if (list.length > 0) {
          const sanitized = list.map(i => ({ ...i, project_id: i.project_id && i.project_id.trim() ? i.project_id : null }));
          await sb.from('supplier_invoices').upsert(sanitized, { onConflict: 'id' });
        }
      } catch (err) {
        // Таблицы может не быть — работаем через универсальный документ ниже
      }

      // 2. Универсальный облачный документ (работает всегда, без миграций базы)
      const doc = {
        id: 'bgt-system-supplier-invoices-cloud',
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
        updated_at: new Date().toISOString()
      };
      await sb.from('budgets').upsert([doc], { onConflict: 'id' });

      this.broadcastCloudChange('supplier_invoices', {
        title: 'Фактуры на уплату',
        action: 'Обновление фактур поставщиков',
        description: 'Изменен список входящих фактур или статус оплаты'
      });
    } catch (e) {
      console.warn('Supplier invoices cloud sync error:', e);
    }
  }

  public async pullSupplierInvoicesFromCloud(): Promise<SupplierInvoice[] | null> {
    try {
      const sb = getSupabaseClient();
      if (!sb) return null;

      // 1. Отдельная таблица
      try {
        const { data, error } = await sb
          .from('supplier_invoices')
          .select('*')
          .order('due_date', { ascending: true })
          .range(0, 9999);
        if (!error && data && data.length > 0) {
          return (data as any[]).map(i => ({ ...i, project_id: i.project_id || '' })) as SupplierInvoice[];
        }
      } catch (e) {
        // fallback
      }

      // 2. Универсальный документ в budgets
      const { data: bData, error: bErr } = await sb
        .from('budgets')
        .select('*')
        .eq('id', 'bgt-system-supplier-invoices-cloud')
        .single();

      if (!bErr && bData && Array.isArray(bData.items)) {
        return bData.items as SupplierInvoice[];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Workers
  public getWorkers(): Worker[] {
    const res = this.getItem<Worker[]>(STORAGE_KEYS.WORKERS, []);
    return Array.isArray(res) ? res : [];
  }
  public saveWorkers(workers: Worker[]): void {
    this.setItem(STORAGE_KEYS.WORKERS, Array.isArray(workers) ? workers : []);
    this.syncToSupabase('workers', workers);
  }
  public deleteWorker(workerId: string): void {
    const remaining = this.getWorkers().filter(w => w.id !== workerId);
    this.setItem(STORAGE_KEYS.WORKERS, remaining);
    this.deleteFromSupabase('workers', workerId);
  }

  // Work Logs
  public getWorkLogs(): WorkLog[] {
    const res = this.getItem<WorkLog[]>(STORAGE_KEYS.WORK_LOGS, []);
    return Array.isArray(res) ? res : [];
  }
  public saveWorkLogs(logs: WorkLog[]): void {
    this.setItem(STORAGE_KEYS.WORK_LOGS, Array.isArray(logs) ? logs : []);
    this.syncToSupabase('work_logs', logs);
  }
  public deleteWorkLog(logId: string): void {
    const remaining = this.getWorkLogs().filter(w => w.id !== logId);
    this.setItem(STORAGE_KEYS.WORK_LOGS, remaining);
    this.deleteFromSupabase('work_logs', logId);
  }

  // Settings
  public getSettings(): CompanySettings {
    return this.getItem<CompanySettings>(STORAGE_KEYS.SETTINGS, DEFAULT_COMPANY_SETTINGS);
  }
  public async saveSettings(settings: CompanySettings): Promise<void> {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
    try {
      const sb = getSupabaseClient();
      if (sb) {
        const settingsDoc = {
          id: 'bgt-system-settings-cloud',
          project_id: null,
          title: 'Cloud Settings Storage',
          items: [settings],
          status: 'approved',
          updated_at: new Date().toISOString()
        };
        await sb.from('budgets').upsert([settingsDoc], { onConflict: 'id' });
        this.broadcastCloudChange('settings');
      }
    } catch (e) {
      console.warn('Error saving settings to cloud:', e);
    }
  }

  // Realtime Broadcast across active browsers
  public initRealtimeSync(onRemoteChange?: (payload: any) => void): void {
    if (!this.isBrowser()) return;
    const sb = getSupabaseClient();
    if (!sb) return;

    if (this.realtimeChannel) return;

    try {
      this.realtimeChannel = sb.channel('prerab-cross-device-sync');
      this.realtimeChannel.on('broadcast', { event: 'data_changed' }, (payload: any) => {
        const payloadData = payload?.payload || {};
        const table = payloadData?.table || 'all';
        this.fetchAllFromCloud().then(() => {
          window.dispatchEvent(new CustomEvent('prerab_cloud_sync_received', { detail: payloadData }));
          if (onRemoteChange) {
            onRemoteChange(payloadData);
          }
        });
      });
      this.realtimeChannel.subscribe();
    } catch (e) {
      console.warn('Realtime sync setup skipped:', e);
    }
  }

  public broadcastCloudChange(
    table: string, 
    meta?: { author?: string; action?: string; description?: string; title?: string }
  ): void {
    if (!this.isBrowser()) return;
    try {
      let author = meta?.author;
      if (!author) {
        try {
          const authStr = localStorage.getItem('prerab_auth_current_user_v1');
          if (authStr) {
            const u = JSON.parse(authStr);
            author = u?.name;
          }
        } catch (e) {}
      }

      if (this.realtimeChannel) {
        this.realtimeChannel.send({
          type: 'broadcast',
          event: 'data_changed',
          payload: { 
            table, 
            timestamp: Date.now(),
            author: author || 'Коллега',
            action: meta?.action || 'Обновление данных',
            description: meta?.description || `Обновлена таблица ${table}`,
            title: meta?.title || 'Синхронизация с облаком'
          }
        });
      }
    } catch (e) {
      // non-fatal
    }
  }

  // Dedicated Tasks Cloud Sync (with universal fallback)
  public async syncTasksToCloud(tasks: Task[]): Promise<void> {
    try {
      const sb = getSupabaseClient();
      if (!sb) return;

      // 1. Try dedicated tasks table if it exists
      try {
        await sb.from('tasks').upsert(tasks, { onConflict: 'id' });
      } catch (err) {
        // non-fatal fallback
      }

      // 2. Persist to universal cloud document in budgets table (guarantees 100% sync across all admin accounts)
      const tasksCloudDoc = {
        id: 'bgt-system-tasks-cloud',
        project_id: null,
        title: 'Cloud Tasks Storage',
        items: tasks,
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
        updated_at: new Date().toISOString()
      };
      await sb.from('budgets').upsert([tasksCloudDoc], { onConflict: 'id' });

      // Notify peer admin computers
      this.broadcastCloudChange('tasks', {
        title: 'Задачи и планировщик',
        action: 'Обновление задач',
        description: 'Внесены изменения в задачи команды'
      });
    } catch (e) {
      console.warn('Tasks cloud sync error:', e);
    }
  }

  public async pullTasksFromCloud(): Promise<Task[] | null> {
    try {
      const sb = getSupabaseClient();
      if (!sb) return null;

      // 1. Try dedicated tasks table
      try {
        const { data: tData, error: tErr } = await sb.from('tasks').select('*');
        if (!tErr && tData && tData.length > 0) {
          return tData.map((t: any) => ({
            ...t,
            checklist: Array.isArray(t?.checklist) ? t.checklist : []
          })) as Task[];
        }
      } catch (e) {
        // fallback
      }

      // 2. Check universal cloud record in budgets table
      const { data: bData, error: bErr } = await sb
        .from('budgets')
        .select('*')
        .eq('id', 'bgt-system-tasks-cloud')
        .single();
      
      if (!bErr && bData && Array.isArray(bData.items) && bData.items.length > 0) {
        return bData.items.map((t: any) => ({
          ...t,
          checklist: Array.isArray(t?.checklist) ? t.checklist : []
        })) as Task[];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Schedule Templates Cloud Sync
  public async syncScheduleTemplatesToCloud(templates: ScheduleTemplate[]): Promise<void> {
    try {
      const sb = getSupabaseClient();
      if (!sb) return;

      const tmplDoc = {
        id: 'bgt-system-schedule-templates-cloud',
        project_id: null,
        title: 'Cloud Schedule Templates Storage',
        items: templates,
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
        updated_at: new Date().toISOString()
      };
      await sb.from('budgets').upsert([tmplDoc], { onConflict: 'id' });

      this.broadcastCloudChange('schedule_templates', {
        title: 'Шаблоны графиков работ',
        action: 'Обновление шаблонов',
        description: 'Обновлены строительные шаблоны планирования'
      });
    } catch (e) {
      console.warn('Schedule templates cloud sync error:', e);
    }
  }

  public async pullScheduleTemplatesFromCloud(): Promise<ScheduleTemplate[] | null> {
    try {
      const sb = getSupabaseClient();
      if (!sb) return null;

      const { data: bData, error: bErr } = await sb
        .from('budgets')
        .select('*')
        .eq('id', 'bgt-system-schedule-templates-cloud')
        .single();
      
      if (!bErr && bData && Array.isArray(bData.items) && bData.items.length > 0) {
        return bData.items as ScheduleTemplate[];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Schedule Stages Cloud Sync (План-график / Диаграмма Ганта)
  public async syncScheduleStagesToCloud(stages: Task[]): Promise<void> {
    try {
      const sb = getSupabaseClient();
      if (!sb) return;

      const stagesDoc = {
        id: 'bgt-system-schedule-stages-cloud',
        project_id: null,
        title: 'Cloud Schedule Stages Storage (Gantt)',
        items: stages,
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
        updated_at: new Date().toISOString()
      };
      await sb.from('budgets').upsert([stagesDoc], { onConflict: 'id' });

      this.broadcastCloudChange('schedule_stages', {
        title: 'План-график объектов',
        action: 'Обновление этапов',
        description: 'Обновлены этапы строительства в плане-графике'
      });
    } catch (e) {
      console.warn('Schedule stages cloud sync error:', e);
    }
  }

  public async pullScheduleStagesFromCloud(): Promise<Task[] | null> {
    try {
      const sb = getSupabaseClient();
      if (!sb) return null;

      const { data: bData, error: bErr } = await sb
        .from('budgets')
        .select('*')
        .eq('id', 'bgt-system-schedule-stages-cloud')
        .single();
      
      if (!bErr && bData && Array.isArray(bData.items) && bData.items.length > 0) {
        return bData.items.map((s: any) => ({
          ...s,
          is_stage: true,
          checklist: Array.isArray(s?.checklist) ? s.checklist : []
        })) as Task[];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Clean data foreign keys so Postgres never throws foreign key errors
  private sanitizeForSupabase(table: string, data: any[]): any[] {
    return data.map(item => {
      const copy = { ...item };
      if (table === 'expenses') {
        copy.project_id = copy.project_id && copy.project_id.trim() ? copy.project_id : null;
      } else if (table === 'invoices') {
        copy.project_id = copy.project_id && copy.project_id.trim() ? copy.project_id : null;
        copy.client_id = copy.client_id && copy.client_id.trim() ? copy.client_id : null;
      } else if (table === 'projects') {
        copy.client_id = copy.client_id && copy.client_id.trim() ? copy.client_id : null;
      } else if (table === 'budgets') {
        copy.project_id = copy.project_id && copy.project_id.trim() ? copy.project_id : null;
      } else if (table === 'supplier_invoices') {
        copy.project_id = copy.project_id && copy.project_id.trim() ? copy.project_id : null;
      } else if (table === 'work_logs') {
        copy.project_id = copy.project_id && copy.project_id.trim() ? copy.project_id : null;
        copy.worker_id = copy.worker_id && copy.worker_id.trim() ? copy.worker_id : null;
      }
      return copy;
    });
  }

  // Async sync single collection to Supabase
  private async syncToSupabase(table: string, data: any[]): Promise<void> {
    try {
      const sb = getSupabaseClient();
      if (!sb) return;

      if (data.length === 0) return;

      const sanitized = this.sanitizeForSupabase(table, data);
      const { error } = await sb.from(table).upsert(sanitized, { onConflict: 'id' });
      if (error) {
        console.warn(`Supabase sync warning for ${table}:`, error.message);
      } else {
        let title = 'Облачная база';
        let description = `Обновлена таблица ${table}`;
        if (table === 'projects') {
          title = 'Строительные объекты';
          description = 'Обновлены данные или статус объекта';
        } else if (table === 'expenses') {
          title = 'Учет расходов';
          description = 'Добавлен или изменен чек/расход';
        } else if (table === 'invoices') {
          title = 'Счета (Faktúry)';
          description = 'Обновлен счет или статус оплаты';
        } else if (table === 'supplier_invoices') {
          title = 'Фактуры на уплату';
          description = 'Обновлена входящая фактура поставщика';
        } else if (table === 'clients') {
          title = 'Клиенты (CRM)';
          description = 'Обновлены данные заказчика';
        } else if (table === 'work_logs' || table === 'workers') {
          title = 'Бригады и табель';
          description = 'Внесены отработанные часы или данные мастера';
        } else if (table === 'budgets') {
          title = 'Сметчик (Výkaz výmer)';
          description = 'Обновлена смета объекта';
        }
        this.broadcastCloudChange(table, { title, description });
      }
    } catch (err) {
      console.warn(`Supabase network sync skipped:`, err);
    }
  }

  // Delete single row from Supabase
  public async deleteFromSupabase(table: string, id: string): Promise<void> {
    try {
      const sb = getSupabaseClient();
      if (!sb) return;
      await sb.from(table).delete().eq('id', id);
      this.broadcastCloudChange(table, {
        title: 'Удаление записи',
        description: `Запись удалена из облака (${table})`
      });
    } catch (e) {
      console.warn(`Error deleting from ${table}:`, e);
    }
  }

  // Full unified cloud fetch: Supabase is authoritative Single Source of Truth
  public async fetchAllFromCloud(): Promise<boolean> {
    const sb = getSupabaseClient();
    if (!sb) return false;

    try {
      const [cRes, pRes, bRes, eRes, iRes, wRes, wlRes, cloudTasks, cloudTemplates, cloudStages, cloudSupplierInvoices] = await Promise.all([
        sb.from('clients').select('*').range(0, 9999),
        sb.from('projects').select('*').range(0, 9999),
        sb.from('budgets').select('*').range(0, 9999),
        sb.from('expenses').select('*').order('date', { ascending: false }).range(0, 9999),
        sb.from('invoices').select('*').order('issue_date', { ascending: false }).range(0, 9999),
        sb.from('workers').select('*').range(0, 9999),
        sb.from('work_logs').select('*').range(0, 9999),
        this.pullTasksFromCloud(),
        this.pullScheduleTemplatesFromCloud(),
        this.pullScheduleStagesFromCloud(),
        this.pullSupplierInvoicesFromCloud(),
      ]);

      let cloudSettings: CompanySettings | null = null;
      const realBudgets: BudgetEstimate[] = [];

      if (bRes.data) {
        bRes.data.forEach((b: any) => {
          if (b.id === 'bgt-system-settings-cloud') {
            if (b.items && b.items[0]) {
              cloudSettings = { ...DEFAULT_COMPANY_SETTINGS, ...b.items[0] };
            }
          } else if (
            b.id !== 'bgt-system-tasks-cloud' && 
            b.id !== 'bgt-system-schedule-templates-cloud' &&
            b.id !== 'bgt-system-schedule-stages-cloud' &&
            b.id !== 'bgt-system-supplier-invoices-cloud'
          ) {
            realBudgets.push(b);
          }
        });
      }

      if (cRes.data && cRes.data.length > 0) {
        this.setItem(STORAGE_KEYS.CLIENTS, cRes.data as Client[]);
      }
      if (pRes.data && pRes.data.length > 0) {
        this.setItem(STORAGE_KEYS.PROJECTS, pRes.data as Project[]);
      }
      if (realBudgets.length > 0) {
        this.setItem(STORAGE_KEYS.BUDGETS, realBudgets);
      }
      if (eRes.data && eRes.data.length > 0) {
        const cleanExpenses = (eRes.data as any[]).map(e => ({ ...e, project_id: e.project_id || '' }));
        this.setItem(STORAGE_KEYS.EXPENSES, cleanExpenses as Expense[]);
      }
      if (iRes.data && iRes.data.length > 0) {
        const cleanInvoices = (iRes.data as any[]).map(i => ({ ...i, project_id: i.project_id || '', client_id: i.client_id || '' }));
        this.setItem(STORAGE_KEYS.INVOICES, cleanInvoices as Invoice[]);
      }
      if (wRes.data && wRes.data.length > 0) {
        this.setItem(STORAGE_KEYS.WORKERS, wRes.data as Worker[]);
      }
      if (wlRes.data && wlRes.data.length > 0) {
        const cleanLogs = (wlRes.data as any[]).map(w => ({ ...w, project_id: w.project_id || '' }));
        this.setItem(STORAGE_KEYS.WORK_LOGS, cleanLogs as WorkLog[]);
      }
      if (cloudTasks && cloudTasks.length > 0) {
        // Sanitize: ensure no planner stages ever infiltrate tasks
        const cleanCloudTasks = cloudTasks.filter(t => !isPlannerStage(t));
        this.setItem(STORAGE_KEYS.TASKS, cleanCloudTasks);
      }
      if (cloudTemplates && cloudTemplates.length > 0) {
        this.setItem(STORAGE_KEYS.SCHEDULE_TEMPLATES, cloudTemplates);
      }
      if (cloudStages && cloudStages.length > 0) {
        this.setItem(STORAGE_KEYS.SCHEDULE_STAGES, cloudStages);
      }
      if (cloudSupplierInvoices) {
        this.setItem(STORAGE_KEYS.SUPPLIER_INVOICES, cloudSupplierInvoices);
      }
      if (cloudSettings) {
        this.setItem(STORAGE_KEYS.SETTINGS, cloudSettings);
      }

      return true;
    } catch (err) {
      console.warn('Error fetching all from cloud:', err);
      return false;
    }
  }

  // Legacy wrapper
  public async pullAllFromSupabase(): Promise<{ success: boolean; message: string }> {
    const success = await this.fetchAllFromCloud();
    return {
      success,
      message: success ? 'Все данные успешно обновлены из облака!' : 'Не удалось обновить данные из облака'
    };
  }

  // Push all local data up to Supabase
  public async pushAllToSupabase(): Promise<{ success: boolean; message: string }> {
    try {
      const sb = getSupabaseClient();
      if (!sb) {
        return { success: false, message: 'Supabase URL или Ключ не настроены' };
      }

      const clients = this.getClients();
      const projects = this.getProjects();
      const budgets = this.getBudgets();
      const expenses = this.getExpenses();
      const invoices = this.getInvoices();
      const workers = this.getWorkers();
      const workLogs = this.getWorkLogs();
      const tasks = this.getTasks();
      const templates = this.getScheduleTemplates();
      const stages = this.getScheduleStages();
      const supplierInvoices = this.getSupplierInvoices();

      const promises = [];
      if (clients.length > 0) promises.push(sb.from('clients').upsert(this.sanitizeForSupabase('clients', clients), { onConflict: 'id' }));
      if (projects.length > 0) promises.push(sb.from('projects').upsert(this.sanitizeForSupabase('projects', projects), { onConflict: 'id' }));
      if (budgets.length > 0) promises.push(sb.from('budgets').upsert(this.sanitizeForSupabase('budgets', budgets), { onConflict: 'id' }));
      if (expenses.length > 0) promises.push(sb.from('expenses').upsert(this.sanitizeForSupabase('expenses', expenses), { onConflict: 'id' }));
      if (invoices.length > 0) promises.push(sb.from('invoices').upsert(this.sanitizeForSupabase('invoices', invoices), { onConflict: 'id' }));
      if (workers.length > 0) promises.push(sb.from('workers').upsert(this.sanitizeForSupabase('workers', workers), { onConflict: 'id' }));
      if (workLogs.length > 0) promises.push(sb.from('work_logs').upsert(this.sanitizeForSupabase('work_logs', workLogs), { onConflict: 'id' }));
      if (tasks.length > 0) promises.push(this.syncTasksToCloud(tasks));
      if (templates.length > 0) promises.push(this.syncScheduleTemplatesToCloud(templates));
      if (stages.length > 0) promises.push(this.syncScheduleStagesToCloud(stages));
      if (supplierInvoices.length > 0) promises.push(this.syncSupplierInvoicesToCloud(supplierInvoices));

      await Promise.all(promises);

      return { success: true, message: 'Все данные успешно синхронизированы с облаком!' };
    } catch (err: any) {
      return { success: false, message: `Ошибка загрузки в облако: ${err.message || err}` };
    }
  }

  // Full Database Backup Export (JSON)
  public exportFullBackup(): string {
    const backup = {
      version: '1.2.0',
      exported_at: new Date().toISOString(),
      company: this.getSettings().name,
      data: {
        clients: this.getClients(),
        projects: this.getProjects(),
        budgets: this.getBudgets(),
        expenses: this.getExpenses(),
        invoices: this.getInvoices(),
        supplier_invoices: this.getSupplierInvoices(),
        workers: this.getWorkers(),
        workLogs: this.getWorkLogs(),
        settings: this.getSettings(),
        tasks: this.getTasks(),
        schedule_templates: this.getScheduleTemplates(),
        schedule_stages: this.getScheduleStages(),
      }
    };
    return JSON.stringify(backup, null, 2);
  }

  // Full Database Restore from Backup
  public importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data) return false;

      if (parsed.data.clients) this.saveClients(parsed.data.clients);
      if (parsed.data.projects) this.saveProjects(parsed.data.projects);
      if (parsed.data.budgets) this.saveBudgets(parsed.data.budgets);
      if (parsed.data.expenses) this.saveExpenses(parsed.data.expenses);
      if (parsed.data.invoices) this.saveInvoices(parsed.data.invoices);
      if (parsed.data.supplier_invoices) this.saveSupplierInvoices(parsed.data.supplier_invoices);
      if (parsed.data.workers) this.saveWorkers(parsed.data.workers);
      if (parsed.data.workLogs) this.saveWorkLogs(parsed.data.workLogs);
      if (parsed.data.settings) this.saveSettings(parsed.data.settings);
      if (parsed.data.tasks) this.saveTasks(parsed.data.tasks);
      if (parsed.data.schedule_templates) this.saveScheduleTemplates(parsed.data.schedule_templates);
      if (parsed.data.schedule_stages) this.saveScheduleStages(parsed.data.schedule_stages);
      
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  // Clear all data (Start completely clean)
  public clearAllData(): void {
    this.cache = {};
    if (!this.isBrowser()) return;
    this.setItem(STORAGE_KEYS.CLIENTS, []);
    this.setItem(STORAGE_KEYS.PROJECTS, []);
    this.setItem(STORAGE_KEYS.BUDGETS, []);
    this.setItem(STORAGE_KEYS.EXPENSES, []);
    this.setItem(STORAGE_KEYS.INVOICES, []);
    this.setItem(STORAGE_KEYS.SUPPLIER_INVOICES, []);
    this.setItem(STORAGE_KEYS.WORKERS, []);
    this.setItem(STORAGE_KEYS.WORK_LOGS, []);
    this.setItem(STORAGE_KEYS.TASKS, []);
    this.setItem(STORAGE_KEYS.SCHEDULE_TEMPLATES, DEFAULT_SCHEDULE_TEMPLATES);
    this.setItem(STORAGE_KEYS.SCHEDULE_STAGES, DEFAULT_SCHEDULE_STAGES);
  }
}

export const storage = new StorageManager();
