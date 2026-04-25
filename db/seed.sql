-- =============================================================================
-- BIZOS seed data — BIZOS Demo company
-- Run AFTER schema.sql and policies.sql.
-- Assumes you've created auth users manually in Supabase for:
--   ceo@bizos.demo, hr@bizos.demo, finance@bizos.demo, sales@bizos.demo
-- then update the auth_user_id values below to match.
-- =============================================================================

-- 1. Company
insert into companies (id, name, code)
values ('00000000-0000-0000-0000-00000000c001', 'BIZOS Demo', 'BIZOS')
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

-- 3. Positions
insert into positions (id, company_id, name, level, base_salary_min, base_salary_max) values
  ('00000000-0000-0000-0000-0000000000p1','00000000-0000-0000-0000-00000000c001','CEO','C-level',60000000,120000000),
  ('00000000-0000-0000-0000-0000000000p2','00000000-0000-0000-0000-00000000c001','Head of Department','Director',35000000,60000000),
  ('00000000-0000-0000-0000-0000000000p3','00000000-0000-0000-0000-00000000c001','Team Lead','Manager',20000000,35000000),
  ('00000000-0000-0000-0000-0000000000p4','00000000-0000-0000-0000-00000000c001','Senior Specialist','Senior',15000000,25000000),
  ('00000000-0000-0000-0000-0000000000p5','00000000-0000-0000-0000-00000000c001','Specialist','Mid',10000000,16000000),
  ('00000000-0000-0000-0000-0000000000p6','00000000-0000-0000-0000-00000000c001','Junior','Junior',7000000,11000000)
on conflict do nothing;

-- 4. Sample employees (24 people)
insert into employees (id, company_id, full_name, email, department_id, position_id, base_salary, status) values
  ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-00000000c001','Nguyễn Văn A','ceo@bizos.demo',null,'00000000-0000-0000-0000-0000000000p1',80000000,'active'),
  ('00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-00000000c001','Trần Thị B','hr@bizos.demo','00000000-0000-0000-0000-00000000d005','00000000-0000-0000-0000-0000000000p2',45000000,'active'),
  ('00000000-0000-0000-0000-0000000000e3','00000000-0000-0000-0000-00000000c001','Lê Văn C','cfo@bizos.demo','00000000-0000-0000-0000-00000000d006','00000000-0000-0000-0000-0000000000p2',50000000,'active'),
  ('00000000-0000-0000-0000-0000000000e4','00000000-0000-0000-0000-00000000c001','Phạm Thu D','sales.head@bizos.demo','00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-0000000000p2',48000000,'active'),
  ('00000000-0000-0000-0000-0000000000e5','00000000-0000-0000-0000-00000000c001','Hoàng Minh E','mkt.head@bizos.demo','00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-0000000000p2',45000000,'active'),
  ('00000000-0000-0000-0000-0000000000e6','00000000-0000-0000-0000-00000000c001','Đỗ Quỳnh F','ops.head@bizos.demo','00000000-0000-0000-0000-00000000d003','00000000-0000-0000-0000-0000000000p2',42000000,'active'),
  ('00000000-0000-0000-0000-0000000000e7','00000000-0000-0000-0000-00000000c001','Vũ Thanh G','cs.head@bizos.demo','00000000-0000-0000-0000-00000000d004','00000000-0000-0000-0000-0000000000p2',38000000,'active')
on conflict do nothing;

-- Mark department heads
update departments set head_employee_id='00000000-0000-0000-0000-0000000000e4' where id='00000000-0000-0000-0000-00000000d001';
update departments set head_employee_id='00000000-0000-0000-0000-0000000000e5' where id='00000000-0000-0000-0000-00000000d002';
update departments set head_employee_id='00000000-0000-0000-0000-0000000000e6' where id='00000000-0000-0000-0000-00000000d003';
update departments set head_employee_id='00000000-0000-0000-0000-0000000000e7' where id='00000000-0000-0000-0000-00000000d004';
update departments set head_employee_id='00000000-0000-0000-0000-0000000000e2' where id='00000000-0000-0000-0000-00000000d005';
update departments set head_employee_id='00000000-0000-0000-0000-0000000000e3' where id='00000000-0000-0000-0000-00000000d006';

-- 5. Company KPI cascade (3 tầng mẫu)
insert into kpis (id, company_id, code, name, level, weight, target_frequency, unit) values
  ('00000000-0000-0000-0000-0000000000k1','00000000-0000-0000-0000-00000000c001','REV','Doanh thu tháng','company',1,'monthly','VND'),
  ('00000000-0000-0000-0000-0000000000k2','00000000-0000-0000-0000-00000000c001','GP','Gross Profit','company',1,'monthly','VND'),
  ('00000000-0000-0000-0000-0000000000k3','00000000-0000-0000-0000-00000000c001','NP','Net Profit','company',1,'monthly','VND'),
  ('00000000-0000-0000-0000-0000000000k4','00000000-0000-0000-0000-00000000c001','RET','Retention','company',1,'monthly','%')
on conflict do nothing;

-- Dept KPIs
insert into kpis (id, company_id, code, name, level, owner_department_id, parent_kpi_id, weight, target_frequency, unit) values
  ('00000000-0000-0000-0000-0000000000k10','00000000-0000-0000-0000-00000000c001','SAL.CLOSE','Sales close rate','department','00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-0000000000k1',0.6,'monthly','%'),
  ('00000000-0000-0000-0000-0000000000k11','00000000-0000-0000-0000-00000000c001','SAL.AOV','AOV','department','00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-0000000000k1',0.4,'monthly','VND'),
  ('00000000-0000-0000-0000-0000000000k20','00000000-0000-0000-0000-00000000c001','MKT.LEADS','Qualified leads','department','00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-0000000000k1',0.5,'monthly','lead'),
  ('00000000-0000-0000-0000-0000000000k21','00000000-0000-0000-0000-00000000c001','MKT.CAC','CAC','department','00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-0000000000k2',0.5,'monthly','VND'),
  ('00000000-0000-0000-0000-0000000000k30','00000000-0000-0000-0000-00000000c001','OPS.SLA','Order SLA','department','00000000-0000-0000-0000-00000000d003','00000000-0000-0000-0000-0000000000k2',0.7,'monthly','%'),
  ('00000000-0000-0000-0000-0000000000k40','00000000-0000-0000-0000-00000000c001','CS.RET','Retention','department','00000000-0000-0000-0000-00000000d004','00000000-0000-0000-0000-0000000000k4',1,'monthly','%')
on conflict do nothing;

-- 6. KPI formulas (JSONB AST)
insert into kpi_formulas (kpi_id, formula_type, definition) values
  ('00000000-0000-0000-0000-0000000000k1','composite',
    '{"op":"sum","args":[{"ref":"SAL.CLOSE"},{"ref":"SAL.AOV"},{"ref":"MKT.LEADS"}]}'::jsonb),
  ('00000000-0000-0000-0000-0000000000k2','ratio',
    '{"op":"sub","args":[{"ref":"REV"},{"ref":"COGS"}]}'::jsonb),
  ('00000000-0000-0000-0000-0000000000k3','ratio',
    '{"op":"sub","args":[{"ref":"GP"},{"ref":"OPEX"}]}'::jsonb)
on conflict do nothing;

-- 7. KPI targets and actuals for 2026-04
insert into kpi_targets (kpi_id, period, target_value) values
  ('00000000-0000-0000-0000-0000000000k1','2026-04',5000000000),
  ('00000000-0000-0000-0000-0000000000k2','2026-04',2000000000),
  ('00000000-0000-0000-0000-0000000000k3','2026-04',800000000)
on conflict do nothing;

insert into kpi_actuals (kpi_id, period, actual_value, completion_rate, status) values
  ('00000000-0000-0000-0000-0000000000k1','2026-04',5200000000,1.04,'green'),
  ('00000000-0000-0000-0000-0000000000k2','2026-04',1900000000,0.95,'yellow'),
  ('00000000-0000-0000-0000-0000000000k3','2026-04',720000000,0.90,'yellow')
on conflict do nothing;

-- 8. Sample tasks
insert into tasks (company_id, title, assignee_id, department_id, linked_kpi_id, priority, task_type, status, due_date) values
  ('00000000-0000-0000-0000-00000000c001','Chốt 10 đơn sales tuần này','00000000-0000-0000-0000-0000000000e4','00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-0000000000k10','high','growth','in_progress','2026-04-30'),
  ('00000000-0000-0000-0000-00000000c001','Chạy campaign TikTok mới','00000000-0000-0000-0000-0000000000e5','00000000-0000-0000-0000-00000000d002','00000000-0000-0000-0000-0000000000k20','normal','growth','todo','2026-05-05'),
  ('00000000-0000-0000-0000-00000000c001','Review SLA vận hành tháng','00000000-0000-0000-0000-0000000000e6','00000000-0000-0000-0000-00000000d003','00000000-0000-0000-0000-0000000000k30','normal','maintenance','review','2026-04-28')
on conflict do nothing;

-- 9. Payroll period + a few entries
insert into payroll_periods (id, company_id, period, status) values
  ('00000000-0000-0000-0000-0000000000pr1','00000000-0000-0000-0000-00000000c001','2026-04','draft')
on conflict do nothing;

insert into payroll_entries (company_id, payroll_period_id, employee_id, base_salary, bonus_total, gross_pay, net_pay, company_cost) values
  ('00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000pr1','00000000-0000-0000-0000-0000000000e1',80000000,20000000,100000000,85000000,115000000),
  ('00000000-0000-0000-0000-00000000c001','00000000-0000-0000-0000-0000000000pr1','00000000-0000-0000-0000-0000000000e4',48000000,12000000,60000000,51000000,70000000)
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
-- Post-seed notes
-- =============================================================================
-- 1. Create Supabase auth users (Dashboard → Authentication → Add user) for:
--    ceo@bizos.demo / hr@bizos.demo / cfo@bizos.demo / sales.head@bizos.demo
-- 2. For each, capture their auth.users.id and update employees.auth_user_id,
--    then insert matching user_roles rows, e.g.:
--    insert into user_roles (auth_user_id, company_id, role) values
--      ('<ceo-auth-id>', '00000000-0000-0000-0000-00000000c001', 'ceo'),
--      ('<hr-auth-id>',  '00000000-0000-0000-0000-00000000c001', 'hr_admin'),
--      ('<cfo-auth-id>', '00000000-0000-0000-0000-00000000c001', 'cfo');
