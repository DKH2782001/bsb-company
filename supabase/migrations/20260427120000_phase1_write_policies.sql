-- =============================================================================
-- Phase 1 — Write policies (INSERT/UPDATE/DELETE) cho các bảng HR Core
-- Foundation + Phase 1 migration trước đó chỉ tạo `tenant_select` (SELECT-only)
-- → mọi write bị RLS chặn. Migration này thêm write policy chuẩn.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Admin-only tables (ceo / hr_admin chỉnh sửa toàn bộ company)
-- -----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'attendance_locations','attendance_shifts','attendance_shift_assignments','attendance_devices',
    'leave_types',
    'contract_amendments','employee_documents','employee_dependents',
    'onboarding_templates','onboarding_template_tasks'
  ]
  loop
    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format($f$
      create policy %I_write on public.%I
      for all using (company_id = current_company_id() and has_any_role('ceo','hr_admin'))
      with check (company_id = current_company_id() and has_any_role('ceo','hr_admin'));
    $f$, t, t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Holidays: ceo/hr_admin chỉ chỉnh được holiday riêng của company (KHÔNG sửa global VN)
-- -----------------------------------------------------------------------------
drop policy if exists holidays_vn_write on public.holidays_vn;
create policy holidays_vn_write on public.holidays_vn
for all using (company_id = current_company_id() and has_any_role('ceo','hr_admin'))
with check (company_id = current_company_id() and has_any_role('ceo','hr_admin'));

-- -----------------------------------------------------------------------------
-- Attendance records: nhân viên tự check-in/out của mình; admin sửa mọi record
-- -----------------------------------------------------------------------------
drop policy if exists attendance_records_own on public.attendance_records;
create policy attendance_records_own on public.attendance_records
for all using (
  company_id = current_company_id()
  and employee_id = current_employee_id()
)
with check (
  company_id = current_company_id()
  and employee_id = current_employee_id()
);

drop policy if exists attendance_records_admin on public.attendance_records;
create policy attendance_records_admin on public.attendance_records
for all using (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin','dept_head')
)
with check (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin','dept_head')
);

-- -----------------------------------------------------------------------------
-- Attendance corrections: own writes + admin
-- -----------------------------------------------------------------------------
drop policy if exists attendance_corrections_own on public.attendance_corrections;
create policy attendance_corrections_own on public.attendance_corrections
for all using (
  company_id = current_company_id()
  and employee_id = current_employee_id()
)
with check (
  company_id = current_company_id()
  and employee_id = current_employee_id()
);

drop policy if exists attendance_corrections_admin on public.attendance_corrections;
create policy attendance_corrections_admin on public.attendance_corrections
for all using (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin','dept_head')
);

-- -----------------------------------------------------------------------------
-- Overtime requests: own + admin
-- -----------------------------------------------------------------------------
drop policy if exists overtime_requests_own on public.overtime_requests;
create policy overtime_requests_own on public.overtime_requests
for all using (
  company_id = current_company_id()
  and employee_id = current_employee_id()
)
with check (
  company_id = current_company_id()
  and employee_id = current_employee_id()
);

drop policy if exists overtime_requests_admin on public.overtime_requests;
create policy overtime_requests_admin on public.overtime_requests
for all using (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin','dept_head')
);

-- -----------------------------------------------------------------------------
-- Leave requests: nhân viên tự submit/cancel đơn của mình; manager/admin duyệt
-- -----------------------------------------------------------------------------
drop policy if exists leave_requests_own on public.leave_requests;
create policy leave_requests_own on public.leave_requests
for all using (
  company_id = current_company_id()
  and employee_id = current_employee_id()
)
with check (
  company_id = current_company_id()
  and employee_id = current_employee_id()
);

drop policy if exists leave_requests_admin on public.leave_requests;
create policy leave_requests_admin on public.leave_requests
for all using (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin','dept_head','team_lead')
)
with check (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin','dept_head','team_lead')
);

-- -----------------------------------------------------------------------------
-- Leave balances: chỉ admin chỉnh; nhân viên xem qua tenant_select đã có
-- -----------------------------------------------------------------------------
drop policy if exists leave_balances_write on public.leave_balances;
create policy leave_balances_write on public.leave_balances
for all using (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin')
)
with check (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin')
);

-- -----------------------------------------------------------------------------
-- Onboarding runs + tasks: admin tạo run; owner cập nhật task của mình
-- -----------------------------------------------------------------------------
drop policy if exists onboarding_runs_admin on public.onboarding_runs;
create policy onboarding_runs_admin on public.onboarding_runs
for all using (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin','dept_head')
)
with check (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin','dept_head')
);

drop policy if exists onboarding_run_tasks_admin on public.onboarding_run_tasks;
create policy onboarding_run_tasks_admin on public.onboarding_run_tasks
for all using (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin','dept_head')
)
with check (
  company_id = current_company_id()
  and has_any_role('ceo','hr_admin','dept_head')
);

drop policy if exists onboarding_run_tasks_owner on public.onboarding_run_tasks;
create policy onboarding_run_tasks_owner on public.onboarding_run_tasks
for update using (
  company_id = current_company_id()
  and owner_employee_id = current_employee_id()
);
