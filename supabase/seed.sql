-- =============================================================================
-- BIZOS seed data — BIZOS Demo company
-- Run AFTER schema.sql and policies.sql.
-- Assumes you've created auth users manually in Supabase for:
--   ceo@bizos.demo, hr@bizos.demo, finance@bizos.demo, sales@bizos.demo
-- then update the auth_user_id values below to match.
-- =============================================================================

-- 1. Company
insert into companies (id, name, code)
values ('00000000-0000-0000-0000-00000000c001', 'BIZOS Demo', 'BIZOS_DEMO')
on conflict (id) do nothing;

-- 2. Departments
insert into departments (id, company_id, name, code, budget_monthly) values
  ('00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-00000000c001','Sales','SAL',500000000),
  ('00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-00000000c001','Marketing','MKT',400000000),
  ('00000000-0000-0000-0000-00000000d003','00000000-0000-0000-0000-00000000c001','Operations','OPS',300000000),
  ('00000000-0000-0000-0000-00000000d004','00000000-0000-0000-0000-00000000c001','Customer Success','CS',200000000),
  ('00000000-0000-0000-0000-00000000d005','00000000-0000-0000-0000-00000000c001','HR & Admin','HR',150000000),
  ('00000000-0000-0000-0000-00000000d006','00000000-0000-0000-0000-00000000c001','Finance','FIN',150000000)
on conflict do nothing;

-- 3. Positions (b0 prefix instead of p)
insert into positions (id, company_id, name, level, base_salary_min, base_salary_max) values
  ('00000000-0000-0000-0000-000000000b01','00000000-0000-0000-0000-00000000c001','CEO','C-level',60000000,120000000),
  ('00000000-0000-0000-0000-000000000b02','00000000-0000-0000-0000-00000000c001','Head of Department','Director',35000000,60000000),
  ('00000000-0000-0000-0000-000000000b03','00000000-0000-0000-0000-00000000c001','Team Lead','Manager',20000000,35000000),
  ('00000000-0000-0000-0000-000000000b04','00000000-0000-0000-0000-00000000c001','Senior Specialist','Senior',15000000,25000000),
  ('00000000-0000-0000-0000-000000000b05','00000000-0000-0000-0000-00000000c001','Specialist','Mid',10000000,16000000),
  ('00000000-0000-0000-0000-000000000b06','00000000-0000-0000-0000-00000000c001','Junior','Junior',7000000,11000000)
on conflict do nothing;

-- 4. Sample employees
insert into employees (id, company_id, full_name, email, department_id, position_id, base_salary, status) values
  ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-00000000c001','Nguyễn Văn A','ceo@bizos.demo',null,'00000000-0000-0000-0000-000000000b01',80000000,'active'),
  ('00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-00000000c001','Trần Thị B','hr@bizos.demo','00000000-0000-0000-0000-00000000d005','00000000-0000-0000-0000-000000000b02',45000000,'active'),
  ('00000000-0000-0000-0000-0000000000e3','00000000-0000-0000-0000-00000000c001','Lê Văn C','cfo@bizos.demo','00000000-0000-0000-0000-00000000d006','00000000-0000-0000-0000-000000000b02',50000000,'active'),
  ('00000000-0000-0000-0000-0000000000e4','00000000-0000-0000-0000-00000000c001','Phạm Thu D','sales.head@bizos.demo','00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-000000000b02',48000000,'active'),
  ('00000000-0000-0000-0000-0000000000e5','00000000-0000-0000-0000-00000000c001','Hoàng Minh E','mkt.head@bizos.demo','00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-000000000b02',45000000,'active'),
  ('00000000-0000-0000-0000-0000000000e6','00000000-0000-0000-0000-00000000c001','Đỗ Quỳnh F','ops.head@bizos.demo','00000000-0000-0000-0000-00000000d003','00000000-0000-0000-0000-000000000b02',42000000,'active'),
  ('00000000-0000-0000-0000-0000000000e7','00000000-0000-0000-0000-00000000c001','Vũ Thanh G','cs.head@bizos.demo','00000000-0000-0000-0000-00000000d004','00000000-0000-0000-0000-000000000b02',38000000,'active')
on conflict do nothing;

-- Mark department heads
update departments set head_employee_id='00000000-0000-0000-0000-0000000000e4' where id='00000000-0000-0000-0000-00000000d001';
update departments set head_employee_id='00000000-0000-0000-0000-0000000000e5' where id='00000000-0000-0000-0000-00000000d002';
update departments set head_employee_id='00000000-0000-0000-0000-0000000000e6' where id='00000000-0000-0000-0000-00000000d003';
update departments set head_employee_id='00000000-0000-0000-0000-0000000000e7' where id='00000000-0000-0000-0000-00000000d004';
update departments set head_employee_id='00000000-0000-0000-0000-0000000000e2' where id='00000000-0000-0000-0000-00000000d005';
update departments set head_employee_id='00000000-0000-0000-0000-0000000000e3' where id='00000000-0000-0000-0000-00000000d006';

-- 5. Company KPI cascade (a0 prefix instead of k)
insert into kpis (id, company_id, code, name, level, weight, target_frequency, unit) values
  ('00000000-0000-0000-0000-000000000a01','00000000-0000-0000-0000-00000000c001','REV','Doanh thu tháng','company',1,'monthly','VND'),
  ('00000000-0000-0000-0000-000000000a02','00000000-0000-0000-0000-00000000c001','GP','Gross Profit','company',1,'monthly','VND'),
  ('00000000-0000-0000-0000-000000000a03','00000000-0000-0000-0000-00000000c001','NP','Net Profit','company',1,'monthly','VND'),
  ('00000000-0000-0000-0000-000000000a04','00000000-0000-0000-0000-00000000c001','RET','Retention','company',1,'monthly','%')
on conflict do nothing;

-- Dept KPIs
insert into kpis (id, company_id, code, name, level, owner_department_id, parent_kpi_id, weight, target_frequency, unit) values
  ('00000000-0000-0000-0000-000000000a10','00000000-0000-0000-0000-00000000c001','SAL.CLOSE','Sales close rate','department','00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-000000000a01',0.6,'monthly','%'),
  ('00000000-0000-0000-0000-000000000a11','00000000-0000-0000-0000-00000000c001','SAL.AOV','AOV','department','00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-000000000a01',0.4,'monthly','VND'),
  ('00000000-0000-0000-0000-000000000a20','00000000-0000-0000-0000-00000000c001','MKT.LEADS','Qualified leads','department','00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-000000000a01',0.5,'monthly','lead'),
  ('00000000-0000-0000-0000-000000000a21','00000000-0000-0000-0000-00000000c001','MKT.CAC','CAC','department','00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-000000000a02',0.5,'monthly','VND'),
  ('00000000-0000-0000-0000-000000000a30','00000000-0000-0000-0000-00000000c001','OPS.SLA','Order SLA','department','00000000-0000-0000-0000-00000000d003','00000000-0000-0000-0000-000000000a02',0.7,'monthly','%'),
  ('00000000-0000-0000-0000-000000000a40','00000000-0000-0000-0000-00000000c001','CS.RET','Retention','department','00000000-0000-0000-0000-00000000d004','00000000-0000-0000-0000-000000000a04',1,'monthly','%')
on conflict do nothing;

-- 6. KPI formulas (JSONB AST)
insert into kpi_formulas (kpi_id, formula_type, definition) values
  ('00000000-0000-0000-0000-000000000a01','composite',
    '{"op":"sum","args":[{"ref":"SAL.CLOSE"},{"ref":"SAL.AOV"},{"ref":"MKT.LEADS"}]}'::jsonb),
  ('00000000-0000-0000-0000-000000000a02','ratio',
    '{"op":"sub","args":[{"ref":"REV"},{"ref":"COGS"}]}'::jsonb),
  ('00000000-0000-0000-0000-000000000a03','ratio',
    '{"op":"sub","args":[{"ref":"GP"},{"ref":"OPEX"}]}'::jsonb)
on conflict do nothing;

-- 7. KPI targets and actuals for 2026-04
insert into kpi_targets (kpi_id, period, target_value) values
  ('00000000-0000-0000-0000-000000000a01','2026-04',5000000000),
  ('00000000-0000-0000-0000-000000000a02','2026-04',2000000000),
  ('00000000-0000-0000-0000-000000000a03','2026-04',800000000)
on conflict do nothing;

insert into kpi_actuals (kpi_id, period, actual_value, completion_rate, status) values
  ('00000000-0000-0000-0000-000000000a01','2026-04',5200000000,1.04,'green'),
  ('00000000-0000-0000-0000-000000000a02','2026-04',1900000000,0.95,'yellow'),
  ('00000000-0000-0000-0000-000000000a03','2026-04',720000000,0.90,'yellow')
on conflict do nothing;

-- 8. Sample tasks
insert into tasks (company_id, title, assignee_id, department_id, linked_kpi_id, priority, task_type, status, due_date) values
  ('00000000-0000-0000-0000-00000000c001','Chốt 10 đơn sales tuần này','00000000-0000-0000-0000-0000000000e4','00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-000000000a10','high','growth','in_progress','2026-04-30'),
  ('00000000-0000-0000-0000-00000000c001','Chạy campaign TikTok mới','00000000-0000-0000-0000-0000000000e5','00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-000000000a20','normal','growth','todo','2026-05-05'),
  ('00000000-0000-0000-0000-00000000c001','Review SLA vận hành tháng','00000000-0000-0000-0000-0000000000e6','00000000-0000-0000-0000-00000000d003','00000000-0000-0000-0000-000000000a30','normal','maintenance','review','2026-04-28')
on conflict do nothing;

-- 9. Payroll period + a few entries (bb prefix instead of pr)
insert into payroll_periods (id, company_id, period, status) values
  ('00000000-0000-0000-0000-00000000bb01','00000000-0000-0000-0000-00000000c001','2026-04','draft')
on conflict do nothing;

insert into payroll_entries (company_id, payroll_period_id, employee_id, base_salary, bonus_total, gross_pay, net_pay, company_cost) values
  ('00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-00000000bb01','00000000-0000-0000-0000-0000000000e1',80000000,20000000,100000000,85000000,115000000),
  ('00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-00000000bb01','00000000-0000-0000-0000-0000000000e4',48000000,12000000,60000000,51000000,70000000)
on conflict do nothing;

-- 10. Chart of accounts (tối thiểu VN)
insert into chart_of_accounts (company_id, code, name, account_type) values
  ('00000000-0000-0000-0000-00000000c001','511','Doanh thu bán hàng','revenue'),
  ('00000000-0000-0000-0000-00000000c001','632','Giá vốn hàng bán','cogs'),
  ('00000000-0000-0000-0000-00000000c001','641','Chi phí bán hàng','expense'),
  ('00000000-0000-0000-0000-00000000c001','642','Chi phí quản lý','expense'),
  ('00000000-0000-0000-0000-00000000c001','334','Phải trả người lao động','liability'),
  ('00000000-0000-0000-0000-00000000c001','111','Tiền mặt','asset'),
  ('00000000-0000-0000-0000-00000000c001','112','Tiền gửi ngân hàng','asset'),
  ('00000000-0000-0000-0000-00000000c001','131','Phải thu khách hàng','asset'),
  ('00000000-0000-0000-0000-00000000c001','331','Phải trả người bán','liability')
on conflict do nothing;

-- 11. App settings
insert into app_settings (company_id, settings) values
  ('00000000-0000-0000-0000-00000000c001','{"brand":"BIZOS","fiscal_year_start":"01-01"}'::jsonb)
on conflict do nothing;

insert into user_preferences (company_id, auth_user_id, locale, timezone, date_format, theme, compact_sidebar, notification_settings, security_settings) values
  ('00000000-0000-0000-0000-00000000c001','11111111-1111-1111-1111-111111111111','vi','Asia/Ho_Chi_Minh','DD/MM/YYYY','light',false,'{"email":true,"push":true,"kpiAlerts":true,"approvals":true,"reminders":true,"periodicReports":true,"securityAlerts":true}'::jsonb,'{"two_factor":true,"password_strength":"strong"}'::jsonb)
on conflict (auth_user_id) do nothing;

insert into user_sessions (company_id, auth_user_id, device_label, platform, browser, location_label, ip_address, last_seen_at, is_current) values
  ('00000000-0000-0000-0000-00000000c001','11111111-1111-1111-1111-111111111111','MacBook Pro 16','macOS','Chrome','Hà Nội, Việt Nam','203.113.11.10','2026-04-24T09:15:00Z',true),
  ('00000000-0000-0000-0000-00000000c001','11111111-1111-1111-1111-111111111111','iPhone 14 Pro','iOS 17.5','Safari','Hà Nội, Việt Nam',null,'2026-04-24T06:15:00Z',false),
  ('00000000-0000-0000-0000-00000000c001','11111111-1111-1111-1111-111111111111','Office Desktop','Windows 11','Chrome','Hồ Chí Minh, Việt Nam',null,'2026-04-22T09:12:00Z',false)
on conflict do nothing;

insert into notifications (company_id, auth_user_id, title, body, created_at) values
  ('00000000-0000-0000-0000-00000000c001','11111111-1111-1111-1111-111111111111','Cập nhật hồ sơ cá nhân','01/06/2024 09:15','2026-04-23T09:15:00Z'),
  ('00000000-0000-0000-0000-00000000c001','11111111-1111-1111-1111-111111111111','Đổi mật khẩu thành công','30/05/2024 18:30','2026-04-22T18:30:00Z'),
  ('00000000-0000-0000-0000-00000000c001','11111111-1111-1111-1111-111111111111','Bật xác thực 2 lớp (2FA)','20/05/2024 10:22','2026-04-20T10:22:00Z')
on conflict do nothing;

-- =============================================================================
-- Auto-create auth users + link to employees + assign roles
-- =============================================================================
-- Create auth users for demo (local Supabase only)
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current, phone_change, phone_change_token, reauthentication_token, email_change_confirm_status, is_sso_user, is_anonymous)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000', 'ceo@bizos.demo', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated', now(), now(), '', '', '', '', '', '', '', '', 0, false, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000', 'hr@bizos.demo', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated', now(), now(), '', '', '', '', '', '', '', '', 0, false, false),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000000', 'cfo@bizos.demo', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated', now(), now(), '', '', '', '', '', '', '', '', 0, false, false),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000000', 'sales.head@bizos.demo', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated', now(), now(), '', '', '', '', '', '', '', '', 0, false, false)
on conflict (id) do nothing;

-- Create identities for the auth users
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"ceo@bizos.demo"}'::jsonb, 'email', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', now(), now(), now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","email":"hr@bizos.demo"}'::jsonb, 'email', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', now(), now(), now()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","email":"cfo@bizos.demo"}'::jsonb, 'email', 'cccccccc-cccc-cccc-cccc-cccccccccccc', now(), now(), now()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '{"sub":"dddddddd-dddd-dddd-dddd-dddddddddddd","email":"sales.head@bizos.demo"}'::jsonb, 'email', 'dddddddd-dddd-dddd-dddd-dddddddddddd', now(), now(), now())
on conflict do nothing;

-- Link employees to auth users
update employees set auth_user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' where email = 'ceo@bizos.demo';
update employees set auth_user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' where email = 'hr@bizos.demo';
update employees set auth_user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' where email = 'cfo@bizos.demo';
update employees set auth_user_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' where email = 'sales.head@bizos.demo';

-- Assign roles
insert into user_roles (auth_user_id, company_id, role) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-00000000c001', 'ceo'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-00000000c001', 'hr_admin'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-00000000c001', 'cfo'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-00000000c001', 'dept_head')
on conflict do nothing;

-- =============================================================================
-- Full demo data for feature testing
-- Attendance / Leave / Operations / Finance / Recruiting / Contracts / Onboarding
-- =============================================================================

-- Extra employees to match demo mode richness
insert into employees (
  id, company_id, code, full_name, email, department_id, position_id, manager_id, join_date, base_salary, status, employment_type
) values
  ('00000000-0000-0000-0000-0000000000e8','00000000-0000-0000-0000-00000000c001','E8','Nguyen Hai H','a01@bizos.demo','00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-000000000b04','00000000-0000-0000-0000-0000000000e4','2024-02-05',20000000,'active','fulltime'),
  ('00000000-0000-0000-0000-0000000000e9','00000000-0000-0000-0000-00000000c001','E9','Tran Nam I','a02@bizos.demo','00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-000000000b05','00000000-0000-0000-0000-0000000000e4','2024-07-10',14000000,'active','fulltime'),
  ('00000000-0000-0000-0000-0000000000ea','00000000-0000-0000-0000-00000000c001','E10','Ly Hoa K','a03@bizos.demo','00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-000000000b04','00000000-0000-0000-0000-0000000000e5','2024-03-18',18000000,'active','fulltime'),
  ('00000000-0000-0000-0000-0000000000eb','00000000-0000-0000-0000-00000000c001','E11','Pham Tu L','a04@bizos.demo','00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-000000000b05','00000000-0000-0000-0000-0000000000e5','2024-08-12',16000000,'active','fulltime'),
  ('00000000-0000-0000-0000-0000000000ec','00000000-0000-0000-0000-00000000c001','E12','Nguyen Lan M','a05@bizos.demo','00000000-0000-0000-0000-00000000d003','00000000-0000-0000-0000-000000000b05','00000000-0000-0000-0000-0000000000e6','2024-05-06',13000000,'active','fulltime'),
  ('00000000-0000-0000-0000-0000000000ed','00000000-0000-0000-0000-00000000c001','E13','Tran Son N','a06@bizos.demo','00000000-0000-0000-0000-00000000d004','00000000-0000-0000-0000-000000000b05','00000000-0000-0000-0000-0000000000e7','2024-09-02',12000000,'active','fulltime'),
  ('00000000-0000-0000-0000-0000000000ee','00000000-0000-0000-0000-00000000c001','E14','Dinh Ha O','a07@bizos.demo','00000000-0000-0000-0000-00000000d005','00000000-0000-0000-0000-000000000b05','00000000-0000-0000-0000-0000000000e2','2025-11-18',13000000,'active','fulltime')
on conflict (id) do update set
  code = excluded.code,
  full_name = excluded.full_name,
  email = excluded.email,
  department_id = excluded.department_id,
  position_id = excluded.position_id,
  manager_id = excluded.manager_id,
  join_date = excluded.join_date,
  base_salary = excluded.base_salary,
  status = excluded.status,
  employment_type = excluded.employment_type;

update employees set
  code = coalesce(code, 'E1'),
  manager_id = null,
  join_date = coalesce(join_date, '2023-01-01')
where id = '00000000-0000-0000-0000-0000000000e1';

update employees set
  manager_id = '00000000-0000-0000-0000-0000000000e1',
  join_date = coalesce(join_date, '2023-04-01')
where id in (
  '00000000-0000-0000-0000-0000000000e2',
  '00000000-0000-0000-0000-0000000000e3',
  '00000000-0000-0000-0000-0000000000e4',
  '00000000-0000-0000-0000-0000000000e5',
  '00000000-0000-0000-0000-0000000000e6',
  '00000000-0000-0000-0000-0000000000e7'
);

insert into employee_reporting_lines (company_id, employee_id, manager_id, starts_at)
select '00000000-0000-0000-0000-00000000c001', e.id, e.manager_id, coalesce(e.join_date, '2024-01-01')
from employees e
where e.company_id = '00000000-0000-0000-0000-00000000c001'
  and e.manager_id is not null
  and not exists (
    select 1
    from employee_reporting_lines r
    where r.company_id = e.company_id
      and r.employee_id = e.id
      and r.manager_id = e.manager_id
  );

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role,
  created_at, updated_at, confirmation_token, recovery_token, email_change,
  email_change_token_new, email_change_token_current, phone_change, phone_change_token,
  reauthentication_token, email_change_confirm_status, is_sso_user, is_anonymous
) values
  ('eeeeeeee-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','mkt.head@bizos.demo',crypt('password123', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'authenticated','authenticated',now(),now(),'','','','','','','','',0,false,false),
  ('ffffffff-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','ops.head@bizos.demo',crypt('password123', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'authenticated','authenticated',now(),now(),'','','','','','','','',0,false,false),
  ('12121212-1212-1212-1212-121212121212','00000000-0000-0000-0000-000000000000','cs.head@bizos.demo',crypt('password123', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'authenticated','authenticated',now(),now(),'','','','','','','','',0,false,false),
  ('18181818-1818-1818-1818-181818181818','00000000-0000-0000-0000-000000000000','a01@bizos.demo',crypt('password123', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,'authenticated','authenticated',now(),now(),'','','','','','','','',0,false,false)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
  ('eeeeeeee-1111-1111-1111-111111111111','eeeeeeee-1111-1111-1111-111111111111','{"sub":"eeeeeeee-1111-1111-1111-111111111111","email":"mkt.head@bizos.demo"}'::jsonb,'email','eeeeeeee-1111-1111-1111-111111111111',now(),now(),now()),
  ('ffffffff-1111-1111-1111-111111111111','ffffffff-1111-1111-1111-111111111111','{"sub":"ffffffff-1111-1111-1111-111111111111","email":"ops.head@bizos.demo"}'::jsonb,'email','ffffffff-1111-1111-1111-111111111111',now(),now(),now()),
  ('12121212-1212-1212-1212-121212121212','12121212-1212-1212-1212-121212121212','{"sub":"12121212-1212-1212-1212-121212121212","email":"cs.head@bizos.demo"}'::jsonb,'email','12121212-1212-1212-1212-121212121212',now(),now(),now()),
  ('18181818-1818-1818-1818-181818181818','18181818-1818-1818-1818-181818181818','{"sub":"18181818-1818-1818-1818-181818181818","email":"a01@bizos.demo"}'::jsonb,'email','18181818-1818-1818-1818-181818181818',now(),now(),now())
on conflict do nothing;

update employees set auth_user_id = 'eeeeeeee-1111-1111-1111-111111111111' where id = '00000000-0000-0000-0000-0000000000e5';
update employees set auth_user_id = 'ffffffff-1111-1111-1111-111111111111' where id = '00000000-0000-0000-0000-0000000000e6';
update employees set auth_user_id = '12121212-1212-1212-1212-121212121212' where id = '00000000-0000-0000-0000-0000000000e7';
update employees set auth_user_id = '18181818-1818-1818-1818-181818181818' where id = '00000000-0000-0000-0000-0000000000e8';

insert into user_roles (auth_user_id, company_id, role, scope_department_id) values
  ('eeeeeeee-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000c001','dept_head','00000000-0000-0000-0000-00000000d002'),
  ('ffffffff-1111-1111-1111-111111111111','00000000-0000-0000-0000-00000000c001','dept_head','00000000-0000-0000-0000-00000000d003'),
  ('12121212-1212-1212-1212-121212121212','00000000-0000-0000-0000-00000000c001','dept_head','00000000-0000-0000-0000-00000000d004'),
  ('18181818-1818-1818-1818-181818181818','00000000-0000-0000-0000-00000000c001','employee',null)
on conflict do nothing;

insert into user_preferences (
  company_id, auth_user_id, locale, timezone, date_format, theme, compact_sidebar, notification_settings, security_settings
) values
  ('00000000-0000-0000-0000-00000000c001','eeeeeeee-1111-1111-1111-111111111111','vi','Asia/Ho_Chi_Minh','DD/MM/YYYY','light',false,'{"email":true,"approvals":true}'::jsonb,'{"two_factor":false}'::jsonb),
  ('00000000-0000-0000-0000-00000000c001','ffffffff-1111-1111-1111-111111111111','vi','Asia/Ho_Chi_Minh','DD/MM/YYYY','dark',false,'{"email":true,"approvals":true}'::jsonb,'{"two_factor":false}'::jsonb),
  ('00000000-0000-0000-0000-00000000c001','12121212-1212-1212-1212-121212121212','vi','Asia/Ho_Chi_Minh','DD/MM/YYYY','light',false,'{"email":true,"approvals":true}'::jsonb,'{"two_factor":false}'::jsonb),
  ('00000000-0000-0000-0000-00000000c001','18181818-1818-1818-1818-181818181818','vi','Asia/Ho_Chi_Minh','DD/MM/YYYY','light',false,'{"email":true,"reminders":true}'::jsonb,'{"two_factor":false}'::jsonb)
on conflict (auth_user_id) do nothing;

insert into kpis (id, company_id, code, name, level, owner_employee_id, owner_department_id, unit, weight, parent_kpi_id, data_source, active, target_frequency) values
  ('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-00000000c001','E8.CLOSE','Sales close / Nguyen Hai H','employee','00000000-0000-0000-0000-0000000000e8','00000000-0000-0000-0000-00000000d001','don',0.5,'00000000-0000-0000-0000-000000000a10','crm',true,'monthly'),
  ('00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-00000000c001','E9.CLOSE','Sales close / Tran Nam I','employee','00000000-0000-0000-0000-0000000000e9','00000000-0000-0000-0000-00000000d001','don',0.5,'00000000-0000-0000-0000-000000000a10','crm',true,'monthly'),
  ('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-00000000c001','E10.CONTENT','Content output / Ly Hoa K','employee','00000000-0000-0000-0000-0000000000ea','00000000-0000-0000-0000-00000000d002','bai',0.6,'00000000-0000-0000-0000-000000000a20','social',true,'monthly'),
  ('00000000-0000-0000-0000-000000000202','00000000-0000-0000-0000-00000000c001','E11.CPL','CPL Ads / Pham Tu L','employee','00000000-0000-0000-0000-0000000000eb','00000000-0000-0000-0000-00000000d002','VND',0.4,'00000000-0000-0000-0000-000000000a21','ads',true,'monthly')
on conflict (id) do update set
  name = excluded.name,
  owner_employee_id = excluded.owner_employee_id,
  owner_department_id = excluded.owner_department_id,
  unit = excluded.unit,
  weight = excluded.weight,
  parent_kpi_id = excluded.parent_kpi_id,
  data_source = excluded.data_source,
  active = excluded.active,
  target_frequency = excluded.target_frequency;

insert into kpi_targets (kpi_id, period, target_value) values
  ('00000000-0000-0000-0000-000000000a10','2026-04',35),
  ('00000000-0000-0000-0000-000000000a11','2026-04',12000000),
  ('00000000-0000-0000-0000-000000000a20','2026-04',500),
  ('00000000-0000-0000-0000-000000000a21','2026-04',450000),
  ('00000000-0000-0000-0000-000000000a30','2026-04',95),
  ('00000000-0000-0000-0000-000000000a40','2026-04',68),
  ('00000000-0000-0000-0000-000000000101','2026-04',25),
  ('00000000-0000-0000-0000-000000000102','2026-04',25),
  ('00000000-0000-0000-0000-000000000201','2026-04',60),
  ('00000000-0000-0000-0000-000000000202','2026-04',400000)
on conflict (kpi_id, period) do update set
  target_value = excluded.target_value;

insert into kpi_actuals (kpi_id, period, actual_value, completion_rate, status) values
  ('00000000-0000-0000-0000-000000000a10','2026-04',32,0.91,'yellow'),
  ('00000000-0000-0000-0000-000000000a11','2026-04',13200000,1.10,'green'),
  ('00000000-0000-0000-0000-000000000a20','2026-04',540,1.08,'green'),
  ('00000000-0000-0000-0000-000000000a21','2026-04',478000,0.94,'yellow'),
  ('00000000-0000-0000-0000-000000000a30','2026-04',88,0.93,'yellow'),
  ('00000000-0000-0000-0000-000000000a40','2026-04',66,0.97,'yellow'),
  ('00000000-0000-0000-0000-000000000101','2026-04',27,1.08,'green'),
  ('00000000-0000-0000-0000-000000000102','2026-04',18,0.72,'red'),
  ('00000000-0000-0000-0000-000000000201','2026-04',62,1.03,'green'),
  ('00000000-0000-0000-0000-000000000202','2026-04',420000,0.95,'yellow')
on conflict (kpi_id, period) do update set
  actual_value = excluded.actual_value,
  completion_rate = excluded.completion_rate,
  status = excluded.status;

insert into projects (id, company_id, code, name, owner_id, business_case, status, starts_at, ends_at, budget) values
  ('00000000-0000-0000-0000-000000005201','00000000-0000-0000-0000-00000000c001','P01','Mo kenh TikTok moi','00000000-0000-0000-0000-0000000000e5','Ky vong +300 leads/thang','active','2026-03-01','2026-06-30',120000000),
  ('00000000-0000-0000-0000-000000005202','00000000-0000-0000-0000-00000000c001','P02','Trien khai CRM moi','00000000-0000-0000-0000-0000000000e4','Giam thoi gian xu ly 30%','active','2026-02-01','2026-05-15',350000000),
  ('00000000-0000-0000-0000-000000005203','00000000-0000-0000-0000-00000000c001','P03','Tai cau truc sales pipeline','00000000-0000-0000-0000-0000000000e4','Tang close rate 5%','paused','2026-04-01','2026-07-30',80000000),
  ('00000000-0000-0000-0000-000000005204','00000000-0000-0000-0000-00000000c001','P04','Loyalty program CSKH','00000000-0000-0000-0000-0000000000e7','Retention +5%','draft','2026-05-01','2026-08-31',200000000)
on conflict (id) do update set
  name = excluded.name,
  owner_id = excluded.owner_id,
  business_case = excluded.business_case,
  status = excluded.status,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  budget = excluded.budget;

insert into project_members (project_id, employee_id, role) values
  ('00000000-0000-0000-0000-000000005201','00000000-0000-0000-0000-0000000000ea','content'),
  ('00000000-0000-0000-0000-000000005201','00000000-0000-0000-0000-0000000000eb','ads'),
  ('00000000-0000-0000-0000-000000005202','00000000-0000-0000-0000-0000000000e4','owner'),
  ('00000000-0000-0000-0000-000000005202','00000000-0000-0000-0000-0000000000e2','stakeholder')
on conflict (project_id, employee_id) do nothing;

insert into sprints (id, company_id, name, goal, start_date, end_date, status, capacity, velocity, completed_points, carry_over_points, completion_rate, retrospective, completed_at) values
  ('00000000-0000-0000-0000-000000005101','00000000-0000-0000-0000-00000000c001','Sprint 0 - Cuoi thang 3/2026','Dong goi backlog Q2','2026-03-17','2026-03-31','completed',28,24,22,2,91.67,'{"wins":["release leave module"],"risks":["QA sat deadline"]}'::jsonb,'2026-03-31T10:00:00Z'),
  ('00000000-0000-0000-0000-000000005102','00000000-0000-0000-0000-00000000c001','Sprint 1 - Thang 4/2026','Tang doanh thu Q2, toi uu marketing campaigns','2026-04-14','2026-04-28','active',30,null,null,null,null,null,null),
  ('00000000-0000-0000-0000-000000005103','00000000-0000-0000-0000-00000000c001','Sprint 2 - Dau thang 5/2026','Ship dashboard payroll v2','2026-05-05','2026-05-19','planning',32,null,null,null,null,null,null)
on conflict (id) do update set
  name = excluded.name,
  goal = excluded.goal,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  status = excluded.status,
  capacity = excluded.capacity,
  velocity = excluded.velocity,
  completed_points = excluded.completed_points,
  carry_over_points = excluded.carry_over_points,
  completion_rate = excluded.completion_rate,
  retrospective = excluded.retrospective,
  completed_at = excluded.completed_at;

insert into tasks (
  id, company_id, title, description, assignee_id, reviewer_id, department_id, project_id, linked_kpi_id,
  priority, task_type, status, due_date, estimated_hours, actual_hours, blocked_reason, sprint_id, story_points, parent_task_id
) values
  ('00000000-0000-0000-0000-000000005301','00000000-0000-0000-0000-00000000c001','Chot 10 don sales tuan nay',null,'00000000-0000-0000-0000-0000000000e8',null,'00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-000000005202','00000000-0000-0000-0000-000000000101','high','growth','in_progress','2026-04-30',6,null,null,'00000000-0000-0000-0000-000000005102',5,null),
  ('00000000-0000-0000-0000-000000005302','00000000-0000-0000-0000-00000000c001','Goi 50 leads warm',null,'00000000-0000-0000-0000-0000000000e9',null,'00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-000000005202','00000000-0000-0000-0000-000000000102','high','growth','todo','2026-04-30',5,null,null,'00000000-0000-0000-0000-000000005102',3,null),
  ('00000000-0000-0000-0000-000000005303','00000000-0000-0000-0000-00000000c001','Dang 15 bai content TikTok',null,'00000000-0000-0000-0000-0000000000ea',null,'00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-000000005201','00000000-0000-0000-0000-000000000201','normal','growth','in_progress','2026-04-30',10,null,null,'00000000-0000-0000-0000-000000005102',8,null),
  ('00000000-0000-0000-0000-000000005304','00000000-0000-0000-0000-00000000c001','Toi uu ads campaign Q2',null,'00000000-0000-0000-0000-0000000000eb',null,'00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-000000005201','00000000-0000-0000-0000-000000000202','high','growth','todo','2026-04-30',8,null,null,'00000000-0000-0000-0000-000000005102',5,null),
  ('00000000-0000-0000-0000-000000005305','00000000-0000-0000-0000-00000000c001','Review SLA van hanh thang',null,'00000000-0000-0000-0000-0000000000e6',null,'00000000-0000-0000-0000-00000000d003',null,'00000000-0000-0000-0000-000000000a30','normal','growth','review','2026-04-30',4,null,null,'00000000-0000-0000-0000-000000005102',3,null),
  ('00000000-0000-0000-0000-000000005306','00000000-0000-0000-0000-00000000c001','Khao sat CSAT thang 4',null,'00000000-0000-0000-0000-0000000000ed',null,'00000000-0000-0000-0000-00000000d004','00000000-0000-0000-0000-000000005204','00000000-0000-0000-0000-000000000a40','normal','growth','in_progress','2026-04-28',3,null,null,'00000000-0000-0000-0000-000000005102',2,null),
  ('00000000-0000-0000-0000-000000005307','00000000-0000-0000-0000-00000000c001','Dang tin tuyen 3 vi tri moi',null,'00000000-0000-0000-0000-0000000000ee',null,'00000000-0000-0000-0000-00000000d005',null,null,'normal','admin','done','2026-04-20',2,2,null,'00000000-0000-0000-0000-000000005101',2,null),
  ('00000000-0000-0000-0000-000000005308','00000000-0000-0000-0000-00000000c001','Chay payroll thang 4',null,'00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000e3','00000000-0000-0000-0000-00000000d005',null,null,'urgent','admin','todo','2026-04-25',6,null,null,null,null,null),
  ('00000000-0000-0000-0000-000000005309','00000000-0000-0000-0000-00000000c001','Tong hop bao cao tai chinh Q1',null,'00000000-0000-0000-0000-0000000000e3',null,'00000000-0000-0000-0000-00000000d006',null,null,'high','admin','review','2026-04-29',6,null,null,null,null,null),
  ('00000000-0000-0000-0000-00000000530a','00000000-0000-0000-0000-00000000c001','Thiet ke landing page moi',null,'00000000-0000-0000-0000-0000000000ea',null,'00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-000000005201','00000000-0000-0000-0000-000000000201','normal','growth','blocked','2026-05-03',7,null,'Cho brand guideline moi',null,null,null),
  ('00000000-0000-0000-0000-00000000530b','00000000-0000-0000-0000-00000000c001','Training inbound sales',null,'00000000-0000-0000-0000-0000000000e4',null,'00000000-0000-0000-0000-00000000d001',null,'00000000-0000-0000-0000-000000000a10','normal','growth','todo','2026-05-05',3,null,null,null,null,null),
  ('00000000-0000-0000-0000-00000000530c','00000000-0000-0000-0000-00000000c001','Chuan hoa SOP CSKH',null,'00000000-0000-0000-0000-0000000000e7',null,'00000000-0000-0000-0000-00000000d004',null,null,'normal','maintenance','done','2026-04-15',4,4,null,'00000000-0000-0000-0000-000000005101',2,null)
on conflict (id) do update set
  title = excluded.title,
  assignee_id = excluded.assignee_id,
  reviewer_id = excluded.reviewer_id,
  department_id = excluded.department_id,
  project_id = excluded.project_id,
  linked_kpi_id = excluded.linked_kpi_id,
  priority = excluded.priority,
  task_type = excluded.task_type,
  status = excluded.status,
  due_date = excluded.due_date,
  estimated_hours = excluded.estimated_hours,
  actual_hours = excluded.actual_hours,
  blocked_reason = excluded.blocked_reason,
  sprint_id = excluded.sprint_id,
  story_points = excluded.story_points,
  parent_task_id = excluded.parent_task_id;

insert into task_results (id, company_id, task_id, type, url, label, note, created_by) values
  ('00000000-0000-0000-0000-000000005321','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-000000005303','link','https://example.com/tiktok-calendar','Content calendar','Lich dang bai tuan 3','00000000-0000-0000-0000-0000000000ea'),
  ('00000000-0000-0000-0000-000000005322','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-000000005307','file','https://example.com/recruitment-plan.pdf','Recruitment plan','Ban mo ta cong viec da duyet','00000000-0000-0000-0000-0000000000ee'),
  ('00000000-0000-0000-0000-000000005323','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-000000005305','link','https://example.com/sla-review','SLA review','Bao cao SLA thang 4','00000000-0000-0000-0000-0000000000e6')
on conflict (id) do nothing;

insert into payroll_entries (
  company_id, payroll_period_id, employee_id, base_salary, allowance_total, commission_total,
  bonus_total, penalty_total, adjustment_total, gross_pay, net_pay, company_cost, breakdown
)
select
  e.company_id,
  '00000000-0000-0000-0000-00000000bb01',
  e.id,
  e.base_salary,
  round(e.base_salary * 0.05),
  case when e.department_id = '00000000-0000-0000-0000-00000000d001' then round(e.base_salary * 0.20) else 0 end,
  round(e.base_salary * 0.15),
  0,
  0,
  round(e.base_salary * 1.25),
  round(e.base_salary * 1.10),
  round(e.base_salary * 1.35),
  jsonb_build_object('month','2026-04')
from employees e
where e.company_id = '00000000-0000-0000-0000-00000000c001'
  and e.status = 'active'
on conflict (payroll_period_id, employee_id) do update set
  base_salary = excluded.base_salary,
  allowance_total = excluded.allowance_total,
  commission_total = excluded.commission_total,
  bonus_total = excluded.bonus_total,
  gross_pay = excluded.gross_pay,
  net_pay = excluded.net_pay,
  company_cost = excluded.company_cost,
  breakdown = excluded.breakdown;

insert into accounting_entries (id, company_id, entry_date, account_code, debit, credit, department_id, project_id, note) values
  ('00000000-0000-0000-0000-000000004001','00000000-0000-0000-0000-00000000c001','2026-04-15','511',0,5200000000,'00000000-0000-0000-0000-00000000d001',null,'Doanh thu thang 4'),
  ('00000000-0000-0000-0000-000000004002','00000000-0000-0000-0000-00000000c001','2026-04-15','632',3300000000,0,'00000000-0000-0000-0000-00000000d003',null,'Gia von thang 4'),
  ('00000000-0000-0000-0000-000000004003','00000000-0000-0000-0000-00000000c001','2026-04-20','641',420000000,0,'00000000-0000-0000-0000-00000000d001',null,'Chi phi ban hang'),
  ('00000000-0000-0000-0000-000000004004','00000000-0000-0000-0000-00000000c001','2026-04-20','642',380000000,0,'00000000-0000-0000-0000-00000000d005',null,'Chi phi quan ly'),
  ('00000000-0000-0000-0000-000000004005','00000000-0000-0000-0000-00000000c001','2026-04-28','334',0,560000000,null,null,'Luong thang 4')
on conflict (id) do nothing;

insert into job_requisitions (id, company_id, department_id, position_id, title, headcount, status, reason, opened_at, closed_at) values
  ('00000000-0000-0000-0000-000000005801','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-00000000d001',null,'Senior Sales x2',2,'open','Mo rong khu vuc HN','2026-04-15',null),
  ('00000000-0000-0000-0000-000000005802','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-00000000d002',null,'Performance Marketing Lead',1,'open','Tang ad spend','2026-04-10',null),
  ('00000000-0000-0000-0000-000000005803','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-00000000d003',null,'Ops Specialist',1,'pipeline','Replacement','2026-03-20',null)
on conflict (id) do update set
  title = excluded.title,
  headcount = excluded.headcount,
  status = excluded.status,
  reason = excluded.reason,
  opened_at = excluded.opened_at,
  closed_at = excluded.closed_at;

insert into candidates (id, company_id, requisition_id, full_name, email, phone, stage, notes) values
  ('00000000-0000-0000-0000-000000005811','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-000000005801','Le Minh Quan','quan@example.com','0901111111','screening','CV manh ve SaaS sales'),
  ('00000000-0000-0000-0000-000000005812','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-000000005801','Tran Quoc Bao','bao@example.com','0902222222','interview','Co kinh nghiem B2B'),
  ('00000000-0000-0000-0000-000000005813','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-000000005802','Nguyen Thu Ha','ha@example.com','0903333333','offer','Strong on Meta Ads'),
  ('00000000-0000-0000-0000-000000005814','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-000000005803','Pham Ngoc An','an@example.com','0904444444','new','Ops background')
on conflict (id) do nothing;

insert into sop_documents (id, company_id, department_id, title, body, version, published) values
  ('00000000-0000-0000-0000-000000005901','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-00000000d001','Quy trinh qualify lead','1. Nhan lead. 2. Cham diem. 3. Ban giao sales.',3,true),
  ('00000000-0000-0000-0000-000000005902','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-00000000d002','Playbook content TikTok','Hook 3s dau, CTA cuoi video.',2,true),
  ('00000000-0000-0000-0000-000000005903','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-00000000d004','SOP xu ly khieu nai','Phan hoi trong 2h, xu ly trong 24h.',1,true),
  ('00000000-0000-0000-0000-000000005904','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-00000000d005','Policy cham cong','Cham cong qua app, sai sot ghi chu va tao correction.',4,true)
on conflict (id) do update set
  title = excluded.title,
  body = excluded.body,
  version = excluded.version,
  published = excluded.published;

insert into leave_types (
  id, company_id, code, name, paid, default_quota_days, carry_over_max_days, requires_attachment, description, active
) values
  ('00000000-0000-0000-0000-000000006001','00000000-0000-0000-0000-00000000c001','ANNUAL','Phep nam',true,12,5,false,'12 ngay / nam',true),
  ('00000000-0000-0000-0000-000000006002','00000000-0000-0000-0000-00000000c001','SICK','Nghi om',true,null,0,true,'Can giay xac nhan',true),
  ('00000000-0000-0000-0000-000000006003','00000000-0000-0000-0000-00000000c001','MATERNITY','Nghi thai san',true,180,0,true,'Theo quy dinh',true),
  ('00000000-0000-0000-0000-000000006004','00000000-0000-0000-0000-00000000c001','MARRIAGE','Nghi ket hon',true,3,0,false,'3 ngay',true),
  ('00000000-0000-0000-0000-000000006005','00000000-0000-0000-0000-00000000c001','BEREAVEMENT','Nghi huu',true,3,0,false,'3 ngay',true),
  ('00000000-0000-0000-0000-000000006006','00000000-0000-0000-0000-00000000c001','UNPAID','Nghi khong luong',false,null,0,false,'Theo thoa thuan',true),
  ('00000000-0000-0000-0000-000000006007','00000000-0000-0000-0000-00000000c001','COMP','Nghi bu',true,null,0,false,'Bu sau OT',true)
on conflict (company_id, code) do update set
  name = excluded.name,
  paid = excluded.paid,
  default_quota_days = excluded.default_quota_days,
  carry_over_max_days = excluded.carry_over_max_days,
  requires_attachment = excluded.requires_attachment,
  description = excluded.description,
  active = excluded.active;

insert into holidays_vn (id, company_id, name, holiday_date, is_paid, is_substitute, notes) values
  ('00000000-0000-0000-0000-000000006101',null,'Tet Duong lich','2026-01-01',true,false,null),
  ('00000000-0000-0000-0000-000000006102',null,'Tet Nguyen dan','2026-02-16',true,false,'Mung 1'),
  ('00000000-0000-0000-0000-000000006103',null,'Tet Nguyen dan','2026-02-17',true,false,'Mung 2'),
  ('00000000-0000-0000-0000-000000006104',null,'Tet Nguyen dan','2026-02-18',true,false,'Mung 3'),
  ('00000000-0000-0000-0000-000000006105',null,'Tet Nguyen dan','2026-02-19',true,false,'Mung 4'),
  ('00000000-0000-0000-0000-000000006106',null,'Tet Nguyen dan','2026-02-20',true,false,'Mung 5'),
  ('00000000-0000-0000-0000-000000006107',null,'Gio to Hung Vuong','2026-04-26',true,false,'10/3 AL'),
  ('00000000-0000-0000-0000-000000006108',null,'Giai phong mien Nam','2026-04-30',true,false,null),
  ('00000000-0000-0000-0000-000000006109',null,'Quoc te Lao dong','2026-05-01',true,false,null),
  ('00000000-0000-0000-0000-00000000610a',null,'Quoc khanh','2026-09-01',true,false,'Ngay lien ke'),
  ('00000000-0000-0000-0000-00000000610b',null,'Quoc khanh','2026-09-02',true,false,null)
on conflict (id) do update set
  name = excluded.name,
  holiday_date = excluded.holiday_date,
  is_paid = excluded.is_paid,
  is_substitute = excluded.is_substitute,
  notes = excluded.notes;

with lt as (
  select code, id
  from leave_types
  where company_id = '00000000-0000-0000-0000-00000000c001'
)
insert into leave_balances (
  company_id, employee_id, leave_type_id, year, entitled_days, carried_over_days, used_days, pending_days, adjustment_days
)
select
  '00000000-0000-0000-0000-00000000c001',
  e.id,
  lt.id,
  2026,
  case lt.code
    when 'ANNUAL' then 12
    when 'COMP' then 2
    else 0
  end,
  case when lt.code = 'ANNUAL' then 2 else 0 end,
  case
    when lt.code = 'ANNUAL' and e.id = '00000000-0000-0000-0000-0000000000e1' then 4
    when lt.code = 'ANNUAL' and e.id = '00000000-0000-0000-0000-0000000000e8' then 2
    else 0
  end,
  case when lt.code = 'ANNUAL' and e.id = '00000000-0000-0000-0000-0000000000e1' then 1 else 0 end,
  0
from employees e
cross join lt
where e.company_id = '00000000-0000-0000-0000-00000000c001'
  and e.status = 'active'
  and lt.code in ('ANNUAL','SICK','COMP','UNPAID')
on conflict (employee_id, leave_type_id, year) do update set
  entitled_days = excluded.entitled_days,
  carried_over_days = excluded.carried_over_days,
  used_days = excluded.used_days,
  pending_days = excluded.pending_days,
  adjustment_days = excluded.adjustment_days,
  updated_at = now();

with lt as (
  select code, id
  from leave_types
  where company_id = '00000000-0000-0000-0000-00000000c001'
)
insert into leave_requests (
  id, company_id, employee_id, leave_type_id, starts_on, ends_on, half_day_start, half_day_end,
  total_days, reason, attachments, handover_to, status, decided_by, decided_at, decision_note
)
select
  seed.id,
  seed.company_id,
  seed.employee_id,
  lt.id,
  seed.starts_on,
  seed.ends_on,
  seed.half_day_start,
  seed.half_day_end,
  seed.total_days,
  seed.reason,
  seed.attachments,
  seed.handover_to,
  seed.status::leave_request_status,
  seed.decided_by,
  seed.decided_at,
  seed.decision_note
from (
  values
    ('00000000-0000-0000-0000-000000005501'::uuid,'00000000-0000-0000-0000-00000000c001'::uuid,'00000000-0000-0000-0000-0000000000e8'::uuid,'ANNUAL','2026-04-14'::date,'2026-04-15'::date,false,false,2.0,'Viec gia dinh','[]'::jsonb,'00000000-0000-0000-0000-0000000000e9'::uuid,'approved','00000000-0000-0000-0000-0000000000e4'::uuid,'2026-04-10T09:00:00Z'::timestamptz,'Approved'),
    ('00000000-0000-0000-0000-000000005502'::uuid,'00000000-0000-0000-0000-00000000c001'::uuid,'00000000-0000-0000-0000-0000000000ea'::uuid,'SICK','2026-04-08'::date,'2026-04-08'::date,false,false,1.0,'Sot cao','[]'::jsonb,null,'approved','00000000-0000-0000-0000-0000000000e5'::uuid,'2026-04-08T08:00:00Z'::timestamptz,'OK'),
    ('00000000-0000-0000-0000-000000005503'::uuid,'00000000-0000-0000-0000-00000000c001'::uuid,'00000000-0000-0000-0000-0000000000eb'::uuid,'UNPAID','2026-04-22'::date,'2026-04-22'::date,false,false,1.0,'Viec rieng','[]'::jsonb,null,'approved','00000000-0000-0000-0000-0000000000e5'::uuid,'2026-04-21T17:00:00Z'::timestamptz,'Approved'),
    ('00000000-0000-0000-0000-000000005504'::uuid,'00000000-0000-0000-0000-00000000c001'::uuid,'00000000-0000-0000-0000-0000000000e1'::uuid,'ANNUAL','2026-05-06'::date,'2026-05-06'::date,false,false,1.0,'Du lich','[]'::jsonb,'00000000-0000-0000-0000-0000000000e2'::uuid,'pending',null,null,null),
    ('00000000-0000-0000-0000-000000005505'::uuid,'00000000-0000-0000-0000-00000000c001'::uuid,'00000000-0000-0000-0000-0000000000e9'::uuid,'ANNUAL','2026-04-24'::date,'2026-04-24'::date,false,false,1.0,'Ve que','[]'::jsonb,null,'rejected','00000000-0000-0000-0000-0000000000e4'::uuid,'2026-04-22T11:00:00Z'::timestamptz,'Can giu KPI'),
    ('00000000-0000-0000-0000-000000005506'::uuid,'00000000-0000-0000-0000-00000000c001'::uuid,'00000000-0000-0000-0000-0000000000ec'::uuid,'COMP','2026-04-29'::date,'2026-04-29'::date,false,false,1.0,'Bu sau OT','[]'::jsonb,null,'cancelled',null,null,null)
) as seed(id, company_id, employee_id, leave_code, starts_on, ends_on, half_day_start, half_day_end, total_days, reason, attachments, handover_to, status, decided_by, decided_at, decision_note)
join lt on lt.code = seed.leave_code
on conflict (id) do update set
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  total_days = excluded.total_days,
  reason = excluded.reason,
  handover_to = excluded.handover_to,
  status = excluded.status,
  decided_by = excluded.decided_by,
  decided_at = excluded.decided_at,
  decision_note = excluded.decision_note;

insert into attendance_locations (id, company_id, name, address, latitude, longitude, radius_m, ip_whitelist, active) values
  ('00000000-0000-0000-0000-000000005401','00000000-0000-0000-0000-00000000c001','Van phong Ha Noi','Tang 7, Detech II, Cau Giay, Ha Noi',21.038211,105.782560,200,array['27.72.0.1'],true),
  ('00000000-0000-0000-0000-000000005402','00000000-0000-0000-0000-00000000c001','Chi nhanh TP.HCM','Bitexco, Quan 1, TP.HCM',10.771679,106.704423,150,array['14.169.0.1'],true)
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  radius_m = excluded.radius_m,
  ip_whitelist = excluded.ip_whitelist,
  active = excluded.active;

insert into attendance_shifts (id, company_id, code, name, start_time, end_time, break_minutes, late_grace_minutes, early_leave_grace_minutes, is_overnight, active) values
  ('00000000-0000-0000-0000-000000005411','00000000-0000-0000-0000-00000000c001','DAY','Ca hanh chinh','08:30','17:30',60,5,5,false,true),
  ('00000000-0000-0000-0000-000000005412','00000000-0000-0000-0000-00000000c001','FLEX','Ca linh hoat','09:00','18:00',60,15,15,false,true)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  break_minutes = excluded.break_minutes,
  late_grace_minutes = excluded.late_grace_minutes,
  early_leave_grace_minutes = excluded.early_leave_grace_minutes,
  is_overnight = excluded.is_overnight,
  active = excluded.active;

insert into attendance_devices (id, company_id, employee_id, label, source, fingerprint, user_agent, last_used_at, active) values
  ('00000000-0000-0000-0000-000000005421','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000e1','MacBook CEO','web','ceo-macbook','Chrome on macOS','2026-04-28T09:15:00Z',true),
  ('00000000-0000-0000-0000-000000005422','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000e2','HR Laptop','web','hr-windows','Chrome on Windows','2026-04-28T08:40:00Z',true),
  ('00000000-0000-0000-0000-000000005423','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000e8','Sales iPhone','mobile','sales-iphone','Safari on iOS','2026-04-28T08:35:00Z',true),
  ('00000000-0000-0000-0000-000000005424','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000ea','MKT Pixel','mobile','mkt-pixel','Chrome on Android','2026-04-28T09:05:00Z',true)
on conflict (id) do update set
  label = excluded.label,
  source = excluded.source,
  fingerprint = excluded.fingerprint,
  user_agent = excluded.user_agent,
  last_used_at = excluded.last_used_at,
  active = excluded.active;

insert into attendance_shift_assignments (company_id, employee_id, shift_id, effective_from, effective_to, weekdays)
select
  '00000000-0000-0000-0000-00000000c001',
  e.id,
  case when e.department_id in ('00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-00000000d002') then '00000000-0000-0000-0000-000000005412'::uuid else '00000000-0000-0000-0000-000000005411'::uuid end,
  '2026-01-01',
  null,
  array[1,2,3,4,5]::smallint[]
from employees e
where e.company_id = '00000000-0000-0000-0000-00000000c001'
  and e.status = 'active'
  and not exists (
    select 1
    from attendance_shift_assignments a
    where a.company_id = e.company_id
      and a.employee_id = e.id
      and a.effective_from = '2026-01-01'
  );

insert into overtime_requests (
  id, company_id, employee_id, starts_at, ends_at, hours, reason, status, decided_by, decided_at, decision_note
) values
  ('00000000-0000-0000-0000-000000005511','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000e8','2026-04-10T18:30:00+07','2026-04-10T21:00:00+07',2.5,'Follow up khach hang cuoi ngay','approved','00000000-0000-0000-0000-0000000000e4','2026-04-10T17:00:00+07','OK'),
  ('00000000-0000-0000-0000-000000005512','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000ea','2026-04-24T18:15:00+07','2026-04-24T21:15:00+07',3.0,'Chot content launch','approved','00000000-0000-0000-0000-0000000000e5','2026-04-24T16:30:00+07','Approved'),
  ('00000000-0000-0000-0000-000000005513','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000ec','2026-04-29T18:00:00+07','2026-04-29T20:00:00+07',2.0,'Xu ly ton dong cuoi thang','approved','00000000-0000-0000-0000-0000000000e6','2026-04-29T15:00:00+07','Approved'),
  ('00000000-0000-0000-0000-000000005514','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000e9','2026-04-17T18:30:00+07','2026-04-17T20:00:00+07',1.5,'Goi lai lead khach','pending',null,null,null)
on conflict (id) do update set
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  hours = excluded.hours,
  reason = excluded.reason,
  status = excluded.status,
  decided_by = excluded.decided_by,
  decided_at = excluded.decided_at,
  decision_note = excluded.decision_note;

with leave_days as (
  select
    lr.employee_id,
    gs::date as work_date
  from leave_requests lr
  cross join lateral generate_series(lr.starts_on, lr.ends_on, interval '1 day') gs
  where lr.company_id = '00000000-0000-0000-0000-00000000c001'
    and lr.status = 'approved'
    and lr.starts_on <= '2026-04-30'
    and lr.ends_on >= '2026-04-01'
),
holiday_days as (
  select holiday_date
  from holidays_vn
  where holiday_date between '2026-04-01' and '2026-04-30'
),
workdays as (
  select gs::date as work_date
  from generate_series('2026-04-01'::date, '2026-04-30'::date, interval '1 day') gs
  where extract(isodow from gs) <= 5
    and gs::date not in (select holiday_date from holiday_days)
),
emp as (
  select
    e.id as employee_id,
    e.company_id,
    e.department_id,
    row_number() over (order by e.id) as seq
  from employees e
  where e.company_id = '00000000-0000-0000-0000-00000000c001'
    and e.status = 'active'
),
seed as (
  select
    emp.company_id,
    emp.employee_id,
    wd.work_date,
    case when emp.department_id in ('00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-00000000d002')
      then '00000000-0000-0000-0000-000000005412'::uuid
      else '00000000-0000-0000-0000-000000005411'::uuid
    end as shift_id,
    case when emp.department_id = '00000000-0000-0000-0000-00000000d001'
      then '00000000-0000-0000-0000-000000005402'::uuid
      else '00000000-0000-0000-0000-000000005401'::uuid
    end as location_id,
    emp.seq,
    case
      when emp.department_id in ('00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-00000000d002')
        then time '09:00'
      else time '08:30'
    end as shift_start,
    case
      when emp.department_id in ('00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-00000000d002')
        then time '18:00'
      else time '17:30'
    end as shift_end
  from emp
  cross join workdays wd
  left join leave_days ld
    on ld.employee_id = emp.employee_id
   and ld.work_date = wd.work_date
  where ld.employee_id is null
)
insert into attendance_records (
  company_id, employee_id, work_date, shift_id, location_id, device_id,
  check_in_at, check_out_at, check_in_lat, check_in_lng, check_out_lat, check_out_lng,
  check_in_ip, check_out_ip, source, status, late_minutes, early_leave_minutes, worked_minutes, note
)
select
  s.company_id,
  s.employee_id,
  s.work_date,
  s.shift_id,
  s.location_id,
  case s.employee_id
    when '00000000-0000-0000-0000-0000000000e1' then '00000000-0000-0000-0000-000000005421'::uuid
    when '00000000-0000-0000-0000-0000000000e2' then '00000000-0000-0000-0000-000000005422'::uuid
    when '00000000-0000-0000-0000-0000000000e8' then '00000000-0000-0000-0000-000000005423'::uuid
    when '00000000-0000-0000-0000-0000000000ea' then '00000000-0000-0000-0000-000000005424'::uuid
    else null
  end,
  ((s.work_date::timestamp + s.shift_start) + make_interval(mins =>
    (
      case when (extract(day from s.work_date)::int + s.seq) % 11 = 0 then 8 + (s.seq % 4) * 3 else 0 end
    )::int
  )) at time zone 'Asia/Ho_Chi_Minh',
  ((s.work_date::timestamp + s.shift_end) - make_interval(mins =>
    (
      case when (extract(day from s.work_date)::int + s.seq) % 13 = 0 then 10 + (s.seq % 3) * 5 else 0 end
    )::int
  )) at time zone 'Asia/Ho_Chi_Minh',
  case when s.location_id = '00000000-0000-0000-0000-000000005401'::uuid then 21.038211 else 10.771679 end,
  case when s.location_id = '00000000-0000-0000-0000-000000005401'::uuid then 105.782560 else 106.704423 end,
  case when s.location_id = '00000000-0000-0000-0000-000000005401'::uuid then 21.038211 else 10.771679 end,
  case when s.location_id = '00000000-0000-0000-0000-000000005401'::uuid then 105.782560 else 106.704423 end,
  '203.113.10.10',
  '203.113.10.10',
  case when (extract(day from s.work_date)::int + s.seq) % 17 = 0 then 'mobile'::attendance_source else 'web'::attendance_source end,
  case
    when (extract(day from s.work_date)::int + s.seq) % 11 = 0 then 'late'::attendance_status
    when (extract(day from s.work_date)::int + s.seq) % 13 = 0 then 'early_leave'::attendance_status
    when (extract(day from s.work_date)::int + s.seq) % 17 = 0 then 'remote'::attendance_status
    else 'present'::attendance_status
  end,
  case when (extract(day from s.work_date)::int + s.seq) % 11 = 0 then 8 + (s.seq % 4) * 3 else 0 end,
  case when (extract(day from s.work_date)::int + s.seq) % 13 = 0 then 10 + (s.seq % 3) * 5 else 0 end,
  greatest(
    0,
    480
      - case when (extract(day from s.work_date)::int + s.seq) % 11 = 0 then 8 + (s.seq % 4) * 3 else 0 end
      - case when (extract(day from s.work_date)::int + s.seq) % 13 = 0 then 10 + (s.seq % 3) * 5 else 0 end
  ),
  case
    when (extract(day from s.work_date)::int + s.seq) % 11 = 0 then 'Late due to traffic'
    when (extract(day from s.work_date)::int + s.seq) % 13 = 0 then 'Left early for personal reason'
    when (extract(day from s.work_date)::int + s.seq) % 17 = 0 then 'WFH approved'
    else null
  end
from seed s
on conflict (employee_id, work_date) do update set
  shift_id = excluded.shift_id,
  location_id = excluded.location_id,
  device_id = excluded.device_id,
  check_in_at = excluded.check_in_at,
  check_out_at = excluded.check_out_at,
  check_in_lat = excluded.check_in_lat,
  check_in_lng = excluded.check_in_lng,
  check_out_lat = excluded.check_out_lat,
  check_out_lng = excluded.check_out_lng,
  check_in_ip = excluded.check_in_ip,
  check_out_ip = excluded.check_out_ip,
  source = excluded.source,
  status = excluded.status,
  late_minutes = excluded.late_minutes,
  early_leave_minutes = excluded.early_leave_minutes,
  worked_minutes = excluded.worked_minutes,
  note = excluded.note,
  updated_at = now();

insert into attendance_corrections (
  id, company_id, employee_id, record_id, work_date, requested_check_in, requested_check_out, reason, status,
  decided_by, decided_at, decision_note
)
values
  ('00000000-0000-0000-0000-000000005521','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000e9',null,'2026-04-11','2026-04-11T09:02:00+07','2026-04-11T18:03:00+07','Quen bat GPS','approved','00000000-0000-0000-0000-0000000000e4','2026-04-12T10:00:00+07','Approved'),
  ('00000000-0000-0000-0000-000000005522','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000ea',null,'2026-04-18','2026-04-18T09:20:00+07','2026-04-18T18:10:00+07','Mang chua pin','pending',null,null,null)
on conflict (id) do update set
  requested_check_in = excluded.requested_check_in,
  requested_check_out = excluded.requested_check_out,
  reason = excluded.reason,
  status = excluded.status,
  decided_by = excluded.decided_by,
  decided_at = excluded.decided_at,
  decision_note = excluded.decision_note;

insert into employment_contracts (
  company_id, employee_id, starts_at, ends_at, base_salary, allowances, document_url,
  code, contract_type, status, position_id, department_id, probation_ends_at, signed_at,
  notice_period_days, working_hours_per_week, currency, notes, updated_at
)
select
  e.company_id,
  e.id,
  case when e.id = '00000000-0000-0000-0000-0000000000ee' then '2025-11-18'::date else coalesce(e.join_date, '2024-01-01'::date) end,
  case
    when e.id = '00000000-0000-0000-0000-0000000000e1' then null
    when e.id = '00000000-0000-0000-0000-0000000000ed' then '2026-05-15'::date
    when e.id = '00000000-0000-0000-0000-0000000000ee' then '2026-05-31'::date
    else '2026-12-31'::date
  end,
  e.base_salary,
  jsonb_build_object('meal', 500000, 'phone', case when e.department_id in ('00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-00000000d002') then 300000 else 200000 end),
  format('contracts/%s/main.pdf', e.id),
  format('HD-%s', right(replace(e.id::text, '-', ''), 6)),
  case when e.id = '00000000-0000-0000-0000-0000000000ee' then 'probation'::contract_type when e.id = '00000000-0000-0000-0000-0000000000e1' then 'indefinite'::contract_type else 'fixed_term'::contract_type end,
  case when e.id = '00000000-0000-0000-0000-0000000000ed' then 'expiring_soon'::contract_status else 'active'::contract_status end,
  e.position_id,
  e.department_id,
  case when e.id = '00000000-0000-0000-0000-0000000000ee' then '2026-01-18'::date else null end,
  coalesce(e.join_date, '2024-01-01'::date),
  30,
  40,
  'VND',
  'Seeded full demo contract',
  now()
from employees e
where e.company_id = '00000000-0000-0000-0000-00000000c001'
  and not exists (
    select 1
    from employment_contracts c
    where c.company_id = e.company_id
      and c.employee_id = e.id
  );

insert into contract_amendments (
  id, company_id, contract_id, amendment_no, effective_from, changes, reason, document_url, signed_at
)
select
  '00000000-0000-0000-0000-000000005611',
  c.company_id,
  c.id,
  1,
  '2026-03-01',
  '{"salary":22000000,"title":"Senior Sales"}'::jsonb,
  'Promotion after Q1',
  'contracts/amendments/e8-amendment-1.pdf',
  '2026-02-28'
from employment_contracts c
where c.employee_id = '00000000-0000-0000-0000-0000000000e8'
  and not exists (select 1 from contract_amendments where id = '00000000-0000-0000-0000-000000005611');

insert into contract_amendments (
  id, company_id, contract_id, amendment_no, effective_from, changes, reason, document_url, signed_at
)
select
  '00000000-0000-0000-0000-000000005612',
  c.company_id,
  c.id,
  1,
  '2026-04-01',
  '{"allowances":{"meal":700000,"phone":400000}}'::jsonb,
  'Allowance update',
  'contracts/amendments/e10-amendment-1.pdf',
  '2026-03-30'
from employment_contracts c
where c.employee_id = '00000000-0000-0000-0000-0000000000ea'
  and not exists (select 1 from contract_amendments where id = '00000000-0000-0000-0000-000000005612');

insert into employee_documents (
  id, company_id, employee_id, doc_type, label, storage_path, mime_type, size_bytes, expires_on, uploaded_by
) values
  ('00000000-0000-0000-0000-000000005621','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000e8','cccd_front','CCCD front','documents/e8/cccd-front.jpg','image/jpeg',254331,null,'00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-000000005622','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000e8','contract_pdf','Contract PDF','contracts/e8/main.pdf','application/pdf',482233,null,'00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-000000005623','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000ee','degree','University degree','documents/e14/degree.pdf','application/pdf',322111,null,'00000000-0000-0000-0000-0000000000e2'),
  ('00000000-0000-0000-0000-000000005624','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000ed','bhxh','BHXH card','documents/e13/bhxh.pdf','application/pdf',201889,'2027-12-31','00000000-0000-0000-0000-0000000000e2')
on conflict (id) do nothing;

insert into employee_dependents (
  id, company_id, employee_id, full_name, relationship, date_of_birth, national_id, tax_code, starts_on, ends_on, notes
) values
  ('00000000-0000-0000-0000-000000005631','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000e1','Nguyen Bao An','con','2019-06-01',null,'DEP001','2024-01-01',null,'Dependent for PIT reduction'),
  ('00000000-0000-0000-0000-000000005632','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000e3','Tran Thi Mai','me','1966-09-12',null,'DEP002','2025-01-01',null,'Dependent parent')
on conflict (id) do nothing;

insert into onboarding_templates (id, company_id, name, kind, description, active) values
  ('00000000-0000-0000-0000-000000005701','00000000-0000-0000-0000-00000000c001','New hire standard','onboarding','Checklist for new employees',true),
  ('00000000-0000-0000-0000-000000005702','00000000-0000-0000-0000-00000000c001','Offboarding standard','offboarding','Checklist for employee exit',true)
on conflict (id) do update set
  name = excluded.name,
  kind = excluded.kind,
  description = excluded.description,
  active = excluded.active;

insert into onboarding_template_tasks (id, company_id, template_id, sort_order, title, description, default_owner_role, due_offset_days, required) values
  ('00000000-0000-0000-0000-000000005711','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-000000005701',1,'Create company email','IT creates mailbox','hr_admin',-2,true),
  ('00000000-0000-0000-0000-000000005712','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-000000005701',2,'Prepare laptop','Assign device and software','hr_admin',-1,true),
  ('00000000-0000-0000-0000-000000005713','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-000000005701',3,'Team intro','Manager onboarding intro','dept_head',0,true),
  ('00000000-0000-0000-0000-000000005714','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-000000005702',1,'Collect assets','Return laptop, card, docs','hr_admin',0,true),
  ('00000000-0000-0000-0000-000000005715','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-000000005702',2,'Exit interview','Closing interview with HR','hr_admin',1,false)
on conflict (id) do update set
  sort_order = excluded.sort_order,
  title = excluded.title,
  description = excluded.description,
  default_owner_role = excluded.default_owner_role,
  due_offset_days = excluded.due_offset_days,
  required = excluded.required;

insert into onboarding_runs (id, company_id, template_id, employee_id, kind, status, started_on, target_done_on, completed_at, notes) values
  ('00000000-0000-0000-0000-000000005721','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-000000005701','00000000-0000-0000-0000-0000000000ee','onboarding','in_progress','2025-11-18','2025-11-25',null,'Seeded onboarding run'),
  ('00000000-0000-0000-0000-000000005722','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-000000005701','00000000-0000-0000-0000-0000000000e8','onboarding','completed','2024-02-05','2024-02-12','2024-02-12T10:00:00Z','Completed onboarding'),
  ('00000000-0000-0000-0000-000000005723','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-000000005702','00000000-0000-0000-0000-0000000000ed','offboarding','not_started','2026-05-20','2026-05-25',null,'Prepare for contract end')
on conflict (id) do update set
  template_id = excluded.template_id,
  employee_id = excluded.employee_id,
  kind = excluded.kind,
  status = excluded.status,
  started_on = excluded.started_on,
  target_done_on = excluded.target_done_on,
  completed_at = excluded.completed_at,
  notes = excluded.notes;

insert into onboarding_run_tasks (
  company_id, run_id, template_task_id, sort_order, title, description, owner_employee_id, due_on, status, completed_at, completed_by, notes
)
select
  r.company_id,
  r.id,
  tt.id,
  tt.sort_order,
  tt.title,
  tt.description,
  case
    when tt.default_owner_role = 'dept_head' then
      case r.employee_id
        when '00000000-0000-0000-0000-0000000000ee' then '00000000-0000-0000-0000-0000000000e2'::uuid
        else '00000000-0000-0000-0000-0000000000e4'::uuid
      end
    else '00000000-0000-0000-0000-0000000000e2'::uuid
  end,
  (r.started_on + tt.due_offset_days),
  case
    when r.id = '00000000-0000-0000-0000-000000005722' then 'completed'::onboarding_task_status
    when tt.sort_order = 1 then 'completed'::onboarding_task_status
    else 'pending'::onboarding_task_status
  end,
  case
    when r.id = '00000000-0000-0000-0000-000000005722' then (r.started_on + tt.due_offset_days)::timestamp at time zone 'Asia/Ho_Chi_Minh'
    when tt.sort_order = 1 then (r.started_on + tt.due_offset_days)::timestamp at time zone 'Asia/Ho_Chi_Minh'
    else null
  end,
  case
    when r.id = '00000000-0000-0000-0000-000000005722' or tt.sort_order = 1 then '00000000-0000-0000-0000-0000000000e2'::uuid
    else null
  end,
  'Seeded task'
from onboarding_runs r
join onboarding_template_tasks tt on tt.template_id = r.template_id
where not exists (
  select 1
  from onboarding_run_tasks t
  where t.run_id = r.id
    and t.template_task_id = tt.id
);

insert into notifications (id, company_id, auth_user_id, title, body, link, read_at, created_at) values
  ('00000000-0000-0000-0000-000000005501','00000000-0000-0000-0000-00000000c001','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','KPI Sales close rate can chu y','Close rate hien 91% target','/dashboard',null,'2026-04-22T08:30:00Z'),
  ('00000000-0000-0000-0000-000000005502','00000000-0000-0000-0000-00000000c001','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Don nghi phep moi','Nguyen Hai H vua gui don nghi phep','/leave/approvals',null,'2026-04-10T09:10:00Z'),
  ('00000000-0000-0000-0000-000000005503','00000000-0000-0000-0000-00000000c001','18181818-1818-1818-1818-181818181818','Task moi duoc giao','Chot 10 don sales tuan nay','/operations',null,'2026-04-14T08:00:00Z'),
  ('00000000-0000-0000-0000-000000005504','00000000-0000-0000-0000-00000000c001','eeeeeeee-1111-1111-1111-111111111111','OT duoc phe duyet','Content launch duoc OT 3h','/attendance/timesheets','2026-04-24T16:35:00Z','2026-04-24T16:35:00Z')
on conflict (id) do nothing;

insert into approvals (id, company_id, kind, title, payload, status, requested_by, created_at) values
  ('00000000-0000-0000-0000-000000005a01','00000000-0000-0000-0000-00000000c001','payroll_adjustment','Dieu chinh bonus thang 4 - Nguyen Hai H','{"amount":5000000,"reason":"Vuot KPI 30%"}'::jsonb,'pending','00000000-0000-0000-0000-0000000000e2','2026-04-22T10:00:00Z'),
  ('00000000-0000-0000-0000-000000005a02','00000000-0000-0000-0000-00000000c001','job_requisition','Tuyen 2 Senior Sales','{"headcount":2}'::jsonb,'pending','00000000-0000-0000-0000-0000000000e4','2026-04-21T09:00:00Z'),
  ('00000000-0000-0000-0000-000000005a03','00000000-0000-0000-0000-00000000c001','kpi_change','Doi target Qualified leads thang 5','{"kpi":"MKT.LEADS","new_target":600}'::jsonb,'pending','00000000-0000-0000-0000-0000000000e5','2026-04-23T11:00:00Z'),
  ('00000000-0000-0000-0000-000000005a04','00000000-0000-0000-0000-00000000c001','project_budget','Tang budget du an TikTok','{"project":"P01","new_budget":150000000}'::jsonb,'approved','00000000-0000-0000-0000-0000000000e5','2026-04-10T08:00:00Z')
on conflict (id) do nothing;

insert into alerts (id, company_id, severity, title, detail, resolved_at, created_at) values
  ('00000000-0000-0000-0000-000000005b01','00000000-0000-0000-0000-00000000c001','danger','KPI Sales close rate o muc do','{"kpi":"SAL.CLOSE","actual":54,"target":65}'::jsonb,null,'2026-04-22T08:30:00Z'),
  ('00000000-0000-0000-0000-000000005b02','00000000-0000-0000-0000-00000000c001','warning','Chi phi Marketing vuot ngan sach 8%','{"dept":"MKT","over_pct":8}'::jsonb,null,'2026-04-21T10:15:00Z'),
  ('00000000-0000-0000-0000-000000005b03','00000000-0000-0000-0000-00000000c001','critical','3 task urgent tre deadline','{"count":3}'::jsonb,null,'2026-04-23T07:00:00Z')
on conflict (id) do nothing;

insert into audit_logs (id, company_id, actor, action, entity, entity_id, before, after, created_at) values
  ('00000000-0000-0000-0000-000000005c01','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000e1','attendance.timesheet.regenerate','attendance_monthly_periods','00000000-0000-0000-0000-000000005101',null,'{"month":"2026-04","status":"draft"}'::jsonb,'2026-04-28T09:00:00Z'),
  ('00000000-0000-0000-0000-000000005c02','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000e2','leave.request.approve','leave_requests','00000000-0000-0000-0000-000000005501',null,'{"status":"approved"}'::jsonb,'2026-04-10T09:00:00Z'),
  ('00000000-0000-0000-0000-000000005c03','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000e4','task.update_status','tasks','00000000-0000-0000-0000-000000005301','{"status":"todo"}'::jsonb,'{"status":"in_progress"}'::jsonb,'2026-04-14T08:10:00Z'),
  ('00000000-0000-0000-0000-000000005c04','00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000e3','payroll.override','payroll_entries',null,'{"bonus_total":3000000}'::jsonb,'{"bonus_total":5000000}'::jsonb,'2026-04-22T14:00:00Z')
on conflict (id) do nothing;
