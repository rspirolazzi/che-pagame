import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { HomePreview } from "@/components/HomePreview";
import { JsonLd } from "@/components/JsonLd";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { pageMetadata } from "@/lib/seo";
import { organizationJsonLd, webApplicationJsonLd } from "@/lib/structuredData";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("home");
}

const BENEFITS: [key: string, icon: IconName][] = [
  ["split", "split"],
  ["clear", "scale"],
  ["yours", "lock"],
];

/** Home (FR-008): logo, slogan and start; three benefits; a balances preview; how it works. */
export default async function HomePage() {
  const [t, session] = await Promise.all([getTranslations(), auth()]);
  const signedIn = Boolean(session?.user && !session.error);
  return (
    <>
      <section className="hero" aria-labelledby="home-slogan">
        <Logo href="/" size="lg" />
        <h1 id="home-slogan" className="slogan">
          {t("common.slogan")}
        </h1>
        <p>{t("home.subtitle")}</p>
        <Link href={signedIn ? "/accounts" : "/register"} className="button">
          {signedIn ? t("home.ctaSignedIn") : t("home.cta")}
        </Link>
      </section>
      <ul className="benefits">
        {BENEFITS.map(([key, icon]) => (
          <li key={key} className="card benefit">
            <span className="tile">
              <Icon name={icon} />
            </span>
            <h2>{t(`home.benefits.${key}.title`)}</h2>
            <p>{t(`home.benefits.${key}.body`)}</p>
          </li>
        ))}
      </ul>
      <HomePreview />
      <p className="row">
        <Link href="/how-it-works" className="more-link">
          {t("home.howItWorks")}
          <Icon name="arrowRight" />
        </Link>
        <Link href="/faq" className="more-link">
          {t("home.faq")}
          <Icon name="arrowRight" />
        </Link>
      </p>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={webApplicationJsonLd(t("seo.home.description"))} />
    </>
  );
}
