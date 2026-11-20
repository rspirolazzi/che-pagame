import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { setLanguageAction, setThemeAction } from "@/app/actions/preferences";
import { PreferenceControls } from "@/components/PreferenceControls";
import { PublicHeader } from "@/components/PublicHeader";
import { negotiateLocale } from "@/i18n/config";
import { readDeviceCookie, writeDeviceCookie } from "@/lib/devicePreferences";

import { renderWithIntl } from "../support/render";

const mockRefresh = jest.fn();
const mockSetTheme = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ refresh: mockRefresh }),
}));
jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: mockSetTheme }),
}));
jest.mock("@/app/actions/preferences", () => ({
  setLanguageAction: jest.fn(),
  setThemeAction: jest.fn(),
}));

const setLanguage = setLanguageAction as jest.Mock;
const setTheme = setThemeAction as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  document.cookie = "theme-pref=; Max-Age=0; Path=/";
  setLanguage.mockResolvedValue({ ok: true });
  setTheme.mockResolvedValue({ ok: true });
});

it("the public header offers language and theme (feature 014, US1)", () => {
  renderWithIntl(<PublicHeader />);
  expect(screen.getAllByRole("combobox", { name: "Idioma" }).length).toBeGreaterThan(0);
  expect(screen.getAllByRole("combobox", { name: "Tema" }).length).toBeGreaterThan(0);
});

it("shows the current language and theme", () => {
  renderWithIntl(<PreferenceControls />);
  expect(screen.getByRole("combobox", { name: "Idioma" })).toHaveValue("es");
  expect(screen.getByRole("combobox", { name: "Tema" })).toHaveValue("light");
});

it("changing the language saves it and re-renders the same page", async () => {
  renderWithIntl(<PreferenceControls />);
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Idioma" }), "en");
  expect(setLanguage).toHaveBeenCalledWith("en");
  await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
});

it("changing the theme applies it at once and keeps it on the device", async () => {
  renderWithIntl(<PreferenceControls />);
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Tema" }), "dark");
  expect(mockSetTheme).toHaveBeenCalledWith("dark");
  expect(readDeviceCookie("theme-pref")).toBe("dark");
  expect(setTheme).toHaveBeenCalledWith("dark");
});

it("warns when the profile could not be saved but keeps the change (FR-007)", async () => {
  setTheme.mockResolvedValue({ ok: false, code: "network_error" });
  renderWithIntl(<PreferenceControls />);
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Tema" }), "dark");
  expect(await screen.findByRole("status")).toHaveTextContent("no pudimos guardarlo");
  expect(mockSetTheme).toHaveBeenCalledWith("dark");
});

it("device cookies round-trip", () => {
  writeDeviceCookie("NEXT_LOCALE", "en");
  expect(readDeviceCookie("NEXT_LOCALE")).toBe("en");
});

it("without a cookie or header, the language is Spanish (search engines, FR-011)", () => {
  expect(negotiateLocale(null)).toBe("es");
});
