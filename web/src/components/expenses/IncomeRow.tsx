"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Icon } from "@/components/ui/Icon";
import type { AccountResponse, SettlementResponse } from "@/lib/api/types";
import { formatCompactMoney, formatMoney } from "@/lib/money";

/**
 * A settlement in the expense list, shown as "Ingreso" (feature 012, R7): its own icon, the
 * visible "Ingreso" label and the "Ana le pagó a Beto" text, so it never relies on color alone.
 */
export function IncomeRow({
  account,
  settlement,
}: {
  account: AccountResponse;
  settlement: SettlementResponse;
}) {
  const t = useTranslations("expenses.income");
  const locale = useLocale();
  const amount = formatMoney(settlement.amount, account.currency, account.currencyDecimals, locale);
  // Compact on screen (feature 016); the exact amount stays in the accessible name.
  const compact = formatCompactMoney(
    settlement.amount,
    account.currency,
    account.currencyDecimals,
    locale,
  );
  const names = { from: settlement.from.name, to: settlement.to.name };
  return (
    <li>
      <Link
        href={`/accounts/${account.id}/settlements/${settlement.id}`}
        className="expense-row income-row"
        aria-label={t("a11y", { ...names, amount })}
      >
        <span className="category-icon income-icon" aria-hidden="true">
          <Icon name="swap" />
        </span>
        <span className="expense-main">
          <span>{t("row", names)}</span>
          <small>
            <span className="badge income-badge">{t("label")}</span>
          </small>
        </span>
        <strong title={amount}>{compact}</strong>
      </Link>
    </li>
  );
}
