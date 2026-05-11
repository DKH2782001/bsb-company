import type { TableRow } from "@/lib/supabase/database.types";
import { redirect } from "next/navigation";

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

/**
 * Route → allowed roles mapping.
 * If a route is not listed, it is accessible by all authenticated users.
 */
export const ROUTE_ROLES: Record<string, AppRole[]> = {
  "/finance": ["ceo", "cfo", "auditor"],
  "/compensation": ["ceo", "cfo", "hr_admin"],
  "/reports": ["ceo", "cfo", "hr_admin", "auditor"],
  "/forecast": ["ceo", "cfo"],
  "/people/contracts": ["ceo", "hr_admin"],
  "/people/onboarding": ["ceo", "hr_admin"],
  "/recruiting": ["ceo", "hr_admin"],
  "/audit": ["ceo", "cfo", "auditor"],
  "/settings": ["ceo", "cfo", "hr_admin"],
  "/approval": ["ceo", "cfo", "hr_admin"],
};

/**
 * Check if user has permission to access a route.
 * Redirects to dashboard with error if not.
 */
export function requirePageRole(context: UserContext, pathname: string): void {
  // Find matching route rule (longest prefix match)
  const matchedRoute = Object.keys(ROUTE_ROLES)
    .filter((route) => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];

  if (!matchedRoute) return; // No restriction

  const allowedRoles = ROUTE_ROLES[matchedRoute];
  if (!hasAnyRole(context, allowedRoles)) {
    redirect("/dashboard?forbidden=1");
  }
}

