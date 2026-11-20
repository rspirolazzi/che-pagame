import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";
import { buildPageMetadata, DISALLOWED_PATHS, PUBLIC_PAGES, siteUrl } from "@/lib/seo";
import {
  faqPageJsonLd,
  organizationJsonLd,
  serializeJsonLd,
  webApplicationJsonLd,
} from "@/lib/structuredData";

const ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ENV };
});

describe("siteUrl", () => {
  it("prefers SITE_URL, then AUTH_URL, then localhost, without a trailing slash", () => {
    process.env.SITE_URL = "https://chepagame.com.ar/";
    process.env.AUTH_URL = "https://other.example";
    expect(siteUrl()).toBe("https://chepagame.com.ar");
    delete process.env.SITE_URL;
    expect(siteUrl()).toBe("https://other.example");
    delete process.env.AUTH_URL;
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});

describe("buildPageMetadata", () => {
  beforeEach(() => {
    process.env.SITE_URL = "https://chepagame.com.ar";
  });

  it("sets the canonical URL, es_AR Open Graph and a large Twitter card", () => {
    const meta = buildPageMetadata({ title: "Preguntas", description: "D", path: "/faq" });
    expect(meta.title).toBe("Preguntas");
    expect(meta.alternates?.canonical).toBe("/faq");
    expect(meta.openGraph).toMatchObject({
      locale: "es_AR",
      url: "https://chepagame.com.ar/faq",
      title: "Preguntas | ChePagame",
      images: [expect.objectContaining({ url: "/og-image.png", width: 1200, height: 630 })],
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("keeps the home title as is", () => {
    const meta = buildPageMetadata({
      title: "ChePagame: x",
      description: "D",
      path: "/",
      absoluteTitle: true,
    });
    expect(meta.title).toEqual({ absolute: "ChePagame: x" });
  });
});

describe("public pages", () => {
  it("lists exactly the indexable public pages", () => {
    expect(PUBLIC_PAGES.map((p) => p.path)).toEqual([
      "/",
      "/how-it-works",
      "/about",
      "/contact",
      "/faq",
      "/privacy",
      "/terms",
      "/delete-account",
    ]);
  });

  it.each([
    ["es", es],
    ["en", en],
  ])("has search texts of the right length in %s (FR-001)", (_lang, messages) => {
    for (const { key } of PUBLIC_PAGES) {
      const { title, description } = messages.seo[key];
      const full = key === "home" ? title : `${title} | ChePagame`;
      expect(full.length).toBeLessThanOrEqual(60);
      expect(description.length).toBeLessThanOrEqual(160);
    }
  });
});

describe("robots.txt and sitemap.xml", () => {
  beforeEach(() => {
    process.env.SITE_URL = "https://chepagame.com.ar";
  });

  it("allows the site, blocks private, auth and API paths and points to the sitemap", () => {
    const result = robots();
    expect(result.rules).toEqual({ userAgent: "*", allow: "/", disallow: DISALLOWED_PATHS });
    for (const path of ["/accounts", "/profile", "/invite", "/api", "/login", "/register"]) {
      expect(DISALLOWED_PATHS).toContain(path);
    }
    expect(result.sitemap).toBe("https://chepagame.com.ar/sitemap.xml");
  });

  it("lists every public page with an absolute URL and no private one", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(PUBLIC_PAGES.length);
    for (const entry of entries) {
      expect(entry.url.startsWith("https://chepagame.com.ar/")).toBe(true);
      expect(entry.lastModified).toBeTruthy();
      expect(DISALLOWED_PATHS.some((p) => entry.url.endsWith(p))).toBe(false);
    }
  });
});

describe("structured data", () => {
  beforeEach(() => {
    process.env.SITE_URL = "https://chepagame.com.ar";
  });

  it("describes the organization and a free finance web application", () => {
    expect(organizationJsonLd()).toMatchObject({
      "@type": "Organization",
      logo: "https://chepagame.com.ar/icons/icon-512.png",
    });
    expect(webApplicationJsonLd("desc")).toMatchObject({
      "@type": "WebApplication",
      applicationCategory: "FinanceApplication",
      inLanguage: "es-AR",
      offers: { price: "0" },
    });
  });

  it("builds FAQPage entries and escapes < in the script content", () => {
    const data = faqPageJsonLd([{ question: "¿Es gratis?", answer: "Sí </script>" }]);
    expect(data.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "¿Es gratis?",
      acceptedAnswer: { "@type": "Answer", text: "Sí </script>" },
    });
    expect(serializeJsonLd(data)).not.toContain("</script>");
  });
});
