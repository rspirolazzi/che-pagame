import { getTranslations } from "next-intl/server";

import { CodeSignInFlow } from "@/components/CodeSignInFlow";
import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { robots: NOINDEX };

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgotPassword");
  return (
    <section className="card auth-card">
      <h1>{t("title")}</h1>
      <CodeSignInFlow kind="password-reset" />
    </section>
  );
}
