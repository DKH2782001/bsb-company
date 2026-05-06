"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPercent(value: number) {
  return `${value.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`;
}

export function TaskExecutionInputs() {
  const [target, setTarget] = useState("");
  const [actual, setActual] = useState("");
  const [weight, setWeight] = useState("1");
  const [unit, setUnit] = useState("");

  const completionPercent = useMemo(() => {
    const targetNumber = parseNumber(target);
    if (targetNumber <= 0) return 0;
    return parseNumber(actual) / targetNumber * 100;
  }, [actual, target]);

  return (
    <>
      <Input
        name="actionTargetValue"
        type="number"
        min={0}
        value={target}
        onChange={(event) => setTarget(event.target.value)}
        placeholder="Mục tiêu cần đạt"
      />
      <Input
        name="actionActualValue"
        type="number"
        min={0}
        value={actual}
        onChange={(event) => setActual(event.target.value)}
        placeholder="Kết quả thực tế"
      />
      <Input
        name="taskWeight"
        type="number"
        min={0}
        step={0.1}
        value={weight}
        onChange={(event) => setWeight(event.target.value)}
        placeholder="Trọng số công việc"
      />
      <Input
        name="progressUnit"
        value={unit}
        onChange={(event) => setUnit(event.target.value)}
        placeholder="Đơn vị: khách hàng / trường hợp / video..."
      />
      <div className="flex h-11 items-center rounded-2xl border border-indigo-200 bg-indigo-50 px-3.5 text-sm font-semibold text-indigo-900">
        % hoàn thành: {formatPercent(completionPercent)}
      </div>
    </>
  );
}
