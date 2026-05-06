import { createClientOrNull } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Footer } from "@/components/layout/Footer";
import { AppContextProvider } from "@/components/layout/AppContext";
import { getAuthenticatedUser, getUserContext } from "@/lib/repositories/shared";
import { listMyNotifications, countMyUnread } from "@/lib/repositories/notifications";
import { hasSupabaseEnv } from "@/lib/env";
import { DEMO_AUTH_USER_ID } from "@/lib/queries/demo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [supabase, locale] = await Promise.all([createClientOrNull(), getLocale()]);
  let user = null;
  try {
    user = supabase ? (await supabase.auth.getUser()).data.user : null;
  } catch {
    user = null;
  }
  const context = await getUserContext(user ?? (await getAuthenticatedUser()));
  const roleLabel = context.roles[0]?.toUpperCase() ?? "CEO";

  const [notifications, unreadCount] = await Promise.all([listMyNotifications(20), countMyUnread()]);
  const supabaseConfigured = hasSupabaseEnv();
  const authUserId = user?.id ?? (supabaseConfigured ? null : DEMO_AUTH_USER_ID);

  return (
    <AppContextProvider locale={locale} roles={context.roles}>
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <Sidebar locale={locale} roles={context.roles} />
        <Topbar
          userEmail={user?.email ?? "demo@bizos.local"}
          locale={locale}
          roleLabel={roleLabel}
          notifications={notifications}
          unreadCount={unreadCount}
          authUserId={authUserId}
          hasSupabase={supabaseConfigured}
        />
        <main className="flex-1 px-6 py-5 md:ml-[240px]">{children}</main>
        <div className="md:ml-[240px]">
          <Footer locale={locale} />
        </div>
      </div>
    </AppContextProvider>
  );
}
