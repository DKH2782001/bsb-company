"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { importVNHolidaysAction } from "@/app/(app)/leave/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function ImportHolidaysButton() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function onClick() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("year", year);
      const result = await importVNHolidaysAction(fd);
      if (!result.ok) {
        toast({ variant: "error", title: "Import thất bại", description: result.error });
        return;
      }
      toast({
        variant: "success",
        title: `Đã nhập ${result.added ?? 0} ngày lễ VN năm ${year}`,
        description: "Vui lòng kiểm tra ngày Tết Nguyên đán theo lịch âm cụ thể từng năm.",
      });
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="h-9 w-24 rounded-xl border border-[var(--line-soft)] bg-white dark:bg-[var(--surface)] px-2 text-sm"
      />
      <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={onClick}>
        <Download className="h-4 w-4" />
        {isPending ? "Đang nhập..." : "Import lịch lễ VN"}
      </Button>
    </div>
  );
}
