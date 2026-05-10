import Link from "next/link";
import { ArrowRight, FileText, Search } from "lucide-react";

import { createApprovalRequestAction } from "@/app/(app)/governance/actions";
import { ApprovalFormFieldRenderer } from "@/components/approvals/ApprovalFormFieldRenderer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { defaultApprovalTemplateDraft, processNodeToFlowStep } from "@/lib/approvals/templateSchema";
import { fetchDepartments, fetchEmployees } from "@/lib/queries";
import { listApprovalTemplates } from "@/lib/repositories/approval-template-store";
import { getAuthenticatedUser, getUserContext } from "@/lib/repositories/shared";

export default async function ApprovalSubmitPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [employees, departments, user, templates] = await Promise.all([
    fetchEmployees(),
    fetchDepartments(),
    getAuthenticatedUser(),
    listApprovalTemplates(),
  ]);
  const params = searchParams ? await searchParams : {};
  const selectedTemplateId = typeof params.templateId === "string" ? params.templateId : templates[0]?.id;
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ??
    templates[0] ??
    ({ ...defaultApprovalTemplateDraft, status: "published" as const });
  const context = await getUserContext(user);
  const submitterId = context.employeeId ?? "e1";
  const runtimeSteps = selectedTemplate.processSchema.nodes
    .filter((node) => node.type === "APPROVAL" || node.type === "HANDLER")
    .map(processNodeToFlowStep);

  return (
    <div>
      <PageHeader
        helpKey="/approval"
        title="Gui yeu cau phe duyet"
        description="Chon mau phieu, dien form va gui vao quy trinh phe duyet dang publish."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/approval/inbox"
              className="inline-flex h-9 items-center justify-center rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)] px-3.5 text-xs font-medium text-[var(--text-strong)] hover:bg-[var(--surface-alt)]"
            >
              Trung tam phe duyet
            </Link>
            <Link
              href="/approval/admin"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--brand-600),#415bff)] px-3.5 text-xs font-medium text-white"
            >
              Quan tri mau
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tim mau phieu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[var(--text-soft)]" />
                <Input placeholder="Tim theo ten phieu, nhom..." className="pl-9" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Gan day</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.map((template) => {
                const active = template.id === selectedTemplate.id;
                return (
                  <Link
                    key={template.id}
                    href={`/approval?templateId=${encodeURIComponent(template.id)}`}
                    className={`block w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-blue-200 bg-blue-50"
                        : "border-[var(--line-soft)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--text-strong)]">
                          {template.basicInfo.name}
                        </div>
                        <div className="text-xs text-[var(--text-soft)]">{template.basicInfo.group}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm">{selectedTemplate.basicInfo.name}</CardTitle>
                <div className="mt-1 text-xs text-[var(--text-soft)]">
                  Form render tu schema mau, workflow se tao request cho nguoi duyet tiep theo.
                </div>
              </div>
              <Badge variant="success">Published</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form action={createApprovalRequestAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="kind" value="project_budget" />
              <input type="hidden" name="title" value={selectedTemplate.basicInfo.name} />
              <input type="hidden" name="requestedBy" value={submitterId} />
              <input type="hidden" name="amount" value="150000000" />
              <input type="hidden" name="note" value={`Gui tu mau phe duyet ${selectedTemplate.id}`} />

              {selectedTemplate.formSchema.fields.map((field) => (
                <ApprovalFormFieldRenderer key={field.id} field={field} employees={employees} departments={departments} />
              ))}

              {runtimeSteps.map((step, index) => (
                <div key={`${step.label}-${index}`}>
                  <input type="hidden" name="flowStepLabel" value={step.label} />
                  <input type="hidden" name="flowStepApproverId" value={step.approverEmployeeId ?? "e2"} />
                  <input type="hidden" name="flowStepRole" value={step.approverRole ?? "manual"} />
                </div>
              ))}

              <div className="md:col-span-2">
                <Button type="submit" className="w-full">
                  Gui phe duyet
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
