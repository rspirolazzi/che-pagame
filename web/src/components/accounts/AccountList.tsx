"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";

import type { AccountSummary } from "@/lib/api/types";

import { AmountText } from "../ui/AmountText";
import { AccountIcon } from "./AccountIcon";

/** "Mis Cuentas": dates are formatted in the user's language (Principle II). */
export function AccountList({ accounts }: { accounts: AccountSummary[] }) {
  const t = useTranslations("accounts");
  const format = useFormatter();

  if (accounts.length === 0) return <p className="form-status">{t("empty")}</p>;
  return (
    <ul className="account-list card">
      {accounts.map((account) => (
        <li key={account.id}>
          <Link href={`/accounts/${account.id}`}>
            <AccountIcon icon={account.icon} />
            <span className="expense-main">
              <strong>{account.name}</strong>
              <small>
                {account.currency} · {t("participantCount", { count: account.participantCount })} ·{" "}
                {t("updatedAt", {
                  date: format.dateTime(new Date(account.updatedAt), { dateStyle: "medium" }),
                })}
              </small>
            </span>
            {account.isClosed && <span className="badge">{t("closedBadge")}</span>}
            <span className="account-balance">
              <AmountText
                amount={account.myBalance}
                currency={account.currency}
                decimals={account.currencyDecimals}
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
