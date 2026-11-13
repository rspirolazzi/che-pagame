import { getTranslations } from "next-intl/server";

/** "Quiénes somos" with one paragraph (FR-008b). */
export default async function AboutPage() {
  const t = await getTranslations("pages.about");
  return (
    <article className="card stack page-narrow">
      <h1>{t("title")}</h1>
      <p>{t("body")}</p>
    </article>
  );
}
