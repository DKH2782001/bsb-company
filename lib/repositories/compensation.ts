import * as demo from "@/lib/queries/demo";
import { withDemoFallback } from "@/lib/repositories/shared";

export async function listPayrollEntries() {
  return withDemoFallback(demo.demoPayroll, async (db) => {
    const { data, error } = await db.from("payroll_entries").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
}
