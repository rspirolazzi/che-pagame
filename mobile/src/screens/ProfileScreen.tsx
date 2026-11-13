import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";

import { AppButton } from "../components/AppButton";
import { CurrencyPicker } from "../components/CurrencyPicker";
import { DonateSection } from "../components/DonateSection";
import { ExportButton } from "../components/exports/ExportButton";
import { CodeInput, ErrorText } from "../components/FormBits";
import { Screen } from "../components/Screen";
import { useAuth } from "../hooks/useAuth";
import { usePreferences } from "../hooks/usePreferences";
import { exportsApi } from "../services/api/exports";
import { type ApiErrorCode, errorCodeOf } from "../services/api/types";
import { usersApi } from "../services/api/users";
import type { AppTheme } from "../theme";
import { displayName } from "../utils/displayName";
import { parseDonationUrl } from "../utils/donation";
import { validateEmail, validateName } from "../utils/validation";

// Feature 008: embedded at build time; empty in store builds (Google Play, App Store).
const donationUrl = parseDonationUrl(process.env.EXPO_PUBLIC_DONATION_URL);

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, setUser, logout } = useAuth();
  const prefs = usePreferences();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [newEmail, setNewEmail] = useState("");
  const [emailStep, setEmailStep] = useState<"email" | "code" | "done">("email");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<ApiErrorCode | null>(null);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  async function saveNames() {
    setSaved(false);
    setError(null);
    const problem = validateName(firstName) ?? validateName(lastName);
    setMessage(problem ? `validation.${problem}` : null);
    if (problem) return;
    try {
      // An emptied field is sent as null, which clears it.
      setUser(
        await usersApi.updateMe({
          firstName: firstName.trim() || null,
          lastName: lastName.trim() || null,
        }),
      );
      setSaved(true);
    } catch (err) {
      setError(errorCodeOf(err));
    }
  }

  async function requestEmailChange() {
    setError(null);
    const problem = validateEmail(newEmail);
    setMessage(problem ? `validation.${problem}` : null);
    if (problem) return;
    try {
      await usersApi.requestEmailChange(newEmail.trim());
      setEmailStep("code");
    } catch (err) {
      setError(errorCodeOf(err));
    }
  }

  async function confirmEmailChange(code: string) {
    setError(null);
    try {
      setUser(await usersApi.confirmEmailChange(code));
      setEmailStep("done");
    } catch (err) {
      setError(errorCodeOf(err));
    }
  }

  return (
    <Screen>
      <View>
        <Text variant="headlineMedium" accessibilityRole="header">
          {t("profile.title")}
        </Text>
        <Text variant="titleMedium">{displayName(user)}</Text>
      </View>

      <Section title={t("profile.personal")}>
        <TextInput
          mode="outlined"
          label={t("profile.firstName")}
          accessibilityLabel={t("profile.firstName")}
          maxLength={60}
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          mode="outlined"
          label={t("profile.lastName")}
          accessibilityLabel={t("profile.lastName")}
          maxLength={60}
          value={lastName}
          onChangeText={setLastName}
        />
        <AppButton mode="contained" onPress={saveNames}>
          {t("common.save")}
        </AppButton>
        {saved && <Text>{t("profile.saved")}</Text>}
      </Section>

      <Section title={t("profile.preferences")}>
        <Text>{t("profile.language")}</Text>
        <SegmentedButtons
          value={user.preferences.language}
          onValueChange={(value) => prefs.setLanguage(value as "es" | "en")}
          buttons={[
            { value: "es", label: t("profile.languages.es") },
            { value: "en", label: t("profile.languages.en") },
          ]}
        />
        <Text>{t("profile.theme")}</Text>
        <SegmentedButtons
          value={user.preferences.theme}
          onValueChange={(value) => prefs.setTheme(value as "light" | "dark" | "system")}
          buttons={[
            { value: "light", label: t("profile.themes.light") },
            { value: "dark", label: t("profile.themes.dark") },
            { value: "system", label: t("profile.themes.system") },
          ]}
        />
        <Text>{t("profile.currency")}</Text>
        <CurrencyPicker
          label={t("profile.currency")}
          value={user.preferences.defaultCurrency ?? null}
          onChange={prefs.setCurrency}
        />
        <ErrorText code={prefs.error} />
      </Section>

      <Section title={t("profile.email")}>
        <Text>
          {t("profile.currentEmail")}: {user.email}
        </Text>
        {emailStep === "email" && (
          <>
            <TextInput
              mode="outlined"
              label={t("profile.newEmail")}
              accessibilityLabel={t("profile.newEmail")}
              autoCapitalize="none"
              keyboardType="email-address"
              value={newEmail}
              onChangeText={setNewEmail}
            />
            <AppButton mode="outlined" onPress={requestEmailChange}>
              {t("profile.sendCode")}
            </AppButton>
          </>
        )}
        {emailStep === "code" && (
          <>
            <Text>{t("profile.codeSentTo", { email: newEmail.trim() })}</Text>
            <CodeInput label={t("profile.codeLabel")} onComplete={confirmEmailChange} />
          </>
        )}
        {emailStep === "done" && <Text>{t("profile.emailChanged", { email: user.email })}</Text>}
        <ErrorText messageKey={message} />
        <ErrorText code={error} />
      </Section>

      <Section title={t("exports.mineTitle")}>
        <Text variant="bodySmall">{t("exports.mineHint")}</Text>
        <ExportButton run={exportsApi.mine} label={t("exports.mineButton")} />
      </Section>

      {donationUrl && (
        <Section title={t("donate.title")}>
          <DonateSection url={donationUrl} />
        </Section>
      )}

      <AppButton mode="text" tone="danger" icon="logout" onPress={logout}>
        {t("auth.logout")}
      </AppButton>
    </Screen>
  );
}

/** A titled card of the profile (feature 006 mockup). */
function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme<AppTheme>();
  const { spacing, radius } = theme.custom;
  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
      <Text variant="titleMedium" accessibilityRole="header">
        {title}
      </Text>
      <View
        style={{
          gap: spacing.md,
          padding: spacing.lg,
          borderWidth: 1,
          borderRadius: radius.md,
          borderColor: theme.colors.outlineVariant,
          backgroundColor: theme.colors.surface,
        }}
      >
        {children}
      </View>
    </View>
  );
}
