"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { CompactMenu } from "./CompactMenu";
import { Logo } from "./ui/Logo";

const LINKS = [
  ["/", "home"],
  ["/how-it-works", "howItWorks"],
  ["/about", "about"],
  ["/contact", "contact"],
] as const;

/** Header without a session (constitution "Header (sin sesión)"). */
export function PublicHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const links = (
    <>
      {LINKS.map(([href, key]) => (
        <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
          {t(key)}
        </Link>
      ))}
      <Link
        href="/login"
        className="button"
        aria-current={pathname === "/login" ? "page" : undefined}
      >
        {t("loginRegister")}
      </Link>
    </>
  );
  return (
    <>
      <header className="public-header">
        <Logo href="/" />
        <nav aria-label={t("main")} className="public-nav">
          {links}
        </nav>
      </header>
      <CompactMenu logo={<Logo href="/" size="sm" />}>{links}</CompactMenu>
    </>
  );
}
