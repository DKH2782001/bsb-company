"use client";

import { useState } from "react";
import { Shield, ChevronRight, Eye, EyeOff, Info } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type RoleInfo = {
  role: string;
  scope_department_id: string | null;
};

const roleDetails: Record<string, { label: string; description: string; permissions: string[] }> = {
  ceo: {
    label: "CEO",
    description: "Quyền truy cập toàn bộ hệ thống, bao gồm tất cả phòng ban và chức năng.",
    permissions: [
      "Quản lý tổ chức & phòng ban",
      "Xem & chỉnh sửa KPI toàn công ty",
      "Phê duyệt tất cả yêu cầu",
      "Quản lý tài chính & ngân sách",
      "Quản lý nhân sự & tuyển dụng",
      "Xem báo cáo & audit log",
      "Quản lý cài đặt hệ thống",
    ],
  },
  cfo: {
    label: "Finance Viewer",
    description: "Truy cập đầy đủ vào module tài chính, ngân sách và báo cáo tài chính.",
    permissions: [
      "Xem & quản lý tài chính",
      "Xem báo cáo ngân sách",
      "Phê duyệt yêu cầu tài chính",
      "Xem lương & thưởng",
    ],
  },
  hr_admin: {
    label: "Admin",
    description: "Quản trị nhân sự, tuyển dụng, chấm công và bảng lương.",
    permissions: [
      "Quản lý hồ sơ nhân viên",
      "Quản lý tuyển dụng",
      "Quản lý chấm công",
      "Xem & chỉnh sửa bảng lương",
    ],
  },
  dept_head: {
    label: "Department Head",
    description: "Quản lý phòng ban, KPI và nhân sự trong phạm vi phòng ban.",
    permissions: [
      "Quản lý nhân sự phòng ban",
      "Thiết lập KPI phòng ban",
      "Phê duyệt yêu cầu phòng ban",
    ],
  },
  team_lead: {
    label: "Team Lead",
    description: "Quản lý team, phân công công việc và theo dõi KPI của team.",
    permissions: [
      "Phân công công việc team",
      "Theo dõi KPI team",
      "Đánh giá nhân viên trong team",
    ],
  },
  employee: {
    label: "Employee",
    description: "Truy cập cá nhân: xem KPI, công việc và thông tin cá nhân.",
    permissions: [
      "Xem KPI cá nhân",
      "Quản lý công việc được giao",
      "Cập nhật hồ sơ cá nhân",
    ],
  },
  auditor: {
    label: "Approval Manager",
    description: "Quyền xem toàn bộ hệ thống để kiểm tra và phê duyệt.",
    permissions: [
      "Xem toàn bộ dữ liệu (read-only)",
      "Xem audit log",
      "Phê duyệt yêu cầu đặc biệt",
    ],
  },
};

const roleTone: Record<string, "info" | "warning" | "success" | "outline"> = {
  ceo: "info",
  cfo: "warning",
  hr_admin: "info",
  dept_head: "success",
  team_lead: "outline",
  employee: "outline",
  auditor: "success",
};

export function RolesManageDialog({ roles }: { roles: RoleInfo[] }) {
  const [open, setOpen] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[var(--brand-600)] cursor-pointer hover:text-[var(--brand-700)] transition-colors"
      >
        Quản lý
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--brand-600)]" />
            Quyền truy cập
          </div>
        }
        description={`Bạn đang có ${roles.length} quyền trong hệ thống. Liên hệ Admin để thay đổi.`}
        size="lg"
        footer={
          <Button onClick={() => setOpen(false)}>Đóng</Button>
        }
      >
        <div className="space-y-3">
          {roles.map((role) => {
            const details = roleDetails[role.role];
            const isExpanded = expandedRole === `${role.role}-${role.scope_department_id}`;

            return (
              <div key={`${role.role}-${role.scope_department_id ?? "global"}`} className="rounded-2xl border border-[var(--line-soft)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedRole(isExpanded ? null : `${role.role}-${role.scope_department_id}`)}
                  className="flex w-full items-center justify-between p-4 text-left cursor-pointer hover:bg-[var(--surface-alt)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={roleTone[role.role] ?? "outline"}>
                      {details?.label ?? role.role}
                    </Badge>
                    <span className="text-xs text-[var(--text-soft)]">
                      {role.scope_department_id ? `Phạm vi: ${role.scope_department_id}` : "Quyền cao nhất"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Hoạt động</Badge>
                    <ChevronRight className={`h-4 w-4 text-[var(--text-soft)] transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {isExpanded && details && (
                  <div className="border-t border-[var(--line-soft)] bg-[var(--surface-alt)] px-4 py-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                    <div className="text-xs text-[var(--text-soft)] mb-3">{details.description}</div>
                    <div className="text-xs font-semibold text-[var(--text-strong)] mb-2">Quyền hạn:</div>
                    <ul className="space-y-1.5">
                      {details.permissions.map((perm) => (
                        <li key={perm} className="flex items-center gap-2 text-xs text-[var(--text-soft)]">
                          <div className="h-1.5 w-1.5 rounded-full bg-[var(--brand-600)]" />
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-start gap-2 rounded-2xl bg-[var(--surface-alt)] p-3 text-xs text-[var(--text-soft)]">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--brand-600)]" />
            <span>Quyền truy cập được quản lý bởi Admin. Nếu cần thay đổi quyền, vui lòng liên hệ quản trị viên hệ thống.</span>
          </div>
        </div>
      </Dialog>
    </>
  );
}
