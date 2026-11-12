import { type TextStyle, useColorScheme } from "react-native";
import { MD3DarkTheme, MD3LightTheme, type MD3Theme, useTheme } from "react-native-paper";

import type { ThemeName } from "../services/api/types";
import { brandFont, fonts } from "./fonts";
import { tokens } from "./tokens.generated";

type Mode = "light" | "dark";
type Colors = (typeof tokens.color)[Mode];

/** Linear blend of two #RRGGBB colors: `weight` 0 is `a`, 1 is `b`. */
function mix(a: string, b: string, weight: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  const out = [1, 3, 5].map((i) =>
    Math.round(channel(a, i) * (1 - weight) + channel(b, i) * weight)
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${out.join("").toUpperCase()}`;
}

/** #RRGGBB plus an alpha in 0..1, as #RRGGBBAA. */
function alpha(hex: string, value: number): string {
  return `${hex}${Math.round(value * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase()}`;
}

/** Amounts use the brand typeface with tabular figures so columns line up (FR-011). */
function amountStyle(level: "amount" | "amountLarge"): TextStyle {
  const { size, lineHeight, weight } = tokens.typography.scale[level];
  return {
    fontSize: size,
    lineHeight,
    ...brandFont(weight === "700" ? "bold" : "semibold"),
    fontVariant: ["tabular-nums"],
  };
}

function custom(colors: Colors) {
  return {
    positive: colors.positive,
    negative: colors.negative,
    warning: colors.warning,
    accent: colors.accent,
    onAccent: colors.onAccent,
    border: colors.border,
    controlBorder: colors.controlBorder,
    textMuted: colors.textMuted,
    spacing: tokens.spacing,
    radius: tokens.radius,
    size: tokens.size,
    amount: amountStyle("amount"),
    amountLarge: amountStyle("amountLarge"),
  };
}

export type AppTheme = MD3Theme & { custom: ReturnType<typeof custom> };

function build(mode: Mode): AppTheme {
  const base = mode === "dark" ? MD3DarkTheme : MD3LightTheme;
  const c = tokens.color[mode];
  const inverse = tokens.color[mode === "dark" ? "light" : "dark"];
  // MD3 tints raised surfaces with the primary color; dark mode needs a stronger tint to read.
  const tint = mode === "dark" ? [0.05, 0.08, 0.11, 0.12, 0.14] : [0.03, 0.05, 0.07, 0.08, 0.1];
  return {
    ...base,
    fonts,
    // Paper multiplies roundness per component (buttons x5, cards x3): 4 gives 20 and 12.
    roundness: tokens.radius.sm / 2,
    colors: {
      ...base.colors,
      primary: c.primary,
      onPrimary: c.onPrimary,
      primaryContainer: mix(c.surface, c.primary, 0.15),
      onPrimaryContainer: c.text,
      secondary: c.primary,
      onSecondary: c.onPrimary,
      secondaryContainer: c.accent,
      onSecondaryContainer: c.onAccent,
      tertiary: c.primary,
      onTertiary: c.onPrimary,
      tertiaryContainer: mix(c.surface, c.primary, 0.15),
      onTertiaryContainer: c.text,
      background: c.background,
      onBackground: c.text,
      surface: c.surface,
      onSurface: c.text,
      surfaceVariant: mix(c.surface, c.border, 0.5),
      onSurfaceVariant: c.textMuted,
      surfaceDisabled: alpha(c.text, 0.12),
      onSurfaceDisabled: alpha(c.text, 0.38),
      error: c.negative,
      onError: c.onPrimary,
      errorContainer: mix(c.surface, c.negative, 0.15),
      onErrorContainer: c.text,
      outline: c.controlBorder,
      outlineVariant: c.border,
      inverseSurface: inverse.surface,
      inverseOnSurface: inverse.text,
      inversePrimary: inverse.primary,
      scrim: c.scrim,
      backdrop: alpha(c.scrim, 0.4),
      elevation: {
        level0: "transparent",
        level1: mix(c.surface, c.primary, tint[0]),
        level2: mix(c.surface, c.primary, tint[1]),
        level3: mix(c.surface, c.primary, tint[2]),
        level4: mix(c.surface, c.primary, tint[3]),
        level5: mix(c.surface, c.primary, tint[4]),
      },
    },
    custom: custom(c),
  };
}

export const lightTheme = build("light");
export const darkTheme = build("dark");

/** Theme for the user's preference; `system` follows the device (FR-006). */
export function useAppTheme(preference: ThemeName | undefined): AppTheme {
  const scheme = useColorScheme();
  const effective = !preference || preference === "system" ? scheme : preference;
  return effective === "dark" ? darkTheme : lightTheme;
}

/** Identity colors and sizes Paper does not have (positive, warning, spacing...). */
export function useAppColors(): AppTheme["custom"] {
  return useTheme<AppTheme>().custom;
}

export { tokens };
