import { TabsNav } from "@/components/ui/tabs";
import { tServer } from "@/lib/i18n/server";

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const { t } = await tServer();
  return (
    <div>
      <TabsNav
        items={[
          { href: "/finance", label: t("finance.tabs.overview") },
          { href: "/finance/pnl", label: t("finance.tabs.pnl") },
          { href: "/finance/balance-sheet", label: t("finance.tabs.bs") },
          { href: "/finance/cashflow", label: t("finance.tabs.cf") },
          { href: "/finance/budget", label: t("finance.tabs.budget") },
        ]}
      />
      {children}
    </div>
  );
}
