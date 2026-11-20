import type { Metadata } from "next";

import { auth } from "@/auth";
import { ContactContent } from "@/components/ContactContent";
import { displayName } from "@/lib/displayName";
import { pageMetadata } from "@/lib/seo";
import { turnstileSiteKey } from "@/lib/turnstile";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("contact");
}

/** Contact (FR-008c, feature 017): the form, and the public email as an alternative. */
export default async function ContactPage() {
  const session = await auth();
  const user = session?.user && !session.error ? session.user : null;
  return (
    <ContactContent
      email={process.env.CONTACT_EMAIL?.trim() || null}
      siteKey={turnstileSiteKey()}
      defaults={user ? { name: displayName(user), email: user.email } : undefined}
    />
  );
}
