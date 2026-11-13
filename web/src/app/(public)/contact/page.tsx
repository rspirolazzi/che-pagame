import { ContactContent } from "@/components/ContactContent";

/** Contact (FR-008c): the public email comes from CONTACT_EMAIL (optional, read on the server). */
export default function ContactPage() {
  return <ContactContent email={process.env.CONTACT_EMAIL?.trim() || null} />;
}
