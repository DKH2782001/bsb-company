import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShiftTemplateDialog } from "@/components/scheduling/ShiftTemplateDialog";
import { getShiftTemplates } from "@/lib/repositories/scheduling";
import { Clock, ArrowLeft } from "lucide-react";

export const revalidate = 0;

export default async function SchedulingSettingsPage() {
  const templates = await getShiftTemplates();

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Cấu hình ca làm việc"
        description="Định nghĩa các ca, giờ làm và hệ số lương"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/scheduling"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[13px] font-medium transition-colors hover:bg-[var(--surface-alt)]"
              style={{ borderColor: "var(--line-soft)", color: "var(--text-soft)" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại lịch
            </Link>
            <ShiftTemplateDialog mode="create" />
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />Ca làm việc ({templates.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {templates.length === 0 ? (
            <div className="px-6 py-10 text-center text-[var(--text-soft)] text-sm">
              Chưa có ca nào. Nhấn "Thêm ca" để bắt đầu.
            </div>
          ) : (
            <div className="divide-y divide-[var(--line-soft)]">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center gap-4 px-6 py-4">
                  <span
                    className="h-9 w-9 rounded-xl shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[var(--text-strong)]">{t.name}</span>
                      <Badge variant="outline" className="text-xs">{t.code}</Badge>
                      {t.is_overnight && <Badge variant="info" className="text-xs">Qua đêm</Badge>}
                      {t.role_required && (
                        <Badge variant="outline" className="text-xs">{t.role_required}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-[var(--text-soft)] mt-0.5">
                      {t.start_time} — {t.end_time}
                      {t.break_minutes > 0 && ` · nghỉ ${t.break_minutes} phút`}
                      {" · "}
                      {t.min_staff}{t.max_staff ? `–${t.max_staff}` : "+"} người
                    </div>
                    <div className="text-xs text-[var(--text-soft)] mt-0.5 flex gap-3">
                      <span>Đêm ×{t.night_multiplier}</span>
                      <span>Cuối tuần ×{t.weekend_multiplier}</span>
                      <span>Lễ ×{t.holiday_multiplier}</span>
                    </div>
                  </div>
                  <ShiftTemplateDialog mode="edit" template={t} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
