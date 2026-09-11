// Data Types for Prerab OS

export type ProjectStatus = 
  | 'lead'              // Новый лид / Заявка
  | 'survey'            // Замер / Осмотр
  | 'quote_sent'        // Смета отправлена
  | 'contract_signed'   // Договор подписан
  | 'in_progress'       // В работе / Ремонт
  | 'completed'         // Сдан / Завершен
  | 'cancelled';        // Отменен

export type ClientType = 'person' | 'company';

export interface Client {
  id: string;
  type: ClientType;
  name: string;              // ФИО контактного лица
  company_name?: string;     // Название фирмы (если юр. лицо)
  ico?: string;              // IČO
  dic?: string;              // DIČ
  ic_dph?: string;           // IČ DPH (SK...)
  is_vat_payer: boolean;     // Плательщик НДС в Словакии
  address: string;           // Улица и дом
  city: string;              // Город (Bratislava, Košice, Trnava, Nitra...)
  zip: string;               // Почтовый индекс (PSČ)
  phone: string;
  email: string;
  notes?: string;
  created_at: string;
}

export type WorkCategory = 
  | 'demolition'      // Демонтаж
  | 'masonry'         // Кладочные и общестроительные работы
  | 'plasterboard'    // Гипсокартон (Sadrokartón)
  | 'floors_tiles'    // Плитка, ламинат, полы
  | 'plumbing'        // Сантехника и отопление
  | 'electrical'      // Электрика и слаботочка
  | 'painting'        // Малярные работы и шпаклевка
  | 'windows_doors'   // Окна, двери, подоконники
  | 'facade_insul'    // Фасад и утепление
  | 'roofing'         // Кровельные работы
  | 'materials'       // Строительные материалы
  | 'other';          // Прочее / Уборка / Вывоз мусора

export type WorkUnit = 'm2' | 'm3' | 'bm' | 'ks' | 'hod' | 'kpl' | 't';

export interface BudgetItem {
  id: string;
  category: WorkCategory;
  name: string;                  // Название работы или материала
  description?: string;
  room?: string;                 // Помещение (Ванная, Кухня, Гостиная, Спальня, Фасад...)
  unit: WorkUnit;
  quantity: number;              // Количество / Площадь
  unit_cost_labor: number;       // Себестоимость работы за ед. (€) - сколько платите мастеру
  unit_cost_material: number;    // Себестоимость материала за ед. (€)
  unit_price_client: number;     // Цена для клиента за ед. (€)
  total_cost: number;            // Общая себестоимость (€) = (cost_labor + cost_material) * quantity
  total_price_client: number;    // Общая стоимость для клиента (€) = price_client * quantity
  margin_amount: number;         // Прибыль (€) = total_price_client - total_cost
  margin_percent: number;        // Маржинальность (%) = (margin / total_price) * 100
}

export interface BudgetEstimate {
  id: string;
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  items: BudgetItem[];
  total_labor_cost: number;
  total_material_cost: number;
  total_cost: number;            // Общая себестоимость проекта
  total_client_price: number;    // Цена проекта для клиента (без НДС)
  vat_rate: number;              // Ставка НДС (23%, 19%, 5%, 0%)
  vat_amount: number;            // Сумма НДС
  total_with_vat: number;        // Итого с НДС
  margin_amount: number;         // Планируемая чистая маржа (€)
  margin_percent: number;        // Планируемая маржа (%)
  is_reverse_charge: boolean;    // Перенос налогового обязательства (§ 69 ods. 12 písm. j)
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  notes?: string;
}

export type ExpenseCategory = 
  | 'materials'         // Стройматериалы
  | 'labor'             // Выплаты мастерам
  | 'subcontractor'     // Субподрядчики (специалисты)
  | 'tools_machinery'   // Аренда техники и инструмент
  | 'transport_fuel'    // Транспорт, бензин, доставка
  | 'waste_disposal'    // Вывоз мусора и контейнеры
  | 'overhead';         // Накладные расходы / Прочее

export interface Expense {
  id: string;
  project_id: string;
  category: ExpenseCategory;
  vendor: string;               // Поставщик / Магазин (Hornbach, OBI, Woodcote, Stavebniny...)
  description: string;          // Описание (Клей для плитки, кабель CYKY, штукатурка...)
  amount_without_vat: number;   // Сумма без НДС (€)
  vat_rate: number;             // Ставка НДС (23, 19, 5, 0)
  vat_amount: number;           // Сумма НДС (€)
  amount_with_vat: number;      // Итого с НДС (€)
  receipt_number?: string;      // Номер чека / фактуры
  receipt_photo_url?: string;   // Фото чека
  date: string;                 // Дата покупки / расхода
  paid_by: string;              // Кто оплатил (Фирма / Мастер / Из кассы)
  status: 'approved' | 'pending' | 'rejected';
}

export type InvoiceType = 
  | 'invoice'           // Острая фактура (Vyúčtovacia faktúra)
  | 'proforma'          // Залоговая фактура (Zálohová faktúra)
  | 'quote'             // Ценовое предложение (Cenová ponuka)
  | 'credit_note';      // Корректировка / Возврат (Dobropis)

export interface InvoiceItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_without_vat: number;
  vat_rate: number;
  vat_amount: number;
  total_with_vat: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;       // Номер счета (например, 2026001 или VF-2026/01)
  type: InvoiceType;
  project_id: string;
  client_id: string;
  issue_date: string;           // Dátum vystavenia
  delivery_date: string;        // Dátum dodania tovaru / služby
  due_date: string;             // Dátum splatnosti
  variable_symbol: string;      // Variabilný symbol (для словацких банков)
  constant_symbol: string;      // Konštantný symbol (обычно 0308)
  items: InvoiceItem[];
  subtotal: number;             // Сумма без НДС
  vat_rate: number;             // Ставка НДС
  vat_amount: number;           // Сумма НДС
  total_amount: number;         // Итого к оплате
  is_reverse_charge: boolean;   // Prenesenie daňovej povinnosti (§ 69)
  payment_status: 'unpaid' | 'partial' | 'paid';
  paid_amount: number;
  payment_method: 'bank_transfer' | 'cash' | 'card';
  notes?: string;
  qr_pay_by_square?: string;    // Base64 QR-код PAY by square
}

export interface Project {
  id: string;
  title: string;                // Название проекта (напр. "Капитальный ремонт 3к квартиры, Ružinov")
  client_id: string;
  status: ProjectStatus;
  address: string;              // Адрес объекта
  city: string;
  start_date: string;
  deadline: string;
  budget_estimated: number;     // Планируемая стоимость проекта (€)
  budget_cost_estimated: number;// Планируемая себестоимость (€)
  budget_actual_spent: number;  // Фактически потрачено расходов (€)
  invoiced_total: number;       // Выставлено счетов клиенту (€)
  paid_total: number;           // Фактически получено от клиента (€)
  notes?: string;
  created_at: string;
}

export type WorkerRole = 
  | 'foreman'         // Бригадир / Прораб (Stavbyvedúci)
  | 'tiler'           // Плиточник (Obkladač)
  | 'plasterer'       // Штукатур / Маляр (Maliar / Omietkár)
  | 'drywaller'       // Гипсокартонщик (Sadrokartonista)
  | 'electrician'     // Электрик (Elektrikár)
  | 'plumber'         // Сантехник (Vodár / Kúrenár)
  | 'mason'           // Каменщик (Murár)
  | 'helper'          // Разнорабочий / Подсобник (Pomocný robotník)
  | 'subcontractor';  // Субподрядчик (Subdodávateľ)

export type WageType = 'hourly' | 'piecework' | 'fixed_monthly';

export interface Worker {
  id: string;
  name: string;
  phone: string;
  role: WorkerRole;
  wage_type: WageType;
  rate: number;                 // Ставка (€/час или базовая цена за м2)
  ico?: string;                 // Если работает по Živnosť (SZČO)
  notes?: string;
  active: boolean;
}

export interface WorkLog {
  id: string;
  worker_id: string;
  project_id: string;
  date: string;
  hours_worked: number;
  work_description: string;
  unit_done?: number;           // Выполненный объем (м2, шт.)
  unit_type?: string;
  total_earned: number;         // Заработано (€)
  is_paid: boolean;
}

// -------------------------------------------------------------
// USER ROLES & AUTHENTICATION TYPES
// -------------------------------------------------------------

export type UserRole = 
  | 'admin'        // Владелец / Администратор (Керим, Ваня) — Полный доступ
  | 'foreman'      // Бригадир / Прораб (Борис, Эзис, Андрей) — Чеки с объекта, табель рабочих
  | 'driver'       // Водитель / Шофер буса Vito — Часы за рулем, дизель, доставки
  | 'accountant';  // Бухгалтер — Фактуры, DPH, акты

export interface UserProfile {
  id: string;
  username: string;             // kerim, vanya, shofer, boris, ezis
  name: string;                 // Керим, Ваня, Шофер Vito, Борис (Бригадир)
  role: UserRole;
  pin: string;                  // 4-значный PIN-код для быстрого входа
  password?: string;            // Обычный пароль
  phone?: string;
  assigned_projects?: string[]; // Назначенные объекты для бригадира
  active: boolean;
  avatar_color?: string;
  created_at: string;
}

// Водитель: Учет смены и часов за рулем
export interface DriverShift {
  id: string;
  driver_name: string;
  date: string;
  hours_worked: number;
  hourly_rate: number;
  start_odometer?: number;
  end_odometer?: number;
  total_km?: number;
  notes?: string;
  is_paid: boolean;
}

// Водитель: Заправка Дизеля на бус Vito
export interface FuelLog {
  id: string;
  date: string;
  vehicle: string;              // Mercedes-Benz Vito
  amount_eur: number;
  liters?: number;
  odometer_km?: number;
  gas_station: string;          // Slovnaft, OMV, Shell, Orlen
  payment_method: string;       // Карта фірма, Готівка, Карта ліва
  driver_name: string;
  receipt_photo_url?: string;
  notes?: string;
}

export interface CompanySettings {
  name: string;                 // Prerab s.r.o.
  legal_name: string;
  ico: string;
  dic: string;
  ic_dph: string;
  is_vat_payer: boolean;
  iban: string;
  swift: string;
  bank_name: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
  email: string;
  web: string;
  logo_url?: string;
  default_vat_rate: number;     // 23
  invoice_prefix: string;       // VF-2026/
  quote_prefix: string;         // CP-2026/
  reverse_charge_text: string;  // "Prenesenie daňovej povinnosti podľa § 69 ods. 12 písm. j zákona o DPH."
  supabase_url?: string;
  supabase_anon_key?: string;
  // Учитывать ли оплаченные фактуры поставщиков в расходах и себестоимости
  // объектов. Пока фактуры не разнесены по объектам, держим выключенным,
  // чтобы дашборд считал только данные из Google Таблицы.
  count_supplier_invoices_in_costs?: boolean;
  // Ссылка на вкладку с финансовым дашбордом в Google Таблице
  finance_dashboard_url?: string;
}

// -------------------------------------------------------------
// TASK & PLANNER TYPES
// -------------------------------------------------------------

export type TaskStatus = 
  | 'todo'          // К выполнению / Бэклог
  | 'in_progress'   // В работе
  | 'waiting'       // Ожидание (доставка / ответ клиента / оплата)
  | 'done';         // Выполнено

export type TaskPriority = 
  | 'critical'      // 🔥 Срочно / Горит
  | 'high'          // ⚡ Высокий
  | 'medium'        // 🔹 Обычный
  | 'low';          // ☕ Низкий

export type TaskCategory = 
  | 'finance'       // 💶 Финансы / Сметы / Оплаты
  | 'construction'  // 🏗️ Стройка / Контроль качества / Замеры
  | 'supply'        // 🚚 Снабжение / Заказ материалов
  | 'docs'          // 📋 Документы / Договоры / Акты
  | 'urgent'        // 🔥 Авария / Срочный выезд
  | 'general';      // 📌 Общие дела фирмы

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  assignee_id: string;          // usr-kerim, usr-vanya, usr-boris, usr-ezis, usr-shofer
  assignee_name: string;        // Керим, Ваня, Борис, Эзис, Шофер
  project_id?: string;          // prj-jaslovska, prj-hergovic, prj-ruzchem, etc. (или пусто для общефирменных)
  project_title?: string;
  start_date?: string;          // YYYY-MM-DD (Дата начала этапа/работы)
  due_date?: string;            // YYYY-MM-DD (Дата окончания этапа/дедлайн)
  duration_days?: number;       // Продолжительность в днях
  depends_on?: string[];        // ID задач, после которых начинается эта задача
  due_time?: string;            // HH:MM
  money_amount?: number;        // Привязанная сумма (€) если задача про оплату
  checklist: ChecklistItem[];
  created_by: string;           // Кто поставил задачу
  created_at: string;
  updated_at: string;
  completed_at?: string;
  is_stage?: boolean;           // Флаг: принадлежит ли запись план-графику (Гант), а не оперативным задачам
}

export type ScheduleStage = Task;

export interface ScheduleTemplateStage {
  id: string;
  title: string;
  description?: string;
  duration_days: number;
  duration_hours?: number;
  workers_count?: number;
  norm_notes?: string;
  category: TaskCategory;
  priority: TaskPriority;
  depends_on_indices?: number[];
  default_assignee_id?: string;
  checklist?: string[];
}

export interface ScheduleTemplate {
  id: string;
  title: string;
  description: string;
  category: 'renovation' | 'bathroom' | 'drywall' | 'custom';
  stages: ScheduleTemplateStage[];
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------------
// SUPPLIER INVOICES (Входящие фактуры на уплату / Došlé faktúry)
// Фактуры, которые приходят на почту фирмы от магазинов и поставщиков
// -------------------------------------------------------------

export type SupplierInvoiceStatus =
  | 'unpaid'        // Не уплачено
  | 'partial'       // Уплачено частично
  | 'paid';         // Уплачено

export type SupplierInvoiceSource =
  | 'email'         // Автоматически принято с почты (Gmail)
  | 'manual'        // Заведено вручную в системе
  | 'import';       // Загружено из бэкапа / Google Таблицы

export interface SupplierInvoice {
  id: string;
  supplier_name: string;         // Поставщик / Магазин (Hornbach, OBI, Siko, Slovnaft...)
  supplier_ico?: string;         // IČO поставщика
  supplier_iban?: string;        // IBAN для оплаты (из текста фактуры)
  invoice_number: string;        // Číslo faktúry (номер фактуры поставщика)
  variable_symbol?: string;      // Variabilný symbol для платежа
  constant_symbol?: string;      // Konštantný symbol
  issue_date: string;            // Dátum vystavenia (YYYY-MM-DD)
  due_date: string;              // Dátum splatnosti — до какого числа платить (YYYY-MM-DD)
  amount_without_vat: number;    // Сумма без DPH (€)
  vat_rate: number;              // Ставка DPH (23, 19, 5, 0)
  vat_amount: number;            // Сумма DPH (€)
  amount_with_vat: number;       // Итого к уплате (€)
  currency: string;              // EUR
  project_id?: string;           // Объект, на который списывается фактура
  category: ExpenseCategory;     // Категория расхода
  payment_status: SupplierInvoiceStatus;
  paid_amount: number;           // Сколько уже уплачено (€)
  paid_at?: string;              // КОГДА уплачено (YYYY-MM-DD)
  paid_by?: string;              // Кто / чем уплатил (Керим, Карта фирмы, Банк...)
  payment_method?: 'bank_transfer' | 'cash' | 'card';
  source: SupplierInvoiceSource;
  email_from?: string;           // Отправитель письма (faktury@hornbach.sk)
  email_subject?: string;        // Тема письма
  email_message_id?: string;     // ID письма Gmail — защита от дублей
  email_thread_id?: string;      // ID переписки Gmail — для кнопки «Открыть письмо»
  email_received_at?: string;    // Когда письмо пришло на почту
  attachment_name?: string;      // Имя вложения (faktura_2026001.pdf)
  attachment_url?: string;       // Ссылка на PDF (Google Drive) или data:URL
  expense_id?: string;           // ID расхода, если фактура проведена в «Расходы и Чеки»
  notes?: string;
  created_at: string;
  updated_at: string;
}
