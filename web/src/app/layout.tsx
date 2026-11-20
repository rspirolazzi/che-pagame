import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { AppProviders } from "@/components/AppProviders";
import { AppShell } from "@/components/AppShell";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SkipLink } from "@/components/SkipLink";
import { parseDonationUrl } from "@/lib/donation";
import { OG_IMAGE, SITE_NAME, siteUrl } from "@/lib/seo";

import "@/styles/tokens.generated.css";
import "./globals.css";

// Brand typeface (Sora, SIL OFL) served by the site itself, never by a third party (feature 007).
const sora = localFont({
  src: [
    { path: "./fonts/Sora-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Sora-Bold.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-sora",
  fallback: ["system-ui", "sans-serif"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo.home");
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
    description: t("description"),
    openGraph: { siteName: SITE_NAME, locale: "es_AR", type: "website", images: [OG_IMAGE] },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  const user = session?.user && !session.error ? session.user : null;
  const donationUrl = parseDonationUrl(process.env.DONATION_URL);

  return (
    <html lang={locale} className={sora.variable} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <AppProviders theme={user?.preferences.theme} language={user?.preferences.language}>
            <SkipLink />
            {user ? (
              // With a session, every page (information ones too) uses the sidebar (v4.6.0).
              <AppShell>
                <main id="main" className="page" tabIndex={-1}>
                  {children}
                </main>
                <SiteFooter donationUrl={donationUrl} />
              </AppShell>
            ) : (
              <>
                <PublicHeader />
                <main id="main" className="page" tabIndex={-1}>
                  {children}
                </main>
                <SiteFooter donationUrl={donationUrl} />
              </>
            )}
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
