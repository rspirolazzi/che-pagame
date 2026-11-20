"use server";

import { getLocale } from "next-intl/server";

import { signOut, unstable_update } from "@/auth";
import { apiFetch } from "@/lib/api/client";
import { type ActionResult, failure } from "@/lib/api/errors";
import type { UpdateMeRequest, UserResponse } from "@/lib/api/types";
import { getAccessToken } from "@/lib/session";

async function call<T>(path: string, method: "PATCH" | "POST", body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method,
    body,
    accessToken: await getAccessToken(),
    language: await getLocale(),
  });
}

/** Persist profile changes and refresh the user stored in the session cookie. */
async function updateSessionUser(user: UserResponse): Promise<void> {
  await unstable_update({ user });
}

export async function updateMeAction(patch: UpdateMeRequest): Promise<ActionResult<UserResponse>> {
  try {
    const user = await call<UserResponse>("/users/me", "PATCH", patch);
    await updateSessionUser(user);
    return { ok: true, data: user };
  } catch (error) {
    return failure(error);
  }
}

export async function requestEmailChangeAction(newEmail: string): Promise<ActionResult> {
  try {
    await call("/users/me/email-change", "POST", { newEmail });
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function confirmEmailChangeAction(code: string): Promise<ActionResult<UserResponse>> {
  try {
    const user = await call<UserResponse>("/users/me/email-change/confirm", "POST", { code });
    await updateSessionUser(user);
    return { ok: true, data: user };
  } catch (error) {
    return failure(error);
  }
}

/** Email the code that confirms the deletion of the current user (feature 015). */
export async function requestAccountDeletionAction(): Promise<ActionResult> {
  try {
    await call("/users/me/deletion", "POST", undefined);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Delete the current user with the emailed code. On success the session cookie is cleared and
 * the browser goes to the login with the "account deleted" notice; it only returns on errors.
 */
export async function confirmAccountDeletionAction(code: string): Promise<ActionResult> {
  try {
    await call("/users/me/deletion/confirm", "POST", { code });
  } catch (error) {
    return failure(error);
  }
  await signOut({ redirectTo: "/login?deleted=1" });
  return { ok: true };
}
