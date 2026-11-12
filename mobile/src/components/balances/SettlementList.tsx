import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";

import { settlementsApi } from "../../services/api/settlements";
import {
  type AccountResponse,
  type ApiErrorCode,
  errorCodeOf,
  type SettlementResponse,
} from "../../services/api/types";
import { formatDay } from "../../utils/expenseGroups";
import { formatMoney } from "../../utils/money";
import type { AppTheme } from "../../theme";
import { ConfirmDialog } from "../accounts/AccountBits";
import { AppButton } from "../AppButton";
import { ErrorText } from "../FormBits";
import { StatusNotice } from "../StatusNotice";

/**
 * Active settlements, most recent first (FR-015); those of a removed participant stay marked.
 * Any member deletes one after confirming with "Continuar" (FR-016), unless the account is
 * closed. After a delete, `onChanged` reloads the balances.
 */
export function SettlementList({
  account,
  items,
  locale,
  hasMore,
  loadingMore,
  onLoadMore,
  onChanged,
}: {
  account: AccountResponse;
  items: SettlementResponse[];
  locale: string;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { spacing, radius } = theme.custom;
  const [toDelete, setToDelete] = useState<SettlementResponse | null>(null);
  const [error, setError] = useState<ApiErrorCode | null>(null);
  const [gone, setGone] = useState(false);

  async function confirmDelete() {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    setError(null);
    setGone(false);
    try {
      await settlementsApi.remove(account.id, target.id);
      onChanged();
    } catch (err) {
      const code = errorCodeOf(err);
      if (code === "not_found") {
        setGone(true);
        onChanged();
      } else {
        setError(code);
      }
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="titleLarge">{t("settlements.title")}</Text>
      {gone && <StatusNotice kind="error">{t("settlements.gone")}</StatusNotice>}
      <ErrorText code={error} />
      {items.length === 0 ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t("settlements.empty")}
        </Text>
      ) : (
        items.map((item) => (
          <View
            key={item.id}
            testID={`settlement-${item.id}`}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
                borderRadius: radius.md,
                padding: spacing.md,
                gap: spacing.sm,
              },
            ]}
          >
            <View style={[styles.row, { gap: spacing.sm }]}>
              <View style={[styles.flex, { gap: spacing.xs }]}>
                <Text variant="bodyLarge">
                  {t("settlements.row", { from: item.from.name, to: item.to.name })}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {formatDay(item.date, locale, { dateStyle: "medium" })}
                </Text>
              </View>
              <Text style={theme.custom.amount}>
                {formatMoney(item.amount, account.currency, account.currencyDecimals, locale)}
              </Text>
            </View>
            {item.isExcluded && (
              <StatusNotice kind="info">
                <Text variant="bodyMedium" style={styles.bold}>
                  {t("settlements.removed")}
                </Text>
                {"\n"}
                {t("settlements.removedHint")}
              </StatusNotice>
            )}
            {!account.isClosed && (
              <AppButton
                mode="text"
                tone="danger"
                style={styles.end}
                onPress={() => setToDelete(item)}
              >
                {t("settlements.delete")}
              </AppButton>
            )}
          </View>
        ))
      )}
      {loadingMore && <ActivityIndicator />}
      {hasMore && !loadingMore && (
        <AppButton mode="outlined" onPress={onLoadMore}>
          {t("settlements.loadMore")}
        </AppButton>
      )}
      <ConfirmDialog
        visible={toDelete !== null}
        title={t("settlements.deleteTitle")}
        message={t("settlements.deleteBody")}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap" },
  flex: { flex: 1, minWidth: 140 },
  end: { alignSelf: "flex-end" },
  bold: { fontWeight: "600" },
});
