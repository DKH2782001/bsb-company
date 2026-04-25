"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function TabsNav({
  items,
  className,
}: {
  items: Array<{ href: string; label: string }>;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <div className={cn("border-b border-zinc-200 mb-6", className)}>
      <nav className="-mb-px flex gap-6">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                active
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-zinc-500 hover:text-zinc-700",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
