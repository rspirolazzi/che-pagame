import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { AppButton } from "../components/AppButton";
import { BalanceSummary } from "../components/balances/BalanceSummary";
import { Screen } from "../components/Screen";
import { useAuth } from "../hooks/useAuth";
import { accountsApi } from "../services/api/accounts";
import type { AccountSummary } from "../services/api/types";
import type { AppTheme } from "../theme";
import { displayName } from "../utils/displayName";
import { AccountListItems } from "./accounts/AccountsScreen";

/** "Inicio": greeting, balances card and the most recent accounts (feature 006 mockup). */
export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountSummary[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      accountsApi
        .list()
        .then((list) => active && setAccounts(list))
        .catch(() => active && setAccounts([]));
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <Screen>
      <Text variant="headlineMedium" accessibilityRole="header">
        {t("dashboard.title", { name: user ? displayName(user) : "" })}
      </Text>
      {accounts && accounts.length > 0 && (
        <BalanceSummary accounts={accounts} locale={i18n.language} />
      )}
      <View style={[styles.sectionHead, { marginTop: theme.custom.spacing.sm }]}>
        <Text variant="titleLarge" accessibilityRole="header" style={styles.flex}>
          {t("accounts.recent")}
        </Text>
        <AppButton mode="text" compact onPress={() => router.push("/accounts")}>
          {t("accounts.seeAll")}
        </AppButton>
      </View>
      {accounts && <AccountListItems accounts={accounts.slice(0, 5)} />}
      <AppButton mode="contained" icon="plus" onPress={() => router.push("/accounts/new")}>
        {t("accounts.new")}
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHead: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  flex: { flexGrow: 1, flexShrink: 1 },
});
