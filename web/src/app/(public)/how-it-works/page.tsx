import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Icon, type IconName } from "@/components/ui/Icon";
import { pageMetadata } from "@/lib/seo";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("howItWorks");
}

const STEPS: [key: string, icon: IconName][] = [
  ["create", "accounts"],
  ["add", "plus"],
  ["balances", "scale"],
  ["settle", "check"],
];

const USES = ["trip", "bbq", "flat", "couple"] as const;

/** "Cómo funciona": four illustrated steps and the common uses (FR-008a, feature 011 US3). */
export default async function HowItWorksPage() {
  const t = await getTranslations("pages.howItWorks");
  return (
    <>
      <header className="stack">
        <h1>{t("title")}</h1>
        <p>{t("intro")}</p>
      </header>
      <section className="stack" aria-labelledby="how-steps">
        <h2 id="how-steps">{t("stepsTitle")}</h2>
        <ol className="steps">
          {STEPS.map(([key, icon], index) => (
            <li key={key} className="card step">
              <span className="step-number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="tile">
                <Icon name={icon} />
              </span>
              <h3>{t(`steps.${key}.title`)}</h3>
              <p>{t(`steps.${key}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="stack" aria-labelledby="how-uses">
        <h2 id="how-uses">{t("usesTitle")}</h2>
        <ul className="benefits">
          {USES.map((key) => (
            <li key={key} className="card benefit">
              <h3>{t(`uses.${key}.title`)}</h3>
              <p>{t(`uses.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>
      <Link href="/faq" className="more-link">
        {t("faqLink")}
        <Icon name="arrowRight" />
      </Link>
    </>
  );
}
