import Link from "next/link";
import { useTranslations } from "next-intl";

/** Footer with the slogan and the legal links (constitution "Footer"). */
export function SiteFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="site-footer">
      <p>{t("rights")}</p>
      <nav aria-label="legal">
        <Link href="/privacy">{t("privacy")}</Link>
        <Link href="/terms">{t("terms")}</Link>
      </nav>
    </footer>
  );
}
