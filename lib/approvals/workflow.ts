import type { Approval } from "@/types/domain";

export type ApprovalStepStatus = "pending" | "approved" | "rejected" | "cancelled";

export type ApprovalWorkflowStep = {
  id: string;
  sort: number;
  label: string;
  approverRole: string;
  approverEmployeeId: string | null;
  status: ApprovalStepStatus;
  actedAt?: string | null;
  actedBy?: string | null;
  comment?: string | null;
  delegatedFromEmployeeId?: string | null;
};

export type ApprovalWorkflow = {
  version: 1;
  routingRule: string;
  source?: "rule" | "manual";
  currentStepId: string | null;
  steps: ApprovalWorkflowStep[];
  comments?: Array<{
    at: string;
    by: string | null;
    stepId: string | null;
    note: string;
  }>;
  reassignHistory?: Array<{
    at: string;
    by: string | null;
    fromEmployeeId: string | null;
    toEmployeeId: string | null;
    note?: string | null;
    kind: "reassign" | "delegate";
  }>;
};

type ApprovalPayload = Approval["payload"] & {
  approvalWorkflow?: ApprovalWorkflow;
  amount?: number;
  new_budget?: number;
  headcount?: number;
  new_target?: number;
};

const APPROVERS = {
  ceo: "e1",
  hr: "e2",
  cfo: "e3",
  salesHead: "e4",
  marketingHead: "e5",
};

function asPayload(approval: Approval): ApprovalPayload {
  return approval.payload as ApprovalPayload;
}

function approvalAmount(payload: ApprovalPayload) {
  const raw = payload.amount ?? payload.new_budget ?? payload.new_target ?? 0;
  return Number.isFinite(Number(raw)) ? Number(raw) : 0;
}

function uniqSteps(steps: ApprovalWorkflowStep[]) {
  const seen = new Set<string>();
  return steps.filter((step) => {
    const key = step.approverEmployeeId ?? `${step.approverRole}:${step.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildStep(
  approvalId: string,
  sort: number,
  label: string,
  approverRole: string,
  approverEmployeeId: string | null,
): ApprovalWorkflowStep {
  return {
    id: `${approvalId}-step-${sort}`,
    sort,
    label,
    approverRole,
    approverEmployeeId,
    status: "pending",
    actedAt: null,
    actedBy: null,
    comment: null,
  };
}

export function buildManualApprovalWorkflow(args: {
  approvalId: string;
  steps: Array<{
    label: string;
    approverRole?: string | null;
    approverEmployeeId: string | null;
  }>;
}): ApprovalWorkflow {
  const steps = args.steps
    .filter((step) => step.label.trim() || step.approverEmployeeId)
    .map((step, index) => ({
      id: `${args.approvalId}-manual-step-${index + 1}`,
      sort: index + 1,
      label: step.label.trim() || `Bước duyệt ${index + 1}`,
      approverRole: step.approverRole || "manual",
      approverEmployeeId: step.approverEmployeeId,
      status: "pending" as const,
      actedAt: null,
      actedBy: null,
      comment: null,
    }));
  const safeSteps = steps.length
    ? steps
    : [
        {
          id: `${args.approvalId}-manual-step-1`,
          sort: 1,
          label: "CEO duyệt request",
          approverRole: "ceo",
          approverEmployeeId: "e1",
          status: "pending" as const,
          actedAt: null,
          actedBy: null,
          comment: null,
        },
      ];

  return {
    version: 1,
    source: "manual",
    routingRule: "Flow thủ công do người tạo cấu hình.",
    currentStepId: safeSteps[0]?.id ?? null,
    steps: safeSteps,
    comments: [],
    reassignHistory: [],
  };
}

export function buildDefaultApprovalWorkflow(approval: Approval): ApprovalWorkflow {
  const payload = asPayload(approval);
  const amount = approvalAmount(payload);
  const requestedBy = approval.requested_by;
  let routingRule = "Rule mặc định: CEO duyệt cuối.";
  let rawSteps: ApprovalWorkflowStep[];

  switch (approval.kind) {
    case "payroll_adjustment":
      routingRule =
        amount >= 10_000_000
          ? "Payroll adjustment >= 10 triệu: HR Admin → CFO → CEO."
          : "Payroll adjustment < 10 triệu: HR Admin → CFO.";
      rawSteps = [
        buildStep(approval.id, 1, "HR kiểm tra payroll", "hr_admin", APPROVERS.hr),
        buildStep(approval.id, 2, "CFO duyệt ngân sách lương", "cfo", APPROVERS.cfo),
        ...(amount >= 10_000_000 ? [buildStep(approval.id, 3, "CEO duyệt cuối", "ceo", APPROVERS.ceo)] : []),
      ];
      break;
    case "job_requisition":
      routingRule =
        Number(payload.headcount ?? 0) >= 2
          ? "Tuyển dụng từ 2 headcount: Trưởng phòng → HR → CEO."
          : "Tuyển dụng 1 headcount: Trưởng phòng → HR.";
      rawSteps = [
        buildStep(approval.id, 1, "Trưởng phòng xác nhận nhu cầu", "dept_head", APPROVERS.salesHead),
        buildStep(approval.id, 2, "HR duyệt headcount", "hr_admin", APPROVERS.hr),
        ...(Number(payload.headcount ?? 0) >= 2 ? [buildStep(approval.id, 3, "CEO duyệt mở tuyển", "ceo", APPROVERS.ceo)] : []),
      ];
      break;
    case "kpi_change":
      routingRule = "Thay đổi KPI: Trưởng phòng sở hữu KPI → CEO.";
      rawSteps = [
        buildStep(approval.id, 1, "Trưởng phòng xác nhận KPI", "dept_head", APPROVERS.marketingHead),
        buildStep(approval.id, 2, "CEO duyệt thay đổi KPI", "ceo", APPROVERS.ceo),
      ];
      break;
    case "project_budget":
      routingRule =
        amount >= 100_000_000
          ? "Budget dự án >= 100 triệu: CFO → CEO."
          : "Budget dự án < 100 triệu: CFO.";
      rawSteps = [
        buildStep(approval.id, 1, "CFO kiểm tra ngân sách", "cfo", APPROVERS.cfo),
        ...(amount >= 100_000_000 ? [buildStep(approval.id, 2, "CEO duyệt budget lớn", "ceo", APPROVERS.ceo)] : []),
      ];
      break;
    default:
      rawSteps = [buildStep(approval.id, 1, "CEO duyệt request", "ceo", APPROVERS.ceo)];
      break;
  }

  const steps = uniqSteps(rawSteps.filter((step) => step.approverEmployeeId !== requestedBy));
  const safeSteps = steps.length ? steps : [buildStep(approval.id, 1, "CEO duyệt request", "ceo", APPROVERS.ceo)];
  return {
    version: 1,
    source: "rule",
    routingRule,
    currentStepId: approval.status === "pending" ? safeSteps[0]?.id ?? null : null,
    steps: safeSteps.map((step, index) => ({ ...step, sort: index + 1 })),
    comments: [],
    reassignHistory: [],
  };
}

export function getApprovalWorkflow(approval: Approval): ApprovalWorkflow {
  const existing = asPayload(approval).approvalWorkflow;
  if (existing?.version === 1 && Array.isArray(existing.steps) && existing.steps.length > 0) {
    const pending = existing.steps.find((step) => step.status === "pending");
    return {
      ...existing,
      currentStepId: approval.status === "pending" ? existing.currentStepId ?? pending?.id ?? null : null,
      comments: existing.comments ?? [],
      reassignHistory: existing.reassignHistory ?? [],
    };
  }

  const workflow = buildDefaultApprovalWorkflow(approval);
  if (approval.status === "approved") {
    return {
      ...workflow,
      currentStepId: null,
      steps: workflow.steps.map((step) => ({ ...step, status: "approved" as const })),
    };
  }
  if (approval.status === "rejected") {
    return {
      ...workflow,
      currentStepId: null,
      steps: workflow.steps.map((step, index) => ({
        ...step,
        status: index === 0 ? "rejected" : "cancelled",
      })),
    };
  }
  return workflow;
}

export function getCurrentApprovalStep(approval: Approval) {
  const workflow = getApprovalWorkflow(approval);
  return workflow.steps.find((step) => step.id === workflow.currentStepId) ?? workflow.steps.find((step) => step.status === "pending") ?? null;
}

export function getApprovalProgress(approval: Approval) {
  const workflow = getApprovalWorkflow(approval);
  const total = workflow.steps.length;
  const approved = workflow.steps.filter((step) => step.status === "approved").length;
  return {
    approved,
    total,
    percent: total ? Math.round((approved / total) * 100) : 0,
  };
}

function withWorkflow(approval: Approval, workflow: ApprovalWorkflow): Approval {
  return {
    ...approval,
    payload: {
      ...approval.payload,
      approvalWorkflow: workflow,
    },
  };
}

export function applyApprovalDecision(args: {
  approval: Approval;
  decision: "approved" | "rejected";
  actorEmployeeId: string | null;
  note?: string;
  now?: string;
}): Approval {
  const now = args.now ?? new Date().toISOString();
  const workflow = getApprovalWorkflow(args.approval);
  const current = workflow.steps.find((step) => step.id === workflow.currentStepId) ?? workflow.steps.find((step) => step.status === "pending");
  if (!current || args.approval.status !== "pending") return args.approval;

  const steps = workflow.steps.map((step) => {
    if (step.id !== current.id) return step;
    return {
      ...step,
      status: args.decision,
      actedAt: now,
      actedBy: args.actorEmployeeId,
      comment: args.note?.trim() || null,
    };
  });

  if (args.decision === "rejected") {
    const rejectedWorkflow = {
      ...workflow,
      currentStepId: null,
      steps: steps.map((step) => (step.status === "pending" ? { ...step, status: "cancelled" as const } : step)),
    };
    return {
      ...withWorkflow(args.approval, rejectedWorkflow),
      status: "rejected",
      decided_by: args.actorEmployeeId,
      decided_at: now,
      decision_note: args.note?.trim() || null,
    };
  }

  const nextPending = steps.find((step) => step.status === "pending");
  const nextWorkflow = {
    ...workflow,
    currentStepId: nextPending?.id ?? null,
    steps,
  };
  return {
    ...withWorkflow(args.approval, nextWorkflow),
    status: nextPending ? "pending" : "approved",
    decided_by: nextPending ? args.approval.decided_by ?? null : args.actorEmployeeId,
    decided_at: nextPending ? args.approval.decided_at ?? null : now,
    decision_note: nextPending ? args.approval.decision_note ?? null : args.note?.trim() || null,
  };
}

export function reassignCurrentApprovalStep(args: {
  approval: Approval;
  toEmployeeId: string | null;
  toEmployeeName?: string | null;
  actorEmployeeId: string | null;
  note?: string;
  kind: "reassign" | "delegate";
  now?: string;
}): Approval {
  const now = args.now ?? new Date().toISOString();
  const workflow = getApprovalWorkflow(args.approval);
  const current = workflow.steps.find((step) => step.id === workflow.currentStepId) ?? workflow.steps.find((step) => step.status === "pending");
  if (!current || args.approval.status !== "pending") return args.approval;

  const steps = workflow.steps.map((step) => {
    if (step.id !== current.id) return step;
    return {
      ...step,
      label: args.kind === "delegate" ? `${step.label} (uỷ quyền)` : step.label,
      approverEmployeeId: args.toEmployeeId,
      delegatedFromEmployeeId: args.kind === "delegate" ? current.approverEmployeeId : step.delegatedFromEmployeeId ?? null,
      comment: args.note?.trim() || (step.comment ?? null),
    };
  });

  const nextWorkflow: ApprovalWorkflow = {
    ...workflow,
    steps,
    reassignHistory: [
      ...(workflow.reassignHistory ?? []),
      {
        at: now,
        by: args.actorEmployeeId,
        fromEmployeeId: current.approverEmployeeId,
        toEmployeeId: args.toEmployeeId,
        note: args.note?.trim() || null,
        kind: args.kind,
      },
    ],
  };

  return withWorkflow(args.approval, nextWorkflow);
}

function normalizeStepSort(steps: ApprovalWorkflowStep[]) {
  return steps.map((step, index) => ({ ...step, sort: index + 1 }));
}

function nextComments(args: {
  workflow: ApprovalWorkflow;
  stepId: string | null;
  actorEmployeeId: string | null;
  note?: string;
  now: string;
}) {
  const note = args.note?.trim();
  if (!note) return args.workflow.comments ?? [];
  return [...(args.workflow.comments ?? []), { at: args.now, by: args.actorEmployeeId, stepId: args.stepId, note }];
}

export function returnCurrentApprovalStep(args: {
  approval: Approval;
  actorEmployeeId: string | null;
  note?: string;
  now?: string;
}): Approval {
  const now = args.now ?? new Date().toISOString();
  const workflow = getApprovalWorkflow(args.approval);
  const current = workflow.steps.find((step) => step.id === workflow.currentStepId) ?? workflow.steps.find((step) => step.status === "pending");
  if (!current || args.approval.status !== "pending") return args.approval;

  const currentIndex = workflow.steps.findIndex((step) => step.id === current.id);
  const target =
    [...workflow.steps]
      .slice(0, Math.max(0, currentIndex))
      .reverse()
      .find((step) => step.status === "approved") ?? workflow.steps[0];

  const steps = workflow.steps.map((step) => {
    if (step.sort < target.sort) return step;
    if (step.id === target.id) {
      return {
        ...step,
        status: "pending" as const,
        actedAt: null,
        actedBy: null,
        comment: args.note?.trim() || "Returned for review",
      };
    }
    return {
      ...step,
      status: "pending" as const,
      actedAt: null,
      actedBy: null,
      comment: step.id === current.id ? args.note?.trim() || (step.comment ?? null) : step.comment ?? null,
    };
  });

  return withWorkflow(args.approval, {
    ...workflow,
    currentStepId: target.id,
    steps,
    comments: nextComments({ workflow, stepId: current.id, actorEmployeeId: args.actorEmployeeId, note: args.note, now }),
  });
}

export function insertApprovalStep(args: {
  approval: Approval;
  toEmployeeId: string | null;
  toEmployeeName?: string | null;
  actorEmployeeId: string | null;
  note?: string;
  position: "before_current" | "after_current";
  now?: string;
}): Approval {
  const now = args.now ?? new Date().toISOString();
  const workflow = getApprovalWorkflow(args.approval);
  const current = workflow.steps.find((step) => step.id === workflow.currentStepId) ?? workflow.steps.find((step) => step.status === "pending");
  if (!current || args.approval.status !== "pending" || !args.toEmployeeId) return args.approval;

  const currentIndex = workflow.steps.findIndex((step) => step.id === current.id);
  const insertIndex = args.position === "before_current" ? currentIndex : currentIndex + 1;
  const insertedStep: ApprovalWorkflowStep = {
    id: `${args.approval.id}-added-step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sort: insertIndex + 1,
    label: args.toEmployeeName ? `Bo sung duyet - ${args.toEmployeeName}` : "Bo sung nguoi duyet",
    approverRole: "added_approver",
    approverEmployeeId: args.toEmployeeId,
    status: "pending",
    actedAt: null,
    actedBy: null,
    comment: args.note?.trim() || null,
  };
  const steps = normalizeStepSort([
    ...workflow.steps.slice(0, insertIndex),
    insertedStep,
    ...workflow.steps.slice(insertIndex),
  ]);

  return withWorkflow(args.approval, {
    ...workflow,
    currentStepId: args.position === "before_current" ? insertedStep.id : workflow.currentStepId,
    steps,
    comments: nextComments({ workflow, stepId: current.id, actorEmployeeId: args.actorEmployeeId, note: args.note, now }),
  });
}

export function appendApprovalComment(args: {
  approval: Approval;
  actorEmployeeId: string | null;
  note: string;
  now?: string;
}): Approval {
  const note = args.note.trim();
  if (!note) return args.approval;
  const now = args.now ?? new Date().toISOString();
  const workflow = getApprovalWorkflow(args.approval);
  const current = workflow.steps.find((step) => step.id === workflow.currentStepId) ?? null;
  return withWorkflow(args.approval, {
    ...workflow,
    comments: nextComments({ workflow, stepId: current?.id ?? null, actorEmployeeId: args.actorEmployeeId, note, now }),
  });
}
