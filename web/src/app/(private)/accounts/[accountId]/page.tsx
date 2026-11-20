import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AccountHeader } from "@/components/accounts/AccountHeader";
import { AddMovementMenu } from "@/components/expenses/AddMovementMenu";
import { ExpenseList, ExpenseSummary } from "@/components/expenses/ExpenseList";
import { ExportButton } from "@/components/exports/ExportButton";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { getAccount } from "@/lib/accountsServer";
import { ApiError } from "@/lib/api/errors";
import { firstMovementPage } from "@/lib/expensesServer";

// Always current data when the page is opened or revisited (FR-033).
export const dynamic = "force-dynamic";

interface AccountPageProps {
  params: Promise<{ accountId: string }>;
}

async function load(accountId: string) {
  try {
    return await Promise.all([getAccount(accountId), firstMovementPage(accountId)]);
  } catch (error) {
    // Non-members get the same answer as for a missing account (FR-019).
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export default async function AccountExpensesPage({ params }: AccountPageProps) {
  const { accountId } = await params;
  const [loaded, t, tAccounts, tBalances] = await Promise.all([
    load(accountId),
    getTranslations("expenses"),
    getTranslations("accounts"),
    getTranslations("balances"),
  ]);
  if (!loaded) notFound();
  const [account, firstPage] = loaded;
  const hasPending = firstPage.items.some(
    (item) => item.kind === "expense" && item.expense.isPending,
  );
  return (
    <>
      <AccountHeader account={account} active="expenses" />
      {account.isClosed && (
        <StatusNotice kind="readOnly">{tAccounts("detail.closedNotice")}</StatusNotice>
      )}
      <div className="page-grid">
        <ExpenseList
          key={firstPage.items
            .map((i) => (i.kind === "expense" ? i.expense.id : i.settlement.id))
            .join()}
          account={account}
          firstPage={firstPage}
          showSummary={false}
        />
        <aside className="page-aside">
          <ExpenseSummary account={account} firstPage={firstPage} />
          {hasPending && (
            <StatusNotice kind="warning">
              <strong>{t("pending")}</strong>
              <br />
              {tBalances("pendingHint")}
            </StatusNotice>
          )}
          <AddMovementMenu account={account} />
          {/* Also on closed accounts: exporting is read only (FR-001 of feature 005). */}
          <ExportButton endpoint={`/api/exports/accounts/${account.id}`} />
        </aside>
      </div>
    </>
  );
}
