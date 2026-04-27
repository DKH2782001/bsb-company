import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((v): string | undefined => {
    if (v === undefined) return undefined;
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

const requiredText = (label: string, min = 1, max = 200) =>
  z
    .string({ message: `${label} là bắt buộc` })
    .trim()
    .min(min, `${label} là bắt buộc`)
    .max(max, `${label} tối đa ${max} ký tự`);

const nonNegative = (label: string) =>
  z
    .number({ message: `${label} phải là số` })
    .nonnegative(`${label} phải ≥ 0`)
    .finite();

export const employmentTypeEnum = z.enum([
  "fulltime",
  "parttime",
  "contract",
  "intern",
  "freelance",
]);

export const employeeStatusEnum = z.enum([
  "active",
  "onboarding",
  "on_leave",
  "terminated",
]);

const employeeBase = z.object({
  id: optionalString,
  fullName: requiredText("Họ tên", 2, 120),
  email: z
    .string()
    .trim()
    .min(1, "Email là bắt buộc")
    .email("Email không hợp lệ"),
  departmentId: optionalString,
  managerId: optionalString,
  baseSalary: nonNegative("Lương cơ bản"),
  employmentType: employmentTypeEnum,
  status: employeeStatusEnum,
});

// Schema validate dùng chung input/output (không có transform top-level / default)
export const employeeUpsertSchema = employeeBase;
export type EmployeeUpsertInput = z.input<typeof employeeUpsertSchema>;
export type EmployeeUpsertOutput = z.output<typeof employeeUpsertSchema>;

const departmentBase = z.object({
  id: optionalString,
  name: requiredText("Tên phòng ban", 2, 120),
  code: optionalString,
  scope: optionalString,
  budgetMonthly: nonNegative("Budget tháng"),
  headEmployeeId: optionalString,
});

export const departmentUpsertSchema = departmentBase;
export type DepartmentUpsertInput = z.input<typeof departmentUpsertSchema>;
export type DepartmentUpsertOutput = z.output<typeof departmentUpsertSchema>;

// ─── KPI ──────────────────────────────────────────────────────────────────
export const kpiLevelEnum = z.enum(["company", "department", "team", "employee"]);
export const kpiFrequencyEnum = z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]);

export const kpiUpsertSchema = z.object({
  id: optionalString,
  name: requiredText("Tên KPI", 2, 200),
  code: optionalString,
  level: kpiLevelEnum,
  unit: requiredText("Đơn vị", 1, 30),
  targetFrequency: kpiFrequencyEnum,
  parentKpiId: optionalString,
  ownerDepartmentId: optionalString,
  ownerEmployeeId: optionalString,
  weight: z.number({ message: "Trọng số phải là số" }).positive("Trọng số > 0"),
  active: z.boolean(),
  // Optional: target cho kỳ hiện tại (chỉ dùng khi tạo)
  targetValue: z.number().nonnegative().optional(),
  period: optionalString,
});
export type KpiUpsertInput = z.input<typeof kpiUpsertSchema>;
export type KpiUpsertOutput = z.output<typeof kpiUpsertSchema>;

// ─── Project ──────────────────────────────────────────────────────────────
export const projectStatusEnum = z.enum(["draft", "active", "paused", "done", "cancelled"]);

export const projectUpsertSchema = z.object({
  id: optionalString,
  name: requiredText("Tên dự án", 2, 200),
  code: optionalString,
  ownerId: optionalString,
  budget: nonNegative("Budget"),
  startsAt: optionalString,
  endsAt: optionalString,
  businessCase: optionalString,
  status: projectStatusEnum,
});
export type ProjectUpsertInput = z.input<typeof projectUpsertSchema>;
export type ProjectUpsertOutput = z.output<typeof projectUpsertSchema>;

// ─── Job Requisition ──────────────────────────────────────────────────────
export const requisitionStatusEnum = z.enum(["open", "pipeline", "filled", "cancelled"]);

export const requisitionUpsertSchema = z.object({
  id: optionalString,
  title: requiredText("Vị trí tuyển", 2, 200),
  departmentId: optionalString,
  headcount: z.number({ message: "Số lượng phải là số" }).int("Số lượng phải nguyên").min(1, "Tối thiểu 1"),
  reason: optionalString,
  status: requisitionStatusEnum,
});
export type RequisitionUpsertInput = z.input<typeof requisitionUpsertSchema>;
export type RequisitionUpsertOutput = z.output<typeof requisitionUpsertSchema>;

// ─── SOP ──────────────────────────────────────────────────────────────────
export const sopUpsertSchema = z.object({
  id: optionalString,
  title: requiredText("Tên SOP", 2, 200),
  departmentId: optionalString,
  body: optionalString,
  published: z.boolean(),
});
export type SopUpsertInput = z.input<typeof sopUpsertSchema>;
export type SopUpsertOutput = z.output<typeof sopUpsertSchema>;

// ─── Accounting Entry ─────────────────────────────────────────────────────
export const accountingEntryUpsertSchema = z
  .object({
    id: optionalString,
    accountCode: requiredText("Account code", 1, 30),
    debit: nonNegative("Debit"),
    credit: nonNegative("Credit"),
    departmentId: optionalString,
    note: optionalString,
    entryDate: requiredText("Ngày bút toán", 8, 20),
  })
  .refine((v) => v.debit > 0 || v.credit > 0, {
    message: "Phải có ít nhất 1 vế (Debit hoặc Credit)",
    path: ["debit"],
  });
export type AccountingEntryUpsertInput = z.input<typeof accountingEntryUpsertSchema>;
export type AccountingEntryUpsertOutput = z.output<typeof accountingEntryUpsertSchema>;

export const contractTypeEnum = z.enum([
  "probation",
  "fixed_term",
  "indefinite",
  "internship",
  "collaborator",
]);

export const contractStatusEnum = z.enum([
  "draft",
  "active",
  "expiring_soon",
  "expired",
  "terminated",
  "renewed",
]);

export const contractUpsertSchema = z.object({
  id: optionalString,
  employeeId: requiredText("Nhân sự", 1, 80),
  code: optionalString,
  contractType: contractTypeEnum,
  status: contractStatusEnum,
  startsAt: requiredText("Ngày hiệu lực", 8, 30),
  endsAt: optionalString,
  probationEndsAt: optionalString,
  signedAt: optionalString,
  baseSalary: nonNegative("Lương cơ bản"),
  currency: requiredText("Tiền tệ", 1, 10),
  noticePeriodDays: z.number({ message: "Notice period phải là số" }).int("Notice period phải là số nguyên").min(0),
  workingHoursPerWeek: nonNegative("Giờ làm việc/tuần"),
  documentUrl: optionalString,
  notes: optionalString,
});
export type ContractUpsertInput = z.input<typeof contractUpsertSchema>;
export type ContractUpsertOutput = z.output<typeof contractUpsertSchema>;

export const contractAmendmentUpsertSchema = z.object({
  contractId: requiredText("Hợp đồng", 1, 80),
  effectiveFrom: requiredText("Ngày hiệu lực", 8, 30),
  summary: requiredText("Nội dung thay đổi", 2, 500),
  reason: optionalString,
  documentUrl: optionalString,
  signedAt: optionalString,
});
export type ContractAmendmentUpsertInput = z.input<typeof contractAmendmentUpsertSchema>;
export type ContractAmendmentUpsertOutput = z.output<typeof contractAmendmentUpsertSchema>;

export const employeeDocumentCreateSchema = z.object({
  employeeId: requiredText("Nhân sự", 1, 80),
  docType: requiredText("Loại hồ sơ", 1, 60),
  label: requiredText("Tên hồ sơ", 2, 120),
  storagePath: requiredText("File", 2, 500),
  mimeType: optionalString,
  sizeBytes: nonNegative("Kích thước"),
  expiresOn: optionalString,
});
export type EmployeeDocumentCreateInput = z.input<typeof employeeDocumentCreateSchema>;
export type EmployeeDocumentCreateOutput = z.output<typeof employeeDocumentCreateSchema>;

export const employeeDependentUpsertSchema = z.object({
  id: optionalString,
  employeeId: requiredText("Nhân sự", 1, 80),
  fullName: requiredText("Họ tên", 2, 120),
  relationship: requiredText("Quan hệ", 1, 60),
  dateOfBirth: optionalString,
  nationalId: optionalString,
  taxCode: optionalString,
  startsOn: optionalString,
  endsOn: optionalString,
  notes: optionalString,
});
export type EmployeeDependentUpsertInput = z.input<typeof employeeDependentUpsertSchema>;
export type EmployeeDependentUpsertOutput = z.output<typeof employeeDependentUpsertSchema>;

export const onboardingKindEnum = z.enum(["onboarding", "offboarding"]);
export const onboardingRunStatusEnum = z.enum(["not_started", "in_progress", "completed", "cancelled"]);
export const onboardingTaskStatusEnum = z.enum(["pending", "in_progress", "completed", "skipped", "overdue"]);

export const onboardingRunCreateSchema = z.object({
  templateId: requiredText("Template", 1, 80),
  employeeId: requiredText("Nhân sự", 1, 80),
  kind: onboardingKindEnum,
  startedOn: requiredText("Ngày bắt đầu", 8, 30),
  targetDoneOn: optionalString,
  notes: optionalString,
});
export type OnboardingRunCreateInput = z.input<typeof onboardingRunCreateSchema>;
export type OnboardingRunCreateOutput = z.output<typeof onboardingRunCreateSchema>;

export const onboardingTaskUpdateSchema = z.object({
  taskId: requiredText("Task", 1, 80),
  status: onboardingTaskStatusEnum,
  notes: optionalString,
});
export type OnboardingTaskUpdateInput = z.input<typeof onboardingTaskUpdateSchema>;
export type OnboardingTaskUpdateOutput = z.output<typeof onboardingTaskUpdateSchema>;
