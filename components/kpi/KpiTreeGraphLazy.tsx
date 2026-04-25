"use client";

import dynamic from "next/dynamic";

export const KpiTreeGraph = dynamic(
  () => import("./KpiTreeGraph").then((m) => ({ default: m.KpiTreeGraph })),
  {
    ssr: false,
    loading: () => <div className="h-[420px] rounded-2xl bg-zinc-50 animate-pulse" />,
  },
);
