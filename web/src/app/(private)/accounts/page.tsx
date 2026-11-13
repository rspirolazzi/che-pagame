import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AccountList } from "@/components/accounts/AccountList";
import { Icon } from "@/components/ui/Icon";
import { listMyAccounts } from "@/lib/accountsServer";

export default async function AccountsPage() {
  const [accounts, t] = await Promise.all([listMyAccounts(), getTranslations("accounts")]);
  return (
    <>
      <header className="row space-between">
        <h1>{t("title")}</h1>
        <span className="row">
          <Link href="/join" className="button secondary">
            {t("join")}
          </Link>
          <Link href="/accounts/new" className="button">
            <Icon name="plus" />
            {t("new")}
          </Link>
        </span>
      </header>
      <AccountList accounts={accounts} />
    </>
  );
}
