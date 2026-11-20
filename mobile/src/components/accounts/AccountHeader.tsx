import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { IconButton, Text, useTheme } from "react-native-paper";

import { exportsApi } from "../../services/api/exports";
import type { AccountResponse } from "../../services/api/types";
import type { AppTheme } from "../../theme";
import { ExportButton } from "../exports/ExportButton";
import { AccountIcon } from "./AccountBits";
import { type AccountTab, AccountTabs } from "./AccountTabs";

/**
 * Top of an account (Gastos and Saldos): back, icon, name, currency, closed badge, settings,
 * export and the two tabs. Replaces the stack header on these screens (feature 006 mockup).
 */
export function AccountHeader({
  account,
  active,
}: {
  account: AccountResponse;
  active: AccountTab;
}) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const router = useRouter();
  const { spacing, radius } = theme.custom;
  return (
    <View style={{ gap: spacing.md }}>
      <View style={[styles.row, { gap: spacing.xs }]}>
        <IconButton
          icon="arrow-left"
          accessibilityLabel={t("a11y.back")}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/accounts"))}
          style={styles.edge}
        />
        <View
          style={[
            styles.iconTile,
            { backgroundColor: theme.colors.primaryContainer, borderRadius: radius.md },
          ]}
        >
          <AccountIcon icon={account.icon} size={22} />
        </View>
        <View style={styles.title}>
          <Text variant="titleLarge" accessibilityRole="header" numberOfLines={2}>
            {account.name}
          </Text>
          <View style={[styles.meta, { gap: spacing.sm }]}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {account.currency}
            </Text>
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
        <IconButton
          icon="cog-outline"
          accessibilityLabel={t("expenses.settings")}
          onPress={() =>
            router.push({
              pathname: "/accounts/[accountId]/settings",
              params: { accountId: account.id },
            })
          }
          style={styles.edge}
        />
      </View>
      <AccountTabs accountId={account.id} active={active} />
      {/* Also on closed accounts: exporting is read only (FR-001 of feature 005). */}
      <ExportButton run={(format) => exportsApi.account(account.id, format)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  // Paper's icon buttons are 40 dp; the identity asks for 48 dp touch targets (FR-018).
  edge: { margin: 0, width: 48, height: 48 },
  iconTile: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, minWidth: 0 },
  meta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  badge: { borderWidth: 1, overflow: "hidden" },
});
