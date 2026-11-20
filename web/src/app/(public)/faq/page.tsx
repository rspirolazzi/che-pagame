import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { faqEntries, FaqList } from "@/components/FaqList";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { faqPageJsonLd } from "@/lib/structuredData";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("faq");
}

/** Preguntas frecuentes (feature 011, US2), marked up as FAQPage with the visible text. */
export default async function FaqPage() {
  const [t, nav] = await Promise.all([
    getTranslations("pages.faq"),
    getTranslations("pages.contact"),
  ]);
  return (
    <article className="stack page-narrow">
      <header className="stack">
        <h1>{t("title")}</h1>
        <p>{t("intro")}</p>
      </header>
      <FaqList t={t} />
      <p>
        <Link href="/contact">{nav("title")}</Link>
      </p>
      <JsonLd data={faqPageJsonLd(faqEntries(t))} />
    </article>
  );
}
