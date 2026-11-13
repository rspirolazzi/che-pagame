import { screen } from "@testing-library/react";

import { AmountText } from "@/components/ui/AmountText";

import { renderWithIntl } from "../support/render";

const ars = { currency: "ARS", decimals: 2 };

it("shows a positive balance with sign, words, accessible badge and color (FR-009)", () => {
  renderWithIntl(<AmountText amount="60.00" {...ars} />);
  const text = screen.getByText(/Te deben\s+60,00/);
  expect(text).toBeInTheDocument();
  expect(screen.getByText("+")).toBeInTheDocument();
  expect(screen.getByLabelText("A favor")).toBeInTheDocument();
  expect(text.closest(".amount")).toHaveClass("amount-positive");
});

it("uses the other participant's words with subject other", () => {
  renderWithIntl(<AmountText amount="30.00" subject="other" {...ars} />);
  expect(screen.getByText(/Le deben\s+30,00/)).toBeInTheDocument();
});

it("shows a negative balance with the minus sign and the debt color", () => {
  renderWithIntl(<AmountText amount="-12.50" {...ars} />);
  const text = screen.getByText(/Debés\s+12,50/);
  expect(screen.getByText("−")).toBeInTheDocument();
  expect(screen.getByLabelText("En contra")).toBeInTheDocument();
  expect(text.closest(".amount")).toHaveClass("amount-negative");
});

it("shows a settled balance in a neutral style", () => {
  renderWithIntl(<AmountText amount="0.00" subject="other" {...ars} />);
  const text = screen.getByText("Al día");
  expect(screen.getByLabelText("Al día")).toBeInTheDocument();
  expect(text.closest(".amount")).toHaveClass("amount-neutral");
});

it("shows only the signed amount with subject none (totals)", () => {
  renderWithIntl(<AmountText amount="-5.00" subject="none" currency="USD" decimals={2} />);
  expect(screen.getByText(/5,00/)).toBeInTheDocument();
  expect(screen.queryByText(/Debés/)).not.toBeInTheDocument();
});
