-- =============================================================================
-- Sprints + task_results — bảng còn thiếu so với code Operations
-- =============================================================================

-- Enum sprint_status
do $$ begin
  if not exists (select 1 from pg_type where typname = 'sprint_status') then
    create type sprint_status as enum ('planning','active','completed','cancelled');
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Sprints
-- -----------------------------------------------------------------------------
create table if not exists sprints (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  goal text,
  start_date date not null,
  end_date date not null,
  status sprint_status not null default 'planning',
  capacity numeric(8,2) not null default 0,
  velocity numeric(8,2),
  completed_points numeric(8,2),
  carry_over_points numeric(8,2),
  completion_rate numeric(5,2),
  retrospective jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists idx_sprints_company_status on sprints (company_id, status);
create index if not exists idx_sprints_dates on sprints (start_date, end_date);

-- -----------------------------------------------------------------------------
-- Tasks: thêm sprint_id, story_points, parent_task_id
-- -----------------------------------------------------------------------------
alter table tasks add column if not exists sprint_id uuid references sprints(id) on delete set null;
alter table tasks add column if not exists story_points integer;
alter table tasks add column if not exists parent_task_id uuid references tasks(id) on delete set null;

create index if not exists idx_tasks_sprint on tasks (sprint_id) where sprint_id is not null;

-- -----------------------------------------------------------------------------
-- Task results — proof link/file đính kèm task
-- -----------------------------------------------------------------------------
create table if not exists task_results (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  type text not null default 'link', -- 'link' | 'file'
  url text not null,
  label text,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references employees(id) on delete set null
);
create index if not exists idx_task_results_task on task_results (task_id);

-- -----------------------------------------------------------------------------
-- RLS — enable + tenant select
-- -----------------------------------------------------------------------------
alter table public.sprints enable row level security;
drop policy if exists tenant_select on public.sprints;
create policy tenant_select on public.sprints
  for select using (company_id = current_company_id());

alter table public.task_results enable row level security;
drop policy if exists tenant_select on public.task_results;
create policy tenant_select on public.task_results
  for select using (company_id = current_company_id());

-- -----------------------------------------------------------------------------
-- Write policies
-- Sprints: ceo / hr_admin / dept_head / team_lead toàn quyền
-- -----------------------------------------------------------------------------
drop policy if exists sprints_write on public.sprints;
create policy sprints_write on public.sprints
for all using (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin','dept_head','team_lead')
)
with check (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin','dept_head','team_lead')
);

-- Task results: assignee tự nộp; admin/manager xem-sửa-xoá tất
drop policy if exists task_results_own on public.task_results;
create policy task_results_own on public.task_results
for all using (
  company_id = current_company_id()
  and exists (
    select 1 from public.tasks t
    where t.id = task_results.task_id and t.assignee_id = current_employee_id()
  )
)
with check (
  company_id = current_company_id()
  and exists (
    select 1 from public.tasks t
    where t.id = task_results.task_id and t.assignee_id = current_employee_id()
  )
);

drop policy if exists task_results_admin on public.task_results;
create policy task_results_admin on public.task_results
for all using (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin','dept_head','team_lead')
)
with check (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin','dept_head','team_lead')
);
