/**
 * The donation page link (feature 008), from EXPO_PUBLIC_DONATION_URL at build time. Only a valid
 * https address is used; anything else hides the section (FR-002). Store builds leave it empty.
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
