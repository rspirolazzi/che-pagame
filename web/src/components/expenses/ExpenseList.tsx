"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { loadMoreMovementsAction } from "@/app/actions/expenses";
import { ErrorMessage } from "@/components/FormMessage";
import type { ApiErrorCode } from "@/lib/api/errors";
import type { AccountResponse, ExpenseListItem as Item, MovementPage } from "@/lib/api/types";
import { formatDay, groupByDay, mergePages, toEntries } from "@/lib/expenseGroups";
import { Money } from "@/components/ui/Money";

import { CategoryIcon } from "./CategoryIcon";
import { IncomeRow } from "./IncomeRow";

interface ExpenseListProps {
  account: AccountResponse;
  /** Expenses and settlements together (feature 012). */
  firstPage: MovementPage;
  /** False when the page shows ExpenseSummary in the side column. */
  showSummary?: boolean;
}

export function ExpenseListItem({ account, item }: { account: AccountResponse; item: Item }) {
  const t = useTranslations("expenses");
  return (
    <li>
      <Link href={`/accounts/${account.id}/expenses/${item.id}`} className="expense-row">
        <CategoryIcon icon={item.categoryIcon} />
        <span className="expense-main">
          <span>{item.title}</span>
          <small>
            {item.paidBy ? t("paidBy", { name: item.paidBy.name }) : t("noPayer")}
            {item.isPending && <span className="badge">{t("pending")}</span>}
          </small>
        </span>
        <strong>
          <Money
            amount={item.amount}
            currency={account.currency}
            decimals={account.currencyDecimals}
          />
        </strong>
      </Link>
    </li>
  );
}

/**
 * Total on top, expenses grouped by day, loaded 50 at a time (FR-034, FR-035). It never refreshes
 * by itself: "Refresh" or coming back to the page brings current data (FR-033).
 */
/** "Total gastado", the count and "Actualizar" (in the side column on desktop, FR-013a). */
export function ExpenseSummary({ account, firstPage }: ExpenseListProps) {
  const t = useTranslations("expenses");
  const router = useRouter();
  const total = firstPage.total ?? "0";
  return (
    <div className="card stack expense-summary">
      <div>
        <small>{t("total")}</small>
        <p className="expense-total">
          <Money amount={total} currency={account.currency} decimals={account.currencyDecimals} />
        </p>
        <small>{t("count", { count: firstPage.count ?? 0 })}</small>
      </div>
      <button type="button" className="secondary" onClick={() => router.refresh()}>
        {t("refresh")}
      </button>
    </div>
  );
}

export function ExpenseList({ account, firstPage, showSummary = true }: ExpenseListProps) {
  const t = useTranslations("expenses");
  const locale = useLocale();
  const [items, setItems] = useState(() => toEntries(firstPage.items));
  const [cursor, setCursor] = useState(firstPage.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorCode | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  async function loadMore() {
    if (!cursor || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    const result = await loadMoreMovementsAction(account.id, cursor);
    loadingRef.current = false;
    setLoading(false);
    if (!result.ok) {
      setError(result.code);
      return;
    }
    setItems((current) => mergePages(current, toEntries(result.data.items)));
    setCursor(result.data.nextCursor);
  }

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !cursor || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMore();
    });
    observer.observe(node);
    return () => observer.disconnect();
    // loadMore only changes with the cursor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  return (
    <section className="stack">
      {showSummary && <ExpenseSummary account={account} firstPage={firstPage} />}
      {items.length === 0 ? (
        <p>
          {t("empty")} {!account.isClosed && t("emptyCta")}
        </p>
      ) : (
        groupByDay(items).map((group) => (
          <section key={group.date} aria-label={formatDay(group.date, locale)}>
            <h2 className="day-heading">{formatDay(group.date, locale)}</h2>
            <ul className="expense-list card">
              {group.items.map(({ id, movement }) =>
                movement.kind === "expense" ? (
                  <ExpenseListItem key={id} account={account} item={movement.expense} />
                ) : (
                  <IncomeRow key={id} account={account} settlement={movement.settlement} />
                ),
              )}
            </ul>
          </section>
        ))
      )}
      <ErrorMessage code={error} />
      {cursor && (
        <div ref={sentinel}>
          <button type="button" className="secondary" disabled={loading} onClick={loadMore}>
            {loading ? t("loading") : t("loadMore")}
          </button>
        </div>
      )}
    </section>
  );
}
