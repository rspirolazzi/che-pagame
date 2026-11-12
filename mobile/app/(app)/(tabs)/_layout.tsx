import Tabs from "expo-router/js-tabs";
import { useTheme } from "react-native-paper";

import { AppTabBar } from "../../../src/components/AppTabBar";

/** Bottom bar with Inicio, Cuentas and Perfil (constitution "Panel Principal", FR-014b). */
export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="accounts" />
      <Tabs.Screen name="profile" />
      {/* "Unirme con un código" keeps its /join URL and the bar, without a tab of its own. */}
      <Tabs.Screen name="join" options={{ href: null }} />
    </Tabs>
  );
}
