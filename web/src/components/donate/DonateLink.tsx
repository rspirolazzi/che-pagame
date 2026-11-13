import { useTranslations } from "next-intl";

import { Icon } from "../ui/Icon";

/**
 * A plain link to the donation page (FR-003, FR-004): a new tab, no referrer, no widget or
 * third-party script. Nothing reaches the platform until the person clicks.
 */
export function DonateLink({ url, compact = false }: { url: string; compact?: boolean }) {
  const t = useTranslations("donate");
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
      className={compact ? "donate-link" : "button secondary"}
      aria-label={`${t("button")} (${t("newTab")})`}
    >
      <Icon name="heart" />
      {t("button")}
    </a>
  );
}
