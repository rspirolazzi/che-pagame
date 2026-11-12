import { useTheme } from "react-native-paper";

import type { AppTheme } from "./index";

/** Stack header and background from the identity (titles in the brand typeface). */
export function useStackOptions() {
  const theme = useTheme<AppTheme>();
  return {
    headerStyle: { backgroundColor: theme.colors.background },
    headerTintColor: theme.colors.onBackground,
    headerTitleStyle: {
      fontFamily: theme.fonts.titleLarge.fontFamily,
      fontWeight: theme.fonts.titleLarge.fontWeight,
    },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: theme.colors.background },
  } as const;
}
