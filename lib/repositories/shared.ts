import { cache } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClientOrNull, createServiceRoleClient } from "@/lib/supabase/server";
import type { Database, TableRow } from "@/lib/supabase/database.types";
import { isBuildTime, isDemoMode } from "@/lib/env";
import * as demo from "@/lib/queries/demo";
import type { UserContext } from "@/lib/auth/permissions";

export type DbClient = SupabaseClient<Database>;
export type ServiceClient = SupabaseClient<Database>;

export class RepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryError";
  }
}

export async function getDbClientOrThrow() {
  const client = await createClientOrNull();
  if (!client) {
    throw new RepositoryError("Supabase chưa được cấu hình. Bật DEMO_MODE=true hoặc thêm env Supabase.");
  }
  return client as DbClient;
}

export async function getServiceClient() {
  return (await createServiceRoleClient()) as ServiceClient;
}

export const getAuthenticatedUser = cache(async () => {
  const client = await createClientOrNull();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user;
});

export async function getUserContext(user?: User | null): Promise<UserContext> {
  const db = await createClientOrNull();
  if (!db || !user) {
    return {
      authUserId: null,
      companyId: isDemoMode() ? demo.DEMO_COMPANY_ID : null,
      employeeId: null,
      roles: isDemoMode() ? ["ceo"] : [],
      scopedDepartmentIds: [],
      scopedTeamIds: [],
    };
  }

  const { data: roles } = await db
    .from("user_roles")
    .select("auth_user_id, company_id, role, scope_department_id, scope_team_id")
    .eq("auth_user_id", user.id);

  const roleRows = (roles ?? []) as TableRow<"user_roles">[];
  const companyId = roleRows[0]?.company_id ?? null;

  const { data: employee } = await db
    .from("employees")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return {
    authUserId: user.id,
    companyId,
    employeeId: employee?.id ?? null,
    roles: roleRows.map((row) => row.role),
    scopedDepartmentIds: roleRows.flatMap((row) => (row.scope_department_id ? [row.scope_department_id] : [])),
    scopedTeamIds: roleRows.flatMap((row) => (row.scope_team_id ? [row.scope_team_id] : [])),
  };
}

export async function withDemoFallback<T>(fallback: T, query: (db: DbClient) => Promise<T>) {
  const db = await createClientOrNull();
  if (!db) {
    if (isDemoMode() || isBuildTime()) return fallback;
    throw new RepositoryError("Thiếu cấu hình Supabase và DEMO_MODE đang tắt.");
  }

  try {
    return await query(db as DbClient);
  } catch (error) {
    if (isDemoMode() || isBuildTime()) return fallback;
    throw error;
  }
}
