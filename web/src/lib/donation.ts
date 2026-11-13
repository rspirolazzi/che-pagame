/**
 * The donation page link (feature 008), from configuration. Only a valid https address is used;
 * anything else (empty, http, javascript:, plain text) hides the button (FR-002).
 */
export function parseDonationUrl(value?: string): string | null {
  const text = value?.trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
