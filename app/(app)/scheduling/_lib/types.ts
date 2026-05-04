export type SchedulingEmployee = {
  id: string;
  name: string;
  initials: string;
  role: string;
  isPartTime: boolean;
  avatarGradient: string;
  maxHoursWeek: number;
  hourlyRate: number;
};

export type SchedulingTemplate = {
  id: string;
  code: string;
  name: string;
  shortLabel: string;
  color: string;
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

export type SchedulingShift = {
  id: string;
  employeeId: string;
  templateId: string;
  date: string;
  status: "scheduled" | "confirmed" | "no_show" | "cancelled";
};

export type SchedulingUnavailability = {
  id: string;
  employeeId: string;
  date: string;
  reason: string | null;
};

export type SchedulingPeriod = {
  id: string;
  weekStart: string;
  weekEnd: string;
  status: "draft" | "published" | "locked";
  publishedAt: string | null;
};

export type ShiftWarning = {
  type: "over_hours" | "understaffed";
  employeeId?: string;
  templateId?: string;
  date?: string;
  message: string;
};

export type SchedulingPageData = {
  period: SchedulingPeriod | null;
  employees: SchedulingEmployee[];
  templates: SchedulingTemplate[];
  shifts: SchedulingShift[];
  unavailabilities: SchedulingUnavailability[];
  weekStart: string;
  weekEnd: string;
  pendingSwapCount: number;
};
