import "server-only";

/**
 * The Turnstile site key, only in production (feature 017, research R5). It is read on the
 * server at request time, not inlined at build time: the production image is built on GitHub
 * without the server's .env.
 */
export function turnstileSiteKey(): string | null {
  const production = (process.env.ENVIRONMENT ?? "").trim().toLowerCase() === "production";
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return production && key ? key : null;
}
