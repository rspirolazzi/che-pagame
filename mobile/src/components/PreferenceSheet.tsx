import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Dialog, IconButton, Portal, SegmentedButtons, Text } from "react-native-paper";

import type { Language } from "../i18n";
import type { ThemeName } from "../services/api/types";
import { setDevicePreferences, useDevicePreferences } from "../services/devicePreferences";
import { AppButton } from "./AppButton";

/**
 * "Idioma y tema" on the screens without a session (feature 014, US4): a button in the corner
 * that opens both choices. They apply at once and stay on this device.
 */
export function PreferenceSheet() {
  const { t } = useTranslation();
  const prefs = useDevicePreferences();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.corner}>
      <IconButton
        icon="translate"
        mode="outlined"
        accessibilityLabel={t("preferences.open")}
        onPress={() => setOpen(true)}
      />
      <Portal>
        <Dialog visible={open} onDismiss={() => setOpen(false)}>
          <Dialog.Title>{t("preferences.open")}</Dialog.Title>
          <Dialog.Content style={styles.content}>
            <Text variant="labelLarge">{t("profile.language")}</Text>
            <SegmentedButtons
              value={prefs.language}
              onValueChange={(value) => setDevicePreferences({ language: value as Language })}
              buttons={[
                { value: "es", label: t("profile.languages.es") },
                { value: "en", label: t("profile.languages.en") },
              ]}
            />
            <Text variant="labelLarge">{t("profile.theme")}</Text>
            <SegmentedButtons
              value={prefs.theme}
              onValueChange={(value) => setDevicePreferences({ theme: value as ThemeName })}
              buttons={[
                { value: "light", label: t("profile.themes.light") },
                { value: "dark", label: t("profile.themes.dark") },
                { value: "system", label: t("profile.themes.system") },
              ]}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <AppButton onPress={() => setOpen(false)}>{t("accounts.dialogs.continue")}</AppButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  corner: { alignSelf: "flex-end" },
  content: { gap: 12 },
});
