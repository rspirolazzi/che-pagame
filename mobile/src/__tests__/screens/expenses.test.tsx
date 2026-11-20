import { act, fireEvent, screen, waitFor, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { ExpenseHistory } from "@/components/expenses/ExpenseBits";
import i18n from "@/i18n";
import AccountExpensesScreen from "@/screens/expenses/AccountExpensesScreen";
import ExpenseDetailScreen from "@/screens/expenses/ExpenseDetailScreen";
import ExpenseFormScreen from "@/screens/expenses/ExpenseFormScreen";
import { accountsApi } from "@/services/api/accounts";
import { expensesApi } from "@/services/api/expenses";
import { movementsApi } from "@/services/api/movements";
import { ApiError } from "@/services/api/types";
import { today } from "@/utils/expenseGroups";

import {
  makeAccount,
  makeExpense,
  makeHistory,
  makeListItem,
  makeSettlement,
} from "../support/accounts";
import { renderScreen } from "../support/render";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
let mockParams: Record<string, string> = { accountId: "acc1" };
const mockFocus: { run?: () => void } = {};

jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (callback: () => void) => {
      mockFocus.run = callback;
      useEffect(callback, [callback]);
    },
  };
});
jest.mock("@react-native-community/datetimepicker", () => () => null);
jest.mock("@/services/api/accounts", () => ({ accountsApi: { get: jest.fn() } }));
jest.mock("@/services/api/expenses", () => ({
  expensesApi: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    history: jest.fn(),
    participantImpact: jest.fn(),
  },
}));

jest.mock("@/services/api/movements", () => ({ movementsApi: { list: jest.fn() } }));

const api = expensesApi as jest.Mocked<typeof expensesApi>;
const movements = movementsApi.list as jest.Mock;
const expense = (overrides: Parameters<typeof makeListItem>[0]) => ({
  kind: "expense" as const,
  expense: makeListItem(overrides),
});

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = { accountId: "acc1" };
  (accountsApi.get as jest.Mock).mockResolvedValue(makeAccount());
  await i18n.changeLanguage("es");
});

describe("account expenses (US2)", () => {
  const firstPage = {
    items: [
      expense({ id: "a", date: "2026-11-11", title: "Cena" }),
      expense({ id: "b", date: "2026-11-10", title: "Nafta", paidBy: null, isPending: true }),
    ],
    nextCursor: "c1",
    total: "150.00",
    count: 3,
  };

  it("shows the total, day sections and rows", async () => {
    movements.mockResolvedValue(firstPage);
    renderScreen(<AccountExpensesScreen />);
    expect(await screen.findByText("Cena")).toBeOnTheScreen();
    expect(screen.getByText("Total gastado")).toBeOnTheScreen();
    expect(screen.getByText(/150,00/)).toBeOnTheScreen();
    expect(screen.getByText("3 gastos")).toBeOnTheScreen();
    expect(screen.getByText(/^Miércoles, 11 de noviembre/)).toBeOnTheScreen();
    expect(screen.getByText("Pagó Ana")).toBeOnTheScreen();
    expect(screen.getByText("Pendiente de asignación")).toBeOnTheScreen();
  });

  it("loads the next page once and merges days", async () => {
    movements.mockResolvedValueOnce(firstPage).mockResolvedValueOnce({
      items: [expense({ id: "c", date: "2026-11-10", title: "Peaje" })],
      nextCursor: null,
      total: null,
      count: null,
    });
    renderScreen(<AccountExpensesScreen />);
    const list = await screen.findByText("Cena");
    expect(list).toBeOnTheScreen();
    const sectionList = screen.UNSAFE_getByType(require("react-native").SectionList);
    await act(async () => {
      sectionList.props.onEndReached();
      sectionList.props.onEndReached();
    });
    expect(movements).toHaveBeenCalledTimes(2);
    expect(movements).toHaveBeenLastCalledWith("acc1", "c1");
    expect(await screen.findByText("Peaje")).toBeOnTheScreen();
    expect(screen.getAllByText(/10 de noviembre/)).toHaveLength(1);
  });

  it("reloads on pull to refresh and when coming back to the screen", async () => {
    movements.mockResolvedValue(firstPage);
    renderScreen(<AccountExpensesScreen />);
    await screen.findByText("Cena");
    const sectionList = screen.UNSAFE_getByType(require("react-native").SectionList);
    await act(async () => {
      await sectionList.props.refreshControl.props.onRefresh();
    });
    await act(async () => {
      mockFocus.run?.();
    });
    await waitFor(() => expect(movements).toHaveBeenCalledTimes(3));
    expect(movements).toHaveBeenCalledWith("acc1");
  });

  it("a closed account has no New expense button", async () => {
    (accountsApi.get as jest.Mock).mockResolvedValue(makeAccount({ isClosed: true }));
    movements.mockResolvedValue({ items: [], nextCursor: null, total: "0.00", count: 0 });
    renderScreen(<AccountExpensesScreen />);
    expect(await screen.findByText(/Todavía no hay gastos/)).toBeOnTheScreen();
    expect(screen.queryByText("Nuevo gasto")).toBeNull();
    expect(screen.queryByLabelText("Agregar")).toBeNull();
  });

  it("shows an income among the expenses and opens its detail (feature 012)", async () => {
    movements.mockResolvedValue({
      ...firstPage,
      items: [...firstPage.items, { kind: "settlement", settlement: makeSettlement({ id: "s1" }) }],
    });
    renderScreen(<AccountExpensesScreen />);
    const row = await screen.findByLabelText(/^Ingreso: Leandro le pagó a Ana, /);
    expect(screen.getByText("Leandro le pagó a Ana")).toBeOnTheScreen();
    fireEvent.press(row);
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/accounts/[accountId]/settlements/[settlementId]",
      params: { accountId: "acc1", settlementId: "s1" },
    });
  });

  it("the + button offers an expense or an income (feature 012)", async () => {
    movements.mockResolvedValue(firstPage);
    renderScreen(<AccountExpensesScreen />);
    await screen.findByText("Cena");
    const group = screen.UNSAFE_getByType(require("react-native-paper").FAB.Group);
    const actions = group.props.actions as { label: string; onPress: () => void }[];
    expect(actions.map((action) => action.label)).toEqual(["Gasto", "Ingreso"]);
    actions[1].onPress();
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/accounts/[accountId]/settlements/new",
      params: { accountId: "acc1", from: "list" },
    });
  });
});

describe("each person's share (feature 013)", () => {
  it("shows the exact shares and recalculates on every change", async () => {
    renderScreen(<ExpenseFormScreen />);
    await screen.findByText("Nuevo gasto");
    // Ana and Leandro, in the account's order: the extra cent goes to Ana.
    fireEvent.changeText(screen.getByLabelText("Importe (ARS)"), "100,01");
    expect(screen.getAllByLabelText(/^Ana, 50,01\sARS$/)[0]).toBeOnTheScreen();
    expect(screen.getAllByLabelText(/^Leandro, 50,00\sARS$/)[0]).toBeOnTheScreen();

    fireEvent.press(screen.getAllByLabelText(/^Leandro, /)[0]);
    expect(screen.getAllByLabelText(/^Ana, 100,01\sARS$/)[0]).toBeOnTheScreen();
    expect(screen.getAllByLabelText("Leandro, No participa")[0]).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText("Importe (ARS)"), "20");
    expect(screen.getAllByLabelText(/^Ana, 20,00\sARS$/)[0]).toBeOnTheScreen();
  });

  it("shows no shares without a valid amount", async () => {
    renderScreen(<ExpenseFormScreen />);
    await screen.findByText("Nuevo gasto");
    fireEvent.changeText(screen.getByLabelText("Importe (ARS)"), "abc");
    expect(screen.queryByText(/ARS$/)).toBeNull();
    expect(screen.getAllByLabelText("Ana").length).toBeGreaterThan(0);
  });
});

describe("expense form (US1, US3)", () => {
  it("comes with today, my participant as payer and everyone sharing; validates", async () => {
    renderScreen(<ExpenseFormScreen />);
    await screen.findByText("Nuevo gasto");
    expect(screen.getByLabelText("Fecha")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Guardar gasto"));
    expect(await screen.findByText(/Ingresá un concepto/)).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText("Concepto"), "Cena");
    fireEvent.changeText(screen.getByLabelText("Importe (ARS)"), "10,555");
    fireEvent.press(screen.getByText("Guardar gasto"));
    expect(await screen.findByText(/como máximo 2 decimales/)).toBeOnTheScreen();
    expect(api.create).not.toHaveBeenCalled();
  });

  it("sends decimal text and keeps the clientRequestId between retries", async () => {
    api.create
      .mockRejectedValueOnce(new ApiError(0, "network_error"))
      .mockResolvedValueOnce(makeExpense({ id: "new1" }));
    renderScreen(<ExpenseFormScreen />);
    await screen.findByText("Nuevo gasto");
    fireEvent.changeText(screen.getByLabelText("Concepto"), "Cena");
    fireEvent.changeText(screen.getByLabelText("Importe (ARS)"), "1.234,5");
    fireEvent.press(screen.getByText("Guardar gasto"));
    await waitFor(() => expect(api.create).toHaveBeenCalledTimes(1));
    fireEvent.press(screen.getByText("Guardar gasto"));
    await waitFor(() => expect(api.create).toHaveBeenCalledTimes(2));

    const [first, second] = api.create.mock.calls;
    expect(first[1]).toMatchObject({
      date: today(),
      title: "Cena",
      amount: "1234.50",
      paidById: "p-ana",
      participantIds: ["p-ana", "p-leandro"],
      categoryIcon: "other",
    });
    expect(first[2]).toMatch(/^[0-9a-f-]{36}$/);
    expect(first[2]).toBe(second[2]);
    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: "/accounts/[accountId]/expenses/[expenseId]",
      params: { accountId: "acc1", expenseId: "new1" },
    });
  });

  it("on a conflict shows the notice and loads the current version", async () => {
    mockParams = { accountId: "acc1", expenseId: "exp1" };
    api.get.mockResolvedValue(makeExpense({ version: 1 }));
    const current = makeExpense({ title: "Cena de B", amount: "120.00", version: 2 });
    api.update
      .mockRejectedValueOnce(new ApiError(409, "expense_conflict", undefined, { current }))
      .mockResolvedValueOnce(current);
    renderScreen(<ExpenseFormScreen />);
    expect(await screen.findByDisplayValue("100,00")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Guardar gasto"));
    expect(await screen.findByText(/Otro miembro cambió este gasto/)).toBeOnTheScreen();
    expect(screen.getByDisplayValue("Cena de B")).toBeOnTheScreen();
    expect(screen.getByDisplayValue("120,00")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Guardar gasto"));
    await waitFor(() => expect(api.update).toHaveBeenCalledTimes(2));
    expect(api.update.mock.calls[1][3]).toBe(2);
  });

  it("a pending expense needs a payer", async () => {
    mockParams = { accountId: "acc1", expenseId: "exp1" };
    api.get.mockResolvedValue(makeExpense({ paidBy: null, isPending: true }));
    renderScreen(<ExpenseFormScreen />);
    await screen.findByText("Editar gasto");
    fireEvent.press(screen.getByText("Guardar gasto"));
    expect(await screen.findByText("Elegí quién pagó.")).toBeOnTheScreen();
    expect(api.update).not.toHaveBeenCalled();
  });
});

describe("expense detail (US1, US3, US5)", () => {
  beforeEach(() => {
    mockParams = { accountId: "acc1", expenseId: "exp1" };
    api.history.mockResolvedValue(makeHistory());
  });

  it("shows shares and history, and deletes after confirming", async () => {
    api.get.mockResolvedValue(makeExpense({ version: 3 }));
    api.remove.mockResolvedValue(undefined);
    renderScreen(<ExpenseDetailScreen />);
    expect(await screen.findByText("Parte de cada uno")).toBeOnTheScreen();
    expect(screen.getAllByText(/50,00/)).toHaveLength(2);
    expect(screen.getByText("Ana modificó el gasto")).toBeOnTheScreen();
    expect(screen.getByText("Ajuste automático al quitar a un participante")).toBeOnTheScreen();
    expect(screen.getByText(/Pagó: Javier → \(vacío\)/)).toBeOnTheScreen();
    expect(screen.getByText("Un miembro cargó el gasto")).toBeOnTheScreen();

    fireEvent.press(screen.getByText("Eliminar"));
    fireEvent.press(await screen.findByText("Cancelar"));
    expect(api.remove).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 300));
    fireEvent.press(screen.getByText("Eliminar"));
    fireEvent.press(await screen.findByText("Continuar"));
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith("acc1", "exp1", 3));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("puts the amount below the title, never in the same row (feature 016, FR-009)", async () => {
    api.get.mockResolvedValue(makeExpense({ amount: "12500000.00" }));
    renderScreen(<ExpenseDetailScreen />);
    const title = await screen.findByText("Cena");
    let row = title.parent;
    while (
      row &&
      !(
        (row.type as unknown) === "View" &&
        StyleSheet.flatten(row.props.style)?.flexDirection === "row"
      )
    ) {
      row = row.parent;
    }
    expect(row).toBeTruthy();
    // Icon + title/date in the first row; the compact amount and the exact one below it.
    expect(within(row!).queryByText(/ARS/)).toBeNull();
    expect(screen.getAllByText(/12,5\sM/).length).toBeGreaterThan(0);
  });

  it("a closed account offers no edit or delete", async () => {
    (accountsApi.get as jest.Mock).mockResolvedValue(makeAccount({ isClosed: true }));
    api.get.mockResolvedValue(makeExpense());
    renderScreen(<ExpenseDetailScreen />);
    await screen.findByText("Parte de cada uno");
    expect(screen.queryByText("Editar")).toBeNull();
    expect(screen.queryByText("Eliminar")).toBeNull();
  });

  it("says when the expense no longer exists", async () => {
    api.get.mockRejectedValue(new ApiError(404, "not_found"));
    renderScreen(<ExpenseDetailScreen />);
    expect(await screen.findByText(/ya no existe/)).toBeOnTheScreen();
  });
});

it("history renders amounts and empty values readably", () => {
  renderScreen(<ExpenseHistory account={makeAccount()} entries={makeHistory()} locale="es" />);
  expect(screen.getByText(/Importe: .*90,00.* → .*120,00/)).toBeOnTheScreen();
});
