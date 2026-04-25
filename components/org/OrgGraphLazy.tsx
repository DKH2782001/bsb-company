"use client";

import dynamic from "next/dynamic";

export const OrgGraph = dynamic(
  () => import("./OrgGraph").then((m) => ({ default: m.OrgGraph })),
  {
    ssr: false,
    loading: () => <div className="h-[420px] rounded-2xl bg-zinc-50 animate-pulse" />,
  },
);
