import type { Metadata } from "next";

/**
 * Search engine helpers (feature 011). Spanish is the indexed version: crawlers send no
 * Accept-Language, so they get the default locale, and Open Graph always says es_AR.
 */

export const SITE_NAME = "ChePagame";
export const OG_IMAGE = { url: "/og-image.png", width: 1200, height: 630, alt: SITE_NAME };

/** The public origin, without a trailing slash: SITE_URL, then AUTH_URL, then localhost. */
export function siteUrl(): string {
  const raw =
    process.env.SITE_URL?.trim() || process.env.AUTH_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export type SeoKey =
  "home" | "howItWorks" | "about" | "contact" | "faq" | "privacy" | "terms" | "deleteAccount";

/** Every indexable page; robots.txt, the sitemap and the tests read this list. */
export const PUBLIC_PAGES: { key: SeoKey; path: string; lastModified: string }[] = [
  { key: "home", path: "/", lastModified: "2026-11-20" },
  { key: "howItWorks", path: "/how-it-works", lastModified: "2026-11-20" },
  { key: "about", path: "/about", lastModified: "2026-11-20" },
  { key: "contact", path: "/contact", lastModified: "2026-11-20" },
  { key: "faq", path: "/faq", lastModified: "2026-11-20" },
  { key: "privacy", path: "/privacy", lastModified: "2026-11-20" },
  { key: "terms", path: "/terms", lastModified: "2026-11-18" },
  { key: "deleteAccount", path: "/delete-account", lastModified: "2026-11-18" },
];

/** Pages that must never be indexed: private ones, authentication and invitations. */
export const DISALLOWED_PATHS = [
  "/accounts",
  "/profile",
  "/dashboard",
  "/invite",
  "/join",
  "/onboarding",
  "/api",
  "/login",
  "/register",
  "/login-code",
  "/forgot-password",
  "/verify-email",
  "/turnstile",
];

export const NOINDEX: Metadata["robots"] = { index: false, follow: false };

/**
 * Title, description, canonical URL and social preview of a public page. The home page uses its
 * title as is; the rest go through the layout's "%s | ChePagame" template.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
}): Metadata {
  const url = `${siteUrl()}${path}`;
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "es_AR",
      siteName: SITE_NAME,
      url,
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [OG_IMAGE.url] },
  };
}

/** generateMetadata for a public page, with its texts from `seo.<key>` in the messages. */
export async function pageMetadata(key: SeoKey): Promise<Metadata> {
  const { getTranslations } = await import("next-intl/server");
  const t = await getTranslations("seo");
  const page = PUBLIC_PAGES.find((p) => p.key === key);
  return buildPageMetadata({
    title: t(`${key}.title`),
    description: t(`${key}.description`),
    path: page?.path ?? "/",
    absoluteTitle: key === "home",
  });
}
