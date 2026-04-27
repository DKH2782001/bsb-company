"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { decideLeaveAction } from "@/app/(app)/leave/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function DecisionButtons({ requestId }: { requestId: string }) {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function decide(approve: boolean) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("requestId", requestId);
      fd.set("decision", approve ? "approve" : "reject");
      if (note.trim()) fd.set("note", note.trim());
      const result = await decideLeaveAction(fd);
      if (!result.ok) {
        toast({ variant: "error", title: "Lỗi", description: result.error });
        return;
      }
      toast({ variant: "success", title: approve ? "Đã duyệt đơn" : "Đã từ chối đơn" });
      setNote("");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ghi chú duyệt (tuỳ chọn)"
        className="min-w-[200px] flex-1"
      />
      <Button type="button" size="sm" disabled={isPending} onClick={() => decide(true)}>
        <Check className="h-3.5 w-3.5" />
        Duyệt
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => decide(false)}>
        <X className="h-3.5 w-3.5" />
        Từ chối
      </Button>
    </div>
  );
}
