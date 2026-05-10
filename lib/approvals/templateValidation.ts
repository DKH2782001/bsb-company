import { z } from "zod";

import type { ApprovalTemplateDraft } from "@/lib/approvals/templateSchema";

const conditionSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.object({
      fieldId: z.string().min(1),
      op: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "contains", "in", "is_empty"]),
      value: z.unknown().optional(),
    }),
    z.object({
      operator: z.enum(["AND", "OR"]),
      conditions: z.array(conditionSchema),
    }),
  ]),
);

const fieldSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  label: z.string().min(1, "Field label is required"),
  placeholder: z.string().optional(),
  required: z.boolean(),
  defaultValue: z.unknown().optional(),
  description: z.string().optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
  currency: z.enum(["VND", "USD", "EUR"]).optional(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  formula: z.string().optional(),
  visibility: conditionSchema.optional(),
  childFields: z.array(z.unknown()).optional(),
});

const approverRuleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("MANAGER"), level: z.number(), direction: z.enum(["BOTTOM_UP", "TOP_DOWN"]).optional() }),
  z.object({ kind: z.literal("DEPT_SUPERVISOR") }),
  z.object({ kind: z.literal("ROLE"), roleIds: z.array(z.string()) }),
  z.object({ kind: z.literal("USER_GROUP"), groupIds: z.array(z.string()) }),
  z.object({ kind: z.literal("SPECIFY"), userIds: z.array(z.string()) }),
  z.object({
    kind: z.literal("REQUESTER_SELECT"),
    selectionMethod: z.enum(["MULTI", "SINGLE"]),
    range: z
      .object({
        type: z.enum(["WHOLE_COMPANY", "SPECIFIED_MEMBER", "SPECIFIED_ROLE"]),
        ids: z.array(z.string()).optional(),
      })
      .optional(),
  }),
  z.object({ kind: z.literal("REQUESTER") }),
  z.object({ kind: z.literal("STEP_APPROVER"), stepId: z.string() }),
  z.object({ kind: z.literal("MULTIPLE_SUPERVISORS") }),
  z.object({ kind: z.literal("MULTIPLE_DEPT_SUPERVISORS") }),
  z.object({ kind: z.literal("CONTACTS_IN_FORM"), fieldId: z.string() }),
  z.object({ kind: z.literal("DEPARTMENTS_IN_FORM"), fieldId: z.string() }),
]);

const processNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["SUBMIT", "APPROVAL", "CC", "CONDITION", "HANDLER", "END"]),
  name: z.string().min(1),
  approverRule: approverRuleSchema.optional(),
  approvalType: z.enum(["MANUAL", "AUTO_APPROVE", "AUTO_REJECT"]).optional(),
  multiApproverLogic: z.enum(["ALL_AGREE", "ANY_AGREE", "SEQUENTIAL"]).optional(),
  selfApprovalRule: z.enum(["SELF_REVIEW", "AUTO_SKIP", "FORWARD_MANAGER", "FORWARD_DEPT_SUPERVISOR"]).optional(),
  formPermissions: z.record(z.string(), z.enum(["EDIT", "READ", "HIDDEN"])).optional(),
  operationPermissions: z
    .object({
      canTransfer: z.boolean(),
      canAddApprover: z.boolean(),
      canRemoveApprover: z.boolean().optional(),
      canReturn: z.boolean(),
      canComment: z.boolean(),
      canRejectToStep: z.string().optional(),
    })
    .optional(),
  emptyApproverRule: z.enum(["AUTO_SKIP", "FORWARD_ADMIN", "FORWARD_UPPER_MANAGER", "CANCEL_REQUEST"]).optional(),
  reminderRule: z
    .object({
      afterHours: z.number(),
      channels: z.array(z.enum(["email", "inapp", "push"])),
    })
    .optional(),
  timeoutRule: z
    .object({
      hours: z.number(),
      action: z.enum(["AUTO_APPROVE", "AUTO_REJECT", "ESCALATE_TO_MANAGER"]),
    })
    .optional(),
});

export const approvalTemplateDraftSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["draft", "published", "archived"]),
  basicInfo: z.object({
    icon: z.string(),
    name: z.string().min(1, "Template name is required"),
    description: z.string(),
    group: z.string().min(1, "Template group is required"),
    submitScope: z.object({
      type: z.enum(["ALL", "DEPARTMENT", "ROLE", "USERS"]),
      ids: z.array(z.string()),
    }),
    showOnWorkplace: z.boolean(),
    prohibitAdmin: z.boolean(),
    administratorIds: z.array(z.string()),
  }),
  formSchema: z.object({
    version: z.literal(1),
    fields: z.array(fieldSchema).min(1, "Template must have at least one field"),
  }),
  processSchema: z.object({
    version: z.literal(1),
    nodes: z.array(processNodeSchema).min(2, "Workflow must include submit and end nodes"),
  }),
  more: z.object({
    notifyOnSubmit: z.boolean(),
    notifyOnApprove: z.boolean(),
    dataPermission: z.enum(["submitter_and_approvers", "all_admins", "company"]),
    printTemplateEnabled: z.boolean(),
    revokeWindow: z
      .object({
        allowed: z.boolean(),
        beforeStep: z.string().optional(),
        hoursAfterSubmit: z.number().optional(),
      })
      .optional(),
    notificationChannels: z.array(z.enum(["email", "inapp", "push"])).optional(),
  }),
});

export function validateApprovalTemplateDraft(template: ApprovalTemplateDraft) {
  const parsed = approvalTemplateDraftSchema.safeParse(template);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  }

  const hasSubmit = template.processSchema.nodes.some((node) => node.type === "SUBMIT");
  const hasEnd = template.processSchema.nodes.some((node) => node.type === "END");
  if (!hasSubmit || !hasEnd) {
    return { ok: false as const, error: "Workflow must include Submit and End nodes." };
  }

  return { ok: true as const };
}
