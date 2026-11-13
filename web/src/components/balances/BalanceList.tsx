"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import type { AccountBalances, AccountResponse } from "@/lib/api/types";
import { amountSign } from "@/lib/balanceTotals";

import { AmountText } from "../ui/AmountText";
import { StatusNotice } from "../ui/StatusNotice";

interface BalanceListProps {
  account: AccountResponse;
  balances: AccountBalances;
}

/**
 * The balance of each active participant, mine highlighted in plain words (FR-007), plus the
 * pending expenses notice (FR-006). It never refreshes by itself (FR-025).
 */
export function BalanceList({ account, balances }: BalanceListProps) {
  const t = useTranslations("balances");
  const tExpenses = useTranslations("expenses");
  const router = useRouter();
  const noDebts = balances.balances.every((entry) => amountSign(entry.amount) === 0);
  return (
    <section className="stack" aria-labelledby="balances-title">
      <div className="row space-between">
        <h2 id="balances-title">{t("title")}</h2>
        <button type="button" className="secondary" onClick={() => router.refresh()}>
          {t("refresh")}
        </button>
      </div>
      {balances.pendingExpenses > 0 && (
        <StatusNotice kind="warning">
          <strong>{tExpenses("pending")}</strong>
          <br />
          <span>{t("pending", { count: balances.pendingExpenses })}</span>. {t("pendingHint")}{" "}
          <Link href={`/accounts/${account.id}`}>{t("pendingLink")}</Link>
        </StatusNotice>
      )}
      <ul className="balance-list card">
        {balances.balances.map((entry) => (
          <li key={entry.participant.id} className={entry.isMe ? "balance-row me" : "balance-row"}>
            <span>
              {entry.participant.name}
              {entry.isMe && <small> ({t("you")})</small>}
            </span>
            <AmountText
              amount={entry.amount}
              currency={balances.currency}
              decimals={balances.currencyDecimals}
              subject={entry.isMe ? "me" : "other"}
            />
          </li>
        ))}
      </ul>
      {noDebts && <p>{t("noDebts")}</p>}
    </section>
  );
}
