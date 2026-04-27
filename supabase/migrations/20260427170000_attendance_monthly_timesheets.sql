-- =============================================================================
-- Phase 1F - Monthly attendance timesheets + lock/unlock
-- =============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'attendance_timesheet_status') then
    create type attendance_timesheet_status as enum ('draft','locked');
  end if;
end $$;

create table if not exists attendance_monthly_periods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  month text not null,
  status attendance_timesheet_status not null default 'draft',
  generated_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by uuid references employees(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, month)
);

create table if not exists attendance_monthly_rows (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references attendance_monthly_periods(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  worked_days numeric(6,2) not null default 0,
  paid_leave_days numeric(6,2) not null default 0,
  unpaid_leave_days numeric(6,2) not null default 0,
  holiday_days numeric(6,2) not null default 0,
  overtime_hours numeric(6,2) not null default 0,
  late_days integer not null default 0,
  late_minutes integer not null default 0,
  early_leave_days integer not null default 0,
  early_leave_minutes integer not null default 0,
  worked_minutes integer not null default 0,
  manual_worked_days_adjustment numeric(6,2) not null default 0,
  manual_paid_leave_adjustment numeric(6,2) not null default 0,
  manual_unpaid_leave_adjustment numeric(6,2) not null default 0,
  manual_overtime_hours_adjustment numeric(6,2) not null default 0,
  manual_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_id, employee_id)
);

create index if not exists idx_attendance_monthly_periods_company_month
  on attendance_monthly_periods (company_id, month desc);

create index if not exists idx_attendance_monthly_rows_period
  on attendance_monthly_rows (period_id, employee_id);

alter table public.attendance_monthly_periods enable row level security;
alter table public.attendance_monthly_rows enable row level security;

drop policy if exists tenant_select on public.attendance_monthly_periods;
create policy tenant_select on public.attendance_monthly_periods
for select using (company_id = current_company_id());

drop policy if exists tenant_select on public.attendance_monthly_rows;
create policy tenant_select on public.attendance_monthly_rows
for select using (company_id = current_company_id());

drop policy if exists attendance_monthly_periods_write on public.attendance_monthly_periods;
create policy attendance_monthly_periods_write on public.attendance_monthly_periods
for all using (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin')
)
with check (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin')
);

drop policy if exists attendance_monthly_rows_write on public.attendance_monthly_rows;
create policy attendance_monthly_rows_write on public.attendance_monthly_rows
for all using (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin')
)
with check (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin')
);
