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
    <div className={cn("border-b border-[var(--line-soft)] mb-6", className)}>
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
                  ? "border-[var(--brand-600)] text-[var(--brand-700)]"
                  : "border-transparent text-[var(--text-soft)] hover:text-[var(--text-strong)]",
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
