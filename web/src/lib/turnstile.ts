import "server-only";

/**
 * The Turnstile site key, only in production (feature 017, research R5). It is read on the
 * server at request time from the server's .env: the production image is built on GitHub without
 * it. No NEXT_PUBLIC_ prefix on purpose: it never reaches the browser bundle; the server passes
 * it to the widget as a prop.
 */
export function turnstileSiteKey(): string | null {
  const production = (process.env.ENVIRONMENT ?? "").trim().toLowerCase() === "production";
  const key = process.env.CLOUDFLARE_TURNSTILE_SITE_KEY?.trim();
  return production && key ? key : null;
}
