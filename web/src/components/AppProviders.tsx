"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { type ReactNode, useEffect } from "react";

import type { LanguageCode, ThemeName } from "@/lib/api/types";
import {
  LOCALE_COOKIE,
  readDeviceCookie,
  THEME_COOKIE,
  writeDeviceCookie,
} from "@/lib/devicePreferences";

/**
 * Applies the profile's theme and language on this device, so every device follows the profile
 * (FR-022) and the device keeps it after signing out (feature 014, FR-009).
 */
function ProfileSync({ theme, language }: { theme?: ThemeName; language?: LanguageCode }) {
  const { setTheme } = useTheme();
  useEffect(() => {
    if (!theme) return;
    setTheme(theme);
    writeDeviceCookie(THEME_COOKIE, theme);
  }, [theme, setTheme]);
  useEffect(() => {
    if (language && readDeviceCookie(LOCALE_COOKIE) !== language) {
      writeDeviceCookie(LOCALE_COOKIE, language);
    }
  }, [language]);
  return null;
}

/**
 * next-themes renders an inline script that sets the theme before first paint. It only matters in
 * the server HTML; when React creates it on the client it would never run, and React 19 warns
 * ("Encountered a script tag..."). Marking the client copy as a data block silences that warning;
 * next-themes already suppresses the attribute hydration mismatch on this script.
 */
const themeScriptProps =
  typeof window === "undefined" ? undefined : ({ type: "application/json" } as const);

export function AppProviders({
  theme,
  language,
  children,
}: {
  theme?: ThemeName;
  language?: LanguageCode;
  children: ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={themeScriptProps}
    >
      <ProfileSync theme={theme} language={language} />
      {children}
    </ThemeProvider>
  );
}
