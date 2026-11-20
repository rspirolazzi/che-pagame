import { LegalPage } from "@/components/LegalPage";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("terms");
}

export default function TermsPage() {
  return <LegalPage kind="terms" />;
}
