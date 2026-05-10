import { describe, expect, it } from "vitest";

import { defaultApprovalTemplateDraft } from "@/lib/approvals/templateSchema";
import { validateApprovalTemplateDraft } from "@/lib/approvals/templateValidation";

describe("approval template validation", () => {
  it("accepts a published template with submit and end nodes", () => {
    const result = validateApprovalTemplateDraft({
      ...defaultApprovalTemplateDraft,
      status: "published",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects an empty template name", () => {
    const result = validateApprovalTemplateDraft({
      ...defaultApprovalTemplateDraft,
      status: "published",
      basicInfo: {
        ...defaultApprovalTemplateDraft.basicInfo,
        name: "",
      },
    });

    expect(result.ok).toBe(false);
  });

  it("rejects workflow without an end node", () => {
    const result = validateApprovalTemplateDraft({
      ...defaultApprovalTemplateDraft,
      status: "published",
      processSchema: {
        ...defaultApprovalTemplateDraft.processSchema,
        nodes: defaultApprovalTemplateDraft.processSchema.nodes.filter((node) => node.type !== "END"),
      },
    });

    expect(result.ok).toBe(false);
  });
});
