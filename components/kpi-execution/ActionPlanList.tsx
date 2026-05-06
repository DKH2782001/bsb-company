"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EnrichedActionPlan } from "@/lib/kpi/execution";
import { ActionMetricCards } from "./ActionMetricCards";
import { upsertActionPlanAction } from "@/app/(app)/workspace/actions";

export function ActionPlanList({
  plans,
  linkedKpiId,
}: {
  plans: EnrichedActionPlan[];
  linkedKpiId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | "new" | null>(null);

  function handleSubmit(formData: FormData) {
    if (linkedKpiId) formData.set("linkedKpiId", linkedKpiId);
    startTransition(async () => {
      await upsertActionPlanAction(formData);
      setEditingId(null);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">Action Plans</CardTitle>
          {linkedKpiId && (
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingId("new")}>
              Tao Action Plan
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingId === "new" && (
          <ActionPlanForm
            linkedKpiId={linkedKpiId}
            isPending={isPending}
            onCancel={() => setEditingId(null)}
            onSubmit={handleSubmit}
          />
        )}

        {plans.length === 0 && <div className="text-sm text-zinc-500">Chua co action plan cho KPI nay.</div>}

        {plans.map((plan, index) => (
          <div key={plan.id} className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
                  Action Plan {index + 1}
                </div>
                <div className="mt-1 text-lg font-semibold text-zinc-900">{plan.title}</div>
                <div className="mt-1 text-sm text-zinc-600">{plan.description}</div>
                <div className="mt-2 text-xs text-zinc-500">
                  Owner: {plan.owner_name} | Period {plan.period}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{plan.status}</Badge>
                <Badge variant="info">{plan.progress_percent}% progress</Badge>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(plan.id)}>
                  Sua
                </Button>
              </div>
            </div>

            {editingId === plan.id && (
              <div className="mt-4">
                <ActionPlanForm
                  plan={plan}
                  linkedKpiId={linkedKpiId}
                  isPending={isPending}
                  onCancel={() => setEditingId(null)}
                  onSubmit={handleSubmit}
                />
              </div>
            )}

            <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_1fr]">
              <div className="rounded-2xl border border-white bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Expected impact
                </div>
                <div className="mt-2 text-sm text-zinc-800">{plan.expected_impact_text}</div>
                <div className="mt-4 grid grid-cols-4 gap-3 text-sm">
                  <Mini label="Tasks" value={String(plan.total_tasks)} />
                  <Mini label="Done" value={String(plan.completed_tasks)} />
                  <Mini label="Overdue" value={String(plan.overdue_tasks)} />
                  <Mini label="Blocked" value={String(plan.blocked_tasks)} />
                </div>
              </div>

              <div className="rounded-2xl border border-white bg-white p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Linked tasks snapshot
                </div>
                <div className="space-y-2">
                  {plan.tasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="rounded-xl border border-zinc-100 px-3 py-2 text-sm">
                      <div className="font-medium text-zinc-900">{task.title}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {task.status} | due {task.due_date ?? "-"}
                      </div>
                    </div>
                  ))}
                  {plan.tasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-zinc-200 px-3 py-4 text-sm text-zinc-500">
                      Chua co task link truc tiep voi action plan nay.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <ActionMetricCards metrics={plan.metrics} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActionPlanForm({
  plan,
  linkedKpiId,
  isPending,
  onCancel,
  onSubmit,
}: {
  plan?: EnrichedActionPlan;
  linkedKpiId?: string;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <form action={onSubmit} className="rounded-2xl border border-indigo-200 bg-white p-4">
      <input type="hidden" name="id" value={plan?.id ?? ""} />
      <input type="hidden" name="linkedKpiId" value={linkedKpiId ?? plan?.linked_kpi_id ?? ""} />
      <div className="grid gap-3 md:grid-cols-2">
        <Input name="title" defaultValue={plan?.title ?? ""} placeholder="Ten Action Plan" required />
        <select
          name="status"
          defaultValue={plan?.status ?? "active"}
          className="h-11 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 text-sm text-[var(--text-strong)]"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
        <Input name="period" defaultValue={plan?.period ?? "2026-04"} placeholder="Period" />
        <Input
          name="progressPercent"
          type="number"
          min={0}
          max={100}
          defaultValue={plan?.progress_percent ?? 0}
          placeholder="Progress %"
        />
        <textarea
          name="description"
          defaultValue={plan?.description ?? ""}
          placeholder="Mo ta ke hoach hanh dong"
          className="min-h-20 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 py-2.5 text-sm text-[var(--text-strong)] md:col-span-2"
        />
        <textarea
          name="expectedImpactText"
          defaultValue={plan?.expected_impact_text ?? ""}
          placeholder="Expected impact"
          className="min-h-20 rounded-2xl border border-[var(--line-soft)] bg-white px-3.5 py-2.5 text-sm text-[var(--text-strong)] md:col-span-2"
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Huy
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Dang luu..." : "Luu Action Plan"}
        </Button>
      </div>
    </form>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 font-medium text-zinc-900">{value}</div>
    </div>
  );
}
