import { cache } from "react";
import * as demo from "./demo";
import { listDepartments, listEmployees, getCompany } from "@/lib/repositories/org";
import { listKpis, listKpiActuals, listKpiTargets } from "@/lib/repositories/kpi";
import { listTasks } from "@/lib/repositories/operations";
import { listPayrollEntries } from "@/lib/repositories/compensation";
import { listProjects } from "@/lib/repositories/projects";
import { listAccountingEntries } from "@/lib/repositories/finance";
import {
  listAlerts,
  listApprovals,
  listAuditLogs,
  listReports,
  listReportSchedules,
} from "@/lib/repositories/governance";
import { listSops } from "@/lib/repositories/knowledge";
import { listRequisitions } from "@/lib/repositories/recruiting";
import { getProfileScreenData } from "@/lib/repositories/profile";
import { withDemoFallback } from "@/lib/repositories/shared";

export const fetchEmployees = cache(() => listEmployees());
export const fetchDepartments = cache(() => listDepartments());
export const fetchCompany = cache(() => getCompany());
export const fetchKpis = cache(() => listKpis());
export const fetchKpiActuals = cache((period = "2026-04") => listKpiActuals(period));
export const fetchKpiTargets = cache((period = "2026-04") => listKpiTargets(period));
export const fetchTasks = cache(() => listTasks());
export const fetchPayroll = cache(() => listPayrollEntries());
export const fetchProjects = cache(() => listProjects());
export const fetchAccounting = cache(() => listAccountingEntries());
export const fetchAlerts = cache(() => listAlerts());
export const fetchApprovals = cache(() => listApprovals());
export const fetchReports = cache(() => listReports());
export const fetchReportSchedules = cache(() => listReportSchedules());
export const fetchRequisitions = cache(() => listRequisitions());
export const fetchSops = cache(() => listSops());
export const fetchAuditLogs = cache(() => listAuditLogs());
export const fetchProfileData = cache(() => getProfileScreenData());

export const fetchObjectives = cache(() =>
  withDemoFallback(demo.demoObjectives, async (db) => {
    const { data, error } = await db.from("objectives").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }),
);

export const fetchKeyResults = cache(() =>
  withDemoFallback(demo.demoKeyResults, async (db) => {
    const { data, error } = await db.from("key_results").select("*");
    if (error) throw error;
    return data ?? [];
  }),
);

export { demo };
