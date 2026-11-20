/**
 * Language and theme kept on the device, with or without a session (feature 014, research R1).
 * Both cookies are strictly functional (no consent banner) and never leave this site.
 */

import type { LanguageCode, ThemeName } from "./api/types";

export const LOCALE_COOKIE = "NEXT_LOCALE";
/** Mirror of next-themes' localStorage value, readable on the server for the Google sign-up. */
export const THEME_COOKIE = "theme-pref";
export const ONE_YEAR = 60 * 60 * 24 * 365;

export const LANGUAGES: LanguageCode[] = ["es", "en"];
export const THEMES: ThemeName[] = ["light", "dark", "system"];

export function isLanguage(value: unknown): value is LanguageCode {
  return typeof value === "string" && (LANGUAGES as string[]).includes(value);
}

export function isTheme(value: unknown): value is ThemeName {
  return typeof value === "string" && (THEMES as string[]).includes(value);
}

/** Writes a device cookie from the browser (Path=/, SameSite=Lax, one year). */
export function writeDeviceCookie(name: string, value: string): void {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`;
  } catch {
    // Storage blocked: the choice still applies to the current page (edge case).
  }
}

export function readDeviceCookie(name: string): string | null {
  try {
    const match = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
  } catch {
    return null;
  }
}
