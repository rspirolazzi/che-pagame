import { Stack } from "expo-router";

import { useAuth } from "../../src/hooks/useAuth";
import { useStackOptions } from "../../src/theme/navigation";

/**
 * A user without a default currency only sees the onboarding (FR-020a). The bottom bar lives in
 * the (tabs) group; full-screen forms stay here so they never show it (feature 006, FR-014b).
 */
export default function AppLayout() {
  const { user } = useAuth();
  const stackOptions = useStackOptions();
  const needsCurrency = user?.preferences.defaultCurrency == null;

  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Protected guard={needsCurrency}>
        <Stack.Screen name="onboarding-currency" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!needsCurrency}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* The expense form draws its own header with back and the title. */}
        <Stack.Screen name="accounts/[accountId]/new-expense" options={{ headerShown: false }} />
        <Stack.Screen
          name="accounts/[accountId]/expenses/[expenseId]/edit"
          options={{ headerShown: false }}
        />
        {/* The screen shows its own title; the header keeps only the back button. */}
        <Stack.Screen name="accounts/[accountId]/settlements/new" options={{ title: "" }} />
        <Stack.Screen
          name="accounts/[accountId]/settlements/[settlementId]"
          options={{ title: "" }}
        />
        <Stack.Screen name="delete-account" options={{ title: "" }} />
        {/* "Acerca de" (feature 011): each screen shows its own title. */}
        <Stack.Screen name="about/index" options={{ title: "" }} />
        <Stack.Screen name="about/how-it-works" options={{ title: "" }} />
        <Stack.Screen name="about/who-we-are" options={{ title: "" }} />
        <Stack.Screen name="about/contact" options={{ title: "" }} />
        <Stack.Screen name="about/faq" options={{ title: "" }} />
      </Stack.Protected>
    </Stack>
  );
}
