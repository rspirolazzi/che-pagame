import type { MetadataRoute } from "next";

import { DISALLOWED_PATHS, siteUrl } from "@/lib/seo";

/** robots.txt: public pages allowed, private, authentication and API blocked (feature 011). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: DISALLOWED_PATHS },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
