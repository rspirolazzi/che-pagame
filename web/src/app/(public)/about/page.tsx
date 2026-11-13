import { getTranslations } from "next-intl/server";

import { DonateSection } from "@/components/donate/DonateSection";
import { parseDonationUrl } from "@/lib/donation";

/** "Quiénes somos" with one paragraph (FR-008b). */
export default async function AboutPage() {
  const t = await getTranslations("pages.about");
  return (
    <article className="card stack page-narrow">
      <h1>{t("title")}</h1>
      <p>{t("body")}</p>
      <DonateSection url={parseDonationUrl(process.env.DONATION_URL)} />
    </article>
  );
}
