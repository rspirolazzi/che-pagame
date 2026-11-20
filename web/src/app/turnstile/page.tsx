import type { Metadata } from "next";

import { TurnstileEmbed } from "@/components/TurnstileEmbed";
import { NOINDEX } from "@/lib/seo";
import { turnstileSiteKey } from "@/lib/turnstile";

export const metadata: Metadata = { robots: NOINDEX };
// The key is read at request time, never at build time (feature 017, R5).
export const dynamic = "force-dynamic";

/**
 * Only the anti-bot check, for the App's WebView (feature 017, R7): Cloudflare requires the
 * site's own domain, so the App loads this page instead of a second integration.
 */
export default function TurnstilePage() {
  return <TurnstileEmbed siteKey={turnstileSiteKey()} />;
}
