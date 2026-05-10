import Link from "next/link";
import { Archive, Copy, FileText, Globe2, Plus, ShieldCheck } from "lucide-react";

import {
  archiveApprovalTemplateAction,
  duplicateApprovalTemplateAction,
  restoreApprovalTemplateAction,
} from "@/app/(app)/approval/admin/actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listApprovalTemplatesForAdmin } from "@/lib/repositories/approval-template-store";

export default async function ApprovalAdminPage() {
  const templates = await listApprovalTemplatesForAdmin();

  return (
    <div>
      <PageHeader
        helpKey="/approval/admin"
        title="Quan tri phe duyet"
        description="Quan ly mau phieu, nhom phieu, nguoi quan tri quy trinh, phan quyen du lieu va cau hinh audit."
        actions={
          <Link
            href="/approval/admin/createApproval"
            className="inline-flex h-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--brand-600),#415bff)] px-3.5 text-xs font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Tao quy trinh
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Template Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {templates.map((template) => (
              <div key={template.id} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-alt)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--text-strong)]">{template.basicInfo.name}</div>
                      <div className="mt-1 text-xs text-[var(--text-soft)]">
                        Group: {template.basicInfo.group} · {template.formSchema.fields.length} fields ·{" "}
                        {template.processSchema.nodes.length} workflow nodes
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        template.status === "published" ? "success" : template.status === "archived" ? "outline" : "warning"
                      }
                    >
                      {template.status}
                    </Badge>
                    <Link
                      href={`/approval/admin/createApproval?templateId=${encodeURIComponent(template.id)}`}
                      className="rounded-full border border-[var(--line-soft)] px-3 py-1 text-xs font-medium text-[var(--text-strong)] hover:bg-[var(--surface)]"
                    >
                      Sua
                    </Link>
                    <form action={duplicateApprovalTemplateAction}>
                      <input type="hidden" name="templateId" value={template.id} />
                      <Button type="submit" variant="outline" size="sm" className="h-7 rounded-full px-3 text-xs">
                        Duplicate
                      </Button>
                    </form>
                    {template.status === "archived" ? (
                      <form action={restoreApprovalTemplateAction}>
                        <input type="hidden" name="templateId" value={template.id} />
                        <Button type="submit" variant="outline" size="sm" className="h-7 rounded-full px-3 text-xs">
                          Restore
                        </Button>
                      </form>
                    ) : (
                      <form action={archiveApprovalTemplateAction}>
                        <input type="hidden" name="templateId" value={template.id} />
                        <Button type="submit" variant="outline" size="sm" className="h-7 rounded-full px-3 text-xs">
                          Archive
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Admin controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--text-soft)]">
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--line-soft)] p-3">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Sub-admin theo group/department
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--line-soft)] p-3">
              <Globe2 className="h-4 w-4 text-blue-600" />
              Ban dich ngon ngu
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--line-soft)] p-3">
              <Copy className="h-4 w-4 text-blue-600" />
              Duplicate template
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--line-soft)] p-3">
              <Archive className="h-4 w-4 text-blue-600" />
              Archive thay vi xoa cung
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
