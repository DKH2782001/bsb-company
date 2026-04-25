import { getLocale, tServer } from "@/lib/i18n/server";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const { t } = await tServer();
  const vn = locale === "vi";

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 text-white">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <span className="font-bold">B</span>
            </div>
            <div>
              <div className="font-bold text-lg">BIZOS</div>
              <div className="text-xs text-white/70 -mt-1">Business Operating System</div>
            </div>
          </div>
          <LocaleSwitcher locale={locale} />
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight whitespace-pre-line">
            {t("auth.sidePanel.heading")}
          </h1>
          <p className="text-white/80 max-w-md">{t("auth.sidePanel.sub")}</p>
          <ul className="space-y-2 text-sm text-white/70">
            <li>• {t("auth.sidePanel.b1")}</li>
            <li>• {t("auth.sidePanel.b2")}</li>
            <li>• {t("auth.sidePanel.b3")}</li>
            <li>• {t("auth.sidePanel.b4")}</li>
          </ul>
        </div>

        <div className="text-xs text-white/60 space-y-1">
          <div>
            by{" "}
            <a href="mailto:alexle@titanlabs.vn" className="underline hover:text-white">
              Alex Le
            </a>{" "}
            · alexle@titanlabs.vn
          </div>
          <div>
            {vn ? "Ủng hộ PayPal" : "Donate PayPal"}:{" "}
            <a
              href="https://www.paypal.com/paypalme/sai211dn"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-white"
            >
              sai211dn@gmail.com
            </a>
          </div>
          <div>
            {vn
              ? "Cần deploy / tuỳ biến cho công ty? Liên hệ alexle@titanlabs.vn"
              : "Need a custom deployment? Contact alexle@titanlabs.vn"}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute top-4 right-4 lg:hidden">
          <LocaleSwitcher locale={locale} />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
