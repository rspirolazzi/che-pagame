import type { ComponentProps } from "react";
import { Button, useTheme } from "react-native-paper";

import type { AppTheme } from "../theme";

type AppButtonProps = ComponentProps<typeof Button> & {
  /** "danger" paints the label with the error color (destructive actions). */
  tone?: "default" | "danger";
};

/** Paper's Button with the 48 dp minimum touch target of the identity (FR-018). */
export function AppButton({ tone = "default", contentStyle, textColor, ...props }: AppButtonProps) {
  const theme = useTheme<AppTheme>();
  return (
    <Button
      {...props}
      textColor={tone === "danger" ? theme.colors.error : textColor}
      contentStyle={[{ minHeight: theme.custom.size.touchTarget }, contentStyle]}
    />
  );
}
