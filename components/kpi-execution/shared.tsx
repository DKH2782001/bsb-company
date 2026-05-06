import { Badge } from "@/components/ui/badge";
import { KpiStatusBadge } from "@/components/kpi/KpiStatusBadge";
import type { ExecutionStatus } from "@/types/domain";

export function formatExecutionValue(value: number, unit: string) {
  if (unit === "VND") return value.toLocaleString("vi-VN");
  return value.toLocaleString("vi-VN");
}

export function formatExecutionPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function RiskBadge({ risk }: { risk: ExecutionStatus }) {
  if (risk === "green") return <Badge variant="success">Green</Badge>;
  if (risk === "yellow") return <Badge variant="warning">Yellow</Badge>;
  return <Badge variant="danger">Red</Badge>;
}

export function ResultStatus({ status, completion }: { status: ExecutionStatus; completion: number }) {
  return <KpiStatusBadge status={status} completion={completion} />;
}
