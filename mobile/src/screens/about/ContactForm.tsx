import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import { Checkbox, HelperText, Text, TextInput } from "react-native-paper";

import { AppButton } from "../../components/AppButton";
import { ErrorText } from "../../components/FormBits";
import { TurnstileGate, useBotCheck } from "../../components/TurnstileGate";
import { useAuth } from "../../hooks/useAuth";
import { contactApi } from "../../services/api/contact";
import { type ApiErrorCode, errorCodeOf } from "../../services/api/types";
import { displayName } from "../../utils/displayName";
import { validateEmail } from "../../utils/validation";

const NAME_MAX = 100;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;

type FieldError = "nameRequired" | "emailInvalid" | "messageTooShort" | "consentRequired";

/**
 * Contact form in the App (feature 017, US1): the same fields, explicit consent and anti-bot
 * check as the web. Name and email come from the profile (FR-010); what was typed is kept when
 * sending fails.
 */
export function ContactForm() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { required: botCheckRequired } = useBotCheck();
  const [name, setName] = useState(user ? displayName(user) : "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<FieldError | null>(null);
  const [error, setError] = useState<ApiErrorCode | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const sending = useRef(false);
  const webBase = (process.env.EXPO_PUBLIC_WEB_BASE_URL ?? "").replace(/\/$/, "");

  function validate(): FieldError | null {
    if (!name.trim()) return "nameRequired";
    if (validateEmail(email)) return "emailInvalid";
    if (message.trim().length < MESSAGE_MIN) return "messageTooShort";
    if (!consent) return "consentRequired";
    return null;
  }

  async function submit() {
    if (sending.current) return;
    const problem = validate();
    setFieldError(problem);
    setError(null);
    if (problem) return;
    sending.current = true;
    setPending(true);
    try {
      await contactApi.send({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        language: i18n.language,
        consent,
        turnstileToken: token,
      });
      setSent(true);
    } catch (err) {
      setError(errorCodeOf(err));
      setToken(null);
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  if (sent) {
    return <Text accessibilityRole="alert">{t("contact.form.sent")}</Text>;
  }

  return (
    <>
      <Text variant="titleMedium" accessibilityRole="header">
        {t("contact.form.title")}
      </Text>
      <TextInput
        mode="outlined"
        label={t("contact.form.name")}
        accessibilityLabel={t("contact.form.name")}
        maxLength={NAME_MAX}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        mode="outlined"
        label={t("contact.form.email")}
        accessibilityLabel={t("contact.form.email")}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        mode="outlined"
        label={t("contact.form.message")}
        accessibilityLabel={t("contact.form.message")}
        multiline
        numberOfLines={5}
        maxLength={MESSAGE_MAX}
        value={message}
        onChangeText={setMessage}
      />
      <Text variant="bodySmall">
        {t("contact.form.remaining", { count: MESSAGE_MAX - message.length })}
      </Text>
      <Checkbox.Item
        label={t("contact.form.consent")}
        labelVariant="bodyMedium"
        labelStyle={{ textAlign: "left" }}
        position="leading"
        status={consent ? "checked" : "unchecked"}
        onPress={() => setConsent((value) => !value)}
      />
      {botCheckRequired && <TurnstileGate onToken={setToken} />}
      {fieldError && (
        <HelperText type="error" visible accessibilityRole="alert">
          {t(`contact.form.errors.${fieldError}`)}
        </HelperText>
      )}
      <ErrorText code={error} />
      {error === "contact_unavailable" && webBase !== "" && (
        <AppButton mode="text" onPress={() => void Linking.openURL(`${webBase}/contact`)}>
          {t("pages.contact.write")}
        </AppButton>
      )}
      <AppButton
        mode="contained"
        loading={pending}
        disabled={pending || (botCheckRequired === true && token === null)}
        onPress={submit}
      >
        {pending ? t("contact.form.sending") : t("contact.form.send")}
      </AppButton>
    </>
  );
}
