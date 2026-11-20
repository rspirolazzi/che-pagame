import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { auth } from "@/auth";

import { isLocale, negotiateLocale, type Locale } from "./config";

export default getRequestConfig(async () => {
  const session = await auth();
  // Session, then the language chosen on this device (feature 014), then the browser. Search
  // engines send neither, so they get Spanish (feature 011).
  const deviceLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale: Locale =
    session?.user?.preferences.language ??
    (isLocale(deviceLocale) ? deviceLocale : undefined) ??
    negotiateLocale((await headers()).get("accept-language"));
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
