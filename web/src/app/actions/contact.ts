"use server";

import { getLocale } from "next-intl/server";

import { apiFetch } from "@/lib/api/client";
import { type ActionResult, failure } from "@/lib/api/errors";

export interface ContactInput {
  name: string;
  email: string;
  message: string;
  consent: boolean;
  turnstileToken: string | null;
}

/** Sends the contact form to the API, which relays it by WhatsApp (feature 017). */
export async function sendContactAction(input: ContactInput): Promise<ActionResult> {
  try {
    const language = await getLocale();
    await apiFetch("/contact", {
      method: "POST",
      body: { ...input, language },
      language,
    });
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
