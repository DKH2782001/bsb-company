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
  TaskResult,
  Sprint,
  Notification,
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
  TaskComment,
  KpiFormula,
  DepartmentResultKpi,
  ActionPlan,
  ActionMetric,
  EmployeeExecution,
} from "@/types/domain";
import { formatLocalISODate } from "@/lib/utils";

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
  mkEmp("e18", "Hieu", "hieu@bizos.demo", "d001", "Sales/Marketing", 18_000_000, "e4"),
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
  mkEmp("e15", "Nguyễn Minh P", "cs01@bizos.demo", "d004", "CSKH", 12_500_000, "e7"),
  mkEmp("e16", "Lê Thu Q", "cs02@bizos.demo", "d004", "CSKH", 12_500_000, "e7"),
  mkEmp("e17", "Phạm Huy R", "cs03@bizos.demo", "d004", "CSKH", 12_500_000, "e7"),
  mkEmp("e14", "Đinh Hà O", "a07@bizos.demo", "d005", "HR Specialist", 13_000_000, "e2"),
];

export const demoKpis: Kpi[] = [
  { id: "k50", company_id: DEMO_COMPANY_ID, code: "MKT.VIRAL", name: "KPI tang viral thuong hieu", description: "Tang do phu thuong hieu tren social", level: "department", owner_employee_id: "e5", owner_department_id: "d002", owner_team_id: null, unit: "score", weight: 1, parent_kpi_id: null, data_source: "social", active: true, target_frequency: "monthly" },
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
  { id: "kpi_reviews_5_star_2026_04", company_id: DEMO_COMPANY_ID, code: "CS.REVIEWS.5STAR", name: "5.000 đánh giá 5 sao", description: "KPI kết quả cấp phòng ban cho CSKH", level: "department", owner_employee_id: "e7", owner_department_id: "d004", owner_team_id: null, unit: "reviews", weight: 1, parent_kpi_id: null, data_source: "manual_import", active: true, target_frequency: "monthly", calc_mode: "manual" },

  { id: "k101", company_id: DEMO_COMPANY_ID, code: "E8.CLOSE", name: "Sales close / Nguyễn Hải H", description: "KPI cá nhân", level: "employee", owner_employee_id: "e8", owner_department_id: "d001", owner_team_id: null, unit: "đơn", weight: 0.5, parent_kpi_id: "k10", data_source: "crm", active: true, target_frequency: "monthly" },
  { id: "k102", company_id: DEMO_COMPANY_ID, code: "E9.CLOSE", name: "Sales close / Trần Nam I", description: "KPI cá nhân", level: "employee", owner_employee_id: "e9", owner_department_id: "d001", owner_team_id: null, unit: "đơn", weight: 0.5, parent_kpi_id: "k10", data_source: "crm", active: true, target_frequency: "monthly" },
  { id: "k201", company_id: DEMO_COMPANY_ID, code: "E10.CONTENT", name: "Content output", description: "Số bài đăng chất lượng", level: "employee", owner_employee_id: "e10", owner_department_id: "d002", owner_team_id: null, unit: "bài", weight: 0.6, parent_kpi_id: "k20", data_source: "social", active: true, target_frequency: "monthly" },
  { id: "k202", company_id: DEMO_COMPANY_ID, code: "E11.CPL", name: "CPL Ads", description: "Chi phí mỗi lead", level: "employee", owner_employee_id: "e11", owner_department_id: "d002", owner_team_id: null, unit: "VND", weight: 0.4, parent_kpi_id: "k21", data_source: "ads", active: true, target_frequency: "monthly" },

  // ── KPI tree mở rộng ──────────────────────────────────────────────────
  // Sales: thêm employee KPI cho Hieu (e18) — close rate cá nhân
  { id: "k103", company_id: DEMO_COMPANY_ID, code: "E18.CLOSE", name: "Sales close / Hieu", description: "KPI cá nhân của Hieu", level: "employee", owner_employee_id: "e18", owner_department_id: "d001", owner_team_id: null, unit: "đơn", weight: 0.4, parent_kpi_id: "k10", data_source: "crm", active: true, target_frequency: "monthly" },
  // Sales AOV chia theo từng rep
  { id: "k111", company_id: DEMO_COMPANY_ID, code: "E8.AOV", name: "AOV / Nguyễn Hải H", description: "AOV cá nhân", level: "employee", owner_employee_id: "e8", owner_department_id: "d001", owner_team_id: null, unit: "VND", weight: 0.5, parent_kpi_id: "k11", data_source: "crm", active: true, target_frequency: "monthly" },
  { id: "k112", company_id: DEMO_COMPANY_ID, code: "E9.AOV", name: "AOV / Trần Nam I", description: "AOV cá nhân", level: "employee", owner_employee_id: "e9", owner_department_id: "d001", owner_team_id: null, unit: "VND", weight: 0.5, parent_kpi_id: "k11", data_source: "crm", active: true, target_frequency: "monthly" },
  // Marketing: leads từ ads (Phạm Tú L)
  { id: "k203", company_id: DEMO_COMPANY_ID, code: "E11.LEADS", name: "Ads leads / Phạm Tú L", description: "Leads từ performance ads", level: "employee", owner_employee_id: "e11", owner_department_id: "d002", owner_team_id: null, unit: "lead", weight: 0.4, parent_kpi_id: "k20", data_source: "ads", active: true, target_frequency: "monthly" },
  // Operations: SLA thực thi cá nhân
  { id: "k301", company_id: DEMO_COMPANY_ID, code: "E6.SLA", name: "SLA Ops Lead / Đỗ Quỳnh F", description: "% đơn xử lý đúng SLA của Ops Lead", level: "employee", owner_employee_id: "e6", owner_department_id: "d003", owner_team_id: null, unit: "%", weight: 0.5, parent_kpi_id: "k30", data_source: "ops", active: true, target_frequency: "monthly" },
  { id: "k302", company_id: DEMO_COMPANY_ID, code: "E12.SLA", name: "SLA Ops Specialist / Nguyễn Lan M", description: "SLA thực thi", level: "employee", owner_employee_id: "e12", owner_department_id: "d003", owner_team_id: null, unit: "%", weight: 0.5, parent_kpi_id: "k30", data_source: "ops", active: true, target_frequency: "monthly" },
  // Customer Success: retention cá nhân
  { id: "k401", company_id: DEMO_COMPANY_ID, code: "E13.RET", name: "CS Retention / Trần Sơn N", description: "% khách giữ chân nhóm e13", level: "employee", owner_employee_id: "e13", owner_department_id: "d004", owner_team_id: null, unit: "%", weight: 0.4, parent_kpi_id: "k40", data_source: "crm", active: true, target_frequency: "monthly" },
  { id: "k402", company_id: DEMO_COMPANY_ID, code: "CS.NPS", name: "Customer NPS", description: "Net Promoter Score CSKH", level: "department", owner_employee_id: "e7", owner_department_id: "d004", owner_team_id: null, unit: "score", weight: 0.6, parent_kpi_id: "k4", data_source: "manual_import", active: true, target_frequency: "monthly" },
  // HR — hỗ trợ Net Profit qua chi phí tuyển dụng
  { id: "k60", company_id: DEMO_COMPANY_ID, code: "HR.TTH", name: "Time to Hire", description: "Số ngày trung bình từ mở requisition đến offer", level: "department", owner_employee_id: "e2", owner_department_id: "d005", owner_team_id: null, unit: "ngày", weight: 0.5, parent_kpi_id: "k3", data_source: "manual_import", active: true, target_frequency: "monthly" },
  { id: "k601", company_id: DEMO_COMPANY_ID, code: "E14.TTH", name: "TTH / Đinh Hà O", description: "Time to hire cá nhân", level: "employee", owner_employee_id: "e14", owner_department_id: "d005", owner_team_id: null, unit: "ngày", weight: 1, parent_kpi_id: "k60", data_source: "manual_import", active: true, target_frequency: "monthly" },
  // Finance — DSO (Days Sales Outstanding)
  { id: "k70", company_id: DEMO_COMPANY_ID, code: "FIN.DSO", name: "DSO - Days Sales Outstanding", description: "Số ngày trung bình thu hồi công nợ", level: "department", owner_employee_id: "e3", owner_department_id: "d006", owner_team_id: null, unit: "ngày", weight: 0.5, parent_kpi_id: "k3", data_source: "accounting", active: true, target_frequency: "monthly" },
];

const p = "2026-04";
const pNext = "2026-05";
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
  { kpi_id: "kpi_reviews_5_star_2026_04", period: p, target_value: 5_000 },
  { kpi_id: "k101", period: p, target_value: 25 },
  { kpi_id: "k102", period: p, target_value: 25 },
  { kpi_id: "k201", period: p, target_value: 60 },
  { kpi_id: "k202", period: p, target_value: 400_000 },
  // KPI mới (tháng 4)
  { kpi_id: "k103", period: p, target_value: 20 },
  { kpi_id: "k111", period: p, target_value: 12_500_000 },
  { kpi_id: "k112", period: p, target_value: 11_500_000 },
  { kpi_id: "k203", period: p, target_value: 200 },
  { kpi_id: "k301", period: p, target_value: 92 },
  { kpi_id: "k302", period: p, target_value: 90 },
  { kpi_id: "k401", period: p, target_value: 65 },
  { kpi_id: "k402", period: p, target_value: 55 },
  { kpi_id: "k60", period: p, target_value: 21 },
  { kpi_id: "k601", period: p, target_value: 21 },
  { kpi_id: "k70", period: p, target_value: 30 },
  // Tháng 5 — phục vụ rule chia KPI tháng → 2 sprint
  { kpi_id: "k1", period: pNext, target_value: 5_500_000_000 },
  { kpi_id: "k20", period: pNext, target_value: 600 },
  { kpi_id: "k101", period: pNext, target_value: 30 },
  { kpi_id: "k102", period: pNext, target_value: 30 },
  { kpi_id: "k201", period: pNext, target_value: 60 },
  { kpi_id: "k103", period: pNext, target_value: 24 },
  { kpi_id: "k301", period: pNext, target_value: 94 },
  { kpi_id: "k60", period: pNext, target_value: 18 },
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
  { kpi_id: "kpi_reviews_5_star_2026_04", period: p, actual_value: 3_200, completion_rate: 0.64, status: "yellow" },
  { kpi_id: "k101", period: p, actual_value: 27, completion_rate: 1.08, status: "green" },
  { kpi_id: "k102", period: p, actual_value: 18, completion_rate: 0.72, status: "red" },
  { kpi_id: "k201", period: p, actual_value: 62, completion_rate: 1.03, status: "green" },
  { kpi_id: "k202", period: p, actual_value: 420_000, completion_rate: 0.95, status: "yellow" },
  // Actuals cho KPI mới
  { kpi_id: "k103", period: p, actual_value: 22, completion_rate: 1.1, status: "green" },
  { kpi_id: "k111", period: p, actual_value: 13_800_000, completion_rate: 1.1, status: "green" },
  { kpi_id: "k112", period: p, actual_value: 9_500_000, completion_rate: 0.83, status: "yellow" },
  { kpi_id: "k203", period: p, actual_value: 165, completion_rate: 0.83, status: "yellow" },
  { kpi_id: "k301", period: p, actual_value: 94, completion_rate: 1.02, status: "green" },
  { kpi_id: "k302", period: p, actual_value: 81, completion_rate: 0.9, status: "yellow" },
  { kpi_id: "k401", period: p, actual_value: 58, completion_rate: 0.89, status: "yellow" },
  { kpi_id: "k402", period: p, actual_value: 48, completion_rate: 0.87, status: "yellow" },
  { kpi_id: "k60", period: p, actual_value: 26, completion_rate: 0.81, status: "yellow" },
  { kpi_id: "k601", period: p, actual_value: 28, completion_rate: 0.75, status: "red" },
  { kpi_id: "k70", period: p, actual_value: 38, completion_rate: 0.79, status: "red" },
];

export const demoKpiFormulas: KpiFormula[] = [
  {
    kpi_id: "k1",
    formula_type: "composite",
    definition: { op: "sum", args: [{ ref: "SAL.REVENUE.A" }, { ref: "SAL.REVENUE.B" }, { ref: "SAL.REVENUE.C" }] },
  },
  {
    kpi_id: "k2",
    formula_type: "formula",
    definition: { op: "sub", args: [{ ref: "REV" }, { ref: "COGS" }] },
  },
  {
    kpi_id: "k3",
    formula_type: "formula",
    definition: { op: "sub", args: [{ ref: "GP" }, { ref: "OPEX" }] },
  },
  {
    kpi_id: "k11",
    formula_type: "formula",
    definition: { op: "ratio", numerator: { ref: "REV" }, denominator: { ref: "ORDERS" } },
  },
];

export const demoDepartmentResultKpis: DepartmentResultKpi[] = [
  {
    id: "kpi_reviews_5_star_2026_04",
    name: "5.000 đánh giá 5 sao",
    department_id: "d004",
    department_name: "Chăm sóc khách hàng",
    period: "2026-04",
    type: "result_kpi",
    unit: "reviews",
    target: 5_000,
    actual: 3_200,
    data_source: "manual_import",
    rollup_mode: "manual",
    status: "yellow",
    days_left: 10,
    last_updated_at: "2026-04-20T17:30:00Z",
  },
];

export const demoActionPlans: ActionPlan[] = [
  {
    id: "ap_hieu_close_new_customers",
    linked_kpi_id: "k1",
    title: "Chot khach moi",
    description: "Action Plan demo cho KPI ca nhan theo task co trong so.",
    owner_id: "e4",
    department_id: "d001",
    period: "2026-04",
    status: "active",
    expected_impact_text: "Tang doanh thu tu khach hang moi.",
    progress_percent: 80,
    total_tasks: 1,
    completed_tasks: 0,
    overdue_tasks: 0,
    blocked_tasks: 0,
  },
  {
    id: "ap_hieu_brand_awareness",
    linked_kpi_id: "k50",
    title: "Tang nhan dien thuong hieu",
    description: "Action Plan demo cho viral thuong hieu.",
    owner_id: "e5",
    department_id: "d002",
    period: "2026-04",
    status: "active",
    expected_impact_text: "Tang do phu thuong hieu tren social.",
    progress_percent: 100,
    total_tasks: 1,
    completed_tasks: 1,
    overdue_tasks: 0,
    blocked_tasks: 0,
  },
  {
    id: "ap_review_request_after_purchase",
    linked_kpi_id: "kpi_reviews_5_star_2026_04",
    title: "Chiến dịch xin đánh giá sau mua tháng 4",
    description: "Gửi lời mời đánh giá đến khách đã mua hàng và có trải nghiệm tốt.",
    owner_id: "e7",
    department_id: "d004",
    period: "2026-04",
    status: "active",
    expected_impact_text: "Tăng số lượng đánh giá 5 sao từ khách đã mua.",
    progress_percent: 67,
    total_tasks: 12,
    completed_tasks: 8,
    overdue_tasks: 2,
    blocked_tasks: 1,
  },
  {
    id: "ap_followup_no_review",
    linked_kpi_id: "kpi_reviews_5_star_2026_04",
    title: "Follow-up khách chưa đánh giá",
    description: "Nhắc lại các khách đã mua nhưng chưa để lại đánh giá.",
    owner_id: "e7",
    department_id: "d004",
    period: "2026-04",
    status: "active",
    expected_impact_text: "Tăng conversion từ khách đã nhận hàng nhưng chưa review.",
    progress_percent: 54,
    total_tasks: 8,
    completed_tasks: 4,
    overdue_tasks: 3,
    blocked_tasks: 0,
  },
  {
    id: "ap_low_rating_recovery",
    linked_kpi_id: "kpi_reviews_5_star_2026_04",
    title: "Xử lý khách có nguy cơ đánh giá thấp",
    description: "Can thiệp sớm với khách có dấu hiệu không hài lòng để tránh review xấu.",
    owner_id: "e7",
    department_id: "d004",
    period: "2026-04",
    status: "active",
    expected_impact_text: "Giảm review xấu và tăng khả năng chuyển thành 5 sao.",
    progress_percent: 72,
    total_tasks: 10,
    completed_tasks: 7,
    overdue_tasks: 1,
    blocked_tasks: 1,
  },
  // ── Action Plans cho department KPI chính ─────────────────────────────
  {
    id: "ap_pipeline_acceleration_q2",
    linked_kpi_id: "k10",
    title: "Pipeline acceleration Q2",
    description: "Đẩy nhanh tốc độ chốt deal qua scoring lead + outreach 2 tier.",
    owner_id: "e4",
    department_id: "d001",
    period: "2026-04",
    status: "active",
    expected_impact_text: "Tăng close rate từ 32% → 40% trong Q2.",
    progress_percent: 58,
    total_tasks: 16,
    completed_tasks: 9,
    overdue_tasks: 2,
    blocked_tasks: 1,
  },
  {
    id: "ap_sales_coaching_weekly",
    linked_kpi_id: "k10",
    title: "Sales coaching weekly",
    description: "Lead 1:1 với từng rep mỗi tuần, review call recording + role-play objection.",
    owner_id: "e4",
    department_id: "d001",
    period: "2026-04",
    status: "active",
    expected_impact_text: "Đồng đều close rate giữa các rep, giảm gap top vs bottom.",
    progress_percent: 75,
    total_tasks: 8,
    completed_tasks: 6,
    overdue_tasks: 0,
    blocked_tasks: 0,
  },
  {
    id: "ap_tiktok_content_series",
    linked_kpi_id: "k20",
    title: "TikTok content series Q2",
    description: "15 video/tuần — combo POV + testimonial + product demo.",
    owner_id: "e5",
    department_id: "d002",
    period: "2026-04",
    status: "active",
    expected_impact_text: "Đẩy 40% qualified leads tới từ TikTok organic.",
    progress_percent: 64,
    total_tasks: 24,
    completed_tasks: 15,
    overdue_tasks: 3,
    blocked_tasks: 1,
  },
  {
    id: "ap_perf_ads_scaling",
    linked_kpi_id: "k20",
    title: "Performance ads scaling",
    description: "Tăng budget cho campaign top 10% ROAS, kill campaign dưới 1.5x.",
    owner_id: "e5",
    department_id: "d002",
    period: "2026-04",
    status: "active",
    expected_impact_text: "CPL ổn định <450k, lead volume +20%.",
    progress_percent: 50,
    total_tasks: 10,
    completed_tasks: 5,
    overdue_tasks: 1,
    blocked_tasks: 0,
  },
  {
    id: "ap_ops_sla_dashboard",
    linked_kpi_id: "k30",
    title: "SLA monitoring dashboard",
    description: "Build realtime dashboard cảnh báo đơn vượt SLA + auto-escalate.",
    owner_id: "e6",
    department_id: "d003",
    period: "2026-04",
    status: "active",
    expected_impact_text: "Phát hiện sớm đơn nguy cơ trễ SLA, % đúng SLA tăng từ 88 → 95.",
    progress_percent: 80,
    total_tasks: 6,
    completed_tasks: 5,
    overdue_tasks: 0,
    blocked_tasks: 0,
  },
  {
    id: "ap_loyalty_program",
    linked_kpi_id: "k40",
    title: "Loyalty rewards program",
    description: "Tier-based loyalty: Silver/Gold/Platinum + bonus voucher mỗi quý.",
    owner_id: "e7",
    department_id: "d004",
    period: "2026-04",
    status: "active",
    expected_impact_text: "Retention +5%, repurchase rate khách Gold +12%.",
    progress_percent: 35,
    total_tasks: 14,
    completed_tasks: 5,
    overdue_tasks: 2,
    blocked_tasks: 1,
  },
  {
    id: "ap_hr_pipeline_speedup",
    linked_kpi_id: "k60",
    title: "HR pipeline speedup",
    description: "Pre-screen + AI sourcing để rút ngắn time-to-hire.",
    owner_id: "e2",
    department_id: "d005",
    period: "2026-04",
    status: "active",
    expected_impact_text: "Time to hire giảm từ 26 → 18 ngày.",
    progress_percent: 45,
    total_tasks: 8,
    completed_tasks: 4,
    overdue_tasks: 1,
    blocked_tasks: 0,
  },
  {
    id: "ap_finance_dso_reduction",
    linked_kpi_id: "k70",
    title: "DSO reduction Q2",
    description: "Tự động hóa nhắc công nợ + early-payment discount 1.5%.",
    owner_id: "e3",
    department_id: "d006",
    period: "2026-04",
    status: "active",
    expected_impact_text: "DSO giảm từ 38 ngày về 30 ngày.",
    progress_percent: 25,
    total_tasks: 6,
    completed_tasks: 1,
    overdue_tasks: 1,
    blocked_tasks: 0,
  },
];

export const demoActionMetrics: ActionMetric[] = [
  {
    id: "metric_review_invites_sent",
    action_plan_id: "ap_review_request_after_purchase",
    name: "Gửi lời mời đánh giá",
    unit: "customers",
    target: 4_000,
    actual: 2_700,
    completion: 0.675,
    owner_id: "e7",
    assignee_id: "e15",
    status: "yellow",
  },
  {
    id: "metric_followup_pending_review",
    action_plan_id: "ap_followup_no_review",
    name: "Follow-up khách chưa đánh giá",
    unit: "customers",
    target: 1_000,
    actual: 600,
    completion: 0.6,
    owner_id: "e7",
    assignee_id: "e16",
    status: "yellow",
  },
  {
    id: "metric_vip_call_reviews",
    action_plan_id: "ap_review_request_after_purchase",
    name: "Gọi khách VIP xin đánh giá",
    unit: "customers",
    target: 300,
    actual: 180,
    completion: 0.6,
    owner_id: "e7",
    assignee_id: "e15",
    status: "yellow",
  },
  {
    id: "metric_low_rating_risk_cases",
    action_plan_id: "ap_low_rating_recovery",
    name: "Xử lý case nguy cơ đánh giá thấp",
    unit: "cases",
    target: 100,
    actual: 80,
    completion: 0.8,
    owner_id: "e7",
    assignee_id: "e17",
    status: "yellow",
  },
  // ── Metrics cho action plans mới ──────────────────────────────────────
  {
    id: "metric_pipeline_calls",
    action_plan_id: "ap_pipeline_acceleration_q2",
    name: "Số cold call / tuần",
    unit: "calls",
    target: 200,
    actual: 145,
    completion: 0.725,
    owner_id: "e4",
    assignee_id: "e8",
    status: "yellow",
  },
  {
    id: "metric_pipeline_demos",
    action_plan_id: "ap_pipeline_acceleration_q2",
    name: "Demo booking",
    unit: "demos",
    target: 80,
    actual: 52,
    completion: 0.65,
    owner_id: "e4",
    assignee_id: "e9",
    status: "yellow",
  },
  {
    id: "metric_coaching_sessions",
    action_plan_id: "ap_sales_coaching_weekly",
    name: "Số session 1:1",
    unit: "sessions",
    target: 16,
    actual: 12,
    completion: 0.75,
    owner_id: "e4",
    assignee_id: "e4",
    status: "yellow",
  },
  {
    id: "metric_tiktok_videos",
    action_plan_id: "ap_tiktok_content_series",
    name: "Video TikTok đăng",
    unit: "videos",
    target: 60,
    actual: 38,
    completion: 0.633,
    owner_id: "e5",
    assignee_id: "e10",
    status: "yellow",
  },
  {
    id: "metric_tiktok_views",
    action_plan_id: "ap_tiktok_content_series",
    name: "Tổng views TikTok",
    unit: "views",
    target: 2_000_000,
    actual: 1_350_000,
    completion: 0.675,
    owner_id: "e5",
    assignee_id: "e10",
    status: "yellow",
  },
  {
    id: "metric_ads_roas",
    action_plan_id: "ap_perf_ads_scaling",
    name: "ROAS trung bình campaign",
    unit: "x",
    target: 3.5,
    actual: 2.8,
    completion: 0.8,
    owner_id: "e5",
    assignee_id: "e11",
    status: "yellow",
  },
  {
    id: "metric_ads_cpl",
    action_plan_id: "ap_perf_ads_scaling",
    name: "CPL trung bình",
    unit: "VND",
    target: 450_000,
    actual: 478_000,
    completion: 0.94,
    owner_id: "e5",
    assignee_id: "e11",
    status: "yellow",
  },
  {
    id: "metric_sla_dashboard_milestones",
    action_plan_id: "ap_ops_sla_dashboard",
    name: "Milestones dashboard hoàn thành",
    unit: "milestone",
    target: 5,
    actual: 4,
    completion: 0.8,
    owner_id: "e6",
    assignee_id: "e6",
    status: "green",
  },
  {
    id: "metric_loyalty_signups",
    action_plan_id: "ap_loyalty_program",
    name: "Khách đăng ký loyalty",
    unit: "khách",
    target: 1_000,
    actual: 320,
    completion: 0.32,
    owner_id: "e7",
    assignee_id: "e13",
    status: "red",
  },
  {
    id: "metric_loyalty_voucher_redeem",
    action_plan_id: "ap_loyalty_program",
    name: "Voucher redeemed",
    unit: "voucher",
    target: 500,
    actual: 180,
    completion: 0.36,
    owner_id: "e7",
    assignee_id: "e13",
    status: "red",
  },
  {
    id: "metric_hr_screening",
    action_plan_id: "ap_hr_pipeline_speedup",
    name: "Hồ sơ pre-screen / tuần",
    unit: "CV",
    target: 50,
    actual: 28,
    completion: 0.56,
    owner_id: "e2",
    assignee_id: "e14",
    status: "yellow",
  },
  {
    id: "metric_hr_offers",
    action_plan_id: "ap_hr_pipeline_speedup",
    name: "Offer đã gửi",
    unit: "offer",
    target: 12,
    actual: 5,
    completion: 0.417,
    owner_id: "e2",
    assignee_id: "e14",
    status: "red",
  },
  {
    id: "metric_dso_followup",
    action_plan_id: "ap_finance_dso_reduction",
    name: "Số lần nhắc công nợ tự động",
    unit: "reminder",
    target: 200,
    actual: 70,
    completion: 0.35,
    owner_id: "e3",
    assignee_id: "e3",
    status: "red",
  },
];

export const demoEmployeeExecutions: EmployeeExecution[] = [
  {
    employee_id: "e15",
    employee_name: "Nguyễn Minh P",
    role: "CSKH",
    department_id: "d004",
    linked_kpi_id: "kpi_reviews_5_star_2026_04",
    linked_action_plan_id: "ap_review_request_after_purchase",
    assigned_tasks: 8,
    done_tasks: 6,
    overdue_tasks: 1,
    blocked_tasks: 0,
    action_target_name: "Gửi lời mời đánh giá",
    action_target_value: 800,
    action_actual_value: 620,
    action_completion: 0.775,
    sla_score: 92,
    quality_score: 88,
    risk_status: "yellow",
  },
  {
    employee_id: "e16",
    employee_name: "Lê Thu Q",
    role: "CSKH",
    department_id: "d004",
    linked_kpi_id: "kpi_reviews_5_star_2026_04",
    linked_action_plan_id: "ap_followup_no_review",
    assigned_tasks: 5,
    done_tasks: 5,
    overdue_tasks: 0,
    blocked_tasks: 0,
    action_target_name: "Follow-up khách chưa đánh giá",
    action_target_value: 500,
    action_actual_value: 430,
    action_completion: 0.86,
    sla_score: 95,
    quality_score: 91,
    risk_status: "green",
  },
  {
    employee_id: "e17",
    employee_name: "Phạm Huy R",
    role: "CSKH",
    department_id: "d004",
    linked_kpi_id: "kpi_reviews_5_star_2026_04",
    linked_action_plan_id: "ap_low_rating_recovery",
    assigned_tasks: 7,
    done_tasks: 2,
    overdue_tasks: 2,
    blocked_tasks: 1,
    action_target_name: "Xử lý case nguy cơ",
    action_target_value: 100,
    action_actual_value: 45,
    action_completion: 0.45,
    sla_score: 70,
    quality_score: 76,
    risk_status: "red",
  },
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
  sprintId: string | null = null,
  storyPoints: number | null = null,
  start: string | null = null,
  extras: Partial<
    Pick<
      Task,
      | "description"
      | "linked_action_plan_id"
      | "action_metric_id"
      | "action_target_value"
      | "action_actual_value"
      | "task_weight"
      | "progress_unit"
      | "quality_score"
      | "sla_score"
      | "blocked_reason"
    >
  > = {},
): Task {
  return {
    id,
    company_id: DEMO_COMPANY_ID,
    title,
    description: extras.description ?? null,
    assignee_id: assignee,
    reviewer_id: null,
    department_id: dept,
    project_id: null,
    linked_kpi_id: kpi,
    linked_action_plan_id: extras.linked_action_plan_id ?? null,
    action_metric_id: extras.action_metric_id ?? null,
    priority,
    task_type: taskType,
    status,
    start_date: start,
    due_date: due,
    estimated_hours: 4,
    actual_hours: null,
    action_target_value: extras.action_target_value ?? null,
    action_actual_value: extras.action_actual_value ?? null,
    task_weight: extras.task_weight ?? 1,
    progress_unit: extras.progress_unit ?? null,
    quality_score: extras.quality_score ?? null,
    sla_score: extras.sla_score ?? null,
    blocked_reason: extras.blocked_reason ?? null,
    sprint_id: sprintId,
    story_points: storyPoints,
    parent_task_id: null,
  };
}

export const demoTasks: Task[] = [
  mkTask("t1", "Chốt 10 đơn sales tuần này", "e8", "d001", "k101", "in_progress", "high", "growth", "2026-05-10", "sp1", 5, "2026-04-28"),
  mkTask("t2", "Gọi 50 leads warm", "e9", "d001", "k102", "todo", "high", "growth", "2026-05-15", "sp1", 3, "2026-05-05"),
  mkTask("t3", "Đăng 15 bài content TikTok", "e10", "d002", "k201", "in_progress", "normal", "growth", "2026-05-20", "sp1", 8, "2026-04-25"),
  mkTask("t4", "Tối ưu ads campaign Q2", "e11", "d002", "k202", "todo", "high", "growth", "2026-05-30", "sp1", 5, "2026-05-10"),
  mkTask("t5", "Review SLA vận hành tháng", "e6", "d003", "k30", "review", "normal", "growth", "2026-05-08", "sp1", 3, "2026-05-01"),
  mkTask("t6", "Khảo sát CSAT tháng 4", "e13", "d004", "k40", "in_progress", "normal", "growth", "2026-05-12", "sp1", 2, "2026-04-28"),
  mkTask("t7", "Đăng tin tuyển 3 vị trí mới", "e14", "d005", null, "done", "normal", "admin", "2026-04-30", "sp1", 2, "2026-04-20"),
  mkTask("t8", "Chạy payroll tháng 4", "e2", "d005", null, "todo", "urgent", "admin", "2026-04-25"),
  mkTask("t9", "Tổng hợp báo cáo tài chính Q1", "e3", "d006", null, "review", "high"),
  mkTask("t10", "Thiết kế landing page mới", "e10", "d002", "k201", "blocked"),
  mkTask("t11", "Training inbound sales", "e4", "d001", "k10", "todo", "normal", "growth", "2026-05-05"),
  mkTask("t12", "Chuẩn hóa SOP CSKH", "e7", "d004", null, "done", "normal", "maintenance", "2026-04-15"),
  mkTask("t13", "Gửi lời mời đánh giá cho 300 khách tuần 1", "e15", "d004", "kpi_reviews_5_star_2026_04", "in_progress", "high", "growth", "2026-04-10", null, null, "2026-04-01", {
    description: "Lọc danh sách khách đã nhận hàng, trải nghiệm tốt, sau đó gửi lời mời đánh giá.",
    linked_action_plan_id: "ap_review_request_after_purchase",
    action_metric_id: "metric_review_invites_sent",
    action_target_value: 300,
    action_actual_value: 220,
    progress_unit: "customers",
    quality_score: 88,
    sla_score: 92,
  }),
  mkTask("t14", "Follow-up 200 khách chưa đánh giá tuần 1", "e16", "d004", "kpi_reviews_5_star_2026_04", "done", "high", "growth", "2026-04-09", null, null, "2026-04-02", {
    description: "Nhắc lại khách đã nhận hàng nhưng chưa để lại review.",
    linked_action_plan_id: "ap_followup_no_review",
    action_metric_id: "metric_followup_pending_review",
    action_target_value: 200,
    action_actual_value: 190,
    progress_unit: "customers",
    quality_score: 90,
    sla_score: 96,
  }),
  mkTask("t15", "Gọi khách VIP xin đánh giá đợt 1", "e15", "d004", "kpi_reviews_5_star_2026_04", "review", "normal", "growth", "2026-04-12", null, null, "2026-04-05", {
    description: "Ưu tiên khách VIP đã hài lòng để tăng khả năng nhận review 5 sao.",
    linked_action_plan_id: "ap_review_request_after_purchase",
    action_metric_id: "metric_vip_call_reviews",
    action_target_value: 80,
    action_actual_value: 55,
    progress_unit: "customers",
    quality_score: 87,
    sla_score: 90,
  }),
  mkTask("t16", "Xử lý 20 case có nguy cơ đánh giá thấp", "e17", "d004", "kpi_reviews_5_star_2026_04", "blocked", "urgent", "urgent", "2026-04-11", null, null, "2026-04-03", {
    description: "Liên hệ lại các case có dấu hiệu không hài lòng để xử lý trước khi khách đánh giá.",
    linked_action_plan_id: "ap_low_rating_recovery",
    action_metric_id: "metric_low_rating_risk_cases",
    action_target_value: 20,
    action_actual_value: 9,
    progress_unit: "cases",
    quality_score: 75,
    sla_score: 68,
    blocked_reason: "Đang chờ đội vận hành xác nhận phương án xử lý đổi trả.",
  }),
  mkTask("t17", "Rà soát template tin nhắn xin đánh giá", "e7", "d004", "kpi_reviews_5_star_2026_04", "done", "normal", "maintenance", "2026-04-06", null, null, "2026-04-01", {
    description: "Chuẩn hóa message theo từng nhóm khách để tăng conversion review.",
    linked_action_plan_id: "ap_review_request_after_purchase",
    action_target_value: 1,
    action_actual_value: 1,
    progress_unit: "task",
    quality_score: 93,
    sla_score: 95,
  }),
  mkTask("t18", "Phân loại 100 khách chưa review theo mức ưu tiên", "e16", "d004", "kpi_reviews_5_star_2026_04", "todo", "normal", "growth", "2026-04-14", null, null, "2026-04-08", {
    description: "Phân nhóm khách để follow-up đúng kịch bản và đúng thời điểm.",
    linked_action_plan_id: "ap_followup_no_review",
    action_metric_id: "metric_followup_pending_review",
    action_target_value: 100,
    action_actual_value: 0,
    progress_unit: "customers",
    quality_score: 0,
    sla_score: 0,
  }),
  mkTask("t19", "Chot khach moi", "e18", "d001", "k1", "in_progress", "high", "growth", "2026-04-20", null, null, "2026-04-01", {
    linked_action_plan_id: "ap_hieu_close_new_customers",
    action_target_value: 100,
    action_actual_value: 80,
    task_weight: 7,
    quality_score: 86,
  }),
  mkTask("t20", "Tang viral thuong hieu", "e18", "d002", "k50", "done", "normal", "growth", "2026-04-21", null, null, "2026-04-02", {
    linked_action_plan_id: "ap_hieu_brand_awareness",
    action_target_value: 10,
    action_actual_value: 10,
    task_weight: 3,
    quality_score: 90,
  }),
  // Tháng 5: Sprint A đã có 1 task chốt 10 đơn (KPI tháng 30 → split 15/sprint, còn 5 trong sprint A)
  mkTask(
    "t_may_a_1",
    "Chốt 10 đơn Sprint A tháng 5",
    "e8",
    "d001",
    "k101",
    "todo",
    "high",
    "growth",
    "2026-05-12",
    "sp_may_a",
    5,
    "2026-05-02",
    {
      action_target_value: 10,
      action_actual_value: 0,
      progress_unit: "đơn",
    },
  ),
];

export const demoTaskResults: TaskResult[] = [];

export const demoTaskComments: TaskComment[] = [
  { id: "cmt1", task_id: "t1", author_id: "e1", content: "Team Sales cần đẩy thêm 3 đơn nữa để về đích tuần này.", created_at: "2026-04-28T09:00:00Z" },
  { id: "cmt2", task_id: "t1", author_id: "e8", content: "Đang chờ khách xác nhận 2 đơn, dự kiến chốt chiều nay.", created_at: "2026-04-28T10:30:00Z" },
  { id: "cmt3", task_id: "t3", author_id: "e5", content: "Brief content đã gửi qua Drive, bạn check nhé.", created_at: "2026-04-27T14:00:00Z" },
];

export const demoSprints: Sprint[] = [
  {
    id: "sp1",
    company_id: DEMO_COMPANY_ID,
    name: "Sprint 1 - Tháng 4/2026",
    goal: "Tăng doanh thu Q2, tối ưu marketing campaigns",
    start_date: "2026-04-14",
    end_date: "2026-04-28",
    status: "active",
    capacity: 30,
    velocity: null,
    completed_points: null,
    carry_over_points: null,
    completion_rate: null,
    created_at: "2026-04-13T08:00:00Z",
    completed_at: null,
    retrospective: null,
  },
  {
    id: "sp_may_a",
    company_id: DEMO_COMPANY_ID,
    name: "Sprint 1 - Tháng 5/2026",
    goal: "Đạt 50% KPI tháng 5",
    start_date: "2026-05-01",
    end_date: "2026-05-14",
    status: "planning",
    capacity: 30,
    velocity: null,
    completed_points: null,
    carry_over_points: null,
    completion_rate: null,
    created_at: "2026-04-30T08:00:00Z",
    completed_at: null,
    retrospective: null,
  },
  {
    id: "sp_may_b",
    company_id: DEMO_COMPANY_ID,
    name: "Sprint 2 - Tháng 5/2026",
    goal: "Đẩy nốt 50% KPI tháng 5",
    start_date: "2026-05-15",
    end_date: "2026-05-28",
    status: "planning",
    capacity: 30,
    velocity: null,
    completed_points: null,
    carry_over_points: null,
    completion_rate: null,
    created_at: "2026-04-30T08:00:00Z",
    completed_at: null,
    retrospective: null,
  },
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

export const DEMO_AUTH_USER_ID = "00000000-0000-0000-0000-000000000001";

export const demoNotifications: Notification[] = [
  { id: "n1", company_id: DEMO_COMPANY_ID, auth_user_id: DEMO_AUTH_USER_ID, title: "Task mới được giao", body: "Lý Hoa K đã giao bạn task 'Đăng 15 bài content TikTok'", link: "/operations", read_at: null, created_at: "2026-04-26T08:30:00Z" },
  { id: "n2", company_id: DEMO_COMPANY_ID, auth_user_id: DEMO_AUTH_USER_ID, title: "Sprint 1 đã bắt đầu", body: "Sprint 1 - Tháng 4/2026 đã chính thức bắt đầu, hạn cuối 28/04", link: "/operations", read_at: null, created_at: "2026-04-25T07:00:00Z" },
  { id: "n3", company_id: DEMO_COMPANY_ID, auth_user_id: DEMO_AUTH_USER_ID, title: "Task đã được duyệt", body: "Trần Minh A đã duyệt task 'Tổng hợp báo cáo tài chính Q1'", link: "/operations", read_at: "2026-04-24T10:00:00Z", created_at: "2026-04-24T09:30:00Z" },
];

export const demoAuditLogs: AuditLog[] = [
  { id: "au1", company_id: DEMO_COMPANY_ID, actor: "e1", action: "kpi.update_target", entity: "kpi", entity_id: "k1", before: { target_value: 4_800_000_000 }, after: { target_value: 5_000_000_000 }, ip_address: "203.113.10.2", user_agent: "Mozilla/5.0 (Macintosh) Chrome/124", request_id: null, created_at: "2026-04-01T08:30:00Z" },
  { id: "au2", company_id: DEMO_COMPANY_ID, actor: "e2", action: "employee.create", entity: "employee", entity_id: "e14", before: null, after: { full_name: "Đinh Hà O" }, ip_address: "203.113.10.2", user_agent: "Mozilla/5.0 (Windows) Chrome/124", request_id: null, created_at: "2026-03-15T10:00:00Z" },
  { id: "au3", company_id: DEMO_COMPANY_ID, actor: "e3", action: "payroll.override", entity: "payroll_entries", entity_id: "pe8", before: { bonus_total: 3_000_000 }, after: { bonus_total: 5_000_000 }, ip_address: "171.241.20.5", user_agent: "Mozilla/5.0 (iPhone) Safari/17", request_id: null, created_at: "2026-04-22T14:00:00Z" },
  { id: "au4", company_id: DEMO_COMPANY_ID, actor: "e1", action: "kpi.formula_update", entity: "kpi_formulas", entity_id: "k1", before: null, after: { formula_type: "composite" }, ip_address: "203.113.10.2", user_agent: "Mozilla/5.0 (Macintosh) Chrome/124", request_id: null, created_at: "2026-04-20T16:00:00Z" },
];

// Phase 1 — Attendance demo data
export type DemoAttendanceLocation = {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_m: number;
  ip_whitelist: string[];
  active: boolean;
};

export type DemoAttendanceShift = {
  id: string;
  company_id: string;
  code: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  late_grace_minutes: number;
  early_leave_grace_minutes: number;
  is_overnight: boolean;
  active: boolean;
};

export type DemoAttendanceRecord = {
  id: string;
  company_id: string;
  employee_id: string;
  work_date: string;
  shift_id: string | null;
  location_id: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  late_minutes: number;
  early_leave_minutes: number;
  worked_minutes: number;
  status: "present" | "late" | "early_leave" | "absent" | "on_leave" | "holiday" | "remote" | "incomplete";
  source: "web" | "mobile" | "biometric" | "manual" | "import";
  note: string | null;
};

export const demoAttendanceLocations: DemoAttendanceLocation[] = [
  {
    id: "loc-hq-hanoi",
    company_id: DEMO_COMPANY_ID,
    name: "Văn phòng Hà Nội",
    address: "Tầng 7, Tòa nhà Detech II, 107 Nguyễn Phong Sắc, Cầu Giấy, Hà Nội",
    latitude: 21.038211,
    longitude: 105.78256,
    radius_m: 200,
    ip_whitelist: ["27.72.0.1"],
    active: true,
  },
  {
    id: "loc-hq-hcm",
    company_id: DEMO_COMPANY_ID,
    name: "Chi nhánh TP. Hồ Chí Minh",
    address: "Lầu 5, Toà nhà Bitexco, Quận 1, TP. HCM",
    latitude: 10.771679,
    longitude: 106.704423,
    radius_m: 150,
    ip_whitelist: ["14.169.0.1"],
    active: true,
  },
];

export const demoAttendanceShifts: DemoAttendanceShift[] = [
  {
    id: "shift-day",
    company_id: DEMO_COMPANY_ID,
    code: "DAY",
    name: "Ca hành chính",
    start_time: "08:30",
    end_time: "17:30",
    break_minutes: 60,
    late_grace_minutes: 5,
    early_leave_grace_minutes: 5,
    is_overnight: false,
    active: true,
  },
  {
    id: "shift-flex",
    company_id: DEMO_COMPANY_ID,
    code: "FLEX",
    name: "Ca linh hoạt",
    start_time: "09:00",
    end_time: "18:00",
    break_minutes: 60,
    late_grace_minutes: 15,
    early_leave_grace_minutes: 15,
    is_overnight: false,
    active: true,
  },
];

function isoOffsetDays(days: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatLocalISODate(d);
}

export const demoMyAttendanceRecords: DemoAttendanceRecord[] = [
  {
    id: "att-1",
    company_id: DEMO_COMPANY_ID,
    employee_id: "e1",
    work_date: dateOffset(1),
    shift_id: "shift-day",
    location_id: "loc-hq-hanoi",
    check_in_at: isoOffsetDays(1, 8, 28),
    check_out_at: isoOffsetDays(1, 17, 35),
    late_minutes: 0,
    early_leave_minutes: 0,
    worked_minutes: 9 * 60 + 7,
    status: "present",
    source: "web",
    note: null,
  },
  {
    id: "att-2",
    company_id: DEMO_COMPANY_ID,
    employee_id: "e1",
    work_date: dateOffset(2),
    shift_id: "shift-day",
    location_id: "loc-hq-hanoi",
    check_in_at: isoOffsetDays(2, 8, 47),
    check_out_at: isoOffsetDays(2, 17, 40),
    late_minutes: 12,
    early_leave_minutes: 0,
    worked_minutes: 8 * 60 + 53,
    status: "late",
    source: "web",
    note: "Tắc đường",
  },
  {
    id: "att-3",
    company_id: DEMO_COMPANY_ID,
    employee_id: "e1",
    work_date: dateOffset(3),
    shift_id: "shift-day",
    location_id: "loc-hq-hanoi",
    check_in_at: isoOffsetDays(3, 8, 25),
    check_out_at: isoOffsetDays(3, 16, 50),
    late_minutes: 0,
    early_leave_minutes: 35,
    worked_minutes: 8 * 60 + 25,
    status: "early_leave",
    source: "web",
    note: null,
  },
  {
    id: "att-4",
    company_id: DEMO_COMPANY_ID,
    employee_id: "e1",
    work_date: dateOffset(4),
    shift_id: "shift-day",
    location_id: "loc-hq-hanoi",
    check_in_at: isoOffsetDays(4, 8, 30),
    check_out_at: isoOffsetDays(4, 17, 32),
    late_minutes: 0,
    early_leave_minutes: 0,
    worked_minutes: 9 * 60 + 2,
    status: "present",
    source: "mobile",
    note: null,
  },
];

// Phase 1 — Leave management demo data
export type DemoLeaveType = {
  id: string;
  company_id: string;
  code: string;
  name: string;
  paid: boolean;
  default_quota_days: number | null;
  carry_over_max_days: number;
  requires_attachment: boolean;
  description: string | null;
  active: boolean;
};

export type DemoLeaveBalance = {
  id: string;
  company_id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  entitled_days: number;
  carried_over_days: number;
  used_days: number;
  pending_days: number;
  adjustment_days: number;
};

export type DemoLeaveRequest = {
  id: string;
  company_id: string;
  employee_id: string;
  leave_type_id: string;
  starts_on: string;
  ends_on: string;
  half_day_start: boolean;
  half_day_end: boolean;
  total_days: number;
  reason: string | null;
  handover_to: string | null;
  status: "draft" | "pending" | "approved" | "rejected" | "cancelled";
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
};

export type DemoHoliday = {
  id: string;
  company_id: string | null;
  name: string;
  holiday_date: string;
  is_paid: boolean;
  is_substitute: boolean;
  notes: string | null;
};

export const demoLeaveTypes: DemoLeaveType[] = [
  { id: "lt-annual", company_id: DEMO_COMPANY_ID, code: "ANNUAL", name: "Phép năm", paid: true, default_quota_days: 12, carry_over_max_days: 5, requires_attachment: false, description: "12 ngày/năm + 1 ngày sau mỗi 5 năm thâm niên", active: true },
  { id: "lt-sick", company_id: DEMO_COMPANY_ID, code: "SICK", name: "Nghỉ ốm", paid: true, default_quota_days: null, carry_over_max_days: 0, requires_attachment: true, description: "BHXH chi trả khi có giấy nghỉ", active: true },
  { id: "lt-maternity", company_id: DEMO_COMPANY_ID, code: "MATERNITY", name: "Nghỉ thai sản", paid: true, default_quota_days: 180, carry_over_max_days: 0, requires_attachment: true, description: "6 tháng cho nữ, 5-14 ngày cho nam", active: true },
  { id: "lt-marriage", company_id: DEMO_COMPANY_ID, code: "MARRIAGE", name: "Nghỉ kết hôn", paid: true, default_quota_days: 3, carry_over_max_days: 0, requires_attachment: false, description: "3 ngày", active: true },
  { id: "lt-bereavement", company_id: DEMO_COMPANY_ID, code: "BEREAVEMENT", name: "Nghỉ hiếu", paid: true, default_quota_days: 3, carry_over_max_days: 0, requires_attachment: false, description: "3 ngày khi tứ thân phụ mẫu, vợ/chồng, con qua đời", active: true },
  { id: "lt-unpaid", company_id: DEMO_COMPANY_ID, code: "UNPAID", name: "Nghỉ không lương", paid: false, default_quota_days: null, carry_over_max_days: 0, requires_attachment: false, description: "Theo thỏa thuận với công ty", active: true },
  { id: "lt-comp", company_id: DEMO_COMPANY_ID, code: "COMP", name: "Nghỉ bù", paid: true, default_quota_days: null, carry_over_max_days: 0, requires_attachment: false, description: "Bù sau OT hoặc làm cuối tuần", active: true },
];

export const demoLeaveBalances: DemoLeaveBalance[] = [
  { id: "lb-e1-annual", company_id: DEMO_COMPANY_ID, employee_id: "e1", leave_type_id: "lt-annual", year: 2026, entitled_days: 12, carried_over_days: 3, used_days: 4, pending_days: 1, adjustment_days: 0 },
  { id: "lb-e1-sick", company_id: DEMO_COMPANY_ID, employee_id: "e1", leave_type_id: "lt-sick", year: 2026, entitled_days: 0, carried_over_days: 0, used_days: 1, pending_days: 0, adjustment_days: 0 },
  { id: "lb-e1-comp", company_id: DEMO_COMPANY_ID, employee_id: "e1", leave_type_id: "lt-comp", year: 2026, entitled_days: 2, carried_over_days: 0, used_days: 0, pending_days: 0, adjustment_days: 0 },
];

function dateOffsetDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatLocalISODate(d);
}

export const demoLeaveRequests: DemoLeaveRequest[] = [
  { id: "lr-1", company_id: DEMO_COMPANY_ID, employee_id: "e8", leave_type_id: "lt-annual", starts_on: dateOffsetDays(3), ends_on: dateOffsetDays(4), half_day_start: false, half_day_end: false, total_days: 2, reason: "Việc gia đình", handover_to: "e9", status: "pending", decided_by: null, decided_at: null, decision_note: null, created_at: new Date(Date.now() - 86_400_000).toISOString() },
  { id: "lr-2", company_id: DEMO_COMPANY_ID, employee_id: "e10", leave_type_id: "lt-sick", starts_on: dateOffsetDays(-1), ends_on: dateOffsetDays(-1), half_day_start: false, half_day_end: false, total_days: 1, reason: "Sốt cao", handover_to: null, status: "approved", decided_by: "e5", decided_at: new Date(Date.now() - 86_400_000).toISOString(), decision_note: "OK", created_at: new Date(Date.now() - 2 * 86_400_000).toISOString() },
  { id: "lr-3", company_id: DEMO_COMPANY_ID, employee_id: "e1", leave_type_id: "lt-annual", starts_on: dateOffsetDays(7), ends_on: dateOffsetDays(7), half_day_start: false, half_day_end: false, total_days: 1, reason: "Du lịch", handover_to: "e2", status: "pending", decided_by: null, decided_at: null, decision_note: null, created_at: new Date().toISOString() },
  { id: "lr-4", company_id: DEMO_COMPANY_ID, employee_id: "e1", leave_type_id: "lt-annual", starts_on: dateOffsetDays(-14), ends_on: dateOffsetDays(-12), half_day_start: false, half_day_end: false, total_days: 3, reason: "Về quê", handover_to: "e2", status: "approved", decided_by: "e2", decided_at: new Date(Date.now() - 15 * 86_400_000).toISOString(), decision_note: null, created_at: new Date(Date.now() - 16 * 86_400_000).toISOString() },
  { id: "lr-5", company_id: DEMO_COMPANY_ID, employee_id: "e11", leave_type_id: "lt-annual", starts_on: dateOffsetDays(5), ends_on: dateOffsetDays(5), half_day_start: false, half_day_end: false, total_days: 1, reason: "Đi khám", handover_to: null, status: "approved", decided_by: "e5", decided_at: new Date().toISOString(), decision_note: null, created_at: new Date(Date.now() - 86_400_000).toISOString() },
];

export const demoHolidaysVN: DemoHoliday[] = [
  { id: "h1", company_id: null, name: "Tết Dương lịch", holiday_date: "2026-01-01", is_paid: true, is_substitute: false, notes: null },
  { id: "h2", company_id: null, name: "Tết Nguyên đán", holiday_date: "2026-02-16", is_paid: true, is_substitute: false, notes: "Mùng 1 Tết Bính Ngọ" },
  { id: "h3", company_id: null, name: "Tết Nguyên đán", holiday_date: "2026-02-17", is_paid: true, is_substitute: false, notes: "Mùng 2 Tết" },
  { id: "h4", company_id: null, name: "Tết Nguyên đán", holiday_date: "2026-02-18", is_paid: true, is_substitute: false, notes: "Mùng 3 Tết" },
  { id: "h5", company_id: null, name: "Tết Nguyên đán", holiday_date: "2026-02-19", is_paid: true, is_substitute: false, notes: "Mùng 4 Tết" },
  { id: "h6", company_id: null, name: "Tết Nguyên đán", holiday_date: "2026-02-20", is_paid: true, is_substitute: false, notes: "Mùng 5 Tết" },
  { id: "h7", company_id: null, name: "Giỗ Tổ Hùng Vương", holiday_date: "2026-04-26", is_paid: true, is_substitute: false, notes: "10/3 ÂL" },
  { id: "h8", company_id: null, name: "Giải phóng miền Nam", holiday_date: "2026-04-30", is_paid: true, is_substitute: false, notes: null },
  { id: "h9", company_id: null, name: "Quốc tế Lao động", holiday_date: "2026-05-01", is_paid: true, is_substitute: false, notes: null },
  { id: "h10", company_id: null, name: "Quốc khánh", holiday_date: "2026-09-02", is_paid: true, is_substitute: false, notes: null },
  { id: "h11", company_id: null, name: "Quốc khánh (nghỉ liền kề)", holiday_date: "2026-09-01", is_paid: true, is_substitute: false, notes: "Theo Bộ luật LĐ 2019" },
];

// ============================================================
// SCHEDULING / ROSTERING demo data
// ============================================================

export type DemoShiftTemplate = {
  id: string;
  company_id: string;
  code: string;
  name: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  is_overnight: boolean;
  role_required: string | null;
  min_staff: number;
  max_staff: number | null;
  hourly_rate_multiplier: number;
  night_multiplier: number;
  weekend_multiplier: number;
  holiday_multiplier: number;
  color: string;
  active: boolean;
};

export type DemoSchedulePeriod = {
  id: string;
  company_id: string;
  week_start: string;
  week_end: string;
  status: "draft" | "published" | "locked";
  published_at: string | null;
  notes: string | null;
};

export type DemoScheduledShift = {
  id: string;
  company_id: string;
  period_id: string;
  shift_template_id: string;
  employee_id: string;
  shift_date: string;
  status: "scheduled" | "confirmed" | "no_show" | "cancelled";
  override_start: string | null;
  override_end: string | null;
  note: string | null;
};

export type DemoShiftSwapRequest = {
  id: string;
  company_id: string;
  request_type: "drop" | "swap";
  requester_shift_id: string;
  receiver_shift_id: string | null;
  receiver_id: string | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
};

export const demoShiftTemplates: DemoShiftTemplate[] = [
  {
    id: "sht-morning",
    company_id: DEMO_COMPANY_ID,
    code: "MORNING",
    name: "Ca Sáng",
    start_time: "07:00",
    end_time: "14:00",
    break_minutes: 30,
    is_overnight: false,
    role_required: null,
    min_staff: 2,
    max_staff: 5,
    hourly_rate_multiplier: 1.0,
    night_multiplier: 1.3,
    weekend_multiplier: 2.0,
    holiday_multiplier: 3.0,
    color: "#F59E0B",
    active: true,
  },
  {
    id: "sht-afternoon",
    company_id: DEMO_COMPANY_ID,
    code: "AFTERNOON",
    name: "Ca Chiều",
    start_time: "14:00",
    end_time: "22:00",
    break_minutes: 30,
    is_overnight: false,
    role_required: null,
    min_staff: 2,
    max_staff: 4,
    hourly_rate_multiplier: 1.0,
    night_multiplier: 1.3,
    weekend_multiplier: 2.0,
    holiday_multiplier: 3.0,
    color: "#6D5EF7",
    active: true,
  },
  {
    id: "sht-night",
    company_id: DEMO_COMPANY_ID,
    code: "NIGHT",
    name: "Ca Đêm",
    start_time: "22:00",
    end_time: "06:00",
    break_minutes: 60,
    is_overnight: true,
    role_required: null,
    min_staff: 1,
    max_staff: 3,
    hourly_rate_multiplier: 1.3,
    night_multiplier: 1.3,
    weekend_multiplier: 2.0,
    holiday_multiplier: 3.0,
    color: "#1E2458",
    active: true,
  },
  {
    id: "sht-office",
    company_id: DEMO_COMPANY_ID,
    code: "OFFICE",
    name: "Ca Hành chính",
    start_time: "08:30",
    end_time: "17:30",
    break_minutes: 60,
    is_overnight: false,
    role_required: null,
    min_staff: 1,
    max_staff: null,
    hourly_rate_multiplier: 1.0,
    night_multiplier: 1.3,
    weekend_multiplier: 2.0,
    holiday_multiplier: 3.0,
    color: "#10B981",
    active: true,
  },
];

function mondayOfCurrentWeek(): Date {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateStr(base: Date, offsetDays: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  return formatLocalISODate(d);
}

const _weekStart = mondayOfCurrentWeek();
const _weekEnd   = new Date(_weekStart);
_weekEnd.setDate(_weekEnd.getDate() + 6);

export const demoSchedulePeriods: DemoSchedulePeriod[] = [
  {
    id: "sp-current",
    company_id: DEMO_COMPANY_ID,
    week_start: formatLocalISODate(_weekStart),
    week_end: formatLocalISODate(_weekEnd),
    status: "published",
    published_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    notes: null,
  },
];

// Employees for demo: e1..e4 are part-time/office workers
export const demoScheduledShifts: DemoScheduledShift[] = [
  // Monday
  { id: "ss-1",  company_id: DEMO_COMPANY_ID, period_id: "sp-current", shift_template_id: "sht-morning",   employee_id: "e1",  shift_date: dateStr(_weekStart, 0), status: "confirmed", override_start: null, override_end: null, note: null },
  { id: "ss-2",  company_id: DEMO_COMPANY_ID, period_id: "sp-current", shift_template_id: "sht-afternoon", employee_id: "e2",  shift_date: dateStr(_weekStart, 0), status: "scheduled", override_start: null, override_end: null, note: null },
  { id: "ss-3",  company_id: DEMO_COMPANY_ID, period_id: "sp-current", shift_template_id: "sht-morning",   employee_id: "e3",  shift_date: dateStr(_weekStart, 0), status: "scheduled", override_start: null, override_end: null, note: null },
  // Tuesday
  { id: "ss-4",  company_id: DEMO_COMPANY_ID, period_id: "sp-current", shift_template_id: "sht-morning",   employee_id: "e2",  shift_date: dateStr(_weekStart, 1), status: "scheduled", override_start: null, override_end: null, note: null },
  { id: "ss-5",  company_id: DEMO_COMPANY_ID, period_id: "sp-current", shift_template_id: "sht-afternoon", employee_id: "e4",  shift_date: dateStr(_weekStart, 1), status: "scheduled", override_start: null, override_end: null, note: null },
  { id: "ss-6",  company_id: DEMO_COMPANY_ID, period_id: "sp-current", shift_template_id: "sht-night",     employee_id: "e1",  shift_date: dateStr(_weekStart, 1), status: "scheduled", override_start: null, override_end: null, note: null },
  // Wednesday
  { id: "ss-7",  company_id: DEMO_COMPANY_ID, period_id: "sp-current", shift_template_id: "sht-morning",   employee_id: "e3",  shift_date: dateStr(_weekStart, 2), status: "scheduled", override_start: null, override_end: null, note: null },
  { id: "ss-8",  company_id: DEMO_COMPANY_ID, period_id: "sp-current", shift_template_id: "sht-afternoon", employee_id: "e1",  shift_date: dateStr(_weekStart, 2), status: "scheduled", override_start: null, override_end: null, note: null },
  // Thursday
  { id: "ss-9",  company_id: DEMO_COMPANY_ID, period_id: "sp-current", shift_template_id: "sht-morning",   employee_id: "e4",  shift_date: dateStr(_weekStart, 3), status: "no_show",   override_start: null, override_end: null, note: "Không liên lạc được" },
  { id: "ss-10", company_id: DEMO_COMPANY_ID, period_id: "sp-current", shift_template_id: "sht-afternoon", employee_id: "e2",  shift_date: dateStr(_weekStart, 3), status: "scheduled", override_start: null, override_end: null, note: null },
  // Friday
  { id: "ss-11", company_id: DEMO_COMPANY_ID, period_id: "sp-current", shift_template_id: "sht-morning",   employee_id: "e1",  shift_date: dateStr(_weekStart, 4), status: "scheduled", override_start: null, override_end: null, note: null },
  { id: "ss-12", company_id: DEMO_COMPANY_ID, period_id: "sp-current", shift_template_id: "sht-afternoon", employee_id: "e3",  shift_date: dateStr(_weekStart, 4), status: "scheduled", override_start: null, override_end: null, note: null },
  // Saturday
  { id: "ss-13", company_id: DEMO_COMPANY_ID, period_id: "sp-current", shift_template_id: "sht-morning",   employee_id: "e2",  shift_date: dateStr(_weekStart, 5), status: "scheduled", override_start: null, override_end: null, note: null },
  { id: "ss-14", company_id: DEMO_COMPANY_ID, period_id: "sp-current", shift_template_id: "sht-afternoon", employee_id: "e4",  shift_date: dateStr(_weekStart, 5), status: "scheduled", override_start: null, override_end: null, note: null },
];

export const demoShiftSwapRequests: DemoShiftSwapRequest[] = [
  {
    id: "sw-1",
    company_id: DEMO_COMPANY_ID,
    request_type: "drop",
    requester_shift_id: "ss-6",
    receiver_shift_id: null,
    receiver_id: null,
    reason: "Bận việc gia đình",
    status: "pending",
    decided_by: null,
    decided_at: null,
    decision_note: null,
    created_at: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: "sw-2",
    company_id: DEMO_COMPANY_ID,
    request_type: "swap",
    requester_shift_id: "ss-5",
    receiver_shift_id: "ss-8",
    receiver_id: "e1",
    reason: "Muốn đổi sang ca chiều thứ tư",
    status: "approved",
    decided_by: "e2",
    decided_at: new Date(Date.now() - 86_400_000).toISOString(),
    decision_note: "OK",
    created_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
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
