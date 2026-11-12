import { router } from "expo-router";
import Stack from "expo-router/js-stack";
import Tabs from "expo-router/js-tabs";
import { act, fireEvent, renderRouter, screen, waitFor, within } from "expo-router/testing-library";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { Text } from "react-native";
import { PaperProvider } from "react-native-paper";

import { AppTabBar } from "@/components/AppTabBar";
import i18n from "@/i18n";
import { lightTheme } from "@/theme";

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <PaperProvider theme={lightTheme}>{children}</PaperProvider>
    </I18nextProvider>
  );
}

function page(label: string) {
  function Page() {
    return <Text>{label}</Text>;
  }
  return Page;
}

/** Same shape as app/(app): tabs with an accounts stack, full-screen forms outside the tabs. */
const routes = {
  "(app)/_layout": () => <Stack screenOptions={{ headerShown: false }} />,
  "(app)/(tabs)/_layout": () => (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="accounts" />
      <Tabs.Screen name="profile" />
    </Tabs>
  ),
  "(app)/(tabs)/index": page("Dashboard screen"),
  "(app)/(tabs)/profile": page("Profile screen"),
  "(app)/(tabs)/accounts/_layout": () => <Stack screenOptions={{ headerShown: false }} />,
  "(app)/(tabs)/accounts/index": page("Accounts screen"),
  "(app)/(tabs)/accounts/[accountId]/index": page("Account screen"),
  "(app)/accounts/[accountId]/expenses/new": page("New expense screen"),
};

beforeEach(async () => {
  await i18n.changeLanguage("es");
});

/** Paper ignores touches on the bar until it is measured; Jest has no layout pass. */
function pressTab(name: string) {
  fireEvent(screen.getByTestId("bottom-navigation-bar"), "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 80 } },
  });
  fireEvent.press(screen.getByTestId(`tab-${name}`));
}

it("shows Inicio, Cuentas and Perfil and marks the active one (FR-014b)", () => {
  renderRouter(routes, { initialUrl: "/", wrapper: Wrapper });
  expect(screen.getByText("Dashboard screen")).toBeOnTheScreen();
  for (const [id, label] of [
    ["index", "Inicio"],
    ["accounts", "Cuentas"],
    ["profile", "Perfil"],
  ]) {
    const tab = screen.getByTestId(`tab-${id}`);
    expect(tab.props.accessibilityLabel).toBe(label);
    expect(within(tab).getAllByText(label).length).toBeGreaterThan(0);
  }
  expect(screen.getByTestId("tab-index").props.accessibilityState).toMatchObject({
    selected: true,
  });
  expect(screen.getByTestId("tab-profile").props.accessibilityState).toMatchObject({
    selected: false,
  });
});

it("navigates between destinations", async () => {
  const view = renderRouter(routes, { initialUrl: "/", wrapper: Wrapper });
  pressTab("profile");
  await waitFor(() => expect(view.getPathname()).toBe("/profile"));
  expect(screen.getByText("Profile screen")).toBeOnTheScreen();
  pressTab("accounts");
  await waitFor(() => expect(view.getPathname()).toBe("/accounts"));
});

it("keeps the URL of an account inside the tabs (R5)", () => {
  const view = renderRouter(routes, { initialUrl: "/accounts/a1", wrapper: Wrapper });
  expect(screen.getByText("Account screen")).toBeOnTheScreen();
  expect(view.getSegments()).toContain("(tabs)");
  expect(screen.getByTestId("tab-accounts")).toBeOnTheScreen();
});

it("opens the new expense form outside the tabs, without the bar (R5)", () => {
  const view = renderRouter(routes, {
    initialUrl: "/accounts/a1/expenses/new",
    wrapper: Wrapper,
  });
  expect(screen.getByText("New expense screen")).toBeOnTheScreen();
  expect(view.getSegments()).not.toContain("(tabs)");
  expect(screen.queryByTestId("tab-accounts")).toBeNull();
});

it("pressing the active tab goes back to its main screen", async () => {
  const view = renderRouter(routes, { initialUrl: "/accounts", wrapper: Wrapper });
  act(() => router.push("/accounts/a1"));
  expect(screen.getByText("Account screen")).toBeOnTheScreen();
  pressTab("accounts");
  await waitFor(() => expect(view.getPathname()).toBe("/accounts"));
});
