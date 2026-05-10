import { describe, expect, it } from "vitest";
import {
  appendApprovalComment,
  applyApprovalDecision,
  buildManualApprovalWorkflow,
  getApprovalWorkflow,
  insertApprovalStep,
  returnCurrentApprovalStep,
} from "@/lib/approvals/workflow";
import type { Approval } from "@/types/domain";

function makeApproval(): Approval {
  return {
    id: "approval_test",
    company_id: "company_demo",
    kind: "project_budget",
    title: "Test approval",
    payload: {
      approvalWorkflow: buildManualApprovalWorkflow({
        approvalId: "approval_test",
        steps: [
          { label: "Manager", approverEmployeeId: "e2", approverRole: "manager" },
          { label: "CFO", approverEmployeeId: "e3", approverRole: "cfo" },
        ],
      }),
    },
    status: "pending",
    requested_by: "e1",
    decided_by: null,
    decided_at: null,
    decision_note: null,
    created_at: "2026-05-01T00:00:00.000Z",
  };
}

describe("approval workflow actions", () => {
  it("returns current approval step back to the previous approved step", () => {
    const afterFirstApprove = applyApprovalDecision({
      approval: makeApproval(),
      decision: "approved",
      actorEmployeeId: "e2",
      now: "2026-05-01T01:00:00.000Z",
    });

    const returned = returnCurrentApprovalStep({
      approval: afterFirstApprove,
      actorEmployeeId: "e3",
      note: "Can bo sung hoa don",
      now: "2026-05-01T02:00:00.000Z",
    });
    const workflow = getApprovalWorkflow(returned);

    expect(workflow.currentStepId).toBe("approval_test-manual-step-1");
    expect(workflow.steps[0].status).toBe("pending");
    expect(workflow.steps[1].status).toBe("pending");
    expect(workflow.comments?.[0].note).toBe("Can bo sung hoa don");
  });

  it("can insert an approver before current step", () => {
    const approval = makeApproval();
    const inserted = insertApprovalStep({
      approval,
      toEmployeeId: "e4",
      toEmployeeName: "Sales Head",
      actorEmployeeId: "e1",
      position: "before_current",
      note: "Can them Sales Head",
      now: "2026-05-01T01:00:00.000Z",
    });
    const workflow = getApprovalWorkflow(inserted);

    expect(workflow.currentStepId).toContain("approval_test-added-step");
    expect(workflow.steps).toHaveLength(3);
    expect(workflow.steps[0].approverEmployeeId).toBe("e4");
  });

  it("can append a workflow comment without changing current step", () => {
    const approval = makeApproval();
    const commented = appendApprovalComment({
      approval,
      actorEmployeeId: "e1",
      note: "Please review today",
      now: "2026-05-01T01:00:00.000Z",
    });
    const workflow = getApprovalWorkflow(commented);

    expect(workflow.currentStepId).toBe("approval_test-manual-step-1");
    expect(workflow.comments?.[0]).toMatchObject({
      by: "e1",
      note: "Please review today",
    });
  });
});
