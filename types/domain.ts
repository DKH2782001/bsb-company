// Tối giản types cho các query helper. Không generate từ supabase gen types
// để tránh phụ thuộc lúc build nếu chưa có project thật.

export type Company = {
  id: string;
  name: string;
  code: string | null;
  currency: string;
  timezone: string;
  settings: Record<string, unknown>;
};

export type Department = {
  id: string;
  company_id: string;
  name: string;
  code: string | null;
  head_employee_id: string | null;
  budget_monthly: number;
  scope: string | null;
};

export type Team = {
  id: string;
  company_id: string;
  department_id: string;
  name: string;
  lead_employee_id: string | null;
};

export type Position = {
  id: string;
  company_id: string;
  name: string;
  level: string | null;
  base_salary_min: number | null;
  base_salary_max: number | null;
};

export type Employee = {
  id: string;
  company_id: string;
  auth_user_id: string | null;
  code: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  department_id: string | null;
  team_id: string | null;
  position_id: string | null;
  manager_id: string | null;
  join_date: string | null;
  status: "active" | "onboarding" | "on_leave" | "terminated";
  base_salary: number;
  employment_type: "fulltime" | "parttime" | "contract" | "intern" | "freelance";
};

export type KpiLevel = "company" | "department" | "team" | "employee";
export type KpiCalcMode = "sum" | "ratio" | "formula" | "manual";

export type Kpi = {
  id: string;
  company_id: string;
  code: string | null;
  name: string;
  description: string | null;
  level: KpiLevel;
  owner_employee_id: string | null;
  owner_department_id: string | null;
  owner_team_id: string | null;
  unit: string;
  weight: number;
  parent_kpi_id: string | null;
  data_source: string | null;
  active: boolean;
  target_frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  calc_mode?: KpiCalcMode | null;
};

export type KpiFormulaDef =
  | { op: "sum" | "mul" | "sub" | "avg" | "weighted_avg"; args: KpiFormulaDef[] }
  | { op: "ratio"; numerator: KpiFormulaDef; denominator: KpiFormulaDef }
  | { op: "milestone"; steps: Array<{ at: number; value: number }> }
  | { op: "manual"; value: number }
  | { ref: string }
  | { const: number };

export type KpiActual = {
  kpi_id: string;
  period: string;
  actual_value: number;
  completion_rate: number | null;
  status: string | null;
};

export type KpiTarget = {
  kpi_id: string;
  period: string;
  target_value: number;
};

export type KpiFormula = {
  kpi_id: string;
  formula_type: string;
  definition: KpiFormulaDef;
};

export type ExecutionStatus = "green" | "yellow" | "red";

export type DepartmentResultKpi = {
  id: string;
  name: string;
  department_id: string;
  department_name: string;
  period: string;
  type: "result_kpi";
  unit: string;
  target: number;
  actual: number;
  data_source: string;
  rollup_mode: "manual" | "third_party" | "import";
  status: ExecutionStatus;
  days_left: number;
  last_updated_at: string;
};

export type ActionPlanStatus = "draft" | "active" | "completed" | "paused";

export type ActionPlan = {
  id: string;
  linked_kpi_id: string;
  title: string;
  description: string;
  owner_id: string;
  department_id: string;
  period: string;
  status: ActionPlanStatus;
  expected_impact_text: string;
  progress_percent: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  blocked_tasks: number;
};

export type ActionMetric = {
  id: string;
  action_plan_id: string;
  name: string;
  unit: string;
  target: number;
  actual: number;
  completion: number;
  owner_id: string | null;
  assignee_id: string | null;
  status: ExecutionStatus;
};

export type EmployeeRiskStatus = "green" | "yellow" | "red";

export type EmployeeExecution = {
  employee_id: string;
  employee_name: string;
  role: string;
  department_id: string;
  linked_kpi_id: string;
  linked_action_plan_id: string;
  assigned_tasks: number;
  done_tasks: number;
  overdue_tasks: number;
  blocked_tasks: number;
  action_target_name: string;
  action_target_value: number;
  action_actual_value: number;
  action_completion: number;
  sla_score: number;
  quality_score: number;
  risk_status: EmployeeRiskStatus;
};

export type Task = {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  reviewer_id: string | null;
  department_id: string | null;
  project_id: string | null;
  linked_kpi_id: string | null;
  linked_action_plan_id?: string | null;
  action_metric_id?: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  task_type: "growth" | "maintenance" | "admin" | "urgent";
  status: "todo" | "in_progress" | "blocked" | "review" | "done" | "cancelled";
  start_date?: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  action_target_value?: number | null;
  action_actual_value?: number | null;
  task_weight?: number | null;
  progress_unit?: string | null;
  quality_score?: number | null;
  sla_score?: number | null;
  recurrence_rule?: string | null;
  blocked_reason?: string | null;
  completion_proof?: string | null;
  sprint_id: string | null;
  story_points: number | null;
  parent_task_id: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TaskResult = {
  id: string;
  task_id: string;
  type: "link" | "file";
  url: string;
  label: string;
  note: string | null;
  created_at: string;
  created_by: string | null;
};

export type TaskComment = {
  id: string;
  task_id: string;
  author_id: string | null;
  content: string;
  created_at: string;
};

export type Sprint = {
  id: string;
  company_id: string;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: "planning" | "active" | "completed";
  capacity: number;
  velocity: number | null;
  completed_points: number | null;
  carry_over_points: number | null;
  completion_rate: number | null;
  created_at: string;
  completed_at: string | null;
  retrospective: {
    went_well: string[];
    to_improve: string[];
    action_items: string[];
  } | null;
};

export type PayrollEntry = {
  id: string;
  company_id: string;
  payroll_period_id: string;
  employee_id: string;
  base_salary: number;
  allowance_total: number;
  commission_total: number;
  bonus_total: number;
  penalty_total: number;
  adjustment_total: number;
  gross_pay: number;
  net_pay: number;
  company_cost: number;
  breakdown: Record<string, unknown>;
};

export type Project = {
  id: string;
  company_id: string;
  code: string | null;
  name: string;
  owner_id: string | null;
  business_case: string | null;
  status: "draft" | "active" | "paused" | "done" | "cancelled";
  starts_at: string | null;
  ends_at: string | null;
  budget: number;
};

export type AccountingEntry = {
  id: string;
  company_id: string;
  entry_date: string;
  account_code: string;
  debit: number;
  credit: number;
  cost_center_id: string | null;
  department_id: string | null;
  project_id: string | null;
  note: string | null;
};

export type Alert = {
  id: string;
  company_id: string;
  severity: "info" | "warning" | "danger" | "critical";
  title: string;
  detail: Record<string, unknown>;
  resolved_at: string | null;
  created_at: string;
};

export type Approval = {
  id: string;
  company_id: string;
  kind: string;
  title: string;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requested_by: string | null;
  decided_by?: string | null;
  decided_at?: string | null;
  decision_note?: string | null;
  created_at: string;
};

export type Objective = {
  id: string;
  company_id: string;
  level: KpiLevel;
  owner_employee_id: string | null;
  owner_department_id: string | null;
  title: string;
  description: string | null;
  period: string;
  status: string | null;
  progress_pct: number;
};

export type KeyResult = {
  id: string;
  objective_id: string;
  title: string;
  target_value: number | null;
  actual_value: number | null;
  unit: string | null;
  progress_pct: number;
};

export type JobRequisition = {
  id: string;
  company_id: string;
  department_id: string | null;
  position_id: string | null;
  title: string;
  headcount: number;
  status: string;
  reason: string | null;
  opened_at: string | null;
  closed_at: string | null;
};

export type SopDocument = {
  id: string;
  company_id: string;
  department_id: string | null;
  title: string;
  body: string | null;
  version: number;
  published: boolean;
};

export type Notification = {
  id: string;
  company_id: string;
  auth_user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  company_id: string;
  actor: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  created_at: string;
};

export type ContractType =
  | "probation"
  | "fixed_term"
  | "indefinite"
  | "internship"
  | "collaborator";

export type ContractStatus =
  | "draft"
  | "active"
  | "expiring_soon"
  | "expired"
  | "terminated"
  | "renewed";

export type EmploymentContract = {
  id: string;
  company_id: string;
  employee_id: string;
  starts_at: string;
  ends_at: string | null;
  base_salary: number;
  allowances: Record<string, unknown> | null;
  document_url: string | null;
  code: string | null;
  contract_type: ContractType;
  status: ContractStatus;
  position_id: string | null;
  department_id: string | null;
  probation_ends_at: string | null;
  signed_at: string | null;
  terminated_at: string | null;
  termination_reason: string | null;
  notice_period_days: number;
  working_hours_per_week: number;
  currency: string;
  notes: string | null;
  updated_at: string;
};

export type ContractAmendment = {
  id: string;
  company_id: string;
  contract_id: string;
  amendment_no: number;
  effective_from: string;
  changes: Record<string, unknown>;
  reason: string | null;
  document_url: string | null;
  signed_at: string | null;
  created_at: string;
};

export type EmployeeDocument = {
  id: string;
  company_id: string;
  employee_id: string;
  doc_type: string;
  label: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  expires_on: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type EmployeeDependent = {
  id: string;
  company_id: string;
  employee_id: string;
  full_name: string;
  relationship: string;
  date_of_birth: string | null;
  national_id: string | null;
  tax_code: string | null;
  starts_on: string | null;
  ends_on: string | null;
  notes: string | null;
  created_at: string;
};

export type OnboardingKind = "onboarding" | "offboarding";
export type OnboardingRunStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "cancelled";
export type OnboardingTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped"
  | "overdue";

export type OnboardingTemplate = {
  id: string;
  company_id: string;
  name: string;
  kind: OnboardingKind;
  description: string | null;
  active: boolean;
  created_at: string;
};

export type OnboardingTemplateTask = {
  id: string;
  company_id: string;
  template_id: string;
  sort_order: number;
  title: string;
  description: string | null;
  default_owner_role: string | null;
  due_offset_days: number;
  required: boolean;
};

export type OnboardingRun = {
  id: string;
  company_id: string;
  template_id: string | null;
  employee_id: string;
  kind: OnboardingKind;
  status: OnboardingRunStatus;
  started_on: string;
  target_done_on: string | null;
  completed_at: string | null;
  notes: string | null;
  updated_at: string;
};

export type OnboardingRunTask = {
  id: string;
  company_id: string;
  run_id: string;
  template_task_id: string | null;
  sort_order: number;
  title: string;
  description: string | null;
  owner_employee_id: string | null;
  due_on: string | null;
  status: OnboardingTaskStatus;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
};
