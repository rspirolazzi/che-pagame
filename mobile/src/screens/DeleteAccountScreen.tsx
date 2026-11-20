import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { AppButton } from "../components/AppButton";
import { ExportButton } from "../components/exports/ExportButton";
import { CodeInput, ErrorText } from "../components/FormBits";
import { Screen } from "../components/Screen";
import { useAuth } from "../hooks/useAuth";
import { exportsApi } from "../services/api/exports";
import { type ApiErrorCode, errorCodeOf } from "../services/api/types";
import { usersApi } from "../services/api/users";

/** Profile → "Delete my account" (feature 015): explanation, export, emailed code, confirmation. */
export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [step, setStep] = useState<"intro" | "code">("intro");
  const [error, setError] = useState<ApiErrorCode | null>(null);
  const [pending, setPending] = useState(false);

  if (!user) return null;

  async function requestCode() {
    setPending(true);
    setError(null);
    try {
      await usersApi.requestDeletion();
      setStep("code");
    } catch (err) {
      setError(errorCodeOf(err));
    } finally {
      setPending(false);
    }
  }

  async function confirm(code: string) {
    setPending(true);
    setError(null);
    try {
      await usersApi.confirmDeletion(code);
    } catch (err) {
      setError(errorCodeOf(err));
      setPending(false);
      return;
    }
    // The user no longer exists: end the local session and show the notice on the login.
    await logout("accountDeleted");
  }

  return (
    <Screen>
      <Text variant="headlineSmall" accessibilityRole="header">
        {t("deleteAccount.title")}
      </Text>
      <Text>{t("deleteAccount.intro")}</Text>

      <View style={styles.block}>
        <Text variant="titleMedium" accessibilityRole="header">
          {t("deleteAccount.erasedTitle")}
        </Text>
        <Text>{t("deleteAccount.erasedBody")}</Text>
      </View>
      <View style={styles.block}>
        <Text variant="titleMedium" accessibilityRole="header">
          {t("deleteAccount.keptTitle")}
        </Text>
        <Text>{t("deleteAccount.keptBody")}</Text>
      </View>
      <View style={styles.block}>
        <Text variant="titleMedium" accessibilityRole="header">
          {t("exports.mineTitle")}
        </Text>
        <Text variant="bodySmall">{t("deleteAccount.exportHint")}</Text>
        <ExportButton run={exportsApi.mine} label={t("exports.mineButton")} />
      </View>

      {step === "intro" && (
        <AppButton
          mode="outlined"
          tone="danger"
          icon="account-remove-outline"
          onPress={requestCode}
          disabled={pending}
        >
          {t("deleteAccount.sendCode")}
        </AppButton>
      )}
      {step === "code" && (
        <View style={styles.block}>
          <Text>{t("deleteAccount.codeSentTo", { email: user.email })}</Text>
          <CodeInput label={t("deleteAccount.codeLabel")} onComplete={confirm} disabled={pending} />
          <Text variant="bodySmall">{t("deleteAccount.irreversible")}</Text>
          <AppButton mode="text" onPress={requestCode} disabled={pending}>
            {t("deleteAccount.resend")}
          </AppButton>
        </View>
      )}
      <ErrorText code={error} />
      <AppButton mode="outlined" onPress={() => router.back()} disabled={pending}>
        {t("deleteAccount.cancel")}
      </AppButton>
    </Screen>
  );
}

const styles = StyleSheet.create({ block: { gap: 8 } });
