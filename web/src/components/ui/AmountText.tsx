"use client";

import { useLocale, useTranslations } from "next-intl";

import { absAmount, amountSign } from "@/lib/balanceTotals";
import { formatCompactMoney, formatMoney } from "@/lib/money";

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
  const exact = formatMoney(absAmount(amount), currency, decimals, locale);
  // Large amounts read "2,3 M" (feature 016); the exact one stays in the accessible name.
  const compact = formatCompactMoney(absAmount(amount), currency, decimals, locale);
  function sentence(money: string): string {
    if (subject === "me") {
      return sign > 0
        ? t("balances.owedToYou", { amount: money })
        : sign < 0
          ? t("balances.youOwe", { amount: money })
          : t("balances.youSettled");
    }
    if (subject === "other") {
      return sign > 0
        ? t("balances.owed", { amount: money })
        : sign < 0
          ? t("balances.owes", { amount: money })
          : t("balances.settled");
    }
    return money;
  }
  const text = sentence(compact);
  const exactText = compact === exact ? undefined : sentence(exact);
  const tone = sign > 0 ? "amount-positive" : sign < 0 ? "amount-negative" : "amount-neutral";
  const label = sign > 0 ? t("a11y.owed") : sign < 0 ? t("a11y.owes") : t("a11y.settled");
  return (
    <span className={`amount ${tone} amount-${size}`}>
      <span className="amount-badge" role="img" aria-label={label}>
        {sign === 0 ? <Icon name="check" size="0.8em" /> : sign > 0 ? "+" : "−"}
      </span>
      <span className="amount-text" title={exactText} aria-label={exactText}>
        {text}
      </span>
    </span>
  );
}
