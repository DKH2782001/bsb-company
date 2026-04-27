"use client";

import { useMemo, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { submitLeaveAction } from "@/app/(app)/leave/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { calculateTotalDays } from "@/lib/leave-utils";
import type { DemoLeaveType as LeaveType } from "@/lib/queries/demo";

export function LeaveSubmitForm({ leaveTypes }: { leaveTypes: LeaveType[] }) {
  const { toast } = useToast();
  const [leaveTypeId, setLeaveTypeId] = useState(leaveTypes[0]?.id ?? "");
  const today = new Date().toISOString().slice(0, 10);
  const [startsOn, setStartsOn] = useState(today);
  const [endsOn, setEndsOn] = useState(today);
  const [halfStart, setHalfStart] = useState(false);
  const [halfEnd, setHalfEnd] = useState(false);
  const [reason, setReason] = useState("");
  const [handover, setHandover] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalDays = useMemo(
    () => calculateTotalDays(startsOn, endsOn, halfStart, halfEnd),
    [startsOn, endsOn, halfStart, halfEnd],
  );

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("leaveTypeId", leaveTypeId);
    if (halfStart) formData.set("halfDayStart", "on");
    if (halfEnd) formData.set("halfDayEnd", "on");

    startTransition(async () => {
      const result = await submitLeaveAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast({
        variant: "success",
        title: "Đã gửi đơn nghỉ phép",
        description: `${result.totalDays} ngày · đang chờ duyệt.`,
      });
      setReason("");
      setHandover("");
      setHalfStart(false);
      setHalfEnd(false);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-[var(--text-soft)]">Loại nghỉ phép *</span>
        <select
          className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white dark:bg-[var(--surface)] px-3 text-sm"
          value={leaveTypeId}
          onChange={(e) => setLeaveTypeId(e.target.value)}
          required
        >
          {leaveTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.paid ? "" : "(không lương)"}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Từ ngày *" name="startsOn" type="date" value={startsOn} onChange={setStartsOn} />
        <Field label="Đến ngày *" name="endsOn" type="date" value={endsOn} onChange={setEndsOn} />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={halfStart} onChange={(e) => setHalfStart(e.target.checked)} className="h-4 w-4" />
          Nửa ngày đầu
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={halfEnd} onChange={(e) => setHalfEnd(e.target.checked)} className="h-4 w-4" />
          Nửa ngày cuối
        </label>
        <div className="ml-auto rounded-full bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold text-[var(--text-strong)]">
          Tổng: {totalDays} ngày làm việc
        </div>
      </div>

      <Field label="Lý do" name="reason" value={reason} onChange={setReason} placeholder="Vd: Việc gia đình, nghỉ ốm..." />
      <Field label="Bàn giao cho (employee_id, tuỳ chọn)" name="handoverTo" value={handover} onChange={setHandover} placeholder="vd: e2" />

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}

      <Button type="submit" disabled={isPending || totalDays <= 0} className="w-full sm:w-auto">
        <Send className="h-4 w-4" />
        {isPending ? "Đang gửi..." : "Gửi đơn nghỉ phép"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-[var(--text-soft)]">{label}</span>
      <Input name={name} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}
