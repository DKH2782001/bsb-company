-- =============================================================================
-- Phase 1 — HR Core schema
-- Attendance, Leave, Holidays VN, Contracts (extended), Onboarding/Offboarding
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'attendance_source') then
    create type attendance_source as enum ('web','mobile','biometric','manual','import');
  end if;
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type attendance_status as enum ('present','late','early_leave','absent','on_leave','holiday','remote','incomplete');
  end if;
  if not exists (select 1 from pg_type where typname = 'leave_request_status') then
    create type leave_request_status as enum ('draft','pending','approved','rejected','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'overtime_status') then
    create type overtime_status as enum ('pending','approved','rejected','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'contract_type') then
    create type contract_type as enum ('probation','fixed_term','indefinite','internship','collaborator');
  end if;
  if not exists (select 1 from pg_type where typname = 'contract_status') then
    create type contract_status as enum ('draft','active','expiring_soon','expired','terminated','renewed');
  end if;
  if not exists (select 1 from pg_type where typname = 'onboarding_run_status') then
    create type onboarding_run_status as enum ('not_started','in_progress','completed','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'onboarding_task_status') then
    create type onboarding_task_status as enum ('pending','in_progress','completed','skipped','overdue');
  end if;
  if not exists (select 1 from pg_type where typname = 'onboarding_kind') then
    create type onboarding_kind as enum ('onboarding','offboarding');
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Attendance
-- -----------------------------------------------------------------------------
create table if not exists attendance_locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  address text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  radius_m integer not null default 200,
  ip_whitelist text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists attendance_devices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid references employees(id) on delete set null,
  label text not null,
  source attendance_source not null default 'web',
  fingerprint text,
  user_agent text,
  last_used_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists attendance_shifts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text not null,
  name text not null,
  start_time time not null,
  end_time time not null,
  break_minutes integer not null default 60,
  late_grace_minutes integer not null default 5,
  early_leave_grace_minutes integer not null default 5,
  is_overnight boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);

create table if not exists attendance_shift_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  shift_id uuid not null references attendance_shifts(id) on delete cascade,
  effective_from date not null,
  effective_to date,
  weekdays smallint[] not null default '{1,2,3,4,5}',
  created_at timestamptz not null default now()
);
create index if not exists idx_shift_assign_emp on attendance_shift_assignments (employee_id, effective_from);

create table if not exists attendance_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  work_date date not null,
  shift_id uuid references attendance_shifts(id) on delete set null,
  location_id uuid references attendance_locations(id) on delete set null,
  device_id uuid references attendance_devices(id) on delete set null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  check_in_lat numeric(10,7),
  check_in_lng numeric(10,7),
  check_out_lat numeric(10,7),
  check_out_lng numeric(10,7),
  check_in_ip inet,
  check_out_ip inet,
  selfie_in_path text,
  selfie_out_path text,
  source attendance_source not null default 'web',
  status attendance_status not null default 'incomplete',
  late_minutes integer not null default 0,
  early_leave_minutes integer not null default 0,
  worked_minutes integer not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, work_date)
);
create index if not exists idx_attendance_emp_date on attendance_records (employee_id, work_date desc);
create index if not exists idx_attendance_company_date on attendance_records (company_id, work_date desc);

create table if not exists attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  record_id uuid references attendance_records(id) on delete set null,
  work_date date not null,
  requested_check_in timestamptz,
  requested_check_out timestamptz,
  reason text not null,
  status leave_request_status not null default 'pending',
  decided_by uuid references employees(id) on delete set null,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_attendance_corr_status on attendance_corrections (company_id, status);

create table if not exists overtime_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  hours numeric(5,2) not null,
  reason text not null,
  status overtime_status not null default 'pending',
  decided_by uuid references employees(id) on delete set null,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_ot_company_status on overtime_requests (company_id, status);

-- -----------------------------------------------------------------------------
-- Leave management
-- -----------------------------------------------------------------------------
create table if not exists leave_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text not null,
  name text not null,
  paid boolean not null default true,
  default_quota_days numeric(5,2),
  carry_over_max_days numeric(5,2) not null default 0,
  requires_attachment boolean not null default false,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);

create table if not exists leave_balances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  leave_type_id uuid not null references leave_types(id) on delete cascade,
  year integer not null,
  entitled_days numeric(6,2) not null default 0,
  carried_over_days numeric(6,2) not null default 0,
  used_days numeric(6,2) not null default 0,
  pending_days numeric(6,2) not null default 0,
  adjustment_days numeric(6,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (employee_id, leave_type_id, year)
);
create index if not exists idx_leave_bal_emp_year on leave_balances (employee_id, year);

create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  leave_type_id uuid not null references leave_types(id) on delete restrict,
  starts_on date not null,
  ends_on date not null,
  half_day_start boolean not null default false,
  half_day_end boolean not null default false,
  total_days numeric(5,2) not null,
  reason text,
  attachments jsonb not null default '[]'::jsonb,
  handover_to uuid references employees(id) on delete set null,
  status leave_request_status not null default 'pending',
  decided_by uuid references employees(id) on delete set null,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_leave_req_emp on leave_requests (employee_id, starts_on desc);
create index if not exists idx_leave_req_company_status on leave_requests (company_id, status);

-- -----------------------------------------------------------------------------
-- Holidays VN
-- -----------------------------------------------------------------------------
create table if not exists holidays_vn (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade, -- null = global VN holiday
  name text not null,
  holiday_date date not null,
  is_paid boolean not null default true,
  is_substitute boolean not null default false, -- ngày nghỉ bù
  notes text,
  created_at timestamptz not null default now(),
  unique (company_id, holiday_date, name)
);
create index if not exists idx_holidays_date on holidays_vn (holiday_date);

-- -----------------------------------------------------------------------------
-- Contracts (extend existing employment_contracts) + amendments + employee_documents
-- -----------------------------------------------------------------------------
alter table employment_contracts add column if not exists code text;
alter table employment_contracts add column if not exists contract_type contract_type not null default 'fixed_term';
alter table employment_contracts add column if not exists status contract_status not null default 'active';
alter table employment_contracts add column if not exists position_id uuid references positions(id) on delete set null;
alter table employment_contracts add column if not exists department_id uuid references departments(id) on delete set null;
alter table employment_contracts add column if not exists probation_ends_at date;
alter table employment_contracts add column if not exists signed_at date;
alter table employment_contracts add column if not exists terminated_at date;
alter table employment_contracts add column if not exists termination_reason text;
alter table employment_contracts add column if not exists notice_period_days integer not null default 30;
alter table employment_contracts add column if not exists working_hours_per_week numeric(5,2) not null default 40;
alter table employment_contracts add column if not exists currency text not null default 'VND';
alter table employment_contracts add column if not exists notes text;
alter table employment_contracts add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_contracts_emp_status on employment_contracts (employee_id, status);
create index if not exists idx_contracts_ends_at on employment_contracts (ends_at) where status in ('active','expiring_soon');

create table if not exists contract_amendments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  contract_id uuid not null references employment_contracts(id) on delete cascade,
  amendment_no integer not null,
  effective_from date not null,
  changes jsonb not null default '{}'::jsonb, -- {salary, position, location, ...}
  reason text,
  document_url text,
  signed_at date,
  created_at timestamptz not null default now(),
  unique (contract_id, amendment_no)
);

create table if not exists employee_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  doc_type text not null, -- cccd_front, cccd_back, bhxh, mst, degree, cert, contract_pdf, other
  label text,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  expires_on date,
  uploaded_by uuid references employees(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_emp_docs_emp on employee_documents (employee_id, doc_type);

-- Người phụ thuộc (cho giảm trừ TNCN)
create table if not exists employee_dependents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  full_name text not null,
  relationship text not null, -- con, vo, chong, bo, me, khac
  date_of_birth date,
  national_id text,
  tax_code text,
  starts_on date,
  ends_on date,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_emp_deps_emp on employee_dependents (employee_id);

-- -----------------------------------------------------------------------------
-- Onboarding / Offboarding
-- -----------------------------------------------------------------------------
create table if not exists onboarding_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  kind onboarding_kind not null default 'onboarding',
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists onboarding_template_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  template_id uuid not null references onboarding_templates(id) on delete cascade,
  sort_order integer not null default 0,
  title text not null,
  description text,
  default_owner_role app_role,
  due_offset_days integer not null default 0, -- days from start
  required boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_onb_tpl_tasks_tpl on onboarding_template_tasks (template_id, sort_order);

create table if not exists onboarding_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  template_id uuid references onboarding_templates(id) on delete set null,
  employee_id uuid not null references employees(id) on delete cascade,
  kind onboarding_kind not null default 'onboarding',
  status onboarding_run_status not null default 'not_started',
  started_on date not null default current_date,
  target_done_on date,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_onb_runs_emp on onboarding_runs (employee_id, kind);
create index if not exists idx_onb_runs_company_status on onboarding_runs (company_id, status);

create table if not exists onboarding_run_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  run_id uuid not null references onboarding_runs(id) on delete cascade,
  template_task_id uuid references onboarding_template_tasks(id) on delete set null,
  sort_order integer not null default 0,
  title text not null,
  description text,
  owner_employee_id uuid references employees(id) on delete set null,
  due_on date,
  status onboarding_task_status not null default 'pending',
  completed_at timestamptz,
  completed_by uuid references employees(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_onb_run_tasks_run on onboarding_run_tasks (run_id, sort_order);
create index if not exists idx_onb_run_tasks_owner_status on onboarding_run_tasks (owner_employee_id, status);

-- -----------------------------------------------------------------------------
-- RLS — same pattern as foundation: tenant_select via current_company_id()
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'attendance_locations','attendance_devices','attendance_shifts','attendance_shift_assignments',
    'attendance_records','attendance_corrections','overtime_requests',
    'leave_types','leave_balances','leave_requests',
    'holidays_vn',
    'contract_amendments','employee_documents','employee_dependents',
    'onboarding_templates','onboarding_template_tasks','onboarding_runs','onboarding_run_tasks'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists tenant_select on public.%I;', t);
    execute format(
      'create policy tenant_select on public.%I for select using (company_id is null or company_id = current_company_id());', t
    );
  end loop;
end $$;
