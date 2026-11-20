"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { signOutAction } from "@/app/actions/auth";

import { PreferenceControls } from "./PreferenceControls";
import { Icon, type IconName } from "./ui/Icon";

const DESTINATIONS: [href: string, key: string, icon: IconName][] = [
  ["/dashboard", "tabHome", "home"],
  ["/accounts", "tabAccounts", "accounts"],
  ["/profile", "tabProfile", "profile"],
];

const MORE = [
  ["/how-it-works", "howItWorks"],
  ["/about", "about"],
  ["/contact", "contact"],
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Destinations with a session (constitution v4.6.0, FR-005a): Inicio, Cuentas and Perfil with
 * icon and text, the active one with aria-current and the sun pill; "Más" with the information
 * pages; and Salir.
 */
export function NavDestinations() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  return (
    <>
      <ul className="nav-list">
        {DESTINATIONS.map(([href, key, icon]) => (
          <li key={href}>
            <Link
              href={href}
              className="nav-link"
              aria-current={isActive(pathname, href) ? "page" : undefined}
            >
              <span className="nav-pill">
                <Icon name={icon} />
              </span>
              {t(key)}
            </Link>
          </li>
        ))}
      </ul>
      <div className="nav-more">
        <span className="eyebrow">{t("more")}</span>
        {MORE.map(([href, key]) => (
          <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
            {t(key)}
          </Link>
        ))}
      </div>
      <PreferenceControls />
      <div className="nav-logout">
        <button
          type="button"
          className="danger-text"
          disabled={pending}
          onClick={() => startTransition(() => signOutAction())}
        >
          <Icon name="logout" />
          {t("signOut")}
        </button>
      </div>
    </>
  );
}

/** The fixed sidebar on tablets and desktops. */
export function SideNav({ logo }: { logo: React.ReactNode }) {
  const t = useTranslations("nav");
  return (
    <aside className="side-nav">
      {logo}
      <nav aria-label={t("main")} className="stack">
        <NavDestinations />
      </nav>
    </aside>
  );
}
