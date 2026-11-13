import { getTranslations } from "next-intl/server";

import { Icon, type IconName } from "@/components/ui/Icon";

const STEPS: [key: string, icon: IconName][] = [
  ["create", "accounts"],
  ["add", "plus"],
  ["balances", "scale"],
  ["settle", "check"],
];

/** "Cómo funciona" in four illustrated steps (FR-008a). */
export default async function HowItWorksPage() {
  const t = await getTranslations("pages.howItWorks");
  return (
    <>
      <header className="stack">
        <h1>{t("title")}</h1>
        <p>{t("intro")}</p>
      </header>
      <ol className="steps">
        {STEPS.map(([key, icon], index) => (
          <li key={key} className="card step">
            <span className="step-number" aria-hidden="true">
              {index + 1}
            </span>
            <span className="tile">
              <Icon name={icon} />
            </span>
            <h2>{t(`steps.${key}.title`)}</h2>
            <p>{t(`steps.${key}.body`)}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
