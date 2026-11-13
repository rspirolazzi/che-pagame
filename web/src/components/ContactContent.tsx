"use client";

import { useTranslations } from "next-intl";

import { CopyEmail } from "./ui/CopyEmail";

/** The contact email, or a neutral text when none is configured (never an empty address). */
export function ContactContent({ email }: { email: string | null }) {
  const t = useTranslations("pages.contact");
  return (
    <article className="card stack page-narrow">
      <h1>{t("title")}</h1>
      {email ? (
        <>
          <p>{t("intro")}</p>
          <CopyEmail email={email} />
        </>
      ) : (
        <p>{t("unavailable")}</p>
      )}
    </article>
  );
}
