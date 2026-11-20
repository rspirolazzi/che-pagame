import { screen } from "@testing-library/react";

import { ExpenseDetail } from "@/components/expenses/ExpenseDetail";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { AmountText } from "@/components/ui/AmountText";
import { Money } from "@/components/ui/Money";

import { makeAccount, makeExpense, makeListItem } from "../support/accounts";
import { renderWithIntl } from "../support/render";

jest.mock("next/navigation", () => ({ useRouter: () => require("../support/mocks").router }));
jest.mock("@/app/actions/expenses", () => ({
  loadMoreMovementsAction: jest.fn(),
  deleteExpenseAction: jest.fn(),
}));

const plain = (text: string | null) => (text ?? "").replace(/[\u00a0\u202f]/g, " ");

describe("Money (feature 016, US1 and US2)", () => {
  it("shows a large amount compact, with the exact one as name and tooltip", () => {
    const { container } = renderWithIntl(
      <Money amount="10000000.00" currency="ARS" decimals={2} />,
    );
    const money = container.querySelector("span[aria-label]") as HTMLElement;
    expect(plain(money.textContent)).toBe("10 M ARS");
    expect(plain(money.getAttribute("aria-label"))).toBe("10.000.000,00 ARS");
    expect(plain(money.getAttribute("title"))).toBe("10.000.000,00 ARS");
  });

  it("keeps amounts below 10,000 exact", () => {
    const { container } = renderWithIntl(<Money amount="9500.00" currency="ARS" decimals={2} />);
    expect(plain(container.textContent)).toBe("9500,00 ARS");
    expect(container.querySelector("[aria-label]")).toBeNull();
  });
});

it("a balance keeps its sign and words, compact, with the exact sentence for screen readers", () => {
  renderWithIntl(<AmountText amount="-2300000.00" currency="ARS" decimals={2} />);
  const text = screen.getByText((_, node) =>
    node?.classList.contains("amount-text") ? plain(node.textContent) === "Debés 2,3 M ARS" : false,
  );
  expect(plain(text.getAttribute("aria-label"))).toBe("Debés 2.300.000,00 ARS");
  expect(screen.getByRole("img", { name: "En contra" })).toBeInTheDocument();
});

it("the expense list shows compact amounts and total", () => {
  renderWithIntl(
    <ExpenseList
      account={makeAccount()}
      firstPage={{
        items: [
          {
            kind: "expense",
            expense: makeListItem({ id: "a", title: "Auto", amount: "10000000.00" }),
          },
        ],
        nextCursor: null,
        total: "10000000.00",
        count: 1,
      }}
    />,
  );
  expect(screen.getAllByLabelText(/10\.000\.000,00/).length).toBe(2);
  expect(plain(screen.getByRole("link", { name: /Auto/ }).textContent)).toContain("10 M ARS");
});

it("the expense detail shows the compact amount large and the exact one below (FR-006)", () => {
  renderWithIntl(
    <ExpenseDetail account={makeAccount()} expense={makeExpense({ amount: "10000000.00" })} />,
  );
  const exact = document.querySelector(".money-exact");
  expect(plain(exact?.textContent ?? null)).toBe("10.000.000,00 ARS");
  expect(plain(document.querySelector(".money-with-exact strong")?.textContent ?? null)).toBe(
    "10 M ARS",
  );
});
