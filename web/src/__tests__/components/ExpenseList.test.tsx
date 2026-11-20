import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { loadMoreMovementsAction } from "@/app/actions/expenses";
import { ExpenseList } from "@/components/expenses/ExpenseList";

import { makeAccount, makeListItem, makeSettlement } from "../support/accounts";
import { router } from "../support/mocks";
import { renderWithIntl } from "../support/render";

jest.mock("next/navigation", () => ({ useRouter: () => require("../support/mocks").router }));
jest.mock("@/app/actions/expenses", () => ({ loadMoreMovementsAction: jest.fn() }));

const loadMore = loadMoreMovementsAction as jest.Mock;

const expense = (overrides: Parameters<typeof makeListItem>[0]) => ({
  kind: "expense" as const,
  expense: makeListItem(overrides),
});

beforeEach(() => jest.clearAllMocks());

const page = {
  items: [
    expense({ id: "a", date: "2026-11-11", title: "Cena" }),
    expense({
      id: "b",
      date: "2026-11-10",
      title: "Nafta",
      categoryIcon: "car",
      paidBy: null,
      isPending: true,
    }),
  ],
  nextCursor: "c1",
  total: "1234.50",
  count: 3,
};

it("shows the total, day groups and each row", () => {
  renderWithIntl(<ExpenseList account={makeAccount()} firstPage={page} />);
  expect(screen.getByText("Total gastado")).toBeInTheDocument();
  expect(screen.getByText(/1\.?234,50/)).toBeInTheDocument();
  expect(screen.getByText("3 gastos")).toBeInTheDocument();
  const days = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
  expect(days[0]).toMatch(/11 de noviembre/);
  expect(days[1]).toMatch(/10 de noviembre/);

  const cena = screen.getByRole("link", { name: /Cena/ });
  expect(cena).toHaveAttribute("href", "/accounts/acc1/expenses/a");
  expect(cena).toHaveTextContent("Pagó Ana");
  expect(within(cena).getByRole("img", { name: "Comida" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Nafta/ })).toHaveTextContent("Pendiente de asignación");
});

it("loads the next page keeping one group per day and no repeats", async () => {
  loadMore.mockResolvedValue({
    ok: true,
    data: {
      items: [
        expense({ id: "b", date: "2026-11-10", title: "Nafta" }),
        expense({ id: "c", date: "2026-11-10", title: "Peaje" }),
      ],
      nextCursor: null,
      total: null,
      count: null,
    },
  });
  renderWithIntl(<ExpenseList account={makeAccount()} firstPage={page} />);
  await userEvent.click(screen.getByRole("button", { name: "Cargar más" }));
  expect(loadMore).toHaveBeenCalledWith("acc1", "c1");
  expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(2);
  expect(screen.getAllByRole("link", { name: /Nafta/ })).toHaveLength(1);
  expect(screen.getByRole("link", { name: /Peaje/ })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Cargar más" })).not.toBeInTheDocument();
});

it("refreshes only when asked", async () => {
  renderWithIntl(<ExpenseList account={makeAccount()} firstPage={page} />);
  expect(router.refresh).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Actualizar" }));
  expect(router.refresh).toHaveBeenCalled();
});

it("empty state invites to add the first one unless the account is closed", () => {
  const empty = { items: [], nextCursor: null, total: "0.00", count: 0 };
  const { unmount } = renderWithIntl(<ExpenseList account={makeAccount()} firstPage={empty} />);
  expect(screen.getByText(/Cargá el primero/)).toBeInTheDocument();
  unmount();
  renderWithIntl(<ExpenseList account={makeAccount({ isClosed: true })} firstPage={empty} />);
  expect(screen.getByText(/Todavía no hay gastos/)).toBeInTheDocument();
  expect(screen.queryByText(/Cargá el primero/)).not.toBeInTheDocument();
});

it("shows an income between the expenses, with its own label and text (feature 012)", () => {
  const settlement = makeSettlement({ id: "s1", date: "2026-11-10" });
  renderWithIntl(
    <ExpenseList
      account={makeAccount()}
      firstPage={{ ...page, items: [...page.items, { kind: "settlement", settlement }] }}
    />,
  );
  const row = screen.getByRole("link", { name: /^Ingreso: Leandro le pagó a Ana, / });
  expect(row).toHaveAttribute("href", "/accounts/acc1/settlements/s1");
  expect(row).toHaveTextContent(`${settlement.from.name} le pagó a ${settlement.to.name}`);
  expect(within(row).getByText("Ingreso")).toBeInTheDocument();
  // Same day group as the expense of the 10th.
  expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(2);
});
