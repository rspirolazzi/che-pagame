---

description: "Task list for feature 011: SEO and public pages"
---

# Tasks: SEO y páginas públicas

**Input**: documentos de diseño en `specs/011-seo-public-pages/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/seo-surface.md](contracts/seo-surface.md),
[quickstart.md](quickstart.md)

**Tests**: incluidos (Principio VII). Los tests de cada historia se escriben primero y fallan
antes de implementar.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: en paralelo (archivos distintos, sin dependencias pendientes).
- **[Story]**: US1 (buscadores), US2 (Preguntas frecuentes), US3 (Cómo funciona, Quiénes somos,
  Contacto), US4 (App).

## Convenciones

- Código y comentarios en inglés; textos en `web/src/i18n/messages/{es,en}.json` y
  `mobile/src/i18n/locales/{es,en}.json`, con los tests de paridad en verde.
- Español rioplatense en es; títulos ≤ 60 caracteres con " | ChePagame", descripciones ≤ 160.
- Sin dependencias nuevas ni scripts de terceros (FR-017), salvo Turnstile de la 017 en Registro y
  Contacto.

---

## Phase 1: Setup

- [X] T001 Agregar `SITE_URL` (opcional, URL pública de la Web; si falta se usa `AUTH_URL`) a `.env.example` con un comentario, y documentarla en `README.md` (sección de variables de la Web).
- [X] T002 [P] Crear `web/public/og-image.png` (1200×630, logo y colores de marca de `web/src/styles/tokens.generated.json`, texto "ChePagame — Dividí gastos con amigos") y `web/src/app/favicon.ico` (48×48) desde los íconos existentes en `web/public/icons/`.

---

## Phase 2: Foundational

- [X] T003 [P] Test unitario `web/src/__tests__/lib/seo.test.ts`: `siteUrl()` (SITE_URL, fallback AUTH_URL, fallback localhost, sin barra final); `pageMetadata("faq", "/faq")` devuelve canónica absoluta, `openGraph.locale` `es_AR`, imagen y `twitter.card` `summary_large_image`; `PUBLIC_PAGES` contiene exactamente `/`, `/how-it-works`, `/about`, `/contact`, `/faq`, `/privacy`, `/terms`, `/delete-account`; títulos y descripciones es de cada página respetan 60/160 caracteres.
- [X] T004 Implementar `web/src/lib/seo.ts`: `siteUrl()`, `PUBLIC_PAGES` (`key`, `path`, `lastModified`), `NOINDEX` (`{ index: false, follow: false }`) y `pageMetadata(key, path)` con `getTranslations("seo")` (R1, R3).
- [X] T005 En `web/src/app/layout.tsx`: `metadataBase: new URL(siteUrl())`, `title: { default: "ChePagame", template: "%s | ChePagame" }`, descripción por defecto traducida (`seo.home.description`) y `openGraph.siteName`.
- [X] T006 [P] Agregar `seo.{home,howItWorks,about,contact,faq,privacy,terms,deleteAccount}.{title,description}` en es y en, con las palabras clave de las Clarifications (dividir gastos, hacer la vaca, pagar a medias, quién le debe a quién, gastos del asado, viaje en grupo, departamento compartido, pareja) repartidas por tema.

**Checkpoint**: helpers y textos de SEO listos.

---

## Phase 3: User Story 1 - Encontrar ChePagame en buscadores (P1) 🎯 MVP

**Goal**: metadatos, canónica, redes, robots, sitemap, noindex y JSON-LD del inicio.

**Independent Test**: escenarios 1–5, 9 y 11 de [quickstart.md](quickstart.md).

### Tests

- [X] T007 [P] [US1] Test `web/src/__tests__/app/robots.test.ts`: `robots()` permite `/`, bloquea `/accounts`, `/profile`, `/dashboard`, `/invite`, `/join`, `/onboarding`, `/api`, `/login`, `/register`, `/login-code`, `/forgot-password`, `/verify-email`, y apunta a `<siteUrl>/sitemap.xml`.
- [X] T008 [P] [US1] Test `web/src/__tests__/app/sitemap.test.ts`: `sitemap()` devuelve una entrada absoluta por cada `PUBLIC_PAGES` con `lastModified`, y ninguna ruta privada ni de autenticación.
- [X] T009 [P] [US1] Test `web/src/__tests__/lib/structuredData.test.ts`: `organizationJsonLd()` y `webApplicationJsonLd()` (tipo, `FinanceApplication`, `offers.price` "0", `inLanguage` "es-AR", logo absoluto); `JsonLd` escapa `<` en la salida.
- [X] T010 [P] [US1] Test `web/src/__tests__/app/metadata.test.ts`: `generateMetadata` de cada página pública devuelve título, descripción y canónica propios; el layout `(private)` y las páginas de autenticación devuelven `robots.index === false`.

### Implementation

- [X] T011 [P] [US1] Crear `web/src/app/robots.ts` y `web/src/app/sitemap.ts` según [contracts/seo-surface.md](contracts/seo-surface.md) (R4).
- [X] T012 [P] [US1] Crear `web/src/lib/structuredData.ts` (`organizationJsonLd`, `webApplicationJsonLd`, `faqPageJsonLd(items)`) y `web/src/components/JsonLd.tsx` (R6).
- [X] T013 [US1] Agregar `generateMetadata` con `pageMetadata` a `web/src/app/page.tsx` (inicio, más `JsonLd` de Organization y WebApplication) y a `web/src/app/(public)/{how-it-works,about,contact,privacy,terms,delete-account}/page.tsx` (reemplaza el título/descripción propio de delete-account por `seo.deleteAccount`).
- [X] T014 [US1] `robots: NOINDEX` en `web/src/app/(private)/layout.tsx` y en `generateMetadata` de `web/src/app/(public)/{login,register,login-code,forgot-password,verify-email}/page.tsx`.
- [X] T015 [US1] Crear `web/src/app/not-found.tsx` con `NOINDEX`, un `<h1>` traducido (`notFound.title`) y links a inicio y Preguntas frecuentes; textos es/en.

**Checkpoint**: US1 lista; tests T007–T010 en verde.

---

## Phase 4: User Story 2 - Preguntas frecuentes (P1)

**Goal**: página `/faq` con ≥ 12 preguntas agrupadas, accesible y con `FAQPage`.

**Independent Test**: escenarios 6, 7 y 9 de [quickstart.md](quickstart.md).

### Tests

- [X] T016 [P] [US2] Test `web/src/__tests__/app/FaqPage.test.tsx`: renderiza los grupos en orden, ≥ 12 preguntas, cada una en `<details>` con `<summary>`; el `FAQPage` JSON-LD tiene las mismas preguntas y respuestas que el texto visible; un solo `<h1>`.
- [X] T017 [P] [US2] Test `web/src/__tests__/i18n/faqMessages.test.ts`: cada id de `FAQ_GROUPS` existe con `q` y `a` en es y en.

### Implementation

- [X] T018 [US2] Escribir `pages.faq` en es y en (data-model.md): grupos `basics` (qué es, es gratis, hay App), `accounts` (crear cuenta compartida, invitar, monedas), `expenses` (dividir un gasto, centavos, ingresos si la 012 ya existe), `balances` (quién le debe a quién, pago entre miembros, cerrar cuenta), `privacy` (qué datos guardamos, exportar, borrar la cuenta). Respuestas en texto plano, cortas.
- [X] T019 [US2] Crear `web/src/components/FaqList.tsx` (`FAQ_GROUPS` exportado, grupos con `<h2>` y preguntas en `<details>`) y `web/src/app/(public)/faq/page.tsx` con `generateMetadata` y `JsonLd(faqPageJsonLd(...))`.
- [X] T020 [US2] Agregar el link "Preguntas frecuentes" en `web/src/components/SiteFooter.tsx`, en el inicio (`web/src/app/page.tsx` o `HomePreview.tsx`) y al final de Cómo funciona; actualizar sus tests.

**Checkpoint**: US2 lista.

---

## Phase 5: User Story 3 - Cómo funciona, Quiénes somos y Contacto (P2)

**Goal**: contenido reescrito con palabras clave, jerarquía de títulos y links internos.

**Independent Test**: escenario 8 de [quickstart.md](quickstart.md).

- [X] T021 [P] [US3] Actualizar los tests existentes de las páginas (`web/src/__tests__/app/`) para los textos nuevos: un `<h1>`, subtítulos `<h2>`, link a Preguntas frecuentes y a las otras páginas.
- [X] T022 [US3] Reescribir `pages.howItWorks` (pasos + sección "Para qué sirve" con viaje, asado, departamento y pareja), `pages.about` (qué es, por qué existe, privacidad) y `pages.contact` (intro y remisión a FAQ) en es y en; ajustar `web/src/app/(public)/how-it-works/page.tsx`, `about/page.tsx` y `web/src/components/ContactContent.tsx` para los subtítulos y links nuevos (si la 017 ya está, conservar el formulario).

**Checkpoint**: US3 lista.

---

## Phase 6: User Story 4 - "Acerca de" en la App (P2)

**Goal**: Perfil → "Acerca de" con las cuatro secciones y el mismo contenido.

**Independent Test**: escenario 12 de [quickstart.md](quickstart.md).

- [X] T023 [P] [US4] Test `mobile/src/__tests__/screens/about.test.tsx`: el menú lista Cómo funciona, Quiénes somos, Contacto y Preguntas frecuentes; cada pantalla muestra su título; FAQ abre una respuesta al tocar la pregunta; Perfil navega a `/about`.
- [X] T024 [US4] Copiar `pages.{howItWorks,about,contact,faq}` de la Web a `mobile/src/i18n/locales/{es,en}.json` y extender el test de paridad de la App.
- [X] T025 [US4] Crear `mobile/src/screens/about/AboutScreens.tsx` (`AboutMenu`, `HowItWorksScreen`, `WhoWeAreScreen`, `ContactScreen` con el email copiable existente, `FaqScreen` con `List.Accordion` y `FAQ_GROUPS` con los mismos ids que la Web) y las rutas `mobile/app/(app)/about/{index,how-it-works,who-we-are,contact,faq}.tsx`; registrar el stack en `mobile/app/(app)/_layout.tsx`.
- [X] T026 [US4] Agregar "Acerca de" en `mobile/src/screens/ProfileScreen.tsx` (`router.push("/about")`) y actualizar los mocks de `expo-router` de los tests que lo necesiten.

**Checkpoint**: US4 lista.

---

## Phase 7: Polish

- [X] T027 Quality gates: `npm run lint`, `npx tsc --noEmit`, `npm test` y `npx prettier --check` sobre lo tocado, en `web/` y `mobile/`.
- [X] T028 README: sección "SEO (feature 011)" con `SITE_URL`, robots/sitemap y el paso de Search Console.
- [ ] T029 Validación manual del usuario: escenarios 1–13 de [quickstart.md](quickstart.md) (9–11 y 13 en producción).

---

## Dependencies

- Setup → Foundational → US1. US2 depende de T012 (`faqPageJsonLd`). US3 y US4 dependen solo de
  Foundational; US4 conviene después de US2 y US3 (copia sus textos).
- Paralelo: T007–T010; T011 y T012; T016 y T017; T021 con US2.

## Implementation Strategy

MVP = US1 (metadatos, robots, sitemap). Después US2 (mayor impacto en resultados enriquecidos),
US3 y US4.
