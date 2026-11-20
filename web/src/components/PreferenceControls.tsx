"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useId, useState, useTransition } from "react";

import { setLanguageAction, setThemeAction } from "@/app/actions/preferences";
import type { LanguageCode, ThemeName } from "@/lib/api/types";
import {
  isTheme,
  LANGUAGES,
  THEME_COOKIE,
  THEMES,
  writeDeviceCookie,
} from "@/lib/devicePreferences";
import { useHydrated } from "@/lib/useHydrated";

/**
 * Language and theme from the header, with or without a session (feature 014). The change applies
 * at once and stays on this device; with a session it is saved in the profile too, and if that
 * fails the device keeps it and a notice says so (FR-007).
 */
export function PreferenceControls() {
  const t = useTranslations("profile");
  const tPrefs = useTranslations("preferences");
  const locale = useLocale();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  // next-themes only knows the stored theme after hydration.
  const current: ThemeName = hydrated && isTheme(theme) ? theme : "system";

  function changeLanguage(language: LanguageCode) {
    setFailed(false);
    startTransition(async () => {
      const result = await setLanguageAction(language);
      if (!result.ok) setFailed(true);
      // The server components render again with the other catalog, on the same page (FR-004).
      router.refresh();
    });
  }

  function changeTheme(next: ThemeName) {
    setFailed(false);
    setTheme(next);
    writeDeviceCookie(THEME_COOKIE, next);
    startTransition(async () => {
      const result = await setThemeAction(next);
      if (!result.ok) setFailed(true);
    });
  }

  return (
    <div className="preference-controls" role="group" aria-label={t("preferences")}>
      <label htmlFor={`${id}-language`} className="visually-hidden">
        {t("language")}
      </label>
      <select
        id={`${id}-language`}
        value={locale}
        disabled={pending}
        onChange={(event) => changeLanguage(event.target.value as LanguageCode)}
      >
        {LANGUAGES.map((code) => (
          <option key={code} value={code}>
            {t(`languages.${code}`)}
          </option>
        ))}
      </select>
      <label htmlFor={`${id}-theme`} className="visually-hidden">
        {t("theme")}
      </label>
      <select
        id={`${id}-theme`}
        value={current}
        onChange={(event) => changeTheme(event.target.value as ThemeName)}
      >
        {THEMES.map((name) => (
          <option key={name} value={name}>
            {t(`themes.${name}`)}
          </option>
        ))}
      </select>
      {failed && (
        <p role="status" className="preference-notice">
          {tPrefs("saveFailed")}
        </p>
      )}
    </div>
  );
}
