/**
 * Mock data cho Scheduling module — dùng khi inDemoMode() = true.
 *
 * Thiết kế để thỏa mãn done criteria:
 *   1. Nguyễn Văn A = 50/48h ⚠ Vượt 2h
 *      (6 Ca Sáng × 7h + 1 Ca Đêm × 8h = 50h)
 *   2. Thứ 4 Ca Chiều = 1/2 ⚠  (chỉ NV E làm Chiều ngày T4)
 *   3. Tổng 3 cảnh báo: T3 Chiều 1/2 + T4 Chiều 1/2 + NV A vượt giờ
 *      (T3 Sáng = 2/2 vì có cả NV B + NV C)
 */

// ─── Types ────────────────────────────────────────────────────

export type MockEmployee = {
  id: string;
  name: string;
  initials: string;
  role: string;
  isPartTime: boolean;
  avatarGradient: string;
  maxHoursWeek: number;
  hourlyRate: number; // VND / giờ
};

export type MockShiftTemplate = {
  id: string;
  code: string;
  name: string;
  shortLabel: string;
  color: string;   // hex — mapped to token via hexToShiftToken()
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isOvernight: boolean;
  minStaff: number;
  maxStaff: number;
  nightMultiplier: number;
  weekendMultiplier: number;
  hourlyRateMultiplier: number;
};

export type MockShift = {
  id: string;
  employeeId: string;
  templateId: string;
  date: string; // ISO "YYYY-MM-DD"
  status: "scheduled" | "confirmed" | "no_show" | "cancelled";
};

export type MockUnavailability = {
  id: string;
  employeeId: string;
  date: string;
  reason: string | null;
};

export type MockSwapRequest = {
  id: string;
  shiftId: string;
  requestType: "drop" | "swap";
  requesterId: string;
  targetEmployeeId: string | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
};

export type MockPeriod = {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: "draft" | "published" | "locked";
  publishedAt: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────

function getMondayOfCurrentWeek(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayStr(monday: Date, offsetDays: number): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const _mon = getMondayOfCurrentWeek();
const MON = dayStr(_mon, 0); // Thứ 2
const TUE = dayStr(_mon, 1); // Thứ 3
const WED = dayStr(_mon, 2); // Thứ 4
const THU = dayStr(_mon, 3); // Thứ 5
const FRI = dayStr(_mon, 4); // Thứ 6
const SAT = dayStr(_mon, 5); // Thứ 7
const SUN = dayStr(_mon, 6); // Chủ nhật

// ─── Employees ───────────────────────────────────────────────

export const MOCK_EMPLOYEES: MockEmployee[] = [
  {
    id: "sch-e1", name: "Nguyễn Văn A", initials: "NA", role: "Pha chế",
    isPartTime: false, maxHoursWeek: 48, hourlyRate: 72_115,
    avatarGradient: "linear-gradient(135deg, #5B7FB5, #2D4A78)",
  },
  {
    id: "sch-e2", name: "Trần Thị B", initials: "TB", role: "Phục vụ",
    isPartTime: false, maxHoursWeek: 48, hourlyRate: 57_692,
    avatarGradient: "linear-gradient(135deg, #B5705B, #7A3D2D)",
  },
  {
    id: "sch-e3", name: "Lê Văn C", initials: "LC", role: "Thu ngân",
    isPartTime: false, maxHoursWeek: 48, hourlyRate: 57_692,
    avatarGradient: "linear-gradient(135deg, #6B8E5B, #3E5A30)",
  },
  {
    id: "sch-e4", name: "Phạm Thu D", initials: "PD", role: "Phục vụ",
    isPartTime: true, maxHoursWeek: 24, hourlyRate: 50_000,
    avatarGradient: "linear-gradient(135deg, #A06BB5, #5E3D78)",
  },
  {
    id: "sch-e5", name: "Hoàng Minh E", initials: "HE", role: "Phục vụ",
    isPartTime: true, maxHoursWeek: 30, hourlyRate: 45_000,
    avatarGradient: "linear-gradient(135deg, #B58F5B, #785B30)",
  },
  {
    id: "sch-e6", name: "Đỗ Quỳnh F", initials: "DF", role: "Thu ngân",
    isPartTime: true, maxHoursWeek: 30, hourlyRate: 55_000,
    avatarGradient: "linear-gradient(135deg, #5BA8B5, #305C78)",
  },
  {
    id: "sch-e7", name: "Vũ Thanh G", initials: "VG", role: "Pha chế",
    isPartTime: true, maxHoursWeek: 30, hourlyRate: 60_000,
    avatarGradient: "linear-gradient(135deg, #B5556B, #783040)",
  },
];

// ─── Shift Templates ─────────────────────────────────────────
// break_minutes = 0 → giờ thực bằng giờ danh nghĩa (quan trọng cho tính toán)
// Sáng 7h, Chiều 8h, Đêm 8h

export const MOCK_SHIFT_TEMPLATES: MockShiftTemplate[] = [
  {
    id: "sht-morning", code: "MORNING", name: "Ca Sáng", shortLabel: "Sáng",
    color: "#F59E0B", startTime: "07:00", endTime: "14:00",
    breakMinutes: 0, isOvernight: false, minStaff: 2, maxStaff: 4,
    nightMultiplier: 1.3, weekendMultiplier: 2.0, hourlyRateMultiplier: 1.0,
  },
  {
    id: "sht-afternoon", code: "AFTERNOON", name: "Ca Chiều", shortLabel: "Chiều",
    color: "#3B82F6", startTime: "14:00", endTime: "22:00",
    breakMinutes: 0, isOvernight: false, minStaff: 2, maxStaff: 4,
    nightMultiplier: 1.3, weekendMultiplier: 2.0, hourlyRateMultiplier: 1.0,
  },
  {
    id: "sht-night", code: "NIGHT", name: "Ca Đêm", shortLabel: "Đêm",
    color: "#6D5EF7", startTime: "22:00", endTime: "06:00",
    breakMinutes: 0, isOvernight: true, minStaff: 1, maxStaff: 2,
    nightMultiplier: 1.3, weekendMultiplier: 2.0, hourlyRateMultiplier: 1.3,
  },
];

// ─── Schedule Period ─────────────────────────────────────────

export const MOCK_PERIOD: MockPeriod = {
  id: "mock-period-current",
  weekStart: MON,
  weekEnd: SUN,
  status: "published",
  publishedAt: new Date(Date.now() - 86_400_000).toISOString(), // hôm qua
};

// ─── Scheduled Shifts ────────────────────────────────────────
//
// Weekly plan — designed so:
//
// NV A  T2=Sáng T3=Đêm  T4=Sáng T5=Sáng T6=Sáng T7=Sáng CN=Sáng  → 50h (6×7+1×8) ⚠ vượt 48h
// NV B  T2=Chiều T3=Sáng T4=—   T5=Chiều T6=Sáng T7=Sáng CN=—    → 37h
// NV C  T2=Sáng T3=Sáng T4=Sáng T5=—   T6=Chiều T7=UNAVAIL CN=UNAVAIL → 29h
// NV D  T2=UNAVAIL T3=Chiều T4=— T5=Sáng T6=—  T7=Sáng CN=—       → 22h
// NV E  T2=UNAVAIL T3=UNAVAIL T4=Chiều T5=UNAVAIL T6=Chiều T7=Sáng CN=Sáng → 30h
// NV F  T2=Chiều T3=—   T4=UNAVAIL T5=Chiều T6=— T7=— CN=—         → 16h
// NV G  T2=—    T3=Đêm  T4=Đêm  T5=—    T6=UNAVAIL T7=Đêm CN=—   → 24h
//
// Staffing check (warnings = 3):
//   T3 Sáng: NV B + NV C = 2/2 ✓ (no warning)
//   T3 Chiều: NV D = 1/2 ⚠
//   T4 Chiều: NV E = 1/2 ⚠
//   NV A: 50h > 48h ⚠

const _BASE_SHIFTS: MockShift[] = [
  // NV A — Nguyễn Văn A (50h total)
  { id: "ss-a1", employeeId: "sch-e1", templateId: "sht-morning",   date: MON, status: "confirmed" },
  { id: "ss-a2", employeeId: "sch-e1", templateId: "sht-night",     date: TUE, status: "confirmed" },
  { id: "ss-a3", employeeId: "sch-e1", templateId: "sht-morning",   date: WED, status: "scheduled" },
  { id: "ss-a4", employeeId: "sch-e1", templateId: "sht-morning",   date: THU, status: "scheduled" },
  { id: "ss-a5", employeeId: "sch-e1", templateId: "sht-morning",   date: FRI, status: "scheduled" },
  { id: "ss-a6", employeeId: "sch-e1", templateId: "sht-morning",   date: SAT, status: "scheduled" },
  { id: "ss-a7", employeeId: "sch-e1", templateId: "sht-morning",   date: SUN, status: "scheduled" },

  // NV B — Trần Thị B (37h total)
  { id: "ss-b1", employeeId: "sch-e2", templateId: "sht-afternoon", date: MON, status: "confirmed" },
  { id: "ss-b2", employeeId: "sch-e2", templateId: "sht-morning",   date: TUE, status: "confirmed" }, // T3 Sáng: chỉ có NV B → 1/2 ⚠
  { id: "ss-b3", employeeId: "sch-e2", templateId: "sht-afternoon", date: THU, status: "scheduled" },
  { id: "ss-b4", employeeId: "sch-e2", templateId: "sht-morning",   date: FRI, status: "scheduled" },
  { id: "ss-b5", employeeId: "sch-e2", templateId: "sht-morning",   date: SAT, status: "scheduled" },

  // NV C — Lê Văn C (29h total, T7+CN unavail)
  { id: "ss-c1", employeeId: "sch-e3", templateId: "sht-morning",   date: MON, status: "confirmed" },
  { id: "ss-c4", employeeId: "sch-e3", templateId: "sht-morning",   date: TUE, status: "scheduled" }, // makes T3 Sáng = 2/2 ✓
  { id: "ss-c2", employeeId: "sch-e3", templateId: "sht-morning",   date: WED, status: "scheduled" },
  { id: "ss-c3", employeeId: "sch-e3", templateId: "sht-afternoon", date: FRI, status: "scheduled" },

  // NV D — Phạm Thu D (22h total, T2 unavail)
  { id: "ss-d1", employeeId: "sch-e4", templateId: "sht-afternoon", date: TUE, status: "scheduled" },
  { id: "ss-d2", employeeId: "sch-e4", templateId: "sht-morning",   date: THU, status: "scheduled" },
  { id: "ss-d3", employeeId: "sch-e4", templateId: "sht-morning",   date: SAT, status: "scheduled" },

  // NV E — Hoàng Minh E (30h total, T2+T3+T5 unavail)
  { id: "ss-e1", employeeId: "sch-e5", templateId: "sht-afternoon", date: WED, status: "scheduled" }, // T4 Chiều: chỉ NV E → 1/2 ⚠
  { id: "ss-e2", employeeId: "sch-e5", templateId: "sht-afternoon", date: FRI, status: "scheduled" },
  { id: "ss-e3", employeeId: "sch-e5", templateId: "sht-morning",   date: SAT, status: "scheduled" },
  { id: "ss-e4", employeeId: "sch-e5", templateId: "sht-morning",   date: SUN, status: "scheduled" },

  // NV F — Đỗ Quỳnh F (16h total, T4 unavail)
  { id: "ss-f1", employeeId: "sch-e6", templateId: "sht-afternoon", date: MON, status: "confirmed" },
  { id: "ss-f2", employeeId: "sch-e6", templateId: "sht-afternoon", date: THU, status: "scheduled" },

  // NV G — Vũ Thanh G (24h total, T6 unavail)
  { id: "ss-g1", employeeId: "sch-e7", templateId: "sht-night",     date: TUE, status: "scheduled" },
  { id: "ss-g2", employeeId: "sch-e7", templateId: "sht-night",     date: WED, status: "scheduled" },
  { id: "ss-g3", employeeId: "sch-e7", templateId: "sht-night",     date: SAT, status: "scheduled" },
];

// ─── Mutable demo store (modified by server actions in demo mode) ──

let _demoShifts: MockShift[] = [..._BASE_SHIFTS];

export function getSchedulingShifts(): MockShift[] {
  return _demoShifts;
}

export function demoAddShift(shift: MockShift): void {
  _demoShifts = [..._demoShifts, shift];
}

export function demoCancelShift(id: string): void {
  _demoShifts = _demoShifts.map((s) =>
    s.id === id ? { ...s, status: "cancelled" as const } : s,
  );
}

// ─── Unavailabilities ────────────────────────────────────────

export const MOCK_UNAVAILABILITIES: MockUnavailability[] = [
  // Lê Văn C: T7, CN
  { id: "unav-c1", employeeId: "sch-e3", date: SAT, reason: "Việc gia đình" },
  { id: "unav-c2", employeeId: "sch-e3", date: SUN, reason: "Việc gia đình" },
  // Phạm Thu D: T2
  { id: "unav-d1", employeeId: "sch-e4", date: MON, reason: "Thi cử" },
  // Hoàng Minh E: T2, T3, T5
  { id: "unav-e1", employeeId: "sch-e5", date: MON, reason: "Học trên lớp" },
  { id: "unav-e2", employeeId: "sch-e5", date: TUE, reason: "Học trên lớp" },
  { id: "unav-e3", employeeId: "sch-e5", date: THU, reason: "Học trên lớp" },
  // Đỗ Quỳnh F: T4
  { id: "unav-f1", employeeId: "sch-e6", date: WED, reason: "Khám sức khỏe" },
  // Vũ Thanh G: T6
  { id: "unav-g1", employeeId: "sch-e7", date: FRI, reason: "Về quê" },
];

// ─── Swap Requests (2 pending) ───────────────────────────────

export const MOCK_SWAP_REQUESTS: MockSwapRequest[] = [
  {
    id: "swap-1",
    shiftId: "ss-b1",                // NV B xin nhả ca Chiều T2
    requestType: "drop",
    requesterId: "sch-e2",
    targetEmployeeId: null,
    reason: "Bận việc đột xuất",
    status: "pending",
    createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
  },
  {
    id: "swap-2",
    shiftId: "ss-d1",                // NV D muốn đổi ca Chiều T3
    requestType: "swap",
    requesterId: "sch-e4",
    targetEmployeeId: "sch-e5",
    reason: "Đổi ca với Hoàng Minh E",
    status: "pending",
    createdAt: new Date(Date.now() - 7 * 3_600_000).toISOString(),
  },
];
