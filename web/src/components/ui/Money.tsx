"use client";

import { useLocale } from "next-intl";

import { formatCompactMoney, formatMoney } from "@/lib/money";

interface MoneyProps {
  /** Decimal text ("10000000.00"), never a number (Principle III). */
  amount: string;
  currency: string;
  decimals: number;
}

/**
 * An amount in a list or summary (feature 016): compact from 10,000 ("10 M ARS"), with the exact
 * amount as the accessible name and as the tooltip on hover. Below 10,000 it is the exact text.
 */
export function Money({ amount, currency, decimals }: MoneyProps) {
  const locale = useLocale();
  const exact = formatMoney(amount, currency, decimals, locale);
  const compact = formatCompactMoney(amount, currency, decimals, locale);
  if (compact === exact) return <>{exact}</>;
  return (
    <span title={exact} aria-label={exact}>
      {compact}
    </span>
  );
}

/** The detail of an expense or a settlement: compact and large, the exact amount below (FR-006). */
export function MoneyWithExact({ amount, currency, decimals }: MoneyProps) {
  const locale = useLocale();
  const exact = formatMoney(amount, currency, decimals, locale);
  const compact = formatCompactMoney(amount, currency, decimals, locale);
  return (
    <span className="money-with-exact">
      <strong className="expense-total" aria-hidden={compact !== exact}>
        {compact}
      </strong>
      {compact !== exact && <small className="money-exact">{exact}</small>}
    </span>
  );
}
