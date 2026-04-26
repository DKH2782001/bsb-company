"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MultiSelect } from "@/app/(app)/operations/MultiSelect";
import { Search, Filter, Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { exportAuditLogsAction } from "./actions";
import type { AuditLogFilter } from "@/lib/repositories/governance";

type Props = {
  actions: string[];
  entities: string[];
  employees: { id: string; full_name: string }[];
  current: AuditLogFilter;
  total: number;
  page: number;
  pageSize: number;
};

export function AuditFilterBar({ actions, entities, employees, current, total, page, pageSize }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState(current.search ?? "");
  const [actorIds, setActorIds] = useState<string[]>(current.actorIds ?? []);
  const [actionList, setActionList] = useState<string[]>(current.actions ?? []);
  const [entityList, setEntityList] = useState<string[]>(current.entities ?? []);
  const [from, setFrom] = useState(current.from ?? "");
  const [to, setTo] = useState(current.to ?? "");

  function pushParams(patch: Record<string, string | string[] | null>, opts?: { resetPage?: boolean }) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      params.delete(k);
      if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
      if (Array.isArray(v)) v.forEach((x) => params.append(k, x));
      else params.set(k, v);
    }
    if (opts?.resetPage) params.delete("page");
    startTransition(() => {
      router.push(`/audit?${params.toString()}`);
    });
  }

  function applyFilters() {
    pushParams(
      {
        search,
        actor: actorIds,
        action: actionList,
        entity: entityList,
        from: from || null,
        to: to || null,
      },
      { resetPage: true },
    );
  }

  function clearFilters() {
    setSearch("");
    setActorIds([]);
    setActionList([]);
    setEntityList([]);
    setFrom("");
    setTo("");
    startTransition(() => router.push("/audit"));
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { csv, filename } = await exportAuditLogsAction({
        search,
        actorIds,
        actions: actionList,
        entities: entityList,
        from: from || null,
        to: to || null,
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasActive = search || actorIds.length || actionList.length || entityList.length || from || to;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-zinc-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="Tìm action/entity/id..."
            className="w-full pl-8 pr-3 h-9 rounded-lg border border-zinc-200 text-sm"
          />
        </div>

        <MultiSelect
          placeholder="Actor"
          options={employees.map((e) => ({ value: e.id, label: e.full_name }))}
          values={actorIds}
          onChange={setActorIds}
        />
        <MultiSelect
          placeholder="Action"
          options={actions.map((a) => ({ value: a, label: a }))}
          values={actionList}
          onChange={setActionList}
        />
        <MultiSelect
          placeholder="Entity"
          options={entities.map((e) => ({ value: e, label: e }))}
          values={entityList}
          onChange={setEntityList}
        />

        <input
          type="datetime-local"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-9 rounded-lg border border-zinc-200 px-2 text-xs"
          placeholder="Từ"
          title="Từ ngày"
        />
        <input
          type="datetime-local"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-9 rounded-lg border border-zinc-200 px-2 text-xs"
          placeholder="Đến"
          title="Đến ngày"
        />

        <button
          onClick={applyFilters}
          disabled={isPending}
          className="h-9 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1 disabled:opacity-50"
        >
          <Filter className="h-3.5 w-3.5" />
          Áp dụng
        </button>

        {hasActive && (
          <button
            onClick={clearFilters}
            className="h-9 px-3 rounded-lg border border-zinc-200 text-xs text-zinc-600 hover:text-red-500 flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Xoá lọc
          </button>
        )}

        <button
          onClick={handleExport}
          disabled={exporting}
          className="ml-auto h-9 px-3 rounded-lg border border-zinc-200 text-xs text-zinc-700 hover:bg-zinc-50 flex items-center gap-1 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          {exporting ? "Đang export..." : "Export CSV"}
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-600 px-1">
        <span>
          {total > 0 ? (
            <>Hiển thị <strong>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}</strong> / {total} bản ghi</>
          ) : (
            "Không có bản ghi nào khớp bộ lọc"
          )}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => pushParams({ page: String(page - 1) })}
              disabled={page <= 1 || isPending}
              className="h-7 w-7 flex items-center justify-center rounded-md border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => pushParams({ page: String(page + 1) })}
              disabled={page >= totalPages || isPending}
              className="h-7 w-7 flex items-center justify-center rounded-md border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
