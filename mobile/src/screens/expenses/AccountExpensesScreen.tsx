import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, SectionList, StyleSheet, View } from "react-native";
import { ActivityIndicator, FAB, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AccountHeader } from "../../components/accounts/AccountHeader";
import { ExpenseListItem, IncomeListItem } from "../../components/expenses/ExpenseBits";
import { ErrorText } from "../../components/FormBits";
import { Money } from "../../components/Money";
import { StatusNotice } from "../../components/StatusNotice";
import { accountsApi } from "../../services/api/accounts";
import { movementsApi } from "../../services/api/movements";
import { type AccountResponse, type ApiErrorCode, errorCodeOf } from "../../services/api/types";
import {
  formatDay,
  groupByDay,
  mergePages,
  type MovementEntry,
  toEntries,
} from "../../utils/expenseGroups";
import type { AppTheme } from "../../theme";

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * The account's main view: total on top and expenses grouped by day, 50 at a time (FR-034,
 * FR-035). It reloads when the screen gets focus and on pull to refresh, never by itself (FR-033).
 */
export default function AccountExpensesScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const locale = i18n.language;
  const { spacing, radius } = theme.custom;
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [items, setItems] = useState<MovementEntry[]>([]);
  const [fabOpen, setFabOpen] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState("0");
  const [count, setCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<ApiErrorCode | null>(null);
  const loadingMoreRef = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextAccount, page] = await Promise.all([
        accountsApi.get(accountId),
        movementsApi.list(accountId),
      ]);
      setAccount(nextAccount);
      setItems(toEntries(page.items));
      setCursor(page.nextCursor);
      setTotal(page.total ?? "0");
      setCount(page.count ?? 0);
    } catch (err) {
      const code = errorCodeOf(err);
      if (code === "not_found") router.replace("/accounts");
      else setError(code);
    }
  }, [accountId, router]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function loadMore() {
    if (!cursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await movementsApi.list(accountId, cursor);
      setItems((current) => mergePages(current, toEntries(page.items)));
      setCursor(page.nextCursor);
    } catch (err) {
      setError(errorCodeOf(err));
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }

  if (!account) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top + spacing.lg }]}>
        {error ? <ErrorText code={error} /> : <ActivityIndicator />}
      </View>
    );
  }

  const sections = groupByDay(items).map((group) => ({
    title: capitalize(formatDay(group.date, locale)),
    data: group.items,
  }));
  const pending = items.filter(
    ({ movement }) => movement.kind === "expense" && movement.expense.isPending,
  ).length;

  return (
    <View style={styles.flex}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingTop: insets.top + spacing.sm,
          // Room for the floating "Nuevo gasto" button.
          paddingBottom: spacing.xxl * 3,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
            <AccountHeader account={account} active="expenses" />
            {account.isClosed && (
              <StatusNotice kind="readOnly">{t("accounts.detail.closedNotice")}</StatusNotice>
            )}
            <View style={styles.total}>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {t("expenses.total")}
              </Text>
              <Money
                style={theme.custom.amountLarge}
                amount={total}
                currency={account.currency}
                decimals={account.currencyDecimals}
                locale={locale}
              />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t("expenses.count", { count })}
              </Text>
            </View>
            {pending > 0 && (
              <StatusNotice kind="warning">
                <Text variant="bodyMedium" style={styles.bold}>
                  {t("balances.pending", { count: pending })}
                </Text>
                {"\n"}
                {t("balances.pendingHint")}
              </StatusNotice>
            )}
            <ErrorText code={error} />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text
            variant="labelLarge"
            style={{
              color: theme.colors.onSurfaceVariant,
              marginTop: spacing.md,
              marginBottom: spacing.xs,
            }}
          >
            {section.title}
          </Text>
        )}
        renderItem={({ item, index, section }) => (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
              borderWidth: 1,
              borderTopWidth: index === 0 ? 1 : 0,
              borderTopLeftRadius: index === 0 ? radius.md : 0,
              borderTopRightRadius: index === 0 ? radius.md : 0,
              borderBottomLeftRadius: index === section.data.length - 1 ? radius.md : 0,
              borderBottomRightRadius: index === section.data.length - 1 ? radius.md : 0,
              overflow: "hidden",
            }}
          >
            {item.movement.kind === "expense" ? (
              <ExpenseListItem
                account={account}
                item={item.movement.expense}
                locale={locale}
                onPress={() =>
                  router.push({
                    pathname: "/accounts/[accountId]/expenses/[expenseId]",
                    params: {
                      accountId: account.id,
                      expenseId: item.movement.kind === "expense" ? item.movement.expense.id : "",
                    },
                  })
                }
              />
            ) : (
              <IncomeListItem
                account={account}
                settlement={item.movement.settlement}
                locale={locale}
                onPress={() =>
                  router.push({
                    pathname: "/accounts/[accountId]/settlements/[settlementId]",
                    params: {
                      accountId: account.id,
                      settlementId:
                        item.movement.kind === "settlement" ? item.movement.settlement.id : "",
                    },
                  })
                }
              />
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("expenses.empty")} {account.isClosed ? "" : t("expenses.emptyCta")}
          </Text>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator /> : null}
      />
      {!account.isClosed && (
        // "+" offers an expense or an income (a settlement, feature 012).
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? "close" : "plus"}
          label={fabOpen ? undefined : t("expenses.add.label")}
          accessibilityLabel={t("expenses.add.label")}
          onStateChange={({ open }) => setFabOpen(open)}
          actions={[
            {
              icon: "receipt-text-outline",
              label: t("expenses.add.expense"),
              accessibilityLabel: t("expenses.add.expense"),
              onPress: () =>
                router.push({
                  pathname: "/accounts/[accountId]/new-expense",
                  params: { accountId: account.id },
                }),
            },
            {
              icon: "swap-horizontal",
              label: t("expenses.add.income"),
              accessibilityLabel: t("expenses.add.income"),
              onPress: () =>
                router.push({
                  pathname: "/accounts/[accountId]/settlements/new",
                  params: { accountId: account.id, from: "list" },
                }),
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: "center" },
  total: { gap: 2 },
  bold: { fontWeight: "600" },
  fab: { position: "absolute" },
});
