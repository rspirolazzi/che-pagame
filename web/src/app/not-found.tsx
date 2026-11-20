import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { robots: NOINDEX };

/** A real 404 that search engines don't index (feature 011, edge cases). */
export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <article className="card stack page-narrow">
      <h1>{t("title")}</h1>
      <p>{t("body")}</p>
      <p className="row">
        <Link href="/" className="button">
          {t("home")}
        </Link>
        <Link href="/faq">{t("faq")}</Link>
      </p>
    </article>
  );
}
