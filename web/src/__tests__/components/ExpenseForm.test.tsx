import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";

import { createExpenseAction } from "@/app/actions/expenses";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { today } from "@/lib/expenseGroups";

import { makeAccount, makeExpense } from "../support/accounts";
import { router } from "../support/mocks";
import { messages, renderWithIntl } from "../support/render";

jest.mock("next/navigation", () => ({ useRouter: () => require("../support/mocks").router }));
jest.mock("@/app/actions/expenses", () => ({
  createExpenseAction: jest.fn(),
  updateExpenseAction: jest.fn(),
}));

const create = createExpenseAction as jest.Mock;

beforeEach(() => {
  create.mockReset();
  router.push.mockReset();
});

it("comes with today, my participant as payer and everyone sharing", () => {
  renderWithIntl(<ExpenseForm account={makeAccount()} />);
  expect(screen.getByLabelText("Fecha")).toHaveValue(today());
  expect(screen.getByLabelText("Pagó")).toHaveValue("p-ana");
  for (const name of ["Ana", "Leandro", "Javier"]) {
    expect(screen.getByRole("checkbox", { name })).toBeChecked();
  }
  expect(screen.getByLabelText("Importe (ARS)")).toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: /moneda/i })).not.toBeInTheDocument();
});

it("computes today only after hydration, so the server HTML has no date", () => {
  const html = renderToString(
    <NextIntlClientProvider locale="es" messages={messages.es} timeZone="UTC">
      <ExpenseForm account={makeAccount()} />
    </NextIntlClientProvider>,
  );
  expect(html).toMatch(/id="expense-date"[^>]*value=""/);
});

it("validates before sending", async () => {
  renderWithIntl(<ExpenseForm account={makeAccount()} />);
  const save = screen.getByRole("button", { name: "Guardar gasto" });

  await userEvent.click(save);
  expect(screen.getByRole("alert")).toHaveTextContent("Ingresá un concepto");

  await userEvent.type(screen.getByLabelText("Concepto"), "Cena");
  await userEvent.type(screen.getByLabelText("Importe (ARS)"), "10,555");
  await userEvent.click(save);
  expect(screen.getByRole("alert")).toHaveTextContent("como máximo 2 decimales");

  await userEvent.clear(screen.getByLabelText("Importe (ARS)"));
  await userEvent.type(screen.getByLabelText("Importe (ARS)"), "100");
  for (const name of ["Ana", "Leandro", "Javier"]) {
    // With an amount, each name carries its share (feature 013).
    await userEvent.click(screen.getByRole("checkbox", { name: new RegExp(`^${name}`) }));
  }
  await userEvent.click(save);
  expect(screen.getByRole("alert")).toHaveTextContent("al menos un participante");
  expect(create).not.toHaveBeenCalled();
});

it("does not accept decimals for a currency without them", async () => {
  renderWithIntl(<ExpenseForm account={makeAccount({ currency: "JPY", currencyDecimals: 0 })} />);
  await userEvent.type(screen.getByLabelText("Concepto"), "Ramen");
  await userEvent.type(screen.getByLabelText("Importe (JPY)"), "10,5");
  await userEvent.click(screen.getByRole("button", { name: "Guardar gasto" }));
  expect(screen.getByRole("alert")).toHaveTextContent("ningún decimal");
});

it("sends decimal text and keeps the same clientRequestId when retrying", async () => {
  create
    .mockResolvedValueOnce({ ok: false, code: "network_error" })
    .mockResolvedValueOnce({ ok: true, data: makeExpense({ id: "new1" }) });
  renderWithIntl(<ExpenseForm account={makeAccount()} />);
  await userEvent.type(screen.getByLabelText("Concepto"), "Cena");
  await userEvent.type(screen.getByLabelText("Importe (ARS)"), "1.234,5");
  await userEvent.click(screen.getByRole("button", { name: "Guardar gasto" }));
  await userEvent.click(screen.getByRole("button", { name: "Guardar gasto" }));

  const [first, second] = create.mock.calls;
  expect(first[1]).toMatchObject({
    title: "Cena",
    amount: "1234.50",
    paidById: "p-ana",
    participantIds: ["p-ana", "p-leandro", "p-javier"],
    categoryIcon: "other",
    date: today(),
  });
  expect(first[2]).toBe(second[2]);
  expect(router.push).toHaveBeenCalledWith("/accounts/acc1/expenses/new1");
});

it("shows translated API errors", async () => {
  create.mockResolvedValue({ ok: false, code: "invalid_participant" });
  renderWithIntl(<ExpenseForm account={makeAccount()} />);
  await userEvent.type(screen.getByLabelText("Concepto"), "Cena");
  await userEvent.type(screen.getByLabelText("Importe (ARS)"), "10");
  await userEvent.click(screen.getByRole("button", { name: "Guardar gasto" }));
  expect(screen.getByRole("alert")).toHaveTextContent("participantes activos");
});

describe("each person's share (feature 013)", () => {
  it("shows the exact shares and recalculates on every change", async () => {
    renderWithIntl(<ExpenseForm account={makeAccount()} />);
    const amount = screen.getByLabelText("Importe (ARS)");
    await userEvent.type(amount, "100");
    // Ana, Leandro, Javier in the account's order: the extra cent goes to Ana.
    expect(screen.getByRole("checkbox", { name: /^Ana\s*33,34\sARS$/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /^Leandro\s*33,33/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /^Javier\s*33,33/ })).toBeChecked();

    await userEvent.click(screen.getByRole("checkbox", { name: /^Javier/ }));
    expect(screen.getByRole("checkbox", { name: /^Ana\s*50,00/ })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /^Leandro\s*50,00/ })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Javier No participa" })).not.toBeChecked();

    await userEvent.clear(amount);
    await userEvent.type(amount, "101");
    expect(screen.getByRole("checkbox", { name: /^Ana\s*50,50/ })).toBeInTheDocument();
  });

  it("shows no shares without a valid amount or with nobody sharing", async () => {
    renderWithIntl(<ExpenseForm account={makeAccount()} />);
    expect(screen.queryByText(/ARS$/)).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Importe (ARS)"), "abc");
    expect(screen.queryByText(/ARS$/)).not.toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText("Importe (ARS)"));
    await userEvent.type(screen.getByLabelText("Importe (ARS)"), "10,555");
    expect(screen.queryByText(/ARS$/)).not.toBeInTheDocument();
  });

  it("starts with the current shares when editing", () => {
    renderWithIntl(<ExpenseForm account={makeAccount()} expense={makeExpense()} />);
    expect(screen.getAllByText(/^[\d.,]+\sARS$/).length).toBeGreaterThan(0);
  });
});
