import { describe, it, expect } from "vitest";
import {
  computeShiftHours,
  computeWeeklyHours,
  computeWeeklyPay,
  computeStaffing,
  detectWarnings,
  computeTotalHours,
} from "../app/(app)/scheduling/_lib/compute";
import type {
  SchedulingEmployee,
  SchedulingShift,
  SchedulingTemplate,
} from "../app/(app)/scheduling/_lib/types";

// ── Fixtures ──────────────────────────────────────────────────

const MORNING: SchedulingTemplate = {
  id: "sht-morning",
  code: "MORNING",
  name: "Ca Sáng",
  shortLabel: "Sáng",
  color: "#F59E0B",
  startTime: "07:00",
  endTime: "14:00",
  breakMinutes: 0,
  isOvernight: false,
  minStaff: 2,
  maxStaff: 4,
  nightMultiplier: 1.3,
  weekendMultiplier: 2.0,
  hourlyRateMultiplier: 1.0,
};

const AFTERNOON: SchedulingTemplate = {
  id: "sht-afternoon",
  code: "AFTERNOON",
  name: "Ca Chiều",
  shortLabel: "Chiều",
  color: "#3B82F6",
  startTime: "14:00",
  endTime: "22:00",
  breakMinutes: 0,
  isOvernight: false,
  minStaff: 2,
  maxStaff: 4,
  nightMultiplier: 1.3,
  weekendMultiplier: 2.0,
  hourlyRateMultiplier: 1.0,
};

const NIGHT: SchedulingTemplate = {
  id: "sht-night",
  code: "NIGHT",
  name: "Ca Đêm",
  shortLabel: "Đêm",
  color: "#6D5EF7",
  startTime: "22:00",
  endTime: "06:00",
  breakMinutes: 0,
  isOvernight: true,
  minStaff: 1,
  maxStaff: 2,
  nightMultiplier: 1.3,
  weekendMultiplier: 2.0,
  hourlyRateMultiplier: 1.3,
};

const TEMPLATES = [MORNING, AFTERNOON, NIGHT];

const EMP_A: SchedulingEmployee = {
  id: "e1",
  name: "Nguyễn Văn A",
  initials: "NA",
  role: "Pha chế",
  isPartTime: false,
  avatarGradient: "linear-gradient(135deg, #5B7FB5, #2D4A78)",
  maxHoursWeek: 48,
  hourlyRate: 72_115,
};

const EMP_B: SchedulingEmployee = {
  id: "e2",
  name: "Trần Thị B",
  initials: "TB",
  role: "Phục vụ",
  isPartTime: false,
  avatarGradient: "linear-gradient(135deg, #B5705B, #7A3D2D)",
  maxHoursWeek: 48,
  hourlyRate: 57_692,
};

// Week of 2026-05-04
const shifts: SchedulingShift[] = [
  // NV A: 6 morning (7h each) + 1 night (8h) = 50h → OVER
  { id: "a1", employeeId: "e1", templateId: "sht-morning",   date: "2026-05-04", status: "confirmed" },
  { id: "a2", employeeId: "e1", templateId: "sht-night",     date: "2026-05-05", status: "confirmed" },
  { id: "a3", employeeId: "e1", templateId: "sht-morning",   date: "2026-05-06", status: "scheduled" },
  { id: "a4", employeeId: "e1", templateId: "sht-morning",   date: "2026-05-07", status: "scheduled" },
  { id: "a5", employeeId: "e1", templateId: "sht-morning",   date: "2026-05-08", status: "scheduled" },
  { id: "a6", employeeId: "e1", templateId: "sht-morning",   date: "2026-05-09", status: "scheduled" },
  { id: "a7", employeeId: "e1", templateId: "sht-morning",   date: "2026-05-10", status: "scheduled" },
  // NV B: only on Tue morning → 1/2 understaffed
  { id: "b1", employeeId: "e2", templateId: "sht-morning",   date: "2026-05-05", status: "scheduled" },
];

// ── Tests ──────────────────────────────────────────────────────

describe("computeShiftHours", () => {
  it("morning 07:00–14:00 with no break = 7h", () => {
    expect(computeShiftHours(MORNING)).toBe(7);
  });

  it("afternoon 14:00–22:00 with no break = 8h", () => {
    expect(computeShiftHours(AFTERNOON)).toBe(8);
  });

  it("overnight night 22:00–06:00 = 8h", () => {
    expect(computeShiftHours(NIGHT)).toBe(8);
  });

  it("applies break minutes correctly", () => {
    const withBreak: SchedulingTemplate = { ...MORNING, breakMinutes: 30 };
    expect(computeShiftHours(withBreak)).toBe(6.5);
  });
});

describe("computeWeeklyHours", () => {
  it("NV A with 6 morning + 1 night = 50h", () => {
    expect(computeWeeklyHours("e1", shifts, TEMPLATES)).toBe(50);
  });

  it("NV B with 1 morning = 7h", () => {
    expect(computeWeeklyHours("e2", shifts, TEMPLATES)).toBe(7);
  });

  it("employee with no shifts = 0h", () => {
    expect(computeWeeklyHours("nonexistent", shifts, TEMPLATES)).toBe(0);
  });

  it("cancelled shifts are excluded", () => {
    const withCancelled: SchedulingShift[] = [
      ...shifts,
      { id: "cancelled1", employeeId: "e2", templateId: "sht-afternoon", date: "2026-05-06", status: "cancelled" },
    ];
    expect(computeWeeklyHours("e2", withCancelled, TEMPLATES)).toBe(7);
  });
});

describe("computeWeeklyPay", () => {
  it("applies weekend multiplier for Saturday shifts", () => {
    const satShift: SchedulingShift = {
      id: "sat1",
      employeeId: "e2",
      templateId: "sht-morning",
      date: "2026-05-09", // Saturday
      status: "scheduled",
    };
    const normalPay = computeWeeklyPay("e2", [{ ...satShift, date: "2026-05-07" }], TEMPLATES, EMP_B); // Thursday
    const satPay = computeWeeklyPay("e2", [satShift], TEMPLATES, EMP_B);
    expect(satPay).toBe(normalPay * 2.0);
  });

  it("applies night multiplier for overnight shifts", () => {
    const nightShift: SchedulingShift = {
      id: "n1",
      employeeId: "e1",
      templateId: "sht-night",
      date: "2026-05-06", // Wednesday (weekday)
      status: "scheduled",
    };
    const pay = computeWeeklyPay("e1", [nightShift], TEMPLATES, EMP_A);
    // 72115 * 8h * 1.3 = 750,396
    expect(pay).toBeCloseTo(EMP_A.hourlyRate * 8 * 1.3);
  });
});

describe("computeStaffing", () => {
  it("returns correct count for a given date+template", () => {
    expect(computeStaffing("2026-05-04", "sht-morning", shifts)).toBe(1); // NV A
  });

  it("returns 0 when no one is scheduled", () => {
    expect(computeStaffing("2026-05-04", "sht-afternoon", shifts)).toBe(0);
  });
});

describe("detectWarnings", () => {
  const weekDates = [
    "2026-05-04", "2026-05-05", "2026-05-06",
    "2026-05-07", "2026-05-08", "2026-05-09", "2026-05-10",
  ];

  it("detects NV A over 48h/week", () => {
    const warnings = detectWarnings([EMP_A, EMP_B], shifts, TEMPLATES, weekDates);
    const overHours = warnings.filter((w) => w.type === "over_hours");
    expect(overHours).toHaveLength(1);
    expect(overHours[0].employeeId).toBe("e1");
  });

  it("detects understaffed morning on Tuesday (1/2)", () => {
    const warnings = detectWarnings([EMP_A, EMP_B], shifts, TEMPLATES, weekDates);
    const understaffed = warnings.filter(
      (w) => w.type === "understaffed" && w.date === "2026-05-05" && w.templateId === "sht-morning",
    );
    expect(understaffed).toHaveLength(1);
  });

  it("does NOT warn when count = 0 (no shift scheduled)", () => {
    // Monday has no afternoon — should not warn (count=0, not understaffed)
    const warnings = detectWarnings([EMP_A, EMP_B], shifts, TEMPLATES, weekDates);
    const monAfternoon = warnings.filter(
      (w) => w.type === "understaffed" && w.date === "2026-05-04" && w.templateId === "sht-afternoon",
    );
    expect(monAfternoon).toHaveLength(0);
  });

  it("no shifts = no warnings", () => {
    const warnings = detectWarnings([], [], TEMPLATES, weekDates);
    expect(warnings).toHaveLength(0);
  });
});

describe("computeTotalHours", () => {
  it("sums all non-cancelled shifts", () => {
    // NV A: 50h + NV B: 7h = 57h
    expect(computeTotalHours(shifts, TEMPLATES)).toBe(57);
  });
});
