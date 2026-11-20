import Link from "next/link";
import { useTranslations } from "next-intl";

import { DonateLink } from "./donate/DonateLink";

/** Footer with the slogan, the legal links and, when configured, the donation link (008). */
export function SiteFooter({ donationUrl = null }: { donationUrl?: string | null }) {
  const t = useTranslations("footer");
  return (
    <footer className="site-footer">
      <p>{t("rights")}</p>
      <nav aria-label="legal">
        <Link href="/privacy">{t("privacy")}</Link>
        <Link href="/terms">{t("terms")}</Link>
        <Link href="/delete-account">{t("deleteAccount")}</Link>
        {donationUrl && <DonateLink url={donationUrl} compact />}
      </nav>
    </footer>
  );
}
