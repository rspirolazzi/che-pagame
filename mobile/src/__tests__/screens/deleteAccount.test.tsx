import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { useAuth } from "@/hooks/useAuth";
import i18n from "@/i18n";
import DeleteAccountScreen from "@/screens/DeleteAccountScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { usePreferences } from "@/hooks/usePreferences";
import { ApiError } from "@/services/api/types";
import { usersApi } from "@/services/api/users";

import { renderScreen, user } from "../support/render";

const mockRouter = { push: jest.fn(), back: jest.fn() };

jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));
jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/usePreferences", () => ({ usePreferences: jest.fn() }));
jest.mock("@/services/api/users", () => ({
  usersApi: { requestDeletion: jest.fn(), confirmDeletion: jest.fn() },
}));

const logout = jest.fn();
const requestDeletion = usersApi.requestDeletion as jest.Mock;
const confirmDeletion = usersApi.confirmDeletion as jest.Mock;

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage("es");
  (useAuth as jest.Mock).mockReturnValue({ user, setUser: jest.fn(), logout });
  (usePreferences as jest.Mock).mockReturnValue({
    setLanguage: jest.fn(),
    setTheme: jest.fn(),
    setCurrency: jest.fn(),
    error: null,
  });
});

it("the profile opens the delete account screen (US1)", () => {
  renderScreen(<ProfileScreen />);
  fireEvent.press(screen.getByRole("button", { name: "Eliminar mi cuenta" }));
  expect(mockRouter.push).toHaveBeenCalledWith("/delete-account");
});

it("explains what is erased and kept, then deletes with the emailed code", async () => {
  requestDeletion.mockResolvedValue(undefined);
  confirmDeletion.mockResolvedValue(undefined);
  renderScreen(<DeleteAccountScreen />);
  expect(screen.getByText("Qué se borra")).toBeTruthy();
  expect(screen.getByText("Qué queda")).toBeTruthy();

  fireEvent.press(screen.getByRole("button", { name: "Enviarme el código para eliminar" }));
  expect(await screen.findByText(/Te enviamos un código a ana@mail.com/)).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText("Código"), "123456");

  await waitFor(() => expect(confirmDeletion).toHaveBeenCalledWith("123456"));
  await waitFor(() => expect(logout).toHaveBeenCalledWith("accountDeleted"));
});

it("a wrong code shows an error and keeps the session", async () => {
  requestDeletion.mockResolvedValue(undefined);
  confirmDeletion.mockRejectedValue(new ApiError(400, "invalid_code"));
  renderScreen(<DeleteAccountScreen />);
  fireEvent.press(screen.getByRole("button", { name: "Enviarme el código para eliminar" }));
  fireEvent.changeText(await screen.findByLabelText("Código"), "000000");

  expect(await screen.findByText(/El código es incorrecto o venció/)).toBeTruthy();
  expect(logout).not.toHaveBeenCalled();
});

it("cancel goes back without deleting", () => {
  renderScreen(<DeleteAccountScreen />);
  fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
  expect(mockRouter.back).toHaveBeenCalled();
  expect(requestDeletion).not.toHaveBeenCalled();
});
