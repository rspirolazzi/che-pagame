import { serializeJsonLd } from "@/lib/structuredData";

/** Structured data for search engines (feature 011). */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // The content is our own JSON with "<" escaped (serializeJsonLd).
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
