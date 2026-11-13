import { getTranslations } from "next-intl/server";

import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { LoginForm } from "@/components/LoginForm";
import { Logo } from "@/components/ui/Logo";
import { loginErrorKey } from "@/lib/loginError";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl, error } = await searchParams;
  const t = await getTranslations();
  return (
    <section className="card auth-card">
      <div className="auth-brand">
        <Logo href="/" size="lg" />
        <p className="slogan-small">{t("common.slogan")}</p>
      </div>
      <h1>{t("auth.login.title")}</h1>
      <GoogleSignInButton callbackUrl={callbackUrl} />
      <p className="divider">{t("common.or")}</p>
      <LoginForm callbackUrl={callbackUrl} initialErrorKey={loginErrorKey(error)} />
    </section>
  );
}
