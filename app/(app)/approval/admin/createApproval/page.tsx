import { LarkApprovalTemplateBuilder } from "@/components/approvals/LarkApprovalTemplateBuilder";
import { defaultApprovalTemplateDraft, type ApprovalTemplateDraft } from "@/lib/approvals/templateSchema";
import { fetchDepartments, fetchEmployees } from "@/lib/queries";
import { getApprovalTemplate } from "@/lib/repositories/approval-template-store";

function makeNewApprovalTemplate(): ApprovalTemplateDraft {
  return {
    ...defaultApprovalTemplateDraft,
    id: `template_${Date.now()}`,
    status: "draft",
  };
}

export default async function CreateApprovalPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const templateId = typeof params.templateId === "string" ? params.templateId : "";
  const [employees, departments, initialTemplate] = await Promise.all([
    fetchEmployees(),
    fetchDepartments(),
    templateId ? getApprovalTemplate(templateId) : Promise.resolve(null),
  ]);
  return (
    <LarkApprovalTemplateBuilder
      employees={employees}
      departments={departments}
      initialTemplate={initialTemplate ?? makeNewApprovalTemplate()}
    />
  );
}
