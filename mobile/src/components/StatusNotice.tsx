import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import type { AppTheme } from "../theme";
import { AppButton } from "./AppButton";

type Kind = "warning" | "error" | "readOnly" | "info";

const ICONS: Record<Kind, keyof typeof MaterialCommunityIcons.glyphMap> = {
  warning: "alert-circle-outline",
  error: "alert-octagon-outline",
  readOnly: "lock-outline",
  info: "information-outline",
};

/** A state shown with an icon, words and color, never color alone (FR-009, FR-010). */
export function StatusNotice({
  kind,
  children,
  action,
}: {
  kind: Kind;
  children: ReactNode;
  action?: { label: string; onPress: () => void };
}) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  const tone = {
    warning: theme.custom.warning,
    error: theme.colors.error,
    readOnly: theme.colors.onSurfaceVariant,
    info: theme.colors.primary,
  }[kind];
  return (
    <View
      testID={`notice-${kind}`}
      // An error without an action is announced as one alert; with an action, the button stays
      // reachable on its own.
      accessible={kind === "error" && !action}
      accessibilityRole={kind === "error" ? "alert" : undefined}
      style={[
        styles.box,
        {
          borderColor: tone,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.custom.radius.md,
          padding: theme.custom.spacing.md,
          gap: theme.custom.spacing.sm,
        },
      ]}
    >
      <View style={[styles.row, { gap: theme.custom.spacing.sm }]}>
        <View accessible accessibilityLabel={t(`a11y.${kind}`)}>
          <MaterialCommunityIcons name={ICONS[kind]} size={20} color={tone} />
        </View>
        <Text variant="bodyMedium" style={styles.text}>
          {children}
        </Text>
      </View>
      {action && (
        <AppButton mode="text" compact onPress={action.onPress} style={styles.action}>
          {action.label}
        </AppButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  text: { flex: 1 },
  action: { alignSelf: "flex-start" },
});
