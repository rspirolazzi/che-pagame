import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AccountHeader } from "@/components/accounts/AccountHeader";
import { BalanceList } from "@/components/balances/BalanceList";
import { SettlementList } from "@/components/balances/SettlementList";
import { SuggestionList } from "@/components/balances/SuggestionList";
import { ExportButton } from "@/components/exports/ExportButton";
import { Icon } from "@/components/ui/Icon";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { getAccount } from "@/lib/accountsServer";
import { ApiError } from "@/lib/api/errors";
import { getBalances, listSettlements } from "@/lib/balancesServer";

// Always current data when the tab is opened or revisited (FR-025).
export const dynamic = "force-dynamic";

interface BalancesPageProps {
  params: Promise<{ accountId: string }>;
}

async function load(accountId: string) {
  try {
    return await Promise.all([
      getAccount(accountId),
      getBalances(accountId),
      listSettlements(accountId),
    ]);
  } catch (error) {
    // Non-members get the same answer as for a missing account (FR-020).
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** "Saldos" tab: balances, then suggestions, then the settlements list (FR-000). */
export default async function AccountBalancesPage({ params }: BalancesPageProps) {
  const { accountId } = await params;
  const [loaded, t, tAccounts] = await Promise.all([
    load(accountId),
    getTranslations("settlements"),
    getTranslations("accounts"),
  ]);
  if (!loaded) notFound();
  const [account, balances, firstPage] = loaded;
  return (
    <>
      <AccountHeader account={account} active="balances" />
      {account.isClosed && (
        <StatusNotice kind="readOnly">{tAccounts("detail.closedNotice")}</StatusNotice>
      )}
      <div className="page-grid">
        <div className="stack">
          <BalanceList account={account} balances={balances} />
          <SettlementList
            key={firstPage.items.map((item) => item.id).join()}
            account={account}
            firstPage={firstPage}
          />
        </div>
        <aside className="page-aside">
          <SuggestionList account={account} suggestions={balances.suggestions} />
          {!account.isClosed && (
            <Link href={`/accounts/${account.id}/settlements/new`} className="button secondary">
              <Icon name="plus" />
              {t("new")}
            </Link>
          )}
          {/* Also on closed accounts: exporting is read only (FR-001 of feature 005). */}
          <ExportButton endpoint={`/api/exports/accounts/${account.id}`} />
        </aside>
      </div>
    </>
  );
}
