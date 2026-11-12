import { screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { AmountText } from "@/components/AmountText";
import { lightTheme } from "@/theme";

import { renderScreen } from "../support/render";

const ars = { currency: "ARS", decimals: 2, locale: "es" };

function colorOf(text: RegExp | string) {
  return StyleSheet.flatten(screen.getByText(text).props.style).color;
}

it("shows a positive balance with color, sign, words and an accessible icon (FR-008)", () => {
  renderScreen(<AmountText amount="60.00" {...ars} />);
  expect(screen.getByText(/Te deben 60,00 ARS/)).toBeOnTheScreen();
  expect(screen.getByText("+")).toBeOnTheScreen();
  expect(screen.getByLabelText("A favor")).toBeOnTheScreen();
  expect(colorOf(/Te deben/)).toBe(lightTheme.custom.positive);
});

it("uses the other participant's words with subject other", () => {
  renderScreen(<AmountText amount="30.00" subject="other" {...ars} />);
  expect(screen.getByText(/Le deben 30,00 ARS/)).toBeOnTheScreen();
});

it("shows a negative balance with the minus sign and the debt color", () => {
  renderScreen(<AmountText amount="-12.50" {...ars} />);
  expect(screen.getByText(/Debés 12,50 ARS/)).toBeOnTheScreen();
  expect(screen.getByText("−")).toBeOnTheScreen();
  expect(screen.getByLabelText("En contra")).toBeOnTheScreen();
  expect(colorOf(/Debés/)).toBe(lightTheme.custom.negative);
});

it("shows a settled balance in a neutral style, without positive or negative color", () => {
  renderScreen(<AmountText amount="0.00" subject="other" {...ars} />);
  expect(screen.getByText("Al día")).toBeOnTheScreen();
  expect(screen.getByLabelText("Al día")).toBeOnTheScreen();
  const color = colorOf("Al día");
  expect(color).not.toBe(lightTheme.custom.positive);
  expect(color).not.toBe(lightTheme.custom.negative);
});

it("shows only the signed amount with subject none (totals)", () => {
  renderScreen(<AmountText amount="-5.00" subject="none" {...ars} currency="USD" />);
  expect(screen.getByText(/5,00 US\$/)).toBeOnTheScreen();
  expect(screen.queryByText(/Debés/)).toBeNull();
});
