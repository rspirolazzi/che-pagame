import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { Text } from "react-native-paper";

import { AppButton } from "../components/AppButton";
import { CodeInput, ErrorText, formStyles, ResendButton } from "../components/FormBits";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../services/api/auth";
import { ApiError, type ApiErrorCode, errorCodeOf } from "../services/api/types";

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signInWithTokens } = useAuth();
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const [error, setError] = useState<ApiErrorCode | null>(null);
  const [pending, setPending] = useState(false);

  async function verify(code: string) {
    setError(null);
    setPending(true);
    try {
      // The root layout sends a new user to the currency onboarding (FR-020a).
      await signInWithTokens(await authApi.verifyRegistration(email, code));
    } catch (err) {
      setError(errorCodeOf(err));
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    try {
      await authApi.resendRegistration(email);
      return { ok: true };
    } catch (err) {
      setError(errorCodeOf(err));
      return {
        ok: false,
        retryAfterSeconds: err instanceof ApiError ? err.retryAfterSeconds : undefined,
      };
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[formStyles.screen, formStyles.centered]}
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="headlineMedium" style={formStyles.title}>
        {t("auth.verifyEmail.title")}
      </Text>
      <Text>{t("auth.verifyEmail.sentTo", { email })}</Text>
      <CodeInput label={t("auth.verifyEmail.codeLabel")} onComplete={verify} disabled={pending} />
      <ErrorText code={error} />
      <ResendButton onResend={resend} />
      <AppButton
        mode="text"
        onPress={() => router.replace({ pathname: "/register", params: { email } })}
      >
        {t("auth.verifyEmail.correctEmail")}
      </AppButton>
    </ScrollView>
  );
}
