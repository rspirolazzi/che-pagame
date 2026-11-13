"use client";

import { useLocale, useTranslations } from "next-intl";

import { absAmount, amountSign } from "@/lib/balanceTotals";
import { formatMoney } from "@/lib/money";

import { Icon } from "./Icon";

interface AmountTextProps {
  /** Signed decimal text ("60.00", "-12.50"), never a number (Principle III). */
  amount: string;
  currency: string;
  decimals: number;
  /** "me": "Te deben/Debés", "other": "Le deben/Debe", "none": only the amount (totals). */
  subject?: "me" | "other" | "none";
  size?: "md" | "lg";
}

/**
 * A balance that reads without color (FR-009): a badge with "+", "−" or a check and an accessible
 * name, the existing words, and the positive, negative or neutral color, with tabular figures.
 */
export function AmountText({
  amount,
  currency,
  decimals,
  subject = "me",
  size = "md",
}: AmountTextProps) {
  const t = useTranslations();
  const locale = useLocale();
  const sign = amountSign(amount);
  const money = formatMoney(absAmount(amount), currency, decimals, locale);
  let text = money;
  if (subject === "me") {
    text =
      sign > 0
        ? t("balances.owedToYou", { amount: money })
        : sign < 0
          ? t("balances.youOwe", { amount: money })
          : t("balances.youSettled");
  } else if (subject === "other") {
    text =
      sign > 0
        ? t("balances.owed", { amount: money })
        : sign < 0
          ? t("balances.owes", { amount: money })
          : t("balances.settled");
  }
  const tone = sign > 0 ? "amount-positive" : sign < 0 ? "amount-negative" : "amount-neutral";
  const label = sign > 0 ? t("a11y.owed") : sign < 0 ? t("a11y.owes") : t("a11y.settled");
  return (
    <span className={`amount ${tone} amount-${size}`}>
      <span className="amount-badge" role="img" aria-label={label}>
        {sign === 0 ? <Icon name="check" size="0.8em" /> : sign > 0 ? "+" : "−"}
      </span>
      <span className="amount-text">{text}</span>
    </span>
  );
}
