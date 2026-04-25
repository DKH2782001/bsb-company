-- =============================================================================
-- BIZOS — Business Operating System  (Supabase / Postgres schema)
-- Bám theo spec Mục 7 & 8: organization, KPI, operations, compensation,
-- projects, finance, goals/OKR, recruiting, knowledge, governance, rbac.
-- =============================================================================

create extension if not exists "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================
do $$ begin
  create type employment_type as enum ('fulltime','parttime','contract','intern','freelance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type employee_status as enum ('active','onboarding','on_leave','terminated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type kpi_level as enum ('company','department','team','employee');
exception when duplicate_object then null; end $$;

do $$ begin
  create type kpi_frequency as enum ('daily','weekly','monthly','quarterly','yearly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority as enum ('low','normal','high','urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_type as enum ('growth','maintenance','admin','urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('todo','in_progress','blocked','review','done','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_status as enum ('draft','active','paused','done','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type approval_status as enum ('pending','approved','rejected','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_severity as enum ('info','warning','danger','critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_role as enum ('ceo','cfo','hr_admin','dept_head','team_lead','employee','auditor');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- ORGANIZATION
-- =============================================================================
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  currency text not null default 'VND',
  timezone text not null default 'Asia/Ho_Chi_Minh',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists business_units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  code text,
  parent_id uuid references business_units(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  business_unit_id uuid references business_units(id) on delete set null,
  name text not null,
  code text,
  head_employee_id uuid,
  scope text,
  budget_monthly numeric(18,2) default 0,
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  department_id uuid not null references departments(id) on delete cascade,
  name text not null,
  lead_employee_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists positions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  level text,
  base_salary_min numeric(18,2),
  base_salary_max numeric(18,2),
  created_at timestamptz not null default now()
);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  auth_user_id uuid unique,
  code text,
  full_name text not null,
  email text,
  phone text,
  avatar_url text,
  department_id uuid references departments(id) on delete set null,
  team_id uuid references teams(id) on delete set null,
  position_id uuid references positions(id) on delete set null,
  manager_id uuid references employees(id) on delete set null,
  join_date date,
  status employee_status not null default 'active',
  base_salary numeric(18,2) default 0,
  employment_type employment_type default 'fulltime',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table departments add constraint departments_head_fk
  foreign key (head_employee_id) references employees(id) on delete set null deferrable initially deferred;
alter table teams add constraint teams_lead_fk
  foreign key (lead_employee_id) references employees(id) on delete set null deferrable initially deferred;

create table if not exists employee_reporting_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  manager_id uuid not null references employees(id) on delete cascade,
  starts_at date not null default current_date,
  ends_at date
);

create table if not exists employment_contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  starts_at date not null,
  ends_at date,
  base_salary numeric(18,2) not null default 0,
  allowances jsonb not null default '{}'::jsonb,
  document_url text,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- RBAC
-- =============================================================================
create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  company_id uuid not null references companies(id) on delete cascade,
  role app_role not null,
  scope_department_id uuid references departments(id) on delete cascade,
  scope_team_id uuid references teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(auth_user_id, company_id, role, scope_department_id, scope_team_id)
);

-- =============================================================================
-- KPI
-- =============================================================================
create table if not exists kpis (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text,
  name text not null,
  description text,
  level kpi_level not null,
  owner_employee_id uuid references employees(id) on delete set null,
  owner_department_id uuid references departments(id) on delete set null,
  owner_team_id uuid references teams(id) on delete set null,
  unit text default '%',
  target_frequency kpi_frequency not null default 'monthly',
  weight numeric(6,3) default 1,
  parent_kpi_id uuid references kpis(id) on delete set null,
  data_source text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kpis_parent_idx on kpis(parent_kpi_id);
create index if not exists kpis_owner_emp_idx on kpis(owner_employee_id);

create table if not exists kpi_formulas (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references kpis(id) on delete cascade unique,
  formula_type text not null,
  definition jsonb not null,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

create table if not exists kpi_dependencies (
  id uuid primary key default gen_random_uuid(),
  parent_kpi_id uuid not null references kpis(id) on delete cascade,
  child_kpi_id uuid not null references kpis(id) on delete cascade,
  weight numeric(6,3) default 1,
  unique(parent_kpi_id, child_kpi_id)
);

create table if not exists kpi_targets (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references kpis(id) on delete cascade,
  period text not null,
  target_value numeric(20,4) not null default 0,
  note text,
  created_at timestamptz not null default now(),
  unique(kpi_id, period)
);

create table if not exists kpi_actuals (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references kpis(id) on delete cascade,
  period text not null,
  actual_value numeric(20,4) not null default 0,
  completion_rate numeric(8,4),
  status text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(kpi_id, period)
);

create table if not exists kpi_thresholds (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references kpis(id) on delete cascade,
  red_max numeric(8,4),
  yellow_max numeric(8,4),
  green_min numeric(8,4),
  unique(kpi_id)
);

create table if not exists kpi_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  kpi_id uuid references kpis(id) on delete set null,
  actor uuid,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- OPERATIONS
-- =============================================================================
create table if not exists sla_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  target_hours numeric(8,2) not null,
  scope jsonb not null default '{}'::jsonb
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  description text,
  assignee_id uuid references employees(id) on delete set null,
  reviewer_id uuid references employees(id) on delete set null,
  department_id uuid references departments(id) on delete set null,
  project_id uuid,
  linked_kpi_id uuid references kpis(id) on delete set null,
  priority task_priority not null default 'normal',
  task_type task_type not null default 'growth',
  status task_status not null default 'todo',
  due_date date,
  estimated_hours numeric(6,2),
  actual_hours numeric(6,2),
  recurrence_rule text,
  blocked_reason text,
  completion_proof text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_assignee_idx on tasks(assignee_id);
create index if not exists tasks_kpi_idx on tasks(linked_kpi_id);
create index if not exists tasks_status_idx on tasks(status);

create table if not exists task_recurrences (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  rrule text not null,
  next_run date
);

create table if not exists task_outputs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  output_type text,
  value numeric(20,4),
  payload jsonb,
  recorded_at timestamptz not null default now()
);

create table if not exists task_status_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  from_status task_status,
  to_status task_status not null,
  actor uuid,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists workload_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  period text not null,
  open_tasks int default 0,
  overdue_tasks int default 0,
  admin_ratio numeric(5,4),
  growth_ratio numeric(5,4),
  created_at timestamptz not null default now()
);

-- =============================================================================
-- COMPENSATION / PAYROLL
-- =============================================================================
create table if not exists compensation_plans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  applies_to jsonb not null default '{}'::jsonb,
  base_formula jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists salary_components (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  component_type text not null,
  amount numeric(18,2) not null default 0,
  effective_from date not null default current_date,
  effective_to date
);

create table if not exists bonus_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  applies_to jsonb not null default '{}'::jsonb,
  definition jsonb not null,
  active boolean not null default true
);

create table if not exists commission_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  applies_to jsonb not null default '{}'::jsonb,
  definition jsonb not null,
  active boolean not null default true
);

create table if not exists payroll_periods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  period text not null,
  status text not null default 'draft',
  closed_at timestamptz,
  unique(company_id, period)
);

create table if not exists payroll_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  payroll_period_id uuid not null references payroll_periods(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  base_salary numeric(18,2) default 0,
  allowance_total numeric(18,2) default 0,
  commission_total numeric(18,2) default 0,
  bonus_total numeric(18,2) default 0,
  penalty_total numeric(18,2) default 0,
  adjustment_total numeric(18,2) default 0,
  gross_pay numeric(18,2) default 0,
  net_pay numeric(18,2) default 0,
  company_cost numeric(18,2) default 0,
  breakdown jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(payroll_period_id, employee_id)
);

create table if not exists adjustment_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  payroll_entry_id uuid not null references payroll_entries(id) on delete cascade,
  kind text not null,
  amount numeric(18,2) not null,
  reason text,
  actor uuid,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- PROJECTS
-- =============================================================================
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text,
  name text not null,
  owner_id uuid references employees(id) on delete set null,
  business_case text,
  status project_status not null default 'draft',
  starts_at date,
  ends_at date,
  budget numeric(18,2) default 0,
  created_at timestamptz not null default now()
);

alter table tasks add constraint tasks_project_fk
  foreign key (project_id) references projects(id) on delete set null;

create table if not exists project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  role text,
  unique(project_id, employee_id)
);

create table if not exists project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  due_date date,
  status text,
  sort int default 0
);

create table if not exists project_budgets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  planned numeric(18,2) default 0,
  actual numeric(18,2) default 0,
  note text
);

create table if not exists project_roi_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  period text not null,
  expected_return numeric(18,2) default 0,
  realized_return numeric(18,2) default 0,
  roi_pct numeric(8,4)
);

create table if not exists project_dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  depends_on uuid not null references projects(id) on delete cascade,
  note text
);

-- =============================================================================
-- FINANCE
-- =============================================================================
create table if not exists chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text not null,
  name text not null,
  account_type text not null,
  parent_id uuid references chart_of_accounts(id) on delete set null,
  unique(company_id, code)
);

create table if not exists cost_centers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  department_id uuid references departments(id) on delete set null,
  code text
);

create table if not exists accounting_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  entry_date date not null,
  account_code text not null,
  debit numeric(18,2) default 0,
  credit numeric(18,2) default 0,
  cost_center_id uuid references cost_centers(id) on delete set null,
  department_id uuid references departments(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  employee_id uuid references employees(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists accounting_entries_date_idx on accounting_entries(entry_date);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  period text not null
);

create table if not exists budget_lines (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references budgets(id) on delete cascade,
  account_code text,
  cost_center_id uuid references cost_centers(id) on delete set null,
  department_id uuid references departments(id) on delete set null,
  planned numeric(18,2) default 0,
  actual numeric(18,2) default 0
);

create table if not exists ar_ap_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  kind text not null,
  counterparty text,
  amount numeric(18,2) not null,
  issue_date date,
  due_date date,
  settled_at date,
  status text
);

create table if not exists cashflow_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  tx_date date not null,
  bucket text not null,
  inflow numeric(18,2) default 0,
  outflow numeric(18,2) default 0,
  note text
);

create table if not exists financial_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  period text not null,
  kind text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique(company_id, period, kind)
);

-- =============================================================================
-- GOALS / OKR
-- =============================================================================
create table if not exists objectives (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  level kpi_level not null,
  owner_employee_id uuid references employees(id) on delete set null,
  owner_department_id uuid references departments(id) on delete set null,
  title text not null,
  description text,
  period text not null,
  status text,
  progress_pct numeric(5,2) default 0,
  created_at timestamptz not null default now()
);

create table if not exists key_results (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references objectives(id) on delete cascade,
  title text not null,
  target_value numeric(20,4),
  actual_value numeric(20,4),
  unit text,
  progress_pct numeric(5,2) default 0
);

create table if not exists okr_alignments (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references objectives(id) on delete cascade,
  aligned_objective_id uuid references objectives(id) on delete cascade,
  aligned_kpi_id uuid references kpis(id) on delete cascade,
  note text
);

-- =============================================================================
-- RECRUITING / CAPABILITY
-- =============================================================================
create table if not exists job_requisitions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  department_id uuid references departments(id) on delete set null,
  position_id uuid references positions(id) on delete set null,
  title text not null,
  headcount int default 1,
  status text not null default 'open',
  reason text,
  opened_at date default current_date,
  closed_at date
);

create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  requisition_id uuid references job_requisitions(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  stage text default 'new',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists skill_matrix (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  skill text not null,
  current_level int,
  target_level int,
  unique(employee_id, skill)
);

create table if not exists training_needs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid references employees(id) on delete set null,
  department_id uuid references departments(id) on delete set null,
  topic text not null,
  priority text default 'normal',
  note text
);

-- =============================================================================
-- KNOWLEDGE
-- =============================================================================
create table if not exists sop_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  department_id uuid references departments(id) on delete set null,
  title text not null,
  body text,
  version int default 1,
  published boolean default false,
  attachment_url text,
  updated_at timestamptz not null default now()
);

create table if not exists playbooks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  area text,
  title text not null,
  body text,
  version int default 1
);

create table if not exists checklists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  items jsonb not null default '[]'::jsonb,
  linked_department_id uuid references departments(id) on delete set null
);

-- =============================================================================
-- GOVERNANCE: approvals, alerts, reports, notifications, audit
-- =============================================================================
create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  kind text not null,
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  status approval_status not null default 'pending',
  requested_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists approval_steps (
  id uuid primary key default gen_random_uuid(),
  approval_id uuid not null references approvals(id) on delete cascade,
  sort int not null default 0,
  approver_role app_role,
  approver_user uuid,
  status approval_status not null default 'pending',
  acted_at timestamptz,
  comment text
);

create table if not exists alert_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  kind text not null,
  definition jsonb not null,
  severity alert_severity not null default 'warning',
  active boolean not null default true
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  rule_id uuid references alert_rules(id) on delete set null,
  severity alert_severity not null default 'warning',
  title text not null,
  detail jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  kind text not null,
  period text not null,
  payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now()
);

create table if not exists report_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  kind text not null,
  cron text not null,
  recipients jsonb not null default '[]'::jsonb,
  active boolean not null default true
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  auth_user_id uuid not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  auth_user_id uuid not null unique,
  locale text not null default 'vi',
  timezone text not null default 'Asia/Ho_Chi_Minh',
  date_format text not null default 'DD/MM/YYYY',
  theme text not null default 'light',
  compact_sidebar boolean not null default false,
  notification_settings jsonb not null default '{}'::jsonb,
  security_settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  auth_user_id uuid not null,
  device_label text not null,
  platform text,
  browser text,
  location_label text,
  ip_address text,
  last_seen_at timestamptz not null default now(),
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  actor uuid,
  action text not null,
  entity text,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_entity_idx on audit_logs(entity, entity_id);

-- =============================================================================
-- SETTINGS / INTEGRATIONS
-- =============================================================================
create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  provider text not null,
  config jsonb not null default '{}'::jsonb,
  active boolean not null default true
);

create table if not exists import_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  kind text not null,
  status text not null default 'pending',
  file_url text,
  result jsonb,
  created_at timestamptz not null default now()
);

create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade unique,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- TRIGGERS
-- =============================================================================
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end $$ language plpgsql;

do $$
declare r record;
begin
  for r in select unnest(array[
    'companies','departments','employees','kpis','kpi_formulas','kpi_actuals',
    'tasks','sop_documents','app_settings','user_preferences'
  ]) as tbl
  loop
    execute format(
      'drop trigger if exists trg_touch_%I on %I; create trigger trg_touch_%I before update on %I for each row execute function touch_updated_at();',
      r.tbl, r.tbl, r.tbl, r.tbl
    );
  end loop;
end $$;
