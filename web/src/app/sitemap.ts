import type { MetadataRoute } from "next";

import { PUBLIC_PAGES, siteUrl } from "@/lib/seo";

/** sitemap.xml with every indexable public page (feature 011, FR-006). */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map(({ path, lastModified }) => ({
    url: `${siteUrl()}${path}`,
    lastModified,
  }));
}
