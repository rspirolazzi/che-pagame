import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";

import i18n, { deviceLanguage, type Language } from "../i18n";
import { setRequestLanguage } from "./api/client";
import type { ThemeName } from "./api/types";

/**
 * Language and theme kept on this device, used without a session and kept after signing out
 * (feature 014, research R5). Small values in SecureStore, which the App already uses.
 */
export interface DevicePreferences {
  language: Language;
  theme: ThemeName;
}

const KEY = "device-preferences";
const THEMES: ThemeName[] = ["light", "dark", "system"];
const LANGUAGES: Language[] = ["es", "en"];

let current: DevicePreferences = { language: deviceLanguage(), theme: "system" };
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function applyLanguage(language: Language) {
  if (i18n.language !== language) void i18n.changeLanguage(language);
  setRequestLanguage(language);
}

/** Reads the stored choice once at start; invalid or missing values keep the defaults. */
export async function loadDevicePreferences(): Promise<DevicePreferences> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    const stored = raw ? (JSON.parse(raw) as Partial<DevicePreferences>) : {};
    current = {
      language: LANGUAGES.includes(stored.language as Language)
        ? (stored.language as Language)
        : current.language,
      theme: THEMES.includes(stored.theme as ThemeName) ? (stored.theme as ThemeName) : "system",
    };
  } catch {
    // Unreadable storage: the defaults apply and nothing breaks.
  }
  applyLanguage(current.language);
  notify();
  return current;
}

/** Applies at once and stores the choice for the next time the App opens. */
export function setDevicePreferences(patch: Partial<DevicePreferences>): void {
  current = { ...current, ...patch };
  if (patch.language) applyLanguage(patch.language);
  notify();
  SecureStore.setItemAsync(KEY, JSON.stringify(current)).catch(() => undefined);
}

export function getDevicePreferences(): DevicePreferences {
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDevicePreferences(): DevicePreferences {
  return useSyncExternalStore(subscribe, getDevicePreferences, getDevicePreferences);
}
