import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import type { AccountSummary } from "../../services/api/types";
import type { AppTheme } from "../../theme";
import { totalsByCurrency } from "../../utils/balanceTotals";
import { AmountText } from "../AmountText";
import { StatusNotice } from "../StatusNotice";

/**
 * "Te deben" and "Debés" per currency over every account, closed ones included (FR-024). Amounts
 * of different currencies are never added together. Highlighted card of the Dashboard (006).
 */
export function BalanceSummary({
  accounts,
  locale,
}: {
  accounts: AccountSummary[];
  locale: string;
}) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { spacing, radius } = theme.custom;
  const totals = totalsByCurrency(accounts);
  if (totals.length === 0) {
    return <StatusNotice kind="info">{t("dashboard.balances.allSettled")}</StatusNotice>;
  }
  const column = (label: string, pick: "owedToMe" | "iOwe", testID: string) => {
    const amounts = totals.filter((total) => /[1-9]/.test(total[pick]));
    return (
      <View style={[styles.column, { gap: spacing.xs }]} testID={testID}>
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        {amounts.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            —
          </Text>
        ) : (
          amounts.map((total) => (
            <AmountText
              key={total.currency}
              amount={pick === "iOwe" ? `-${total[pick]}` : total[pick]}
              currency={total.currency}
              decimals={total.decimals}
              locale={locale}
              subject="none"
              variant="large"
            />
          ))
        )}
      </View>
    );
  };
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.elevation.level2,
          borderColor: theme.colors.outlineVariant,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.md,
        },
      ]}
    >
      <Text variant="titleMedium">{t("dashboard.balances.title")}</Text>
      <View style={[styles.row, { gap: spacing.lg }]}>
        {column(t("dashboard.balances.owedToYou"), "owedToMe", "owed-to-me")}
        {column(t("dashboard.balances.youOwe"), "iOwe", "i-owe")}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
  // Columns wrap to one per line with large system text (FR-019).
  row: { flexDirection: "row", flexWrap: "wrap" },
  column: { flexGrow: 1, flexBasis: 140, minWidth: 0 },
});
