import type { ReactElement, ReactNode } from "react";
import { type RefreshControlProps, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formStyles } from "./FormBits";

/**
 * Scrollable screen with the identity padding. Screens without a header (the bottom bar tabs and
 * the account screens) add the top safe area so content never sits under the status bar.
 */
export function Screen({
  children,
  withTopInset = true,
  refreshControl,
}: {
  children: ReactNode;
  withTopInset?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      contentContainerStyle={[
        formStyles.screen,
        withTopInset && { paddingTop: insets.top + formStyles.screen.padding },
      ]}
    >
      {children}
    </ScrollView>
  );
}
