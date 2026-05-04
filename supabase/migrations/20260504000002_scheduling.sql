-- ============================================================
-- PHASE 1 — Scheduling / Rostering module
-- ============================================================

-- 1. Shift templates (ca làm việc được định nghĩa sẵn)
create table if not exists shift_templates (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id) on delete cascade,
  code          text not null,
  name          text not null,
  start_time    time not null,
  end_time      time not null,
  break_minutes int  not null default 0,
  is_overnight  boolean not null default false,
  role_required text,                       -- vai trò yêu cầu (thu ngân, pha chế, ...)
  min_staff     int  not null default 1,
  max_staff     int,
  -- lương theo giờ (null = dùng lương tháng của NV)
  hourly_rate_multiplier numeric(4,2) not null default 1.0,
  night_multiplier       numeric(4,2) not null default 1.3,  -- ca đêm 22h-6h
  weekend_multiplier     numeric(4,2) not null default 2.0,
  holiday_multiplier     numeric(4,2) not null default 3.0,
  color         text not null default '#6D5EF7',
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(company_id, code)
);

-- 2. Lịch sẵn sàng làm việc (recurring weekly pattern)
create table if not exists employee_availability (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=CN, 1=T2, ...6=T7
  available_from time not null default '00:00',
  available_to   time not null default '23:59',
  min_hours_week numeric(4,1),
  max_hours_week numeric(4,1),
  created_at  timestamptz not null default now(),
  unique(company_id, employee_id, day_of_week)
);

-- 3. Ngày báo bận cụ thể
create table if not exists employee_unavailability (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  employee_id  uuid not null references employees(id) on delete cascade,
  unavail_date date not null,
  reason       text,
  created_at   timestamptz not null default now(),
  unique(company_id, employee_id, unavail_date)
);

-- 4. Chu kỳ lịch (tuần)
create type schedule_period_status as enum ('draft', 'published', 'locked');

create table if not exists schedule_periods (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  week_start   date not null,   -- always Monday
  week_end     date not null,   -- always Sunday
  status       schedule_period_status not null default 'draft',
  published_at timestamptz,
  published_by uuid references employees(id) on delete set null,
  locked_at    timestamptz,
  notes        text,
  created_at   timestamptz not null default now(),
  unique(company_id, week_start)
);

-- 5. Ca đã xếp cho NV cụ thể
create type scheduled_shift_status as enum ('scheduled', 'confirmed', 'no_show', 'cancelled');

create table if not exists scheduled_shifts (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references companies(id) on delete cascade,
  period_id        uuid not null references schedule_periods(id) on delete cascade,
  shift_template_id uuid not null references shift_templates(id) on delete restrict,
  employee_id      uuid not null references employees(id) on delete cascade,
  shift_date       date not null,
  status           scheduled_shift_status not null default 'scheduled',
  override_start   time,   -- null = dùng shift_template
  override_end     time,
  actual_check_in  timestamptz,
  actual_check_out timestamptz,
  note             text,
  created_at       timestamptz not null default now(),
  created_by       uuid references employees(id) on delete set null,
  unique(company_id, employee_id, shift_date, shift_template_id)
);

create index if not exists scheduled_shifts_period_idx on scheduled_shifts(period_id);
create index if not exists scheduled_shifts_date_idx   on scheduled_shifts(company_id, shift_date);

-- 6. Yêu cầu đổi ca / nhả ca
create type swap_request_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type swap_request_type   as enum ('drop', 'swap');

create table if not exists shift_swap_requests (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references companies(id) on delete cascade,
  request_type        swap_request_type not null default 'drop',
  requester_shift_id  uuid not null references scheduled_shifts(id) on delete cascade,
  receiver_shift_id   uuid references scheduled_shifts(id) on delete set null, -- null = drop
  receiver_id         uuid references employees(id) on delete set null,
  reason              text,
  status              swap_request_status not null default 'pending',
  decided_by          uuid references employees(id) on delete set null,
  decided_at          timestamptz,
  decision_note       text,
  created_at          timestamptz not null default now()
);

create index if not exists swap_requests_status_idx on shift_swap_requests(company_id, status);

-- 7. Log publish lịch
create table if not exists shift_publish_log (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  period_id    uuid not null references schedule_periods(id) on delete cascade,
  action       text not null, -- 'published', 'locked', 'unlocked'
  performed_by uuid references employees(id) on delete set null,
  notes        text,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================

alter table shift_templates          enable row level security;
alter table employee_availability    enable row level security;
alter table employee_unavailability  enable row level security;
alter table schedule_periods         enable row level security;
alter table scheduled_shifts         enable row level security;
alter table shift_swap_requests      enable row level security;
alter table shift_publish_log        enable row level security;

-- Chính sách SELECT: thành viên cùng company được đọc
create policy shift_templates_select on shift_templates for select using (
  exists (select 1 from user_roles ur where ur.auth_user_id = auth.uid() and ur.company_id = shift_templates.company_id)
);
create policy employee_availability_select on employee_availability for select using (
  exists (select 1 from user_roles ur where ur.auth_user_id = auth.uid() and ur.company_id = employee_availability.company_id)
);
create policy employee_unavailability_select on employee_unavailability for select using (
  exists (select 1 from user_roles ur where ur.auth_user_id = auth.uid() and ur.company_id = employee_unavailability.company_id)
);
create policy schedule_periods_select on schedule_periods for select using (
  exists (select 1 from user_roles ur where ur.auth_user_id = auth.uid() and ur.company_id = schedule_periods.company_id)
);
create policy scheduled_shifts_select on scheduled_shifts for select using (
  exists (select 1 from user_roles ur where ur.auth_user_id = auth.uid() and ur.company_id = scheduled_shifts.company_id)
);
create policy shift_swap_requests_select on shift_swap_requests for select using (
  exists (select 1 from user_roles ur where ur.auth_user_id = auth.uid() and ur.company_id = shift_swap_requests.company_id)
);
create policy shift_publish_log_select on shift_publish_log for select using (
  exists (select 1 from user_roles ur where ur.auth_user_id = auth.uid() and ur.company_id = shift_publish_log.company_id)
);

-- Chính sách WRITE: CEO / HR Admin / Dept Head được ghi
create policy shift_templates_write on shift_templates for all using (
  exists (select 1 from user_roles ur where ur.auth_user_id = auth.uid() and ur.company_id = shift_templates.company_id and ur.role in ('ceo','hr_admin','dept_head'))
);
create policy employee_availability_write on employee_availability for all using (
  exists (select 1 from user_roles ur where ur.auth_user_id = auth.uid() and ur.company_id = employee_availability.company_id)
);
create policy employee_unavailability_write on employee_unavailability for all using (
  exists (select 1 from user_roles ur where ur.auth_user_id = auth.uid() and ur.company_id = employee_unavailability.company_id)
);
create policy schedule_periods_write on schedule_periods for all using (
  exists (select 1 from user_roles ur where ur.auth_user_id = auth.uid() and ur.company_id = schedule_periods.company_id and ur.role in ('ceo','hr_admin','dept_head'))
);
create policy scheduled_shifts_write on scheduled_shifts for all using (
  exists (select 1 from user_roles ur where ur.auth_user_id = auth.uid() and ur.company_id = scheduled_shifts.company_id and ur.role in ('ceo','hr_admin','dept_head'))
);
create policy shift_swap_requests_write on shift_swap_requests for all using (
  exists (select 1 from user_roles ur where ur.auth_user_id = auth.uid() and ur.company_id = shift_swap_requests.company_id)
);
create policy shift_publish_log_write on shift_publish_log for all using (
  exists (select 1 from user_roles ur where ur.auth_user_id = auth.uid() and ur.company_id = shift_publish_log.company_id and ur.role in ('ceo','hr_admin','dept_head'))
);
