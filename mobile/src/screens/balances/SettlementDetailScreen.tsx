import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { ActivityIndicator, Chip, List, Text } from "react-native-paper";

import { ConfirmDialog } from "../../components/accounts/AccountBits";
import { AppButton } from "../../components/AppButton";
import { ErrorText, formStyles } from "../../components/FormBits";
import { MoneyWithExact } from "../../components/Money";
import { StatusNotice } from "../../components/StatusNotice";
import { accountsApi } from "../../services/api/accounts";
import { settlementsApi } from "../../services/api/settlements";
import {
  type AccountResponse,
  type ApiErrorCode,
  errorCodeOf,
  type SettlementResponse,
} from "../../services/api/types";
import { formatDay } from "../../utils/expenseGroups";

/**
 * An "Ingreso" (a settlement) from the expense list: its data, who recorded it and delete with
 * confirmation. Settlements are never edited (feature 004, FR-017; feature 012, US3).
 */
export default function SettlementDetailScreen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const router = useRouter();
  const { accountId, settlementId } = useLocalSearchParams<{
    accountId: string;
    settlementId: string;
  }>();
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [settlement, setSettlement] = useState<SettlementResponse | null>(null);
  const [gone, setGone] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<ApiErrorCode | null>(null);

  useEffect(() => {
    Promise.all([accountsApi.get(accountId), settlementsApi.get(accountId, settlementId)])
      .then(([nextAccount, nextSettlement]) => {
        setAccount(nextAccount);
        setSettlement(nextSettlement);
      })
      .catch((err) => {
        const code = errorCodeOf(err);
        if (code === "not_found") setGone(true);
        else setError(code);
      });
  }, [accountId, settlementId]);

  async function confirmDelete() {
    setConfirming(false);
    if (!account || !settlement) return;
    try {
      await settlementsApi.remove(account.id, settlement.id);
      router.back();
    } catch (err) {
      const code = errorCodeOf(err);
      if (code === "not_found") setGone(true);
      else setError(code);
    }
  }

  if (gone) {
    return (
      <ScrollView contentContainerStyle={formStyles.screen}>
        <StatusNotice kind="warning">{t("settlements.detail.gone")}</StatusNotice>
      </ScrollView>
    );
  }
  if (!account || !settlement) {
    return (
      <ScrollView contentContainerStyle={formStyles.screen}>
        {error ? <ErrorText code={error} /> : <ActivityIndicator />}
      </ScrollView>
    );
  }

  const names = { from: settlement.from.name, to: settlement.to.name };
  const recordedOn = formatDay(settlement.createdAt.slice(0, 10), locale, { dateStyle: "long" });
  return (
    <ScrollView contentContainerStyle={formStyles.screen}>
      <Chip icon="swap-horizontal" style={{ alignSelf: "flex-start" }}>
        {t("settlements.detail.title")}
      </Chip>
      <Text variant="headlineSmall" accessibilityRole="header">
        {t("settlements.row", names)}
      </Text>
      <MoneyWithExact
        amount={settlement.amount}
        currency={account.currency}
        decimals={account.currencyDecimals}
        locale={locale}
      />
      <List.Item title={t("settlements.from")} description={settlement.from.name} />
      <List.Item title={t("settlements.to")} description={settlement.to.name} />
      <List.Item title={t("settlements.date")} description={formatDay(settlement.date, locale)} />
      {settlement.isExcluded && (
        <Text>
          {t("settlements.removed")}. {t("settlements.removedHint")}
        </Text>
      )}
      <Text variant="bodySmall">
        {settlement.recordedBy
          ? t("settlements.detail.recordedBy", {
              name: settlement.recordedBy.name,
              date: recordedOn,
            })
          : t("settlements.detail.recordedOn", { date: recordedOn })}
      </Text>
      <Text variant="bodySmall">{t("settlements.detail.noEdit")}</Text>
      <ErrorText code={error} />
      {!account.isClosed && (
        <AppButton
          mode="outlined"
          tone="danger"
          icon="delete-outline"
          onPress={() => setConfirming(true)}
        >
          {t("settlements.delete")}
        </AppButton>
      )}
      <ConfirmDialog
        visible={confirming}
        title={t("settlements.deleteTitle")}
        message={t("settlements.deleteBody")}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </ScrollView>
  );
}
