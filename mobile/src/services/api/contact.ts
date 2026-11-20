import { apiRequest } from "./client";
import type { PublicConfig } from "./types";

export interface ContactInput {
  name: string;
  email: string;
  message: string;
  language: string;
  consent: boolean;
  turnstileToken: string | null;
}

/** The contact form, relayed by WhatsApp by the API (feature 017). */
export const contactApi = {
  send: (input: ContactInput) => apiRequest<void>("/contact", { method: "POST", body: input }),
};

/** What the App needs before signing in: the Turnstile key, or null outside production. */
export const publicConfigApi = {
  get: () => apiRequest<PublicConfig>("/public-config"),
};
