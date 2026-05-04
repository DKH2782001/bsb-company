import assert from "node:assert/strict";
import { afterEach, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadAttendanceHelpers() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

  const [{ resolveCheckInLocation }, { DEMO_COMPANY_ID, demoAttendanceLocations }] = await Promise.all([
    import("@/lib/repositories/attendance"),
    import("@/lib/queries/demo"),
  ]);

  return { resolveCheckInLocation, DEMO_COMPANY_ID, demoAttendanceLocations };
}

test("formatLocalISODate uses the local timezone day instead of the UTC day", async () => {
  const { formatLocalISODate } = await import("@/lib/utils");

  assert.equal(formatLocalISODate(new Date("2026-04-27T19:19:42.000Z"), "Asia/Ho_Chi_Minh"), "2026-04-28");
});

test("demo company falls back to an active location when tester is outside the seeded geofence", async () => {
  const { resolveCheckInLocation, DEMO_COMPANY_ID, demoAttendanceLocations } = await loadAttendanceHelpers();
  const result = resolveCheckInLocation({
    companyId: DEMO_COMPANY_ID,
    locations: demoAttendanceLocations,
    latitude: 40.7128,
    longitude: -74.006,
    ip: null,
  });

  assert.equal(result.location?.id, "loc-hq-hanoi");
  assert.equal(result.relaxed, true);
});

test("real companies still reject check-in attempts outside the allowed geofence", async () => {
  const { resolveCheckInLocation, demoAttendanceLocations } = await loadAttendanceHelpers();
  const result = resolveCheckInLocation({
    companyId: "company-real",
    locations: demoAttendanceLocations,
    latitude: 40.7128,
    longitude: -74.006,
    ip: null,
  });

  assert.equal(result.location, null);
  assert.equal(result.relaxed, false);
});

test("real companies still match the configured geofence when GPS is inside radius", async () => {
  const { resolveCheckInLocation, demoAttendanceLocations } = await loadAttendanceHelpers();
  const result = resolveCheckInLocation({
    companyId: "company-real",
    locations: demoAttendanceLocations,
    latitude: 21.038211,
    longitude: 105.78256,
    ip: null,
  });

  assert.equal(result.location?.id, "loc-hq-hanoi");
  assert.equal(result.relaxed, false);
});
