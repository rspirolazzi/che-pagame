import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import type { AppTheme } from "../theme";
import { AppButton } from "./AppButton";
import { StatusNotice } from "./StatusNotice";

/**
 * "Apoyá ChePagame" (feature 008): one sentence and a button that opens the donation page in the
 * system browser. Nothing is rendered without a configured https link (FR-002), and a link that
 * cannot be opened shows an error instead of failing silently (FR-011).
 */
export function DonateSection({ url }: { url: string | null }) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const [failed, setFailed] = useState(false);
  if (!url) return null;

  async function open(link: string) {
    setFailed(false);
    try {
      await Linking.openURL(link);
    } catch {
      setFailed(true);
    }
  }

  return (
    <View style={{ gap: theme.custom.spacing.md }}>
      <Text variant="bodyMedium">{t("donate.body")}</Text>
      <AppButton
        mode="outlined"
        icon="heart-outline"
        accessibilityHint={t("donate.opensBrowser")}
        onPress={() => void open(url)}
      >
        {t("donate.button")}
      </AppButton>
      {failed && <StatusNotice kind="error">{t("donate.openError")}</StatusNotice>}
    </View>
  );
}
