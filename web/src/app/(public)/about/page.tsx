import { getTranslations } from "next-intl/server";

import { AboutVersion } from "@/components/about/AboutVersion";
import { DonateSection } from "@/components/donate/DonateSection";
import { getBuildInfo } from "@/lib/buildInfo";
import { parseDonationUrl } from "@/lib/donation";

// The version line reads the running image's build information, never the build-time one.
export const dynamic = "force-dynamic";

/** "Quiénes somos" with one paragraph (FR-008b) and the running version (feature 009). */
export default async function AboutPage() {
  const t = await getTranslations("pages.about");
  return (
    <article className="card stack page-narrow">
      <h1>{t("title")}</h1>
      <p>{t("body")}</p>
      <DonateSection url={parseDonationUrl(process.env.DONATION_URL)} />
      <AboutVersion build={getBuildInfo()} />
    </article>
  );
}
