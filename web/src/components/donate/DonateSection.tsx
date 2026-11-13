import { useTranslations } from "next-intl";

import { DonateLink } from "./DonateLink";

/** "Apoyá ChePagame" with one sentence and the link; nothing without a configured link. */
export function DonateSection({ url }: { url: string | null }) {
  const t = useTranslations("donate");
  if (!url) return null;
  return (
    <section className="stack donate-section" aria-labelledby="donate-title">
      <h2 id="donate-title">{t("title")}</h2>
      <p>{t("body")}</p>
      <div className="row">
        <DonateLink url={url} />
      </div>
    </section>
  );
}
