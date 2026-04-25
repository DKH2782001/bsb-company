// Fallback demo dataset khi chưa kết nối Supabase (dev/UI preview).
// Mirror lại seed.sql để trang vẫn render đẹp.
import type {
  Company,
  Department,
  Employee,
  Kpi,
  KpiActual,
  KpiTarget,
  Task,
  PayrollEntry,
  Project,
  AccountingEntry,
  Alert,
  Approval,
  Objective,
  KeyResult,
  JobRequisition,
  SopDocument,
  AuditLog,
} from "@/types/domain";

export const DEMO_COMPANY_ID = "00000000-0000-0000-0000-00000000c001";

export const demoCompany: Company = {
  id: DEMO_COMPANY_ID,
  name: "BIZOS Demo",
  code: "BIZOS",
  currency: "VND",
  timezone: "Asia/Ho_Chi_Minh",
  settings: { brand: "BIZOS" },
};

export const demoDepartments: Department[] = [
  { id: "d001", company_id: DEMO_COMPANY_ID, name: "Sales", code: "SAL", head_employee_id: "e4", budget_monthly: 500_000_000, scope: "Chốt đơn, mở rộng khách hàng" },
  { id: "d002", company_id: DEMO_COMPANY_ID, name: "Marketing", code: "MKT", head_employee_id: "e5", budget_monthly: 400_000_000, scope: "Lead generation, brand" },
  { id: "d003", company_id: DEMO_COMPANY_ID, name: "Operations", code: "OPS", head_employee_id: "e6", budget_monthly: 300_000_000, scope: "Vận hành, SLA giao đơn" },
  { id: "d004", company_id: DEMO_COMPANY_ID, name: "Customer Success", code: "CS", head_employee_id: "e7", budget_monthly: 200_000_000, scope: "Retention, CSAT" },
  { id: "d005", company_id: DEMO_COMPANY_ID, name: "HR & Admin", code: "HR", head_employee_id: "e2", budget_monthly: 150_000_000, scope: "Tuyển dụng, vận hành nội bộ" },
  { id: "d006", company_id: DEMO_COMPANY_ID, name: "Finance", code: "FIN", head_employee_id: "e3", budget_monthly: 150_000_000, scope: "Tài chính, kế toán" },
];

function mkEmp(
  id: string,
  name: string,
  email: string,
  dept: string | null,
  position: string,
  salary: number,
  manager: string | null = "e1",
): Employee {
  return {
    id,
    company_id: DEMO_COMPANY_ID,
    auth_user_id: null,
    code: id.toUpperCase(),
    full_name: name,
    email,
    phone: null,
    avatar_url: null,
    department_id: dept,
    team_id: null,
    position_id: position,
    manager_id: manager,
    join_date: "2024-01-01",
    status: "active",
    base_salary: salary,
    employment_type: "fulltime",
  };
}

export const demoEmployees: Employee[] = [
  mkEmp("e1", "Nguyễn Văn A", "ceo@bizos.demo", null, "CEO", 80_000_000, null),
  mkEmp("e2", "Trần Thị B", "hr@bizos.demo", "d005", "Head of HR", 45_000_000),
  mkEmp("e3", "Lê Văn C", "cfo@bizos.demo", "d006", "CFO", 50_000_000),
  mkEmp("e4", "Phạm Thu D", "sales.head@bizos.demo", "d001", "Head of Sales", 48_000_000),
  mkEmp("e5", "Hoàng Minh E", "mkt.head@bizos.demo", "d002", "Head of Marketing", 45_000_000),
  mkEmp("e6", "Đỗ Quỳnh F", "ops.head@bizos.demo", "d003", "Head of Operations", 42_000_000),
  mkEmp("e7", "Vũ Thanh G", "cs.head@bizos.demo", "d004", "Head of CS", 38_000_000),
  mkEmp("e8", "Nguyễn Hải H", "a01@bizos.demo", "d001", "Senior Sales", 20_000_000, "e4"),
  mkEmp("e9", "Trần Nam I", "a02@bizos.demo", "d001", "Sales Specialist", 14_000_000, "e4"),
  mkEmp("e10", "Lý Hoa K", "a03@bizos.demo", "d002", "Content Lead", 18_000_000, "e5"),
  mkEmp("e11", "Phạm Tú L", "a04@bizos.demo", "d002", "Performance Ads", 16_000_000, "e5"),
  mkEmp("e12", "Nguyễn Lan M", "a05@bizos.demo", "d003", "Ops Specialist", 13_000_000, "e6"),
  mkEmp("e13", "Trần Sơn N", "a06@bizos.demo", "d004", "CS Specialist", 12_000_000, "e7"),
  mkEmp("e14", "Đinh Hà O", "a07@bizos.demo", "d005", "HR Specialist", 13_000_000, "e2"),
];

export const demoKpis: Kpi[] = [
  { id: "k1", company_id: DEMO_COMPANY_ID, code: "REV", name: "Doanh thu tháng", description: "Tổng doanh thu từ mọi nguồn", level: "company", owner_employee_id: null, owner_department_id: null, owner_team_id: null, unit: "VND", weight: 1, parent_kpi_id: null, data_source: "accounting", active: true, target_frequency: "monthly" },
  { id: "k2", company_id: DEMO_COMPANY_ID, code: "GP", name: "Gross Profit", description: "Doanh thu - COGS", level: "company", owner_employee_id: null, owner_department_id: null, owner_team_id: null, unit: "VND", weight: 1, parent_kpi_id: null, data_source: "accounting", active: true, target_frequency: "monthly" },
  { id: "k3", company_id: DEMO_COMPANY_ID, code: "NP", name: "Net Profit", description: "GP - OPEX - Tax", level: "company", owner_employee_id: null, owner_department_id: null, owner_team_id: null, unit: "VND", weight: 1, parent_kpi_id: null, data_source: "accounting", active: true, target_frequency: "monthly" },
  { id: "k4", company_id: DEMO_COMPANY_ID, code: "RET", name: "Retention", description: "Tỷ lệ khách giữ chân", level: "company", owner_employee_id: null, owner_department_id: null, owner_team_id: null, unit: "%", weight: 1, parent_kpi_id: null, data_source: "crm", active: true, target_frequency: "monthly" },

  { id: "k10", company_id: DEMO_COMPANY_ID, code: "SAL.CLOSE", name: "Sales close rate", description: "% cơ hội chốt đơn", level: "department", owner_employee_id: null, owner_department_id: "d001", owner_team_id: null, unit: "%", weight: 0.6, parent_kpi_id: "k1", data_source: "crm", active: true, target_frequency: "monthly" },
  { id: "k11", company_id: DEMO_COMPANY_ID, code: "SAL.AOV", name: "AOV", description: "Doanh thu trung bình/đơn", level: "department", owner_employee_id: null, owner_department_id: "d001", owner_team_id: null, unit: "VND", weight: 0.4, parent_kpi_id: "k1", data_source: "crm", active: true, target_frequency: "monthly" },
  { id: "k20", company_id: DEMO_COMPANY_ID, code: "MKT.LEADS", name: "Qualified leads", description: "MQL đủ chất lượng", level: "department", owner_employee_id: null, owner_department_id: "d002", owner_team_id: null, unit: "lead", weight: 0.5, parent_kpi_id: "k1", data_source: "crm", active: true, target_frequency: "monthly" },
  { id: "k21", company_id: DEMO_COMPANY_ID, code: "MKT.CAC", name: "CAC", description: "Chi phí thu hút khách", level: "department", owner_employee_id: null, owner_department_id: "d002", owner_team_id: null, unit: "VND", weight: 0.5, parent_kpi_id: "k2", data_source: "accounting", active: true, target_frequency: "monthly" },
  { id: "k30", company_id: DEMO_COMPANY_ID, code: "OPS.SLA", name: "Order SLA", description: "% đơn đúng SLA", level: "department", owner_employee_id: null, owner_department_id: "d003", owner_team_id: null, unit: "%", weight: 0.7, parent_kpi_id: "k2", data_source: "ops", active: true, target_frequency: "monthly" },
  { id: "k40", company_id: DEMO_COMPANY_ID, code: "CS.RET", name: "CS Retention", description: "% khách quay lại", level: "department", owner_employee_id: null, owner_department_id: "d004", owner_team_id: null, unit: "%", weight: 1, parent_kpi_id: "k4", data_source: "crm", active: true, target_frequency: "monthly" },

  { id: "k101", company_id: DEMO_COMPANY_ID, code: "E8.CLOSE", name: "Sales close / Nguyễn Hải H", description: "KPI cá nhân", level: "employee", owner_employee_id: "e8", owner_department_id: "d001", owner_team_id: null, unit: "đơn", weight: 0.5, parent_kpi_id: "k10", data_source: "crm", active: true, target_frequency: "monthly" },
  { id: "k102", company_id: DEMO_COMPANY_ID, code: "E9.CLOSE", name: "Sales close / Trần Nam I", description: "KPI cá nhân", level: "employee", owner_employee_id: "e9", owner_department_id: "d001", owner_team_id: null, unit: "đơn", weight: 0.5, parent_kpi_id: "k10", data_source: "crm", active: true, target_frequency: "monthly" },
  { id: "k201", company_id: DEMO_COMPANY_ID, code: "E10.CONTENT", name: "Content output", description: "Số bài đăng chất lượng", level: "employee", owner_employee_id: "e10", owner_department_id: "d002", owner_team_id: null, unit: "bài", weight: 0.6, parent_kpi_id: "k20", data_source: "social", active: true, target_frequency: "monthly" },
  { id: "k202", company_id: DEMO_COMPANY_ID, code: "E11.CPL", name: "CPL Ads", description: "Chi phí mỗi lead", level: "employee", owner_employee_id: "e11", owner_department_id: "d002", owner_team_id: null, unit: "VND", weight: 0.4, parent_kpi_id: "k21", data_source: "ads", active: true, target_frequency: "monthly" },
];

const p = "2026-04";
export const demoKpiTargets: KpiTarget[] = [
  { kpi_id: "k1", period: p, target_value: 5_000_000_000 },
  { kpi_id: "k2", period: p, target_value: 2_000_000_000 },
  { kpi_id: "k3", period: p, target_value: 800_000_000 },
  { kpi_id: "k4", period: p, target_value: 70 },
  { kpi_id: "k10", period: p, target_value: 35 },
  { kpi_id: "k11", period: p, target_value: 12_000_000 },
  { kpi_id: "k20", period: p, target_value: 500 },
  { kpi_id: "k21", period: p, target_value: 450_000 },
  { kpi_id: "k30", period: p, target_value: 95 },
  { kpi_id: "k40", period: p, target_value: 68 },
  { kpi_id: "k101", period: p, target_value: 25 },
  { kpi_id: "k102", period: p, target_value: 25 },
  { kpi_id: "k201", period: p, target_value: 60 },
  { kpi_id: "k202", period: p, target_value: 400_000 },
];

export const demoKpiActuals: KpiActual[] = [
  { kpi_id: "k1", period: p, actual_value: 5_200_000_000, completion_rate: 1.04, status: "green" },
  { kpi_id: "k2", period: p, actual_value: 1_900_000_000, completion_rate: 0.95, status: "yellow" },
  { kpi_id: "k3", period: p, actual_value: 720_000_000, completion_rate: 0.9, status: "yellow" },
  { kpi_id: "k4", period: p, actual_value: 71, completion_rate: 1.01, status: "green" },
  { kpi_id: "k10", period: p, actual_value: 32, completion_rate: 0.91, status: "yellow" },
  { kpi_id: "k11", period: p, actual_value: 13_200_000, completion_rate: 1.1, status: "green" },
  { kpi_id: "k20", period: p, actual_value: 540, completion_rate: 1.08, status: "green" },
  { kpi_id: "k21", period: p, actual_value: 478_000, completion_rate: 0.94, status: "yellow" },
  { kpi_id: "k30", period: p, actual_value: 88, completion_rate: 0.93, status: "yellow" },
  { kpi_id: "k40", period: p, actual_value: 66, completion_rate: 0.97, status: "yellow" },
  { kpi_id: "k101", period: p, actual_value: 27, completion_rate: 1.08, status: "green" },
  { kpi_id: "k102", period: p, actual_value: 18, completion_rate: 0.72, status: "red" },
  { kpi_id: "k201", period: p, actual_value: 62, completion_rate: 1.03, status: "green" },
  { kpi_id: "k202", period: p, actual_value: 420_000, completion_rate: 0.95, status: "yellow" },
];

function mkTask(
  id: string,
  title: string,
  assignee: string,
  dept: string,
  kpi: string | null,
  status: Task["status"],
  priority: Task["priority"] = "normal",
  taskType: Task["task_type"] = "growth",
  due = "2026-04-30",
): Task {
  return {
    id,
    company_id: DEMO_COMPANY_ID,
    title,
    description: null,
    assignee_id: assignee,
    reviewer_id: null,
    department_id: dept,
    project_id: null,
    linked_kpi_id: kpi,
    priority,
    task_type: taskType,
    status,
    due_date: due,
    estimated_hours: 4,
    actual_hours: null,
  };
}

export const demoTasks: Task[] = [
  mkTask("t1", "Chốt 10 đơn sales tuần này", "e8", "d001", "k101", "in_progress", "high"),
  mkTask("t2", "Gọi 50 leads warm", "e9", "d001", "k102", "todo", "high"),
  mkTask("t3", "Đăng 15 bài content TikTok", "e10", "d002", "k201", "in_progress"),
  mkTask("t4", "Tối ưu ads campaign Q2", "e11", "d002", "k202", "todo", "high"),
  mkTask("t5", "Review SLA vận hành tháng", "e6", "d003", "k30", "review"),
  mkTask("t6", "Khảo sát CSAT tháng 4", "e13", "d004", "k40", "in_progress"),
  mkTask("t7", "Đăng tin tuyển 3 vị trí mới", "e14", "d005", null, "done", "normal", "admin"),
  mkTask("t8", "Chạy payroll tháng 4", "e2", "d005", null, "todo", "urgent", "admin"),
  mkTask("t9", "Tổng hợp báo cáo tài chính Q1", "e3", "d006", null, "review", "high"),
  mkTask("t10", "Thiết kế landing page mới", "e10", "d002", "k201", "blocked"),
  mkTask("t11", "Training inbound sales", "e4", "d001", "k10", "todo"),
  mkTask("t12", "Chuẩn hóa SOP CSKH", "e7", "d004", null, "done", "normal", "maintenance"),
];

export const demoPayroll: PayrollEntry[] = demoEmployees.map((e, i) => ({
  id: `pe${i + 1}`,
  company_id: DEMO_COMPANY_ID,
  payroll_period_id: "pr1",
  employee_id: e.id,
  base_salary: e.base_salary,
  allowance_total: Math.round(e.base_salary * 0.05),
  commission_total: e.department_id === "d001" ? Math.round(e.base_salary * 0.2) : 0,
  bonus_total: Math.round(e.base_salary * 0.15),
  penalty_total: 0,
  adjustment_total: 0,
  gross_pay: Math.round(e.base_salary * 1.25),
  net_pay: Math.round(e.base_salary * 1.1),
  company_cost: Math.round(e.base_salary * 1.35),
  breakdown: {},
}));

export const demoProjects: Project[] = [
  { id: "pj1", company_id: DEMO_COMPANY_ID, code: "P01", name: "Mở kênh TikTok mới", owner_id: "e5", business_case: "Kỳ vọng +300 leads/tháng", status: "active", starts_at: "2026-03-01", ends_at: "2026-06-30", budget: 120_000_000 },
  { id: "pj2", company_id: DEMO_COMPANY_ID, code: "P02", name: "Triển khai CRM mới", owner_id: "e4", business_case: "Giảm thời gian xử lý 30%", status: "active", starts_at: "2026-02-01", ends_at: "2026-05-15", budget: 350_000_000 },
  { id: "pj3", company_id: DEMO_COMPANY_ID, code: "P03", name: "Tái cấu trúc sales pipeline", owner_id: "e4", business_case: "Tăng close rate 5%", status: "paused", starts_at: "2026-04-01", ends_at: "2026-07-30", budget: 80_000_000 },
  { id: "pj4", company_id: DEMO_COMPANY_ID, code: "P04", name: "Loyalty program CSKH", owner_id: "e7", business_case: "Retention +5%", status: "draft", starts_at: "2026-05-01", ends_at: "2026-08-31", budget: 200_000_000 },
];

export const demoAccounting: AccountingEntry[] = [
  { id: "a1", company_id: DEMO_COMPANY_ID, entry_date: "2026-04-15", account_code: "511", debit: 0, credit: 5_200_000_000, cost_center_id: null, department_id: "d001", project_id: null, note: "Doanh thu tháng 4" },
  { id: "a2", company_id: DEMO_COMPANY_ID, entry_date: "2026-04-15", account_code: "632", debit: 3_300_000_000, credit: 0, cost_center_id: null, department_id: "d003", project_id: null, note: "Giá vốn tháng 4" },
  { id: "a3", company_id: DEMO_COMPANY_ID, entry_date: "2026-04-20", account_code: "641", debit: 420_000_000, credit: 0, cost_center_id: null, department_id: "d001", project_id: null, note: "Chi phí bán hàng" },
  { id: "a4", company_id: DEMO_COMPANY_ID, entry_date: "2026-04-20", account_code: "642", debit: 380_000_000, credit: 0, cost_center_id: null, department_id: "d005", project_id: null, note: "Chi phí quản lý" },
  { id: "a5", company_id: DEMO_COMPANY_ID, entry_date: "2026-04-28", account_code: "334", debit: 0, credit: 560_000_000, cost_center_id: null, department_id: null, project_id: null, note: "Lương tháng 4" },
];

export const demoAlerts: Alert[] = [
  { id: "al1", company_id: DEMO_COMPANY_ID, severity: "danger", title: "KPI Sales close rate ở mức đỏ", detail: { kpi: "SAL.CLOSE", actual: 54, target: 65 }, resolved_at: null, created_at: "2026-04-22T08:30:00Z" },
  { id: "al2", company_id: DEMO_COMPANY_ID, severity: "warning", title: "Chi phí Marketing vượt ngân sách 8%", detail: { dept: "MKT", over_pct: 8 }, resolved_at: null, created_at: "2026-04-21T10:15:00Z" },
  { id: "al3", company_id: DEMO_COMPANY_ID, severity: "warning", title: "Nhân viên Nguyễn Hải H quá tải (18 task)", detail: { employee: "e8", tasks: 18 }, resolved_at: null, created_at: "2026-04-22T14:00:00Z" },
  { id: "al4", company_id: DEMO_COMPANY_ID, severity: "info", title: "Runway giảm còn 11.5 tháng", detail: { runway: 11.5 }, resolved_at: null, created_at: "2026-04-20T09:00:00Z" },
  { id: "al5", company_id: DEMO_COMPANY_ID, severity: "critical", title: "3 task urgent trễ deadline", detail: { count: 3 }, resolved_at: null, created_at: "2026-04-23T07:00:00Z" },
];

export const demoApprovals: Approval[] = [
  { id: "ap1", company_id: DEMO_COMPANY_ID, kind: "payroll_adjustment", title: "Điều chỉnh bonus tháng 4 - Nguyễn Hải H", payload: { amount: 5_000_000, reason: "Vượt KPI 30%" }, status: "pending", requested_by: "e2", created_at: "2026-04-22T10:00:00Z" },
  { id: "ap2", company_id: DEMO_COMPANY_ID, kind: "job_requisition", title: "Tuyển 2 Senior Sales", payload: { headcount: 2 }, status: "pending", requested_by: "e4", created_at: "2026-04-21T09:00:00Z" },
  { id: "ap3", company_id: DEMO_COMPANY_ID, kind: "kpi_change", title: "Đổi target Qualified leads tháng 5", payload: { kpi: "MKT.LEADS", new_target: 600 }, status: "pending", requested_by: "e5", created_at: "2026-04-23T11:00:00Z" },
  { id: "ap4", company_id: DEMO_COMPANY_ID, kind: "project_budget", title: "Tăng budget dự án TikTok", payload: { project: "pj1", new_budget: 150_000_000 }, status: "approved", requested_by: "e5", created_at: "2026-04-10T08:00:00Z" },
];

export const demoObjectives: Objective[] = [
  { id: "o1", company_id: DEMO_COMPANY_ID, level: "company", owner_employee_id: "e1", owner_department_id: null, title: "Trở thành top 3 ngành trong năm 2026", description: null, period: "2026", status: "on_track", progress_pct: 62 },
  { id: "o2", company_id: DEMO_COMPANY_ID, level: "company", owner_employee_id: "e1", owner_department_id: null, title: "Đạt doanh thu 60 tỷ/năm", description: null, period: "2026", status: "on_track", progress_pct: 68 },
  { id: "o3", company_id: DEMO_COMPANY_ID, level: "department", owner_employee_id: "e4", owner_department_id: "d001", title: "Tăng close rate lên 40%", description: null, period: "2026-Q2", status: "at_risk", progress_pct: 45 },
  { id: "o4", company_id: DEMO_COMPANY_ID, level: "department", owner_employee_id: "e5", owner_department_id: "d002", title: "Đạt 2000 qualified leads/tháng", description: null, period: "2026-Q2", status: "on_track", progress_pct: 58 },
];

export const demoKeyResults: KeyResult[] = [
  { id: "kr1", objective_id: "o2", title: "Revenue Q1 ≥ 14 tỷ", target_value: 14, actual_value: 13.8, unit: "tỷ VND", progress_pct: 98 },
  { id: "kr2", objective_id: "o2", title: "Revenue Q2 ≥ 16 tỷ", target_value: 16, actual_value: 5.2, unit: "tỷ VND", progress_pct: 32 },
  { id: "kr3", objective_id: "o3", title: "Close rate April = 35%", target_value: 35, actual_value: 32, unit: "%", progress_pct: 91 },
  { id: "kr4", objective_id: "o4", title: "Leads April = 500", target_value: 500, actual_value: 540, unit: "lead", progress_pct: 108 },
];

export const demoRequisitions: JobRequisition[] = [
  { id: "jr1", company_id: DEMO_COMPANY_ID, department_id: "d001", position_id: null, title: "Senior Sales x2", headcount: 2, status: "open", reason: "Mở rộng khu vực HN", opened_at: "2026-04-15", closed_at: null },
  { id: "jr2", company_id: DEMO_COMPANY_ID, department_id: "d002", position_id: null, title: "Performance Marketing Lead", headcount: 1, status: "open", reason: "Tăng ad spend", opened_at: "2026-04-10", closed_at: null },
  { id: "jr3", company_id: DEMO_COMPANY_ID, department_id: "d003", position_id: null, title: "Ops Specialist", headcount: 1, status: "pipeline", reason: "Replace", opened_at: "2026-03-20", closed_at: null },
];

export const demoSops: SopDocument[] = [
  { id: "sop1", company_id: DEMO_COMPANY_ID, department_id: "d001", title: "Quy trình qualify lead", body: "1. Nhận lead ...\n2. Chấm điểm ...\n3. Pass sang sales.", version: 3, published: true },
  { id: "sop2", company_id: DEMO_COMPANY_ID, department_id: "d002", title: "Playbook content TikTok", body: "Format 15s, hook 3s đầu, CTA cuối.", version: 2, published: true },
  { id: "sop3", company_id: DEMO_COMPANY_ID, department_id: "d004", title: "SOP xử lý khiếu nại", body: "Phản hồi trong 2h, giải quyết trong 24h.", version: 1, published: true },
  { id: "sop4", company_id: DEMO_COMPANY_ID, department_id: "d005", title: "Policy chấm công", body: "Chấm công qua app, sai sót ghi chú.", version: 4, published: true },
];

export const demoAuditLogs: AuditLog[] = [
  { id: "au1", company_id: DEMO_COMPANY_ID, actor: "e1", action: "kpi.update_target", entity: "kpi", entity_id: "k1", before: { target_value: 4_800_000_000 }, after: { target_value: 5_000_000_000 }, created_at: "2026-04-01T08:30:00Z" },
  { id: "au2", company_id: DEMO_COMPANY_ID, actor: "e2", action: "employee.create", entity: "employee", entity_id: "e14", before: null, after: { full_name: "Đinh Hà O" }, created_at: "2026-03-15T10:00:00Z" },
  { id: "au3", company_id: DEMO_COMPANY_ID, actor: "e3", action: "payroll.override", entity: "payroll_entries", entity_id: "pe8", before: { bonus_total: 3_000_000 }, after: { bonus_total: 5_000_000 }, created_at: "2026-04-22T14:00:00Z" },
  { id: "au4", company_id: DEMO_COMPANY_ID, actor: "e1", action: "kpi.formula_update", entity: "kpi_formulas", entity_id: "k1", before: null, after: { formula_type: "composite" }, created_at: "2026-04-20T16:00:00Z" },
];

export const demoRevenueTrend = [
  { label: "T5/25", value: 3_200_000_000 },
  { label: "T6/25", value: 3_400_000_000 },
  { label: "T7/25", value: 3_600_000_000 },
  { label: "T8/25", value: 3_900_000_000 },
  { label: "T9/25", value: 4_100_000_000 },
  { label: "T10/25", value: 4_300_000_000 },
  { label: "T11/25", value: 4_500_000_000 },
  { label: "T12/25", value: 4_700_000_000 },
  { label: "T1/26", value: 4_600_000_000 },
  { label: "T2/26", value: 4_850_000_000 },
  { label: "T3/26", value: 5_000_000_000 },
  { label: "T4/26", value: 5_200_000_000 },
];
