import { cn } from "@/lib/utils";

export function EntityAvatar({
  name,
  size = "md",
  tone = "indigo",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  tone?: "indigo" | "violet" | "emerald" | "amber";
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const sizeClass =
    size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-20 w-20 text-2xl" : "h-11 w-11 text-sm";
  const toneClass =
    tone === "violet"
      ? "from-violet-500 to-indigo-600"
      : tone === "emerald"
        ? "from-emerald-500 to-teal-600"
        : tone === "amber"
          ? "from-amber-400 to-orange-500"
          : "from-[#6D5EF7] to-[#415BFF]";

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-[28px] bg-gradient-to-br font-semibold text-white shadow-[0_10px_30px_rgba(92,90,255,0.18)]",
        sizeClass,
        toneClass,
      )}
    >
      {initials || "U"}
    </div>
  );
}
