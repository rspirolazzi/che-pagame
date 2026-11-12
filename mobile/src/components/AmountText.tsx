import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import type { BalanceEntry } from "../services/api/types";
import { useAppColors } from "../theme";
import { absAmount, amountSign } from "../utils/balanceTotals";
import { formatMoney } from "../utils/money";

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** "Te deben 60,00", "Debés 30,00", "Estás al día" for me; "Le deben"/"Debe"/"Al día" otherwise. */
export function balanceText(
  t: Translate,
  entry: Pick<BalanceEntry, "amount" | "isMe">,
  currency: string,
  decimals: number,
  locale: string,
): string {
  const amount = formatMoney(absAmount(entry.amount), currency, decimals, locale);
  const sign = amountSign(entry.amount);
  if (entry.isMe) {
    if (sign > 0) return t("balances.owedToYou", { amount });
    if (sign < 0) return t("balances.youOwe", { amount });
    return t("balances.youSettled");
  }
  if (sign > 0) return t("balances.owed", { amount });
  if (sign < 0) return t("balances.owes", { amount });
  return t("balances.settled");
}

interface AmountTextProps {
  /** Signed decimal text ("60.00", "-12.50"), never a number (Principle III). */
  amount: string;
  currency: string;
  decimals: number;
  locale: string;
  /** "me": "Te deben/Debés", "other": "Le deben/Debe", "none": only the signed amount. */
  subject?: "me" | "other" | "none";
  variant?: "regular" | "large";
}

/**
 * A balance that reads without color (FR-008): a badge with "+", "−" or a check and an accessible
 * name, the existing words, and the positive, negative or neutral color. Tabular figures.
 */
export function AmountText({
  amount,
  currency,
  decimals,
  locale,
  subject = "me",
  variant = "regular",
}: AmountTextProps) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const sign = amountSign(amount);
  const tone = sign > 0 ? colors.positive : sign < 0 ? colors.negative : colors.textMuted;
  const label = sign > 0 ? t("a11y.owed") : sign < 0 ? t("a11y.owes") : t("a11y.settled");
  const text =
    subject === "none"
      ? formatMoney(absAmount(amount), currency, decimals, locale)
      : balanceText(t, { amount, isMe: subject === "me" }, currency, decimals, locale);
  const size = variant === "large" ? 26 : 20;
  return (
    <View style={styles.row}>
      <View
        accessible
        accessibilityLabel={label}
        style={[styles.badge, { width: size, height: size, borderColor: tone }]}
      >
        {sign === 0 ? (
          <MaterialCommunityIcons name="check" size={size * 0.65} color={tone} />
        ) : (
          <Text style={[styles.sign, { color: tone, fontSize: size * 0.7 }]}>
            {sign > 0 ? "+" : "−"}
          </Text>
        )}
      </View>
      <Text
        style={[
          variant === "large" ? colors.amountLarge : colors.amount,
          styles.text,
          { color: tone },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  badge: { borderRadius: 999, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  sign: { fontWeight: "700", lineHeight: undefined },
  text: { flexShrink: 1 },
});
