import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { useStackOptions } from "../../../../src/theme/navigation";

// A deep link to an account still has "Mis Cuentas" underneath, so back and the tab go there.
export const unstable_settings = { initialRouteName: "index" };

/** The "Cuentas" tab: list, new account, an account and its screens (with the bottom bar). */
export default function AccountsLayout() {
  const { t } = useTranslation();
  const stackOptions = useStackOptions();
  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ title: "" }} />
      <Stack.Screen name="[accountId]/index" options={{ headerShown: false }} />
      <Stack.Screen name="[accountId]/balances" options={{ headerShown: false }} />
      <Stack.Screen name="[accountId]/settings" options={{ title: t("expenses.settings") }} />
      <Stack.Screen name="[accountId]/expenses/[expenseId]/index" options={{ title: "" }} />
    </Stack>
  );
}
