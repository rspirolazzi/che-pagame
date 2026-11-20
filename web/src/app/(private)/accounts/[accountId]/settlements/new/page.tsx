import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { SettlementForm } from "@/components/balances/SettlementForm";
import { getAccount } from "@/lib/accountsServer";
import { ApiError } from "@/lib/api/errors";

interface NewSettlementPageProps {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ from?: string }>;
}

/** A settlement from Balances, or an "Ingreso" from the expense list (feature 012). */
export default async function NewSettlementPage({ params, searchParams }: NewSettlementPageProps) {
  const [{ accountId }, { from }] = await Promise.all([params, searchParams]);
  const fromList = from === "list";
  const t = await getTranslations("settlements");
  const account = await getAccount(accountId).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });
  if (!account) notFound();
  // A closed account is read only (FR-019).
  if (account.isClosed) redirect(`/accounts/${account.id}/balances`);
  if (fromList) {
    const me = account.participants.find((p) => p.isMe);
    const list = `/accounts/${account.id}`;
    return (
      <section className="card stack">
        <h1>{t("incomeTitle")}</h1>
        <p>{t("incomeHint")}</p>
        <SettlementForm account={account} defaultToId={me?.id} returnTo={list} />
        <Link href={list}>{t("backToList")}</Link>
      </section>
    );
  }
  return (
    <section className="card stack">
      <h1>{t("newTitle")}</h1>
      <SettlementForm account={account} />
      <Link href={`/accounts/${account.id}/balances`}>{t("back")}</Link>
    </section>
  );
}
