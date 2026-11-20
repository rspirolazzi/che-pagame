import { SITE_NAME, siteUrl } from "./seo";

/** schema.org data for Google (feature 011, research R6). Built from the visible texts. */

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl(),
    logo: `${siteUrl()}/icons/icon-512.png`,
  };
}

export function webApplicationJsonLd(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: siteUrl(),
    description,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web, Android",
    inLanguage: "es-AR",
    offers: { "@type": "Offer", price: "0", priceCurrency: "ARS" },
  };
}

export type FaqEntry = { question: string; answer: string };

export function faqPageJsonLd(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

/** JSON for a <script> tag: "<" is escaped so the content can never close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
