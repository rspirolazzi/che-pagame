import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import type { AccountBalances } from "../../services/api/types";
import type { AppTheme } from "../../theme";
import { amountSign } from "../../utils/balanceTotals";
import { AmountText } from "../AmountText";
import { StatusNotice } from "../StatusNotice";

export { balanceText } from "../AmountText";

/**
 * The balance of each active participant, mine highlighted in plain words (FR-007), plus the
 * pending expenses notice that leads to the "Gastos" tab (FR-006). Each balance reads without
 * color: sign, words and an accessible badge (feature 006, FR-008).
 */
export function BalanceList({
  balances,
  locale,
  onOpenExpenses,
}: {
  balances: AccountBalances;
  locale: string;
  onOpenExpenses: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { spacing, radius } = theme.custom;
  const noDebts = balances.balances.every((entry) => amountSign(entry.amount) === 0);
  const money = {
    currency: balances.currency,
    decimals: balances.currencyDecimals,
    locale,
  };
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="titleLarge">{t("balances.title")}</Text>
      {balances.pendingExpenses > 0 && (
        <StatusNotice
          kind="warning"
          action={{ label: t("balances.pendingLink"), onPress: onOpenExpenses }}
        >
          <Text variant="bodyMedium" style={styles.bold}>
            {t("expenses.pending")}
          </Text>
          {"\n"}
          <Text variant="bodyMedium">
            {t("balances.pending", { count: balances.pendingExpenses })}
          </Text>
          {"\n"}
          <Text variant="bodySmall">{t("balances.pendingHint")}</Text>
        </StatusNotice>
      )}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
            borderRadius: radius.md,
          },
        ]}
      >
        {balances.balances.map((entry, index) => (
          <View
            key={entry.participant.id}
            testID={entry.isMe ? "balance-me" : `balance-${entry.participant.id}`}
            style={[
              styles.row,
              { padding: spacing.md, gap: spacing.sm },
              index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant },
              entry.isMe && { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text variant="bodyLarge" style={[styles.name, entry.isMe && styles.bold]}>
              {entry.isMe
                ? `${entry.participant.name} (${t("balances.you")})`
                : entry.participant.name}
            </Text>
            <AmountText amount={entry.amount} subject={entry.isMe ? "me" : "other"} {...money} />
          </View>
        ))}
      </View>
      {noDebts && <Text variant="bodyMedium">{t("balances.noDebts")}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
  },
  name: { flexShrink: 1 },
  bold: { fontWeight: "600" },
});
