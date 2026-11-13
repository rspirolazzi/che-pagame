"use client";

import { useTranslations } from "next-intl";

import type { AccountSummary } from "@/lib/api/types";
import { totalsByCurrency } from "@/lib/balanceTotals";

import { AmountText } from "../ui/AmountText";
import { StatusNotice } from "../ui/StatusNotice";

/**
 * "Te deben" and "Debés" per currency over every account, closed ones included (FR-024). Amounts
 * of different currencies are never added together. Highlighted card of the Dashboard (007).
 */
export function BalanceSummary({ accounts }: { accounts: AccountSummary[] }) {
  const t = useTranslations("dashboard.balances");
  const totals = totalsByCurrency(accounts);
  if (totals.length === 0) return <StatusNotice kind="info">{t("allSettled")}</StatusNotice>;
  const column = (label: string, pick: "owedToMe" | "iOwe") => (
    <div role="group" aria-label={label} className="summary-column">
      <small>{label}</small>
      {totals
        .filter((total) => /[1-9]/.test(total[pick]))
        .map((total) => (
          <AmountText
            key={total.currency}
            amount={pick === "iOwe" ? `-${total[pick]}` : total[pick]}
            currency={total.currency}
            decimals={total.decimals}
            subject="none"
            size="lg"
          />
        ))}
    </div>
  );
  return (
    <section className="balance-summary card" aria-labelledby="balance-summary-title">
      <h2 id="balance-summary-title" className="eyebrow">
        {t("title")}
      </h2>
      <div className="summary-columns">
        {column(t("owedToYou"), "owedToMe")}
        {column(t("youOwe"), "iOwe")}
      </div>
    </section>
  );
}
