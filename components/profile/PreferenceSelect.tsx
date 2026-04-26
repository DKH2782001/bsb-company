"use client";

const options: Record<string, Array<{ value: string; label: string }>> = {
  locale: [
    { value: "vi", label: "🇻🇳 Tiếng Việt" },
    { value: "en", label: "🇬🇧 English" },
    { value: "ja", label: "🇯🇵 日本語" },
  ],
  timezone: [
    { value: "Asia/Ho_Chi_Minh", label: "Hồ Chí Minh (UTC+7)" },
    { value: "Asia/Bangkok", label: "Bangkok (UTC+7)" },
    { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
    { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
    { value: "America/New_York", label: "New York (UTC-5)" },
    { value: "Europe/London", label: "London (UTC+0)" },
  ],
  dateFormat: [
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2026)" },
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2026)" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-12-31)" },
  ],
  theme: [
    { value: "light", label: "☀️ Sáng" },
    { value: "dark", label: "🌙 Tối" },
    { value: "system", label: "💻 Theo hệ thống" },
  ],
};

export function PreferenceSelect({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  const items = options[name] ?? [];

  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-[var(--text-soft)]">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="flex h-11 w-full appearance-none rounded-2xl border border-[var(--line-soft)] bg-[var(--input-bg)] px-3.5 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--brand-600)] focus:ring-1 focus:ring-[var(--brand-500)] transition-colors cursor-pointer"
      >
        {items.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
