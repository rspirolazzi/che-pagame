import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { settlementsApi } from "../../services/api/settlements";
import {
  type AccountResponse,
  type ApiErrorCode,
  errorCodeOf,
  type SuggestedTransfer,
} from "../../services/api/types";
import { formatDay, today } from "../../utils/expenseGroups";
import { formatMoney } from "../../utils/money";
import { newRequestId } from "../../utils/requestId";
import type { AppTheme } from "../../theme";
import { ConfirmDialog } from "../accounts/AccountBits";
import { AppButton } from "../AppButton";
import { ErrorText } from "../FormBits";

interface Open {
  suggestion: SuggestedTransfer;
  date: string;
  /** Stable across retries of the same dialog, so a lost response never records two. */
  clientRequestId: string;
}

/** Suggested settlements, each with "Marcar como pagado" in a fixed dialog (FR-012). */
export function SuggestionList({
  account,
  suggestions,
  locale,
  onSaved,
}: {
  account: AccountResponse;
  suggestions: SuggestedTransfer[];
  locale: string;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const { spacing, radius } = theme.custom;
  const [open, setOpen] = useState<Open | null>(null);
  const [error, setError] = useState<ApiErrorCode | null>(null);
  const [saving, setSaving] = useState(false);
  const money = (amount: string) =>
    formatMoney(amount, account.currency, account.currencyDecimals, locale);

  function close() {
    setOpen(null);
    setError(null);
  }

  async function confirm() {
    if (!open || saving) return;
    setSaving(true);
    setError(null);
    try {
      await settlementsApi.create(
        account.id,
        {
          fromParticipantId: open.suggestion.from.id,
          toParticipantId: open.suggestion.to.id,
          amount: open.suggestion.amount,
          date: open.date,
          source: "suggestion",
        },
        open.clientRequestId,
      );
      close();
      onSaved();
    } catch (err) {
      setError(errorCodeOf(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="titleLarge">{t("balances.suggestions")}</Text>
      {suggestions.length === 0 ? (
        <Text variant="bodyMedium">{t("balances.nothingPending")}</Text>
      ) : (
        suggestions.map((suggestion) => (
          <View
            key={`${suggestion.from.id}-${suggestion.to.id}`}
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
              <Text variant="titleMedium" style={styles.flex}>
                {t("balances.transfer", { from: suggestion.from.name, to: suggestion.to.name })}
              </Text>
              {/* The sun accent only as a highlight background, never as text (FR-017). */}
              <Text
                variant="labelMedium"
                style={[
                  styles.chip,
                  {
                    backgroundColor: theme.custom.accent,
                    color: theme.custom.onAccent,
                    borderRadius: radius.full,
                    paddingHorizontal: spacing.sm,
                  },
                ]}
              >
                {t("balances.suggested")}
              </Text>
            </View>
            <Text style={theme.custom.amountLarge}>{money(suggestion.amount)}</Text>
            {!account.isClosed && (
              <AppButton
                mode="contained"
                onPress={() =>
                  setOpen({ suggestion, date: today(), clientRequestId: newRequestId() })
                }
              >
                {t("balances.markPaid")}
              </AppButton>
            )}
          </View>
        ))
      )}
      <ConfirmDialog
        visible={open !== null}
        title={t("balances.dialogTitle")}
        message={
          open
            ? t("balances.dialogBody", {
                from: open.suggestion.from.name,
                to: open.suggestion.to.name,
                amount: money(open.suggestion.amount),
                date: formatDay(open.date, locale, { dateStyle: "long" }),
              })
            : ""
        }
        confirmLabel={t("balances.confirm")}
        cancelLabel={t("balances.cancel")}
        onConfirm={confirm}
        onCancel={close}
      >
        <Text variant="bodySmall">{t("balances.dialogHint")}</Text>
        <ErrorText code={error} />
      </ConfirmDialog>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  flex: { flexShrink: 1, flexGrow: 1 },
  chip: { overflow: "hidden", fontWeight: "700" },
});
