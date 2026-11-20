import type { StyleProp, TextStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import type { AppTheme } from "../theme";
import { formatCompactMoney, formatMoney } from "../utils/money";

interface MoneyProps {
  /** Decimal text ("10000000.00"), never a number (Principle III). */
  amount: string;
  currency: string;
  decimals: number;
  locale: string;
  style?: StyleProp<TextStyle>;
}

/**
 * An amount in a list or summary (feature 016): compact from 10,000 ("10 M ARS"), with the exact
 * amount as the accessible name. Below 10,000 it is the exact text.
 */
export function Money({ amount, currency, decimals, locale, style }: MoneyProps) {
  const exact = formatMoney(amount, currency, decimals, locale);
  const compact = formatCompactMoney(amount, currency, decimals, locale);
  return (
    <Text style={style} accessibilityLabel={exact}>
      {compact}
    </Text>
  );
}

/** The detail of an expense or a settlement: compact and large, the exact amount below (FR-006). */
export function MoneyWithExact({ amount, currency, decimals, locale }: Omit<MoneyProps, "style">) {
  const theme = useTheme<AppTheme>();
  const exact = formatMoney(amount, currency, decimals, locale);
  const compact = formatCompactMoney(amount, currency, decimals, locale);
  return (
    <View style={styles.column} accessible accessibilityLabel={exact}>
      <Text style={theme.custom.amountLarge}>{compact}</Text>
      {compact !== exact && (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {exact}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 2 },
});
