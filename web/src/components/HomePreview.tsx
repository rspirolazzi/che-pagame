"use client";

import { useTranslations } from "next-intl";

import { AmountText } from "./ui/AmountText";

const EXAMPLE = { currency: "ARS", decimals: 2 };

/** A glimpse of the balances screen with example data, marked as such (FR-008). */
export function HomePreview() {
  const t = useTranslations("home.preview");
  return (
    <section className="card preview" aria-labelledby="home-preview-title">
      <span className="example-label">{t("label")}</span>
      <h2 id="home-preview-title">{t("title")}</h2>
      <AmountText amount="58450.50" {...EXAMPLE} />
      <AmountText amount="-41200.00" subject="other" {...EXAMPLE} />
      <AmountText amount="0.00" subject="other" {...EXAMPLE} />
    </section>
  );
}
