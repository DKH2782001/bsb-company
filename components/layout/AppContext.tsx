"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n/dict";

export type AppCtx = {
  locale: Locale;
  roles: string[];
};

const Ctx = createContext<AppCtx>({ locale: "vi", roles: [] });

export function AppContextProvider({
  locale,
  roles,
  children,
}: AppCtx & { children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, roles }}>{children}</Ctx.Provider>;
}

export function useAppContext(): AppCtx {
  return useContext(Ctx);
}
