import { Platform } from "react-native";
import { configureFonts, MD3LightTheme } from "react-native-paper";

import { tokens } from "./tokens.generated";

type Weight = "semibold" | "bold";

/**
 * The brand typeface is embedded as static files (one family per weight), so the weight comes from
 * the family name and `fontWeight` stays normal: Android would otherwise fake a bolder weight.
 */
export function brandFont(weight: Weight): {
  fontFamily?: string;
  fontWeight: "normal" | "600" | "700";
} {
  const family: string = tokens.typography.brandWeights[weight];
  if (!family) return { fontWeight: weight === "bold" ? "700" : "600" };
  return { fontFamily: family, fontWeight: "normal" };
}

const systemFamily = Platform.select({ ios: "System", default: "sans-serif" });

function brand(weight: Weight) {
  const font = brandFont(weight);
  return { fontFamily: font.fontFamily ?? systemFamily, fontWeight: font.fontWeight };
}

const { scale } = tokens.typography;
const base = MD3LightTheme.fonts;

/** Paper's MD3 type scale: brand for display, headline and title; system for body and labels. */
export const fonts = configureFonts({
  config: {
    displayLarge: { ...base.displayLarge, ...brand("bold") },
    displayMedium: { ...base.displayMedium, ...brand("bold") },
    displaySmall: {
      ...base.displaySmall,
      ...brand("bold"),
      fontSize: scale.display.size,
      lineHeight: scale.display.lineHeight,
    },
    headlineLarge: { ...base.headlineLarge, ...brand("bold") },
    headlineMedium: {
      ...base.headlineMedium,
      ...brand("bold"),
      fontSize: scale.headline.size,
      lineHeight: scale.headline.lineHeight,
    },
    headlineSmall: { ...base.headlineSmall, ...brand("bold") },
    titleLarge: {
      ...base.titleLarge,
      ...brand("semibold"),
      fontSize: scale.title.size,
      lineHeight: scale.title.lineHeight,
    },
    titleMedium: { ...base.titleMedium, ...brand("semibold") },
    titleSmall: { ...base.titleSmall, ...brand("semibold") },
  },
});
