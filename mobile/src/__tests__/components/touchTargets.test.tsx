import Tabs from "expo-router/js-tabs";
import { renderRouter, screen } from "expo-router/testing-library";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { StyleSheet, Text } from "react-native";
import { BottomNavigation, Button, PaperProvider } from "react-native-paper";

import { AppButton } from "@/components/AppButton";
import { AppTabBar } from "@/components/AppTabBar";
import i18n from "@/i18n";
import { lightTheme, tokens } from "@/theme";

import { renderScreen } from "../support/render";

const MIN = tokens.size.touchTarget;

it("AppButton is at least 48 dp tall in every mode (FR-018)", () => {
  renderScreen(
    <>
      <AppButton mode="contained">Guardar</AppButton>
      <AppButton mode="text" tone="danger" contentStyle={{ paddingHorizontal: 4 }}>
        Eliminar
      </AppButton>
    </>,
  );
  for (const button of screen.UNSAFE_getAllByType(Button)) {
    expect(StyleSheet.flatten(button.props.contentStyle).minHeight).toBeGreaterThanOrEqual(MIN);
  }
  expect(MIN).toBe(48);
});

it("the danger tone paints the label with the error color", () => {
  renderScreen(<AppButton tone="danger">Eliminar</AppButton>);
  expect(screen.UNSAFE_getByType(Button).props.textColor).toBe(lightTheme.colors.error);
});

it("the bottom bar is at least 48 dp tall (FR-018)", () => {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={lightTheme}>{children}</PaperProvider>
      </I18nextProvider>
    );
  }
  renderRouter(
    {
      _layout: () => <Tabs tabBar={(props) => <AppTabBar {...props} />} />,
      index: () => <Text>Home</Text>,
    },
    { initialUrl: "/", wrapper: Wrapper },
  );
  const bar = screen.UNSAFE_getByType(BottomNavigation.Bar);
  expect(StyleSheet.flatten(bar.props.style).minHeight).toBeGreaterThanOrEqual(MIN);
});
