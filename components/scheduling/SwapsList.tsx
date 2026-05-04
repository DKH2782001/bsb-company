"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { decideSwapAction } from "@/app/(app)/scheduling/actions";
import type { SwapRequestWithMeta } from "@/lib/repositories/scheduling";
import { CheckCircle2, XCircle, Clock, ArrowLeft } from "lucide-react";

const swapStatusBadge: Record<string, { label: string; variant: "success" | "warning" | "danger" | "outline" | "info" }> = {
  pending:   { label: "Chờ duyệt", variant: "warning" },
  approved:  { label: "Đã duyệt",  variant: "success" },
  rejected:  { label: "Từ chối",   variant: "danger" },
  cancelled: { label: "Đã hủy",    variant: "outline" },
};

const swapTypeBadge: Record<string, string> = {
  drop: "Nhả ca",
  swap: "Đổi ca",
};

export function SwapsList({ swaps }: { swaps: SwapRequestWithMeta[] }) {
  const pending = swaps.filter((s) => s.status === "pending");
  const history = swaps.filter((s) => s.status !== "pending");

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Yêu cầu đổi ca"
        description="Duyệt yêu cầu nhả ca hoặc đổi ca giữa nhân viên"
        actions={
          <Link
            href="/scheduling"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[13px] font-medium transition-colors hover:bg-[var(--surface-alt)]"
            style={{ borderColor: "var(--line-soft)", color: "var(--text-soft)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại lịch
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Chờ duyệt ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pending.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-[var(--text-soft)]">
              Không có yêu cầu nào đang chờ.
            </div>
          ) : (
            <div className="divide-y divide-[var(--line-soft)]">
              {pending.map((sw) => (
                <SwapRow key={sw.id} swap={sw} showActions />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lịch sử ({history.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[var(--line-soft)]">
              {history.map((sw) => (
                <SwapRow key={sw.id} swap={sw} showActions={false} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SwapRow({ swap, showActions }: { swap: SwapRequestWithMeta; showActions: boolean }) {
  const [isPending, startTrans] = useTransition();
  const [note, setNote]         = useState("");
  const badge = swapStatusBadge[swap.status] ?? { label: swap.status, variant: "outline" as const };

  function decide(decision: "approved" | "rejected") {
    startTrans(async () => { await decideSwapAction(swap.id, decision, note || undefined); });
  }

  return (
    <div className="px-6 py-4 space-y-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--text-strong)]">{swap.requester_name}</span>
            <Badge variant="outline" className="text-xs">{swapTypeBadge[swap.request_type]}</Badge>
            <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
          </div>
          <div className="text-sm text-[var(--text-soft)]">
            Ca: <span className="font-medium text-[var(--text-strong)]">{swap.requester_shift_name}</span>
            {" · "}Ngày: <span className="font-medium">{swap.requester_shift_date}</span>
            {swap.receiver_name && <> · Đổi với: <span className="font-medium">{swap.receiver_name}</span></>}
          </div>
          {swap.reason && (
            <div className="text-sm text-[var(--text-soft)]">Lý do: {swap.reason}</div>
          )}
          {swap.decision_note && (
            <div className="text-sm text-[var(--text-soft)]">Ghi chú duyệt: {swap.decision_note}</div>
          )}
        </div>
        <span className="text-xs text-[var(--text-soft)] shrink-0">
          {new Date(swap.created_at).toLocaleDateString("vi-VN")}
        </span>
      </div>

      {showActions && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú (tùy chọn)"
            className="flex-1 rounded-lg border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-1.5 text-sm"
          />
          <Button size="sm" onClick={() => decide("approved")} disabled={isPending} className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" />Duyệt
          </Button>
          <Button size="sm" variant="ghost" onClick={() => decide("rejected")} disabled={isPending} className="gap-1.5 text-red-600 hover:text-red-700">
            <XCircle className="h-4 w-4" />Từ chối
          </Button>
        </div>
      )}
    </div>
  );
}
