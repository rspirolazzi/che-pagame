import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AboutVersion } from "@/components/about/AboutVersion";
import { DonateSection } from "@/components/donate/DonateSection";
import { getBuildInfo } from "@/lib/buildInfo";
import { parseDonationUrl } from "@/lib/donation";
import { pageMetadata } from "@/lib/seo";

// The version line reads the running image's build information, never the build-time one.
export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("about");
}

/** "Quiénes somos" (FR-008b, feature 011 US3) and the running version (feature 009). */
export default async function AboutPage() {
  const [t, nav, footer] = await Promise.all([
    getTranslations("pages.about"),
    getTranslations("nav"),
    getTranslations("footer"),
  ]);
  return (
    <article className="card stack page-narrow">
      <h1>{t("title")}</h1>
      <h2>{t("whatTitle")}</h2>
      <p>{t("body")}</p>
      <h2>{t("whyTitle")}</h2>
      <p>{t("why")}</p>
      <h2>{t("privacyTitle")}</h2>
      <p>{t("privacy")}</p>
      <p className="row">
        <Link href="/how-it-works">{nav("howItWorks")}</Link>
        <Link href="/faq">{footer("faq")}</Link>
      </p>
      <DonateSection url={parseDonationUrl(process.env.DONATION_URL)} />
      <AboutVersion build={getBuildInfo()} />
    </article>
  );
}
