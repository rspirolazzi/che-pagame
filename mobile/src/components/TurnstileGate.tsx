import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { publicConfigApi } from "../services/api/contact";
import type { AppTheme } from "../theme";

/** Whether the API asks for the check (production) and the web page that shows it. */
export function useBotCheck(): { required: boolean | null } {
  const [required, setRequired] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    publicConfigApi
      .get()
      .then((config) => active && setRequired(Boolean(config.turnstileSiteKey)))
      // Unknown: let the API decide; it rejects a missing token in production.
      .catch(() => active && setRequired(false));
    return () => {
      active = false;
    };
  }, []);
  return { required };
}

function webBase(): string {
  return (process.env.EXPO_PUBLIC_WEB_BASE_URL ?? "").replace(/\/$/, "");
}

/**
 * Cloudflare Turnstile inside the App (feature 017, research R7): a small WebView with the web's
 * /turnstile page, because Cloudflare only accepts the site's own domain. Only messages from that
 * page are trusted.
 */
export function TurnstileGate({ onToken }: { onToken: (token: string | null) => void }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme<AppTheme>();
  const [failed, setFailed] = useState(false);
  const base = webBase();
  if (!base) {
    return <Text style={styles.error}>{t("botCheck.failed")}</Text>;
  }
  const uri = `${base}/turnstile?lang=${i18n.language}&theme=${theme.dark ? "dark" : "light"}`;

  function onMessage(event: WebViewMessageEvent) {
    if (!event.nativeEvent.url.startsWith(`${base}/turnstile`)) return;
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type: string; token?: string | null };
      if (message.type === "token") {
        setFailed(false);
        onToken(message.token ?? null);
      } else {
        onToken(null);
        if (message.type === "error") setFailed(true);
      }
    } catch {
      onToken(null);
    }
  }

  return (
    <View style={styles.box} accessibilityLabel={t("contact.form.waitingCheck")}>
      <WebView
        source={{ uri }}
        originWhitelist={[`${base}/*`]}
        onMessage={onMessage}
        onError={() => setFailed(true)}
        startInLoadingState
        renderLoading={() => <ActivityIndicator />}
        style={styles.webview}
      />
      {failed && <Text style={styles.error}>{t("botCheck.failed")}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { minHeight: 80 },
  webview: { height: 80, backgroundColor: "transparent" },
  error: { marginTop: 4 },
});
