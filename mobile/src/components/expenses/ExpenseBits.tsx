import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { IconButton, Text, useTheme } from "react-native-paper";

import type {
  AccountResponse,
  CategoryIcon as Category,
  ExpenseListItem as Item,
  HistoryChange,
  HistoryEntry,
  ParticipantRef,
} from "../../services/api/types";
import type { AppTheme } from "../../theme";
import { CATEGORY_ICONS, CATEGORY_MATERIAL_ICON } from "../../utils/categoryIcons";
import { formatDay } from "../../utils/expenseGroups";
import { formatMoney } from "../../utils/money";

export function CategoryIcon({ icon, size = 28 }: { icon: Category; size?: number }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <MaterialCommunityIcons
      name={CATEGORY_MATERIAL_ICON[icon] as never}
      size={size}
      color={theme.colors.primary}
      accessibilityLabel={t(`expenses.categories.${icon}`)}
    />
  );
}

export function CategoryPicker({
  value,
  onChange,
}: {
  value: Category;
  onChange: (icon: Category) => void;
}) {
  const { t } = useTranslation();
  return (
    <View>
      <Text variant="labelLarge">{t("expenses.form.category")}</Text>
      <View style={styles.icons}>
        {CATEGORY_ICONS.map((icon) => (
          <IconButton
            key={icon}
            icon={CATEGORY_MATERIAL_ICON[icon]}
            mode={icon === value ? "contained" : undefined}
            selected={icon === value}
            accessibilityLabel={t(`expenses.categories.${icon}`)}
            accessibilityState={{ selected: icon === value }}
            onPress={() => onChange(icon)}
            style={styles.pick}
          />
        ))}
      </View>
    </View>
  );
}

export function ExpenseListItem({
  account,
  item,
  locale,
  onPress,
}: {
  account: AccountResponse;
  item: Item;
  locale: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { spacing, radius } = theme.custom;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { padding: spacing.md, gap: spacing.md },
        pressed && { backgroundColor: theme.colors.surfaceVariant },
      ]}
    >
      <View
        style={[
          styles.tile,
          { backgroundColor: theme.colors.primaryContainer, borderRadius: radius.md },
        ]}
      >
        <CategoryIcon icon={item.categoryIcon} size={22} />
      </View>
      <View style={styles.body}>
        <Text variant="titleMedium" numberOfLines={2}>
          {item.title}
        </Text>
        {item.isPending ? (
          <View style={[styles.pending, { gap: spacing.xs }]}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={16}
              color={theme.custom.warning}
            />
            <Text variant="bodySmall" style={[styles.bold, { color: theme.custom.warning }]}>
              {t("expenses.pending")}
            </Text>
          </View>
        ) : (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {item.paidBy ? t("expenses.paidBy", { name: item.paidBy.name }) : t("expenses.noPayer")}
          </Text>
        )}
      </View>
      <Text style={theme.custom.amount}>
        {formatMoney(item.amount, account.currency, account.currencyDecimals, locale)}
      </Text>
    </Pressable>
  );
}

/** Who did what and when on an expense, most recent first (FR-030 to FR-032). */
export function ExpenseHistory({
  account,
  entries,
  locale,
}: {
  account: AccountResponse;
  entries: HistoryEntry[];
  locale: string;
}) {
  const { t } = useTranslation();

  function value(change: HistoryChange, side: "before" | "after"): string {
    const raw = change[side];
    if (raw === null || raw === undefined || raw === "") return t("history.none");
    switch (change.field) {
      case "amount":
        return formatMoney(raw as string, account.currency, account.currencyDecimals, locale);
      case "date":
        return formatDay(raw as string, locale, { dateStyle: "medium" });
      case "categoryIcon":
        return t(`expenses.categories.${raw as Category}`);
      case "paidBy":
        return (raw as ParticipantRef).name;
      case "participants": {
        const names = (raw as ParticipantRef[]).map((p) => p.name);
        return names.length ? names.join(", ") : t("history.none");
      }
      default:
        return raw as string;
    }
  }

  return (
    <View style={styles.history}>
      <Text variant="titleMedium">{t("history.title")}</Text>
      {entries.length === 0 && <Text>{t("history.empty")}</Text>}
      {entries.map((entry) => (
        <View key={entry.id} style={styles.entry}>
          <Text variant="labelLarge">
            {t(`history.${entry.action}`, { name: entry.actorName ?? t("history.someone") })}
          </Text>
          <Text variant="bodySmall">
            {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
              new Date(entry.at),
            )}
          </Text>
          {entry.reason === "participant_removed" && (
            <Text variant="bodySmall">{t("history.automatic")}</Text>
          )}
          {entry.action !== "created" &&
            entry.changes.map((change) => (
              <Text key={change.field}>
                {t(`history.fields.${change.field}`)}: {value(change, "before")} →{" "}
                {value(change, "after")}
              </Text>
            ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  icons: { flexDirection: "row", flexWrap: "wrap" },
  // 48 dp touch targets for the category picker (FR-018).
  pick: { width: 48, height: 48 },
  row: { flexDirection: "row", alignItems: "center", minHeight: 48 },
  tile: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, minWidth: 0, gap: 2 },
  pending: { flexDirection: "row", alignItems: "center" },
  bold: { fontWeight: "600" },
  history: { gap: 12 },
  entry: { gap: 2 },
});
