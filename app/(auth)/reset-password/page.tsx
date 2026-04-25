import Link from "next/link";
import { sendReset } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tServer } from "@/lib/i18n/server";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;
  const { t } = await tServer();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">{t("auth.resetTitle")}</h2>
        <p className="text-sm text-zinc-500 mt-1">{t("auth.resetHint")}</p>
      </div>

      {sent && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {t("auth.resetSent")}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form action={sendReset} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.labelEmail")}</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <Button type="submit" className="w-full">
          {t("auth.sendReset")}
        </Button>
      </form>

      <div className="text-center text-sm text-zinc-500">
        <Link href="/login" className="text-indigo-600 font-medium hover:underline">
          {t("auth.backToLogin")}
        </Link>
      </div>
    </div>
  );
}
