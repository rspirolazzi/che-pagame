import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";

import { PreferenceSheet } from "@/components/PreferenceSheet";
import i18n from "@/i18n";
import {
  getDevicePreferences,
  loadDevicePreferences,
  setDevicePreferences,
} from "@/services/devicePreferences";

import { renderScreen } from "../support/render";

beforeEach(async () => {
  await SecureStore.deleteItemAsync("device-preferences");
  setDevicePreferences({ language: "es", theme: "system" });
  await i18n.changeLanguage("es");
});

it("opens from the corner button and applies language and theme at once (feature 014, US4)", async () => {
  renderScreen(<PreferenceSheet />);
  fireEvent.press(screen.getByLabelText("Idioma y tema"));
  fireEvent.press(await screen.findByText("English"));
  await waitFor(() => expect(i18n.language).toBe("en"));
  fireEvent.press(await screen.findByText("Dark"));
  expect(getDevicePreferences()).toEqual({ language: "en", theme: "dark" });
});

it("keeps the choice for the next time the App opens", async () => {
  setDevicePreferences({ language: "en", theme: "dark" });
  await waitFor(async () =>
    expect(JSON.parse((await SecureStore.getItemAsync("device-preferences")) ?? "{}")).toEqual({
      language: "en",
      theme: "dark",
    }),
  );
  setDevicePreferences({ language: "es", theme: "system" });
  await SecureStore.setItemAsync(
    "device-preferences",
    JSON.stringify({ language: "en", theme: "dark" }),
  );
  expect(await loadDevicePreferences()).toEqual({ language: "en", theme: "dark" });
});

it("ignores invalid stored values", async () => {
  await SecureStore.setItemAsync(
    "device-preferences",
    JSON.stringify({ language: "fr", theme: "neon" }),
  );
  const loaded = await loadDevicePreferences();
  expect(loaded.theme).toBe("system");
  expect(["es", "en"]).toContain(loaded.language);
});
