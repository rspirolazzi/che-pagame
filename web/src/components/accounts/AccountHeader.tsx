import Link from "next/link";
import { getTranslations } from "next-intl/server";

import type { AccountResponse } from "@/lib/api/types";

import { Icon } from "../ui/Icon";
import { AccountIcon } from "./AccountIcon";
import { type AccountTab, AccountTabs } from "./AccountTabs";

/** Top of an account (Gastos and Saldos): back, icon, name, currency, closed, settings, tabs. */
export async function AccountHeader({
  account,
  active,
}: {
  account: AccountResponse;
  active: AccountTab;
}) {
  const [t, tAccounts, tA11y] = await Promise.all([
    getTranslations("expenses"),
    getTranslations("accounts"),
    getTranslations("a11y"),
  ]);
  return (
    <header className="stack">
      <div className="account-header">
        <Link href="/accounts" className="button icon-button" aria-label={tA11y("back")}>
          <Icon name="back" />
        </Link>
        <span className="tile">
          <AccountIcon icon={account.icon} size="1.25rem" />
        </span>
        <div className="account-title">
          <h1>{account.name}</h1>
          <span className="row">
            <small>{account.currency}</small>
            {account.isClosed && <span className="badge">{tAccounts("closedBadge")}</span>}
          </span>
        </div>
        <Link href={`/accounts/${account.id}/settings`} className="button secondary">
          <Icon name="settings" />
          {t("settings")}
        </Link>
      </div>
      <AccountTabs accountId={account.id} active={active} />
    </header>
  );
}
