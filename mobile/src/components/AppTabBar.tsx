import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useTranslation } from "react-i18next";
import { BottomNavigation, useTheme } from "react-native-paper";

import type { AppTheme } from "../theme";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** The three destinations of the bottom bar (constitution "Panel Principal", FR-014b). */
export const TABS: Record<string, { label: string; icon: IconName; focusedIcon: IconName }> = {
  index: { label: "nav.tabHome", icon: "home-variant-outline", focusedIcon: "home-variant" },
  accounts: {
    label: "nav.tabAccounts",
    icon: "account-group-outline",
    focusedIcon: "account-group",
  },
  profile: {
    label: "nav.tabProfile",
    icon: "account-circle-outline",
    focusedIcon: "account-circle",
  },
};

/**
 * Paper's MD3 bottom bar for expo-router Tabs. The active destination gets the sun pill and a
 * bold label, not only a color. Pressing the active tab emits `tabPress`, so its stack goes back
 * to the main screen.
 */
export function AppTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { t } = useTranslation();
  const theme = useTheme<AppTheme>();
  // A custom bar ignores `href: null`: draw only the destinations, so routes like /join keep the
  // bar without a tab of their own. /join is reached from Cuentas, which stays active there.
  const routes = state.routes.filter((route) => TABS[route.name]);
  const focusedKey = state.routes[state.index]?.key;
  const focusedIndex = routes.findIndex((route) => route.key === focusedKey);
  const accountsIndex = routes.findIndex((route) => route.name === "accounts");
  const index = focusedIndex >= 0 ? focusedIndex : Math.max(0, accountsIndex);
  return (
    <BottomNavigation.Bar
      navigationState={{ index, routes }}
      safeAreaInsets={insets}
      activeIndicatorStyle={{ backgroundColor: theme.custom.accent }}
      activeColor={theme.custom.onAccent}
      inactiveColor={theme.colors.onSurfaceVariant}
      style={{
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outlineVariant,
        minHeight: theme.custom.size.touchTarget,
      }}
      getLabelText={({ route }) => (TABS[route.name] ? t(TABS[route.name].label) : route.name)}
      getAccessibilityLabel={({ route }) =>
        TABS[route.name] ? t(TABS[route.name].label) : route.name
      }
      getTestID={({ route }) => `tab-${route.name}`}
      renderIcon={({ route, focused, color }) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        return (
          <MaterialCommunityIcons
            name={focused ? tab.focusedIcon : tab.icon}
            size={24}
            color={color}
          />
        );
      }}
      onTabPress={({ route, preventDefault }) => {
        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });
        if (event.defaultPrevented) {
          preventDefault();
          return;
        }
        const focused = focusedKey === route.key;
        if (!focused) navigation.navigate(route.name, route.params);
      }}
    />
  );
}
