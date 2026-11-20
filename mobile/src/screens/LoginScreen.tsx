import { Link } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";

import { AppButton } from "../components/AppButton";
import { PreferenceSheet } from "../components/PreferenceSheet";
import { ErrorText, formStyles } from "../components/FormBits";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { Logo } from "../components/Logo";
import { StatusNotice } from "../components/StatusNotice";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../services/api/auth";
import { ApiError, type ApiErrorCode, errorCodeOf } from "../services/api/types";
import { validateEmail } from "../utils/validation";

export default function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { signInWithTokens, sessionExpired, accountDeleted } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ApiErrorCode | null>(null);
  const [message, setMessage] = useState<string | null>(
    sessionExpired ? "auth.sessionExpired" : null,
  );
  const [lockedMinutes, setLockedMinutes] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setError(null);
    setMessage(null);
    setLockedMinutes(null);
    if (validateEmail(email)) {
      setMessage("validation.emailInvalid");
      return;
    }
    setPending(true);
    try {
      await signInWithTokens(await authApi.loginWithPassword(email.trim(), password));
    } catch (err) {
      if (err instanceof ApiError && err.code === "password_login_locked") {
        setLockedMinutes(Math.max(1, Math.ceil((err.retryAfterSeconds ?? 900) / 60)));
      } else {
        setError(errorCodeOf(err));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[formStyles.screen, formStyles.centered]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Language and theme without a session (feature 014). */}
      <PreferenceSheet />
      <View style={styles.brand}>
        <Logo />
        <Text
          variant="titleMedium"
          style={[styles.center, { color: theme.colors.onSurfaceVariant }]}
        >
          {t("common.slogan")}
        </Text>
      </View>
      {accountDeleted && <StatusNotice kind="info">{t("deleteAccount.done")}</StatusNotice>}
      <Text variant="titleLarge" accessibilityRole="header" style={formStyles.title}>
        {t("auth.login.title")}
      </Text>
      <GoogleSignInButton onMessage={setMessage} />
      <Text style={[styles.center, { color: theme.colors.onSurfaceVariant }]}>
        {t("mobile.orUseEmail")}
      </Text>
      <TextInput
        mode="outlined"
        label={t("common.email")}
        accessibilityLabel={t("common.email")}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        mode="outlined"
        label={t("common.password")}
        accessibilityLabel={t("common.password")}
        secureTextEntry
        autoComplete="current-password"
        value={password}
        onChangeText={setPassword}
      />
      <ErrorText messageKey={message} />
      {lockedMinutes !== null && (
        <Text accessibilityRole="alert">
          {t("auth.login.lockedMinutes", { count: lockedMinutes })}
        </Text>
      )}
      <ErrorText code={error} />
      <AppButton mode="contained" loading={pending} disabled={pending} onPress={submit}>
        {t("auth.login.submit")}
      </AppButton>
      <Link href="/login-code">{t("auth.login.useCode")}</Link>
      <Link href="/forgot-password">{t("auth.login.forgot")}</Link>
      <Link href="/register">
        {t("auth.login.noAccount")} {t("auth.login.register")}
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: "center", gap: 8, marginBottom: 16 },
  center: { textAlign: "center" },
});
