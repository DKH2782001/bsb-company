import type { TableRow } from "@/lib/supabase/database.types";

export type AppRole = TableRow<"user_roles">["role"];

export type UserContext = {
  authUserId: string | null;
  companyId: string | null;
  employeeId: string | null;
  roles: AppRole[];
  scopedDepartmentIds: string[];
  scopedTeamIds: string[];
};

export function hasRole(context: UserContext, role: AppRole) {
  return context.roles.includes(role);
}

export function hasAnyRole(context: UserContext, roles: AppRole[]) {
  return roles.some((role) => hasRole(context, role));
}

export function canAccessFinance(context: UserContext) {
  return hasAnyRole(context, ["ceo", "cfo", "auditor"]);
}

export function canManagePeople(context: UserContext) {
  return hasAnyRole(context, ["ceo", "hr_admin"]);
}

export function canManageGovernance(context: UserContext) {
  return hasAnyRole(context, ["ceo", "cfo", "hr_admin", "auditor"]);
}

export function canAccessDepartment(context: UserContext, departmentId: string | null) {
  if (!departmentId) return hasAnyRole(context, ["ceo", "cfo", "hr_admin", "auditor"]);
  if (hasAnyRole(context, ["ceo", "cfo", "hr_admin", "auditor"])) return true;
  return context.scopedDepartmentIds.includes(departmentId);
}
