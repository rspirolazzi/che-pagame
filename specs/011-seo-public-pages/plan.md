# Implementation Plan: SEO y páginas públicas

**Branch**: `011-seo-public-pages` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/011-seo-public-pages/spec.md`

## Summary

La Web pública gana metadatos por página (título, descripción, canónica, Open Graph/Twitter,
`noindex` en privadas y autenticación), `robots.txt`, `sitemap.xml`, una imagen de redes de
1200×630, datos estructurados JSON-LD (`Organization` + `WebApplication` en el inicio y `FAQPage`
en Preguntas frecuentes) y una página nueva `/faq`. Se reescriben Cómo funciona, Quiénes somos y
Contacto con las palabras clave acordadas. La App suma Perfil → "Acerca de" con las mismas cuatro
secciones, usando los mismos textos (copiados desde los mensajes de la Web). Todo con APIs nativas
de Next.js (`generateMetadata`, `app/robots.ts`, `app/sitemap.ts`, `opengraph-image`), sin
dependencias ni scripts de terceros.

**Nota sobre la 017**: Contacto suma un formulario en la feature 017. Esta feature solo reescribe
el texto de Contacto y deja el espacio para el formulario; si la 017 se implementa antes, la
reescritura conserva el formulario.

## Technical Context

**Language/Version**: TypeScript (Web: Next.js 16 App Router; App: Expo 56 / RN 0.85)

**Primary Dependencies**: next-intl, Expo Router, React Native Paper, react-i18next (todas en uso)

**Storage**: N/A (contenido en los mensajes es/en)

**Testing**: Jest + Testing Library en `web/` y `mobile/`; Lighthouse y Rich Results Test manuales

**Target Platform**: navegadores (SEO), Android

**Project Type**: web-app + mobile-app (sin cambios en el backend)

**Performance Goals**: Lighthouse móvil ≥ 95 SEO y ≥ 90 accesibilidad en cada página pública

**Constraints**: sin scripts de terceros salvo Turnstile en Registro y Contacto (FR-017, 017); el español es la versión indexada; las URLs no
cambian; dominio `https://chepagame.com.ar` desde `AUTH_URL`/`SITE_URL`

**Scale/Scope**: 8 páginas públicas, 1 página nueva, ≥ 12 preguntas, 4 pantallas de la App

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regla | Cumplimiento |
|---|---|
| I. Paridad Web y Mobile | ✅ "Acerca de" en la App con el mismo contenido (R7) |
| II. Internacionalización | ✅ Todo texto en es/en; buscadores sin `Accept-Language` reciben es (R2) |
| V. Strict English Rule | ✅ Código en inglés; contenido en mensajes es/en |
| VI. Privacidad | ✅ Sin Analytics, sin cookies ni scripts de terceros |
| VII. Accesibilidad y tests | ✅ FAQ con `<details>`/acordeón accesible; tests de metadatos, sitemap, robots y JSON-LD |
| VIII. Simplicidad | ✅ APIs nativas de Next.js; sin librerías de SEO |
| Panel principal: header y footer públicos | ✅ Footer suma Preguntas frecuentes; header sin cambios |

Re-check post-design: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/011-seo-public-pages/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── seo-surface.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
web/src/
├── lib/seo.ts                        # NEW: siteUrl(), pageMetadata(key, path), PUBLIC_PAGES, noindex
├── lib/structuredData.ts             # NEW: organization/webApplication/faqPage JSON-LD builders
├── components/JsonLd.tsx             # NEW: <script type="application/ld+json">
├── components/FaqList.tsx            # NEW: grouped <details> list
├── app/layout.tsx                    # metadataBase, default title template, OG defaults
├── app/robots.ts                     # NEW
├── app/sitemap.ts                    # NEW
├── app/opengraph-image.png           # NEW: 1200×630 brand image (static)
├── app/page.tsx                      # generateMetadata + JSON-LD (Organization, WebApplication)
├── app/(public)/faq/page.tsx         # NEW
├── app/(public)/{how-it-works,about,contact,privacy,terms,delete-account}/page.tsx # metadata, content
├── app/(public)/{login,register,login-code,forgot-password,verify-email}/page.tsx  # noindex
├── app/(private)/layout.tsx          # noindex for all private pages
├── app/invite/**                     # noindex
├── app/not-found.tsx                 # real 404 with noindex
├── components/SiteFooter.tsx         # + FAQ link
└── i18n/messages/{es,en}.json        # seo.*, pages.faq.*, rewritten pages.*
mobile/
├── app/(app)/about/{index,how-it-works,who-we-are,contact,faq}.tsx  # NEW stack routes
├── src/screens/about/AboutScreens.tsx # NEW: AboutMenu, HowItWorks, WhoWeAre, Contact, Faq
├── src/screens/ProfileScreen.tsx      # + "Acerca de" item
└── src/i18n/locales/{es,en}.json      # pages.* copied from web
```

**Structure Decision**: dos helpers puros (`seo.ts`, `structuredData.ts`) concentran la lógica
testeable; las páginas solo los llaman. El contenido vive en los mensajes para que la App lo
reuse.

## Complexity Tracking

Sin violaciones.
