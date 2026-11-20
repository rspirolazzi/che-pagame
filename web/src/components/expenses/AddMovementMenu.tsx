import Link from "next/link";
import { useTranslations } from "next-intl";

import { Icon } from "@/components/ui/Icon";
import type { AccountResponse } from "@/lib/api/types";

/**
 * "+" of the expense list: an expense or an income (a settlement, feature 012). Two direct
 * links instead of a menu: one tap less and nothing to open. Not shown on closed accounts.
 */
export function AddMovementMenu({ account }: { account: AccountResponse }) {
  const t = useTranslations("expenses.add");
  if (account.isClosed) return null;
  return (
    <nav className="add-movement" aria-label={t("label")}>
      <Link href={`/accounts/${account.id}/expenses/new`} className="button">
        <Icon name="plus" />
        {t("expense")}
      </Link>
      <Link href={`/accounts/${account.id}/settlements/new?from=list`} className="button secondary">
        <Icon name="swap" />
        {t("income")}
      </Link>
    </nav>
  );
}
