import { useTranslations } from "next-intl";

/** First focusable element: jumps over the navigation to the content (FR-016). */
export function SkipLink() {
  const t = useTranslations("nav");
  return (
    <a href="#main" className="skip-link">
      {t("skipToContent")}
    </a>
  );
}
