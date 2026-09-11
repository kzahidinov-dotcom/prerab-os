-- ====================================================================
-- PRERAB OS — СХЕМА БАЗЫ ДАННЫХ SUPABASE (ПОЛНЫЙ ДОСТУП ДЛЯ ВАШЕЙ КОМПАНИИ)
-- Вставьте этот код в SQL Editor на сайте Supabase и нажмите RUN
-- ====================================================================

-- 1. ТАБЛИЦА КЛИЕНТОВ (CRM)
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'person',
    name TEXT NOT NULL,
    company_name TEXT,
    ico TEXT,
    dic TEXT,
    ic_dph TEXT,
    is_vat_payer BOOLEAN DEFAULT FALSE,
    address TEXT,
    city TEXT DEFAULT 'Bratislava',
    zip TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ТАБЛИЦА ОБЪЕКТОВ И ПРОЕКТОВ (PM)
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    client_id TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress',
    address TEXT,
    city TEXT DEFAULT 'Bratislava',
    start_date DATE,
    deadline DATE,
    budget_estimated NUMERIC(12, 2) DEFAULT 0,
    budget_cost_estimated NUMERIC(12, 2) DEFAULT 0,
    budget_actual_spent NUMERIC(12, 2) DEFAULT 0,
    invoiced_total NUMERIC(12, 2) DEFAULT 0,
    paid_total NUMERIC(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ТАБЛИЦА СМЕТ И ВЫКАЗОВ ВЫМЕР (VÝKAZ VÝMER)
CREATE TABLE IF NOT EXISTS public.budgets (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_labor_cost NUMERIC(12, 2) DEFAULT 0,
    total_material_cost NUMERIC(12, 2) DEFAULT 0,
    total_cost NUMERIC(12, 2) DEFAULT 0,
    total_client_price NUMERIC(12, 2) DEFAULT 0,
    vat_rate NUMERIC(5, 2) DEFAULT 23,
    vat_amount NUMERIC(12, 2) DEFAULT 0,
    total_with_vat NUMERIC(12, 2) DEFAULT 0,
    margin_amount NUMERIC(12, 2) DEFAULT 0,
    margin_percent NUMERIC(5, 2) DEFAULT 0,
    is_reverse_charge BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ТАБЛИЦА РАСХОДОВ И ЧЕКОВ (COST TRACKING)
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'materials',
    vendor TEXT NOT NULL,
    description TEXT,
    amount_without_vat NUMERIC(12, 2) DEFAULT 0,
    vat_rate NUMERIC(5, 2) DEFAULT 23,
    vat_amount NUMERIC(12, 2) DEFAULT 0,
    amount_with_vat NUMERIC(12, 2) DEFAULT 0,
    receipt_number TEXT,
    receipt_photo_url TEXT,
    date DATE DEFAULT CURRENT_DATE,
    paid_by TEXT DEFAULT 'Карта фирмы',
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ТАБЛИЦА СЧЕТОВ И ФАКТУР (FAKTÚRY / DPH)
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'invoice',
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    client_id TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
    issue_date DATE DEFAULT CURRENT_DATE,
    delivery_date DATE DEFAULT CURRENT_DATE,
    due_date DATE DEFAULT CURRENT_DATE + INTERVAL '14 days',
    variable_symbol TEXT NOT NULL,
    constant_symbol TEXT DEFAULT '0308',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12, 2) DEFAULT 0,
    vat_rate NUMERIC(5, 2) DEFAULT 23,
    vat_amount NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) DEFAULT 0,
    is_reverse_charge BOOLEAN DEFAULT FALSE,
    payment_status TEXT DEFAULT 'unpaid',
    paid_amount NUMERIC(12, 2) DEFAULT 0,
    payment_method TEXT DEFAULT 'bank_transfer',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ТАБЛИЦА МАСТЕРОВ И БРИГАД (WORKERS)
CREATE TABLE IF NOT EXISTS public.workers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'helper',
    wage_type TEXT NOT NULL DEFAULT 'hourly',
    rate NUMERIC(10, 2) DEFAULT 10,
    ico TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ТАБЛИЦА ТАБЕЛЯ И ОТРАБОТАННЫХ ЧАСОВ (WORK LOGS)
CREATE TABLE IF NOT EXISTS public.work_logs (
    id TEXT PRIMARY KEY,
    worker_id TEXT REFERENCES public.workers(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    hours_worked NUMERIC(6, 2) DEFAULT 0,
    work_description TEXT,
    unit_done NUMERIC(10, 2),
    unit_type TEXT DEFAULT 'm2',
    total_earned NUMERIC(12, 2) DEFAULT 0,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ТАБЛИЦА ЗАДАЧ И ПЛАНИРОВЩИКА (TASKS)
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium',
    category TEXT NOT NULL DEFAULT 'general',
    assignee_id TEXT,
    assignee_name TEXT,
    project_id TEXT,
    project_title TEXT,
    due_date DATE,
    due_time TEXT,
    money_amount NUMERIC(12, 2),
    checklist JSONB DEFAULT '[]'::jsonb,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 9. ТАБЛИЦА ВХОДЯЩИХ ФАКТУР НА УПЛАТУ (DOŠLÉ FAKTÚRY OD DODÁVATEĽOV)
CREATE TABLE IF NOT EXISTS public.supplier_invoices (
    id TEXT PRIMARY KEY,
    supplier_name TEXT NOT NULL,
    supplier_ico TEXT,
    supplier_iban TEXT,
    invoice_number TEXT NOT NULL,
    variable_symbol TEXT,
    constant_symbol TEXT DEFAULT '0308',
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE DEFAULT CURRENT_DATE + INTERVAL '14 days',
    amount_without_vat NUMERIC(12, 2) DEFAULT 0,
    vat_rate NUMERIC(5, 2) DEFAULT 23,
    vat_amount NUMERIC(12, 2) DEFAULT 0,
    amount_with_vat NUMERIC(12, 2) DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
    category TEXT DEFAULT 'materials',
    payment_status TEXT DEFAULT 'unpaid',       -- unpaid | partial | paid
    paid_amount NUMERIC(12, 2) DEFAULT 0,
    paid_at DATE,                               -- КОГДА уплачено
    paid_by TEXT,
    payment_method TEXT DEFAULT 'bank_transfer',
    source TEXT DEFAULT 'manual',               -- email | manual | import
    email_from TEXT,
    email_subject TEXT,
    email_message_id TEXT,                      -- защита от дублей писем
    email_received_at TIMESTAMPTZ,
    attachment_name TEXT,
    attachment_url TEXT,
    expense_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON public.supplier_invoices (payment_status, due_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_invoices_email_msg ON public.supplier_invoices (email_message_id) WHERE email_message_id IS NOT NULL;

-- ====================================================================
-- ПОЛИТИКИ ДОСТУПА (РАЗРЕШЕНИЕ ЧТЕНИЯ И ЗАПИСИ ДЛЯ ВАШЕГО ПРИЛОЖЕНИЯ)
-- ====================================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access clients" ON public.clients;
CREATE POLICY "Public full access clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access projects" ON public.projects;
CREATE POLICY "Public full access projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access budgets" ON public.budgets;
CREATE POLICY "Public full access budgets" ON public.budgets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access expenses" ON public.expenses;
CREATE POLICY "Public full access expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access invoices" ON public.invoices;
CREATE POLICY "Public full access invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access workers" ON public.workers;
CREATE POLICY "Public full access workers" ON public.workers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access work_logs" ON public.work_logs;
CREATE POLICY "Public full access work_logs" ON public.work_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access tasks" ON public.tasks;
CREATE POLICY "Public full access tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access supplier_invoices" ON public.supplier_invoices;
CREATE POLICY "Public full access supplier_invoices" ON public.supplier_invoices FOR ALL USING (true) WITH CHECK (true);
