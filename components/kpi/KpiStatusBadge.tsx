import { Badge } from "@/components/ui/badge";

export function KpiStatusBadge({
  status,
  completion,
}: {
  status: "green" | "yellow" | "red" | "na";
  completion: number | null;
}) {
  if (status === "na" || completion == null) return <Badge variant="outline">—</Badge>;
  const pct = Math.round(completion * 100);
  if (status === "green") return <Badge variant="success">{pct}%</Badge>;
  if (status === "yellow") return <Badge variant="warning">{pct}%</Badge>;
  return <Badge variant="danger">{pct}%</Badge>;
}
