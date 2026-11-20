import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { DeletionSummary } from "@/components/DeleteAccountFlow";
import { pageMetadata } from "@/lib/seo";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("deleteAccount");
}

/**
 * Public page (no session) explaining how to delete an account; its URL goes in the Google Play
 * Data safety form (feature 015, US3). The button leads to Profile → Delete my account, through
 * the login when there is no session (the proxy adds the callbackUrl).
 */
export default async function PublicDeleteAccountPage() {
  const t = await getTranslations("deleteAccountPage");
  return (
    <article className="card stack">
      <h1>{t("title")}</h1>
      <p>{t("intro")}</p>
      <section className="stack" aria-labelledby="deletion-steps">
        <h2 id="deletion-steps">{t("stepsTitle")}</h2>
        <ol>
          <li>{t("step1")}</li>
          <li>{t("step2")}</li>
          <li>{t("step3")}</li>
        </ol>
      </section>
      <DeletionSummary />
      <p>
        <Link href="/profile/delete" className="button danger">
          {t("button")}
        </Link>
      </p>
      <p>
        <small>{t("noAccess")}</small>
      </p>
    </article>
  );
}
