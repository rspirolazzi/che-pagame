import { LegalPage } from "@/components/LegalPage";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("privacy");
}

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}
