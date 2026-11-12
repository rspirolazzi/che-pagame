import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { AppButton } from "../../components/AppButton";
import { AccountIcon } from "../../components/accounts/AccountBits";
import { AmountText } from "../../components/AmountText";
import { ErrorText } from "../../components/FormBits";
import { Screen } from "../../components/Screen";
import { accountsApi } from "../../services/api/accounts";
import { type AccountSummary, type ApiErrorCode, errorCodeOf } from "../../services/api/types";
import type { AppTheme } from "../../theme";

/** Dates in the user's language (Principle II). */
export function formatDate(iso: string, language: string): string {
  return new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(new Date(iso));
}

/** Accounts as one card of rows: icon, name, details, my balance and the closed badge. */
export function AccountListItems({ accounts }: { accounts: AccountSummary[] }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { spacing, radius } = theme.custom;
  const router = useRouter();
  if (accounts.length === 0) {
    return (
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {t("accounts.empty")}
      </Text>
    );
  }
  return (
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
      {accounts.map((account, index) => (
        <Pressable
          key={account.id}
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: "/accounts/[accountId]", params: { accountId: account.id } })
          }
          style={({ pressed }) => [
            styles.row,
            { padding: spacing.md, gap: spacing.md },
            index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant },
            pressed && { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <View
            style={[
              styles.iconTile,
              { backgroundColor: theme.colors.primaryContainer, borderRadius: radius.md },
            ]}
          >
            <AccountIcon icon={account.icon} size={24} />
          </View>
          <View style={styles.body}>
            <Text variant="titleMedium" numberOfLines={2}>
              {account.name}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {`${account.currency} · ${t("accounts.participantCount", {
                count: account.participantCount,
              })} · ${t("accounts.updatedAt", {
                date: formatDate(account.updatedAt, i18n.language),
              })}`}
            </Text>
            <View style={[styles.balanceRow, { gap: spacing.sm }]}>
              <AmountText
                amount={account.myBalance}
                currency={account.currency}
                decimals={account.currencyDecimals}
                locale={i18n.language}
              />
              {account.isClosed && (
                <Text
                  variant="labelSmall"
                  style={[
                    styles.badge,
                    {
                      borderColor: theme.colors.outline,
                      color: theme.colors.onSurfaceVariant,
                      borderRadius: radius.sm,
                      paddingHorizontal: spacing.sm,
                    },
                  ]}
                >
                  {t("accounts.closedBadge")}
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

/** "Cuentas" tab: create, join and every account the user is a member of. */
export default function AccountsScreen() {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountSummary[] | null>(null);
  const [error, setError] = useState<ApiErrorCode | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      accountsApi
        .list()
        .then((list) => active && setAccounts(list))
        .catch((err) => active && setError(errorCodeOf(err)));
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <Screen>
      <Text variant="headlineMedium" accessibilityRole="header">
        {t("accounts.title")}
      </Text>
      <View style={[styles.actions, { gap: theme.custom.spacing.sm }]}>
        <AppButton
          mode="contained"
          icon="plus"
          style={styles.action}
          onPress={() => router.push("/accounts/new")}
        >
          {t("accounts.new")}
        </AppButton>
        <AppButton mode="outlined" style={styles.action} onPress={() => router.push("/join")}>
          {t("accounts.join")}
        </AppButton>
      </View>
      <ErrorText code={error} />
      {accounts && <AccountListItems accounts={accounts} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "flex-start", minHeight: 48 },
  iconTile: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, minWidth: 0, gap: 2 },
  balanceRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginTop: 4 },
  badge: { borderWidth: 1, overflow: "hidden" },
  actions: { flexDirection: "row", flexWrap: "wrap" },
  action: { flexGrow: 1 },
});
