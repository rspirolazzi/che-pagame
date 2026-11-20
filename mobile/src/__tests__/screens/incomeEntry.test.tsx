import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import i18n from "@/i18n";
import SettlementDetailScreen from "@/screens/balances/SettlementDetailScreen";
import SettlementFormScreen from "@/screens/balances/SettlementFormScreen";
import { accountsApi } from "@/services/api/accounts";
import { settlementsApi } from "@/services/api/settlements";
import { ApiError } from "@/services/api/types";

import { makeAccount, makeSettlement } from "../support/accounts";
import { renderScreen } from "../support/render";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));
jest.mock("@react-native-community/datetimepicker", () => () => null);
jest.mock("@/services/api/accounts", () => ({ accountsApi: { get: jest.fn() } }));
jest.mock("@/services/api/settlements", () => ({
  settlementsApi: { get: jest.fn(), create: jest.fn(), remove: jest.fn() },
}));
jest.mock("@/utils/expenseGroups", () => ({
  ...jest.requireActual("@/utils/expenseGroups"),
  today: () => "2026-11-11",
}));

const api = settlementsApi as jest.Mocked<typeof settlementsApi>;

beforeEach(async () => {
  jest.clearAllMocks();
  (accountsApi.get as jest.Mock).mockResolvedValue(makeAccount());
  await i18n.changeLanguage("es");
});

describe("income form (feature 012, US1)", () => {
  beforeEach(() => {
    mockParams = { accountId: "acc1", from: "list" };
  });

  it("is titled Nuevo ingreso and I receive by default", async () => {
    api.create.mockResolvedValue(makeSettlement());
    renderScreen(<SettlementFormScreen />);
    expect(await screen.findByText("Nuevo ingreso")).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText("Pagó: Leandro"));
    fireEvent.changeText(screen.getByLabelText("Importe (ARS)"), "5000");
    fireEvent.press(screen.getByText("Guardar reembolso"));
    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith(
        "acc1",
        expect.objectContaining({
          fromParticipantId: "p-leandro",
          toParticipantId: "p-ana",
          amount: "5000.00",
          date: "2026-11-11",
        }),
        expect.any(String),
      ),
    );
    expect(mockRouter.back).toHaveBeenCalled();
  });
});

describe("income detail (US3)", () => {
  beforeEach(() => {
    mockParams = { accountId: "acc1", settlementId: "s1" };
  });

  it("shows its data, who recorded it and no edit option", async () => {
    api.get.mockResolvedValue(makeSettlement({ recordedBy: { id: "p-ana", name: "Ana" } }));
    renderScreen(<SettlementDetailScreen />);
    expect(await screen.findByText("Leandro le pagó a Ana")).toBeOnTheScreen();
    expect(screen.getByText(/Registrado por Ana el 11 de noviembre de 2026/)).toBeOnTheScreen();
    expect(screen.getByText(/no se editan/)).toBeOnTheScreen();
    expect(screen.queryByText("Editar")).toBeNull();
  });

  it("deletes after confirming and goes back", async () => {
    api.get.mockResolvedValue(makeSettlement());
    api.remove.mockResolvedValue(undefined);
    renderScreen(<SettlementDetailScreen />);
    fireEvent.press(await screen.findByText("Eliminar"));
    fireEvent.press(await screen.findByText("Continuar"));
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith("acc1", "s1"));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("says it no longer exists when it was deleted", async () => {
    api.get.mockRejectedValue(new ApiError(404, "not_found"));
    renderScreen(<SettlementDetailScreen />);
    expect(await screen.findByText(/ya no existe/)).toBeOnTheScreen();
  });

  it("cannot delete on a closed account", async () => {
    (accountsApi.get as jest.Mock).mockResolvedValue(makeAccount({ isClosed: true }));
    api.get.mockResolvedValue(makeSettlement());
    renderScreen(<SettlementDetailScreen />);
    await screen.findByText("Leandro le pagó a Ana");
    expect(screen.queryByText("Eliminar")).toBeNull();
  });
});
