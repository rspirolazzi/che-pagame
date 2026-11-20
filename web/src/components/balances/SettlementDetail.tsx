"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { deleteSettlementAction } from "@/app/actions/settlements";
import { ConfirmDialog } from "@/components/accounts/ConfirmDialog";
import { ErrorMessage } from "@/components/FormMessage";
import { MoneyWithExact } from "@/components/ui/Money";
import { StatusNotice } from "@/components/ui/StatusNotice";
import type { ApiErrorCode } from "@/lib/api/errors";
import type { AccountResponse, SettlementResponse } from "@/lib/api/types";
import { formatDay } from "@/lib/expenseGroups";

/**
 * An "Ingreso" (a settlement) from the expense list: its data, who recorded it and delete with
 * confirmation. Settlements are never edited (feature 004, FR-017; feature 012, US3).
 */
export function SettlementDetail({
  account,
  settlement,
}: {
  account: AccountResponse;
  settlement: SettlementResponse;
}) {
  const t = useTranslations("settlements");
  const locale = useLocale();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [gone, setGone] = useState(false);
  const [error, setError] = useState<ApiErrorCode | null>(null);
  const list = `/accounts/${account.id}`;
  const recordedOn = formatDay(settlement.createdAt.slice(0, 10), locale, { dateStyle: "long" });

  async function confirmDelete() {
    setDeleting(true);
    setError(null);
    const result = await deleteSettlementAction(account.id, settlement.id);
    setDeleting(false);
    setConfirming(false);
    if (result.ok) {
      router.push(list);
      router.refresh();
      return;
    }
    if (result.code === "not_found") setGone(true);
    else setError(result.code);
  }

  return (
    <article className="card stack">
      <header className="stack">
        <span className="badge income-badge">{t("detail.title")}</span>
        <h1>{t("row", { from: settlement.from.name, to: settlement.to.name })}</h1>
        <MoneyWithExact
          amount={settlement.amount}
          currency={account.currency}
          decimals={account.currencyDecimals}
        />
      </header>
      {gone && <StatusNotice kind="warning">{t("detail.gone")}</StatusNotice>}
      <dl className="stack">
        <div>
          <dt>{t("from")}</dt>
          <dd>{settlement.from.name}</dd>
        </div>
        <div>
          <dt>{t("to")}</dt>
          <dd>{settlement.to.name}</dd>
        </div>
        <div>
          <dt>{t("date")}</dt>
          <dd>{formatDay(settlement.date, locale)}</dd>
        </div>
      </dl>
      {settlement.isExcluded && (
        <p>
          <span className="badge">{t("removed")}</span> {t("removedHint")}
        </p>
      )}
      <p>
        <small>
          {settlement.recordedBy
            ? t("detail.recordedBy", { name: settlement.recordedBy.name, date: recordedOn })
            : t("detail.recordedOn", { date: recordedOn })}
        </small>
      </p>
      <p>
        <small>{t("detail.noEdit")}</small>
      </p>
      <ErrorMessage code={error} />
      <div className="row">
        {!account.isClosed && !gone && (
          <button type="button" className="danger" onClick={() => setConfirming(true)}>
            {t("delete")}
          </button>
        )}
        <Link href={list}>{t("backToList")}</Link>
      </div>
      <ConfirmDialog
        open={confirming}
        title={t("deleteTitle")}
        message={t("deleteBody")}
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </article>
  );
}
