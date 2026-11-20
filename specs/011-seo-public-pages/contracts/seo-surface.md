# Contract: superficie pública para buscadores

## `GET /robots.txt`

```text
User-Agent: *
Allow: /
Disallow: /accounts
Disallow: /profile
Disallow: /dashboard
Disallow: /invite
Disallow: /api
Disallow: /login
Disallow: /register
Disallow: /login-code
Disallow: /forgot-password
Disallow: /verify-email

Sitemap: https://chepagame.com.ar/sitemap.xml
```

## `GET /sitemap.xml`

Una `<url>` por cada página de `PUBLIC_PAGES` con `<loc>` absoluto y `<lastmod>`. Ninguna privada
ni de autenticación.

## Cada página pública (HTML)

- `<title>` y `<meta name="description">` propios.
- `<link rel="canonical" href="https://chepagame.com.ar/<path>">`.
- `og:title`, `og:description`, `og:url`, `og:image` (1200×630), `og:locale=es_AR`,
  `og:site_name=ChePagame`, `twitter:card=summary_large_image`.
- Un solo `<h1>`.

## Páginas privadas, de autenticación, `/invite/*` y 404

- `<meta name="robots" content="noindex, nofollow">`.

## JSON-LD

- `/`: `Organization` y `WebApplication` (`FinanceApplication`, precio 0, `es-AR`).
- `/faq`: `FAQPage` con `mainEntity` = cada pregunta (`Question` + `acceptedAnswer`), texto
  idéntico al visible.
