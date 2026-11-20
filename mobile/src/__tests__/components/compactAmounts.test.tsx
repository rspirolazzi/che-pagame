import { screen } from "@testing-library/react-native";

import { AmountText } from "@/components/AmountText";
import { Money, MoneyWithExact } from "@/components/Money";
import i18n from "@/i18n";

import { renderScreen } from "../support/render";

const plain = (text: string) => text.replace(/[\u00a0\u202f]/g, " ");

beforeEach(async () => {
  await i18n.changeLanguage("es");
});

it("shows a large amount compact with the exact one as accessible name (feature 016)", () => {
  renderScreen(<Money amount="10000000.00" currency="ARS" decimals={2} locale="es" />);
  const node = screen.getByText(/^10\sM\sARS$/);
  expect(plain(node.props.accessibilityLabel)).toBe("10.000.000,00 ARS");
});

it("keeps amounts below 10,000 exact", () => {
  renderScreen(<Money amount="9500.00" currency="ARS" decimals={2} locale="es" />);
  expect(screen.getByText(/^9500,00\sARS$/)).toBeOnTheScreen();
});

it("a balance keeps its words and sign, compact, with the exact sentence", () => {
  renderScreen(<AmountText amount="-2300000.00" currency="ARS" decimals={2} locale="es" />);
  const node = screen.getByText(/^Debés 2,3\sM\sARS$/);
  expect(plain(node.props.accessibilityLabel)).toBe("Debés 2.300.000,00 ARS");
  expect(screen.getByLabelText("En contra")).toBeOnTheScreen();
});

it("the detail shows the compact amount and the exact one below (FR-006)", () => {
  renderScreen(<MoneyWithExact amount="10000000.00" currency="ARS" decimals={2} locale="es" />);
  expect(screen.getByText(/^10\sM\sARS$/)).toBeOnTheScreen();
  expect(screen.getByText(/^10\.000\.000,00\sARS$/)).toBeOnTheScreen();
});
