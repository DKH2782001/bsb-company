"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

const MODES: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex rounded-xl bg-[var(--locale-bg)] p-1 text-[12px] font-semibold">
      {MODES.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-label={label}
          title={label}
          className={cn(
            "flex items-center justify-center w-8 h-7 rounded-lg transition-all duration-200",
            value === theme
              ? "bg-[var(--locale-active-bg)] text-[var(--brand-600)] shadow-sm"
              : "text-[var(--text-soft)] hover:text-[var(--text-strong)]",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
