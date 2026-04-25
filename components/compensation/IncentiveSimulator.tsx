"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { computePayroll, DEFAULT_BONUS_RULE } from "@/lib/compensation/ruleEngine";
import { formatVND } from "@/lib/utils";

export function IncentiveSimulator({ defaultBase = 20_000_000 }: { defaultBase?: number }) {
  const [base, setBase] = useState(defaultBase);
  const [allowance, setAllowance] = useState(1_000_000);
  const [commission, setCommission] = useState(0);
  const [kpi, setKpi] = useState(100);
  const [team, setTeam] = useState(100);
  const [company, setCompany] = useState(100);

  const result = computePayroll({
    base_salary: base,
    allowance,
    commission,
    kpi_completion: kpi / 100,
    team_completion: team / 100,
    company_completion: company / 100,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incentive Simulator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-1.5">
            <Label>Lương cơ bản</Label>
            <Input
              type="number"
              value={base}
              onChange={(e) => setBase(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phụ cấp</Label>
            <Input
              type="number"
              value={allowance}
              onChange={(e) => setAllowance(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hoa hồng</Label>
            <Input
              type="number"
              value={commission}
              onChange={(e) => setCommission(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>KPI cá nhân ({kpi}%)</Label>
            <input
              type="range"
              min={0}
              max={150}
              value={kpi}
              onChange={(e) => setKpi(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
          <div className="space-y-1.5">
            <Label>KPI team ({team}%)</Label>
            <input
              type="range"
              min={0}
              max={150}
              value={team}
              onChange={(e) => setTeam(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
          <div className="space-y-1.5">
            <Label>KPI công ty ({company}%)</Label>
            <input
              type="range"
              min={0}
              max={150}
              value={company}
              onChange={(e) => setCompany(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-1.5 text-sm">
          <Row k="Lương cơ bản" v={formatVND(result.base_salary)} />
          <Row k="Phụ cấp" v={formatVND(result.allowance)} />
          <Row k="Hoa hồng" v={formatVND(result.commission)} />
          <Row k="KPI bonus" v={formatVND(result.kpi_bonus)} />
          <Row k="Team bonus" v={formatVND(result.team_bonus)} />
          <Row k="Company bonus" v={formatVND(result.company_bonus)} />
          <div className="border-t border-zinc-200 my-2" />
          <Row k={<strong>Gross pay</strong>} v={<strong>{formatVND(result.gross_pay)}</strong>} />
          <Row k={<strong>Net pay</strong>} v={<strong>{formatVND(result.net_pay)}</strong>} />
          <Row k="Cost to company" v={formatVND(result.company_cost)} />
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-zinc-500">Multiplier áp dụng</span>
            <Badge variant={result.multiplier_applied >= 1 ? "success" : "warning"}>
              x{result.multiplier_applied.toFixed(2)}
            </Badge>
          </div>
        </div>

        <div className="text-xs text-zinc-500">
          Dựa trên rule mặc định: base_bonus = {DEFAULT_BONUS_RULE.base_bonus_pct}%, 5 bậc threshold
          (0% / 80% / 90% / 100% / 120%).
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-600">{k}</span>
      <span className="text-zinc-900">{v}</span>
    </div>
  );
}
