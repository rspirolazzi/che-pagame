"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { confirmAccountDeletionAction, requestAccountDeletionAction } from "@/app/actions/profile";
import type { ApiErrorCode } from "@/lib/api/errors";

import { CodeInput } from "./CodeInput";
import { ExportButton } from "./exports/ExportButton";
import { ErrorMessage } from "./FormMessage";

/** What is erased and what stays, shared by the Profile flow and the public page (feature 015). */
export function DeletionSummary() {
  const t = useTranslations("deleteAccount");
  return (
    <>
      <section className="stack" aria-labelledby="deletion-erased">
        <h2 id="deletion-erased">{t("erasedTitle")}</h2>
        <p>{t("erasedBody")}</p>
      </section>
      <section className="stack" aria-labelledby="deletion-kept">
        <h2 id="deletion-kept">{t("keptTitle")}</h2>
        <p>{t("keptBody")}</p>
      </section>
    </>
  );
}

/** Profile → "Delete my account": explanation, export, emailed code and confirmation. */
export function DeleteAccountFlow({ email }: { email: string }) {
  const t = useTranslations("deleteAccount");
  const tExports = useTranslations("exports");
  const [step, setStep] = useState<"intro" | "code">("intro");
  const [error, setError] = useState<ApiErrorCode | null>(null);
  const [pending, setPending] = useState(false);

  async function requestCode() {
    setPending(true);
    setError(null);
    const result = await requestAccountDeletionAction();
    setPending(false);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setStep("code");
  }

  async function confirm(code: string) {
    setPending(true);
    setError(null);
    // On success the action signs out and redirects, so this only returns on errors.
    const result = await confirmAccountDeletionAction(code);
    setPending(false);
    if (!result.ok) setError(result.code);
  }

  return (
    <section className="card stack">
      <h1>{t("title")}</h1>
      <p>{t("intro")}</p>
      <DeletionSummary />
      <section className="stack" aria-labelledby="deletion-export">
        <h2 id="deletion-export">{tExports("mineTitle")}</h2>
        <p>{t("exportHint")}</p>
        <ExportButton endpoint="/api/exports/me" label={tExports("mineButton")} />
      </section>
      {step === "intro" && (
        <div className="row">
          <button type="button" className="danger" onClick={requestCode} disabled={pending}>
            {t("sendCode")}
          </button>
          <Link href="/profile" className="button secondary">
            {t("cancel")}
          </Link>
        </div>
      )}
      {step === "code" && (
        <div className="stack">
          <p>{t("codeSentTo", { email })}</p>
          <CodeInput label={t("codeLabel")} onComplete={confirm} disabled={pending} />
          <p>
            <small>{t("irreversible")}</small>
          </p>
          <div className="row">
            <button type="button" className="link-button" onClick={requestCode} disabled={pending}>
              {t("resend")}
            </button>
            <Link href="/profile" className="button secondary">
              {t("cancel")}
            </Link>
          </div>
        </div>
      )}
      <ErrorMessage code={error} />
    </section>
  );
}
