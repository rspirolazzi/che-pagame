import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createSettlementAction, deleteSettlementAction } from "@/app/actions/settlements";
import { SettlementDetail } from "@/components/balances/SettlementDetail";
import { SettlementForm } from "@/components/balances/SettlementForm";
import { AddMovementMenu } from "@/components/expenses/AddMovementMenu";

import { makeAccount, makeSettlement } from "../support/accounts";
import { router } from "../support/mocks";
import { renderWithIntl } from "../support/render";

jest.mock("next/navigation", () => ({ useRouter: () => require("../support/mocks").router }));
jest.mock("@/app/actions/settlements", () => ({
  createSettlementAction: jest.fn(),
  deleteSettlementAction: jest.fn(),
}));
jest.mock("@/lib/expenseGroups", () => ({
  ...jest.requireActual("@/lib/expenseGroups"),
  today: () => "2026-11-11",
}));

const create = createSettlementAction as jest.Mock;
const remove = deleteSettlementAction as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("AddMovementMenu (feature 012, US1)", () => {
  it("offers an expense and an income", () => {
    renderWithIntl(<AddMovementMenu account={makeAccount()} />);
    expect(screen.getByRole("link", { name: "Gasto" })).toHaveAttribute(
      "href",
      "/accounts/acc1/expenses/new",
    );
    expect(screen.getByRole("link", { name: "Ingreso" })).toHaveAttribute(
      "href",
      "/accounts/acc1/settlements/new?from=list",
    );
  });

  it("offers nothing on a closed account", () => {
    renderWithIntl(<AddMovementMenu account={makeAccount({ isClosed: true })} />);
    expect(screen.queryByRole("link", { name: "Ingreso" })).not.toBeInTheDocument();
  });
});

describe("income form", () => {
  it("receives me by default and goes back to the list", async () => {
    create.mockResolvedValue({ ok: true, data: makeSettlement() });
    renderWithIntl(
      <SettlementForm account={makeAccount()} defaultToId="p-ana" returnTo="/accounts/acc1" />,
    );
    expect(screen.getByLabelText("Recibió")).toHaveValue("p-ana");
    expect(screen.getByLabelText("Fecha")).toHaveValue("2026-11-11");
    await userEvent.selectOptions(screen.getByLabelText("Pagó"), "p-leandro");
    await userEvent.type(screen.getByLabelText("Importe (ARS)"), "5000");
    await userEvent.click(screen.getByRole("button", { name: "Guardar reembolso" }));
    expect(create).toHaveBeenCalledWith(
      "acc1",
      expect.objectContaining({
        fromParticipantId: "p-leandro",
        toParticipantId: "p-ana",
        amount: "5000.00",
        source: "manual",
      }),
      expect.any(String),
    );
    expect(router.push).toHaveBeenCalledWith("/accounts/acc1");
  });

  it("rejects the same participant on both sides", async () => {
    renderWithIntl(<SettlementForm account={makeAccount()} defaultToId="p-ana" />);
    await userEvent.selectOptions(screen.getByLabelText("Pagó"), "p-ana");
    await userEvent.type(screen.getByLabelText("Importe (ARS)"), "10");
    await userEvent.click(screen.getByRole("button", { name: "Guardar reembolso" }));
    expect(screen.getByRole("alert")).toHaveTextContent("tienen que ser distintos");
    expect(create).not.toHaveBeenCalled();
  });
});

describe("SettlementDetail (US3)", () => {
  it("shows the data, who recorded it and no edit option", () => {
    renderWithIntl(<SettlementDetail account={makeAccount()} settlement={makeSettlement()} />);
    expect(screen.getByRole("heading", { name: "Leandro le pagó a Ana" })).toBeInTheDocument();
    expect(screen.getByText(/Registrado por Ana el 11 de noviembre de 2026/)).toBeInTheDocument();
    expect(screen.getByText(/no se editan/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Editar/ })).not.toBeInTheDocument();
  });

  it("omits the name when nobody is linked anymore", () => {
    renderWithIntl(
      <SettlementDetail
        account={makeAccount()}
        settlement={makeSettlement({ recordedBy: null })}
      />,
    );
    expect(screen.getByText(/^Registrado el 11 de noviembre de 2026/)).toBeInTheDocument();
  });

  it("deletes after confirming and goes back to the list", async () => {
    remove.mockResolvedValue({ ok: true, data: undefined });
    renderWithIntl(<SettlementDetail account={makeAccount()} settlement={makeSettlement()} />);
    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(remove).toHaveBeenCalledWith("acc1", "s1");
    expect(router.push).toHaveBeenCalledWith("/accounts/acc1");
  });

  it("says it no longer exists when another member deleted it", async () => {
    remove.mockResolvedValue({ ok: false, code: "not_found" });
    renderWithIntl(<SettlementDetail account={makeAccount()} settlement={makeSettlement()} />);
    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByText(/ya no existe/)).toBeInTheDocument();
  });

  it("cannot delete on a closed account", () => {
    renderWithIntl(
      <SettlementDetail account={makeAccount({ isClosed: true })} settlement={makeSettlement()} />,
    );
    expect(screen.queryByRole("button", { name: "Eliminar" })).not.toBeInTheDocument();
  });
});
