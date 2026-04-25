import { createClientOrNull } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Footer } from "@/components/layout/Footer";
import { AppContextProvider } from "@/components/layout/AppContext";
import { getAuthenticatedUser, getUserContext } from "@/lib/repositories/shared";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [supabase, locale] = await Promise.all([createClientOrNull(), getLocale()]);
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const context = await getUserContext(user ?? (await getAuthenticatedUser()));
  const roleLabel = context.roles[0]?.toUpperCase() ?? "CEO";

  return (
    <AppContextProvider locale={locale} roles={context.roles}>
      <div className="min-h-screen bg-[var(--background)] flex flex-col">
        <Sidebar locale={locale} roles={context.roles} />
        <Topbar userEmail={user?.email ?? "demo@bizos.local"} locale={locale} roleLabel={roleLabel} />
        <main className="flex-1 px-6 py-5 md:ml-[240px]">{children}</main>
        <div className="md:ml-[240px]">
          <Footer locale={locale} />
        </div>
      </div>
    </AppContextProvider>
  );
}
