"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { ContactForm } from "./ContactForm";
import { CopyEmail } from "./ui/CopyEmail";

/** The contact email, or a neutral text when none is configured (never an empty address). */
interface ContactContentProps {
  email: string | null;
  /** Turnstile key in production, null elsewhere (feature 017). */
  siteKey?: string | null;
  defaults?: { name: string; email: string };
}

export function ContactContent({ email, siteKey = null, defaults }: ContactContentProps) {
  const t = useTranslations("pages.contact");
  const tForm = useTranslations("contact.form");
  return (
    <article className="card stack page-narrow">
      <h1>{t("title")}</h1>
      <h2>{tForm("title")}</h2>
      <ContactForm siteKey={siteKey} fallbackEmail={email} defaults={defaults} />
      {email ? (
        <>
          <p>{t("intro")}</p>
          <CopyEmail email={email} />
        </>
      ) : (
        <p>{t("unavailable")}</p>
      )}
      <p>
        <Link href="/faq">{t("faq")}</Link>
      </p>
    </article>
  );
}
