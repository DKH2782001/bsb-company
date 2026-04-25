import { Mail, Heart } from "lucide-react";
import type { Locale } from "@/lib/i18n/dict";

export function Footer({ locale = "vi" }: { locale?: Locale }) {
  const vn = locale === "vi";

  return (
    <footer className="mt-10 border-t border-[var(--line-soft)] bg-white/70">
      <div className="mx-auto px-6 py-6 text-sm text-zinc-600">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="font-semibold text-zinc-900">
              BIZOS — Business Operating System
            </div>
            <div className="text-xs text-zinc-500">
              {vn ? "by" : "by"}{" "}
              <a
                href="mailto:alexle@titanlabs.vn"
                className="font-medium text-indigo-600 hover:underline"
              >
                Alex Le
              </a>{" "}
              · alexle@titanlabs.vn
            </div>
          </div>

          <div className="flex flex-col gap-1 text-xs lg:items-end">
            <a
              href="https://www.paypal.com/paypalme/sai211dn"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-rose-600 hover:underline"
            >
              <Heart className="h-3.5 w-3.5" />
              {vn ? "Ủng hộ PayPal" : "Donate PayPal"}: sai211dn@gmail.com
            </a>
            <a
              href="mailto:alexle@titanlabs.vn"
              className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-700"
            >
              <Mail className="h-3.5 w-3.5" />
              {vn
                ? "Cần deploy / tuỳ biến cho công ty? Liên hệ alexle@titanlabs.vn"
                : "Need a custom deployment for your company? Contact alexle@titanlabs.vn"}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
