"use server";

import { cookies } from "next/headers";

import { auth } from "@/auth";
import type { ActionResult } from "@/lib/api/errors";
import type { LanguageCode, ThemeName } from "@/lib/api/types";
import {
  isLanguage,
  isTheme,
  LOCALE_COOKIE,
  ONE_YEAR,
  THEME_COOKIE,
} from "@/lib/devicePreferences";

import { updateMeAction } from "./profile";

async function signedIn(): Promise<boolean> {
  const session = await auth();
  return Boolean(session?.user && !session.error);
}

/**
 * Language from the header (feature 014): always on the device (cookie), and in the profile too
 * with a session. When the profile save fails the device keeps the choice and the caller warns.
 */
export async function setLanguageAction(language: LanguageCode): Promise<ActionResult> {
  if (!isLanguage(language)) return { ok: false, code: "validation_error" };
  (await cookies()).set(LOCALE_COOKIE, language, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
  if (!(await signedIn())) return { ok: true };
  const result = await updateMeAction({ preferences: { language } });
  return result.ok ? { ok: true } : result;
}

/** Theme from the header: the profile with a session; the device part runs in the browser. */
export async function setThemeAction(theme: ThemeName): Promise<ActionResult> {
  if (!isTheme(theme)) return { ok: false, code: "validation_error" };
  (await cookies()).set(THEME_COOKIE, theme, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  if (!(await signedIn())) return { ok: true };
  const result = await updateMeAction({ preferences: { theme } });
  return result.ok ? { ok: true } : result;
}
