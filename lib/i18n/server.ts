import { cookies } from "next/headers";
import { DEFAULT_LOCALE, DICT, type Locale, t as rawT } from "./dict";

const COOKIE = "bizos_locale";

export async function getLocale(): Promise<Locale> {
  try {
    const jar = await cookies();
    const v = jar.get(COOKIE)?.value;
    if (v === "vi" || v === "en") return v;
  } catch {
    // cookies() may fail outside request context
  }
  return DEFAULT_LOCALE;
}

export async function tServer() {
  const locale = await getLocale();
  return {
    locale,
    t: (key: keyof typeof DICT) => rawT(locale, key),
  };
}

export { COOKIE as LOCALE_COOKIE };
