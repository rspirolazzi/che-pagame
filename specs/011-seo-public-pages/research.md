# Research: SEO y páginas públicas

## R1. Metadatos con la API nativa de Next.js

- **Decision**: `metadataBase` = URL del sitio en el layout raíz y un `title.template`
  (`"%s | ChePagame"`). Cada página pública exporta `generateMetadata()` que llama a
  `pageMetadata(key, path)` de `web/src/lib/seo.ts`: arma `title`, `description`,
  `alternates.canonical`, `openGraph` (`type: website`, `locale: es_AR`, `siteName`, imagen) y
  `twitter` (`summary_large_image`) desde `seo.<key>.title/description` en los mensajes.
- **Rationale**: es lo que Next.js recomienda; sin dependencias (Principio VIII).
- **Alternatives considered**: `next-seo` (innecesaria con App Router).

## R2. Idioma indexado

- **Decision**: no cambian las URLs. Los buscadores no envían `Accept-Language`, así que
  `negotiateLocale` devuelve `es` (ya es el default). `openGraph.locale` siempre `es_AR`; `<html
  lang>` sigue el idioma servido. Sin `hreflang` (no hay URLs en inglés).
- **Rationale**: cumple la Clarification (español indexado, inglés para personas) sin rutas
  nuevas.

## R3. URL del sitio

- **Decision**: `siteUrl()` lee `SITE_URL` y, si falta, `AUTH_URL` (ya configurada en producción);
  en desarrollo `http://localhost:3000`. Se agrega `SITE_URL` (opcional) a `.env.example`.
- **Rationale**: la canónica, el sitemap y Open Graph necesitan URLs absolutas del dominio.

## R4. robots.txt y sitemap.xml

- **Decision**: `app/robots.ts` permite `/` y bloquea `/accounts`, `/profile`, `/dashboard`,
  `/invite`, `/api`, `/login`, `/register`, `/login-code`, `/forgot-password`, `/verify-email`, y
  apunta a `/sitemap.xml`. `app/sitemap.ts` lista `PUBLIC_PAGES` (`/`, `/how-it-works`, `/about`,
  `/contact`, `/faq`, `/privacy`, `/terms`, `/delete-account`) con `lastModified` fijo por página
  (constante en `seo.ts`, se actualiza al cambiar el contenido).
- **Rationale**: una sola lista (`PUBLIC_PAGES`) alimenta sitemap y tests (SC-004).

## R5. noindex

- **Decision**: `robots: { index: false, follow: false }` en el layout `(private)`, en las páginas
  de autenticación, en `/invite/*` y en `not-found.tsx`. `notFound()` ya devuelve 404 real.
- **Rationale**: FR-004 y el edge case de páginas inexistentes.

## R6. Datos estructurados

- **Decision**: JSON-LD con un componente `JsonLd` (`<script type="application/ld+json">`,
  contenido serializado con `<` escapado). Inicio: `Organization` (nombre, url, logo) y
  `WebApplication` (`applicationCategory: FinanceApplication`, `operatingSystem: Web, Android`,
  `offers.price: 0`, `inLanguage: es-AR`). FAQ: `FAQPage` generado de la misma lista que se
  renderiza (mismo texto, FR-009).
- **Rationale**: formato recomendado por Google; generar ambos de la misma fuente evita
  diferencias.

## R7. FAQ y "Acerca de" en la App

- **Decision**: las preguntas viven en `pages.faq.groups.<group>.items.<id>.{q,a}` (es/en), con
  un orden fijo en `FAQ_GROUPS` (Web y App tienen su copia de la constante con los mismos ids, y
  un test compara los ids con los mensajes). La Web usa `<details>/<summary>` (accesible sin
  JS). La App usa `List.Accordion` de React Native Paper. Los textos de `pages.*` se copian de la
  Web a la App como en features anteriores, y un test de paridad verifica que existan las mismas
  claves.
- **Rationale**: misma fuente de contenido, sin backend (Principio I y VIII).

## R8. Imagen para redes

- **Decision**: `web/src/app/opengraph-image.png` estático de 1200×630 generado una vez a partir
  del logo y los colores de marca (script en `design/` si ya existe un pipeline de íconos; si no,
  un PNG versionado). Next.js lo publica y lo agrega a los metadatos.
- **Alternatives considered**: `ImageResponse` dinámico (más código, mismo resultado).

## R9. Favicon

- **Decision**: ya existen `app/icon.png` y `apple-icon.png`; se agrega `app/favicon.ico`
  (48×48) para la dirección estándar `/favicon.ico` (FR-007).
