import { fireEvent, screen } from "@testing-library/react-native";

import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import i18n from "@/i18n";
import en from "@/i18n/locales/en.json";
import es from "@/i18n/locales/es.json";
import {
  AboutMenu,
  ContactScreen,
  FAQ_GROUPS,
  FaqScreen,
  HowItWorksScreen,
  WhoWeAreScreen,
} from "@/screens/about/AboutScreens";
import ProfileScreen from "@/screens/ProfileScreen";

import { renderScreen, user } from "../support/render";

const mockRouter = { push: jest.fn(), back: jest.fn() };

jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));
jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/usePreferences", () => ({ usePreferences: jest.fn() }));

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage("es");
  (useAuth as jest.Mock).mockReturnValue({ user, setUser: jest.fn(), logout: jest.fn() });
  (usePreferences as jest.Mock).mockReturnValue({
    setLanguage: jest.fn(),
    setTheme: jest.fn(),
    setCurrency: jest.fn(),
    error: null,
  });
});

it("the profile opens Acerca de (feature 011, US4)", () => {
  renderScreen(<ProfileScreen />);
  fireEvent.press(screen.getByRole("button", { name: "Acerca de" }));
  expect(mockRouter.push).toHaveBeenCalledWith("/about");
});

it("Acerca de lists the four information pages", () => {
  renderScreen(<AboutMenu />);
  for (const name of [
    "Cómo dividir gastos en grupo con ChePagame",
    "Quiénes somos",
    "Contacto",
    "Preguntas frecuentes",
  ]) {
    expect(screen.getByText(name)).toBeTruthy();
  }
  fireEvent.press(screen.getByText("Preguntas frecuentes"));
  expect(mockRouter.push).toHaveBeenCalledWith("/about/faq");
});

it("shows the same content as the web pages", () => {
  renderScreen(<HowItWorksScreen />);
  expect(screen.getByText("Viajes en grupo")).toBeTruthy();
  renderScreen(<WhoWeAreScreen />);
  expect(screen.getByText("Por qué existe")).toBeTruthy();
  renderScreen(<ContactScreen />);
  expect(screen.getByRole("button", { name: "Preguntas frecuentes" })).toBeTruthy();
});

it("the FAQ opens an answer when its question is tapped", () => {
  renderScreen(<FaqScreen />);
  expect(screen.queryByText("Sí. ChePagame es gratis y no tiene publicidad.")).toBeNull();
  fireEvent.press(screen.getByText("¿Es gratis?"));
  expect(screen.getByText("Sí. ChePagame es gratis y no tiene publicidad.")).toBeTruthy();
});

it.each([
  ["es", es],
  ["en", en],
])("every FAQ id has a question and an answer in %s", (_lang, messages) => {
  const groups = messages.pages.faq.groups as Record<
    string,
    { items: Record<string, { q: string; a: string }> }
  >;
  for (const [group, ids] of Object.entries(FAQ_GROUPS)) {
    for (const id of ids) {
      expect(groups[group].items[id].q).toBeTruthy();
      expect(groups[group].items[id].a).toBeTruthy();
    }
  }
});
