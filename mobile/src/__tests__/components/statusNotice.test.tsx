import { fireEvent, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { StatusNotice } from "@/components/StatusNotice";
import { lightTheme } from "@/theme";

import { renderScreen } from "../support/render";

it.each([
  ["warning", "Aviso", lightTheme.custom.warning],
  ["error", "Error", lightTheme.colors.error],
  ["readOnly", "Solo lectura", lightTheme.colors.onSurfaceVariant],
  ["info", "Información", lightTheme.colors.primary],
] as const)("%s shows an icon, the text and its color (FR-009, FR-010)", (kind, label, color) => {
  renderScreen(<StatusNotice kind={kind}>Pendiente de asignación</StatusNotice>);
  expect(screen.getByText("Pendiente de asignación")).toBeOnTheScreen();
  expect(screen.getByLabelText(label)).toBeOnTheScreen();
  expect(StyleSheet.flatten(screen.getByTestId(`notice-${kind}`).props.style).borderColor).toBe(
    color,
  );
});

it("announces errors as alerts", () => {
  renderScreen(<StatusNotice kind="error">No pudimos conectarnos.</StatusNotice>);
  expect(screen.getByRole("alert")).toBeOnTheScreen();
});

it("renders the optional action as a button", () => {
  const onPress = jest.fn();
  renderScreen(
    <StatusNotice kind="warning" action={{ label: "Completarlos en Gastos", onPress }}>
      2 gastos pendientes
    </StatusNotice>,
  );
  fireEvent.press(screen.getByRole("button", { name: "Completarlos en Gastos" }));
  expect(onPress).toHaveBeenCalledTimes(1);
});
