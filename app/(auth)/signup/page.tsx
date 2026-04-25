import Link from "next/link";
import { signup } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tServer } from "@/lib/i18n/server";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { t } = await tServer();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">{t("auth.signupTitle")}</h2>
        <p className="text-sm text-zinc-500 mt-1">{t("auth.signupHint")}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form action={signup} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">{t("auth.labelFullName")}</Label>
          <Input id="fullName" name="fullName" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.labelEmail")}</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("auth.labelPassword")}</Label>
          <Input id="password" name="password" type="password" required minLength={8} />
        </div>
        <Button type="submit" className="w-full">
          {t("auth.createAccount")}
        </Button>
      </form>

      <div className="text-center text-sm text-zinc-500">
        {t("auth.hasAccount")}{" "}
        <Link href="/login" className="text-indigo-600 font-medium hover:underline">
          {t("common.login")}
        </Link>
      </div>
    </div>
  );
}
