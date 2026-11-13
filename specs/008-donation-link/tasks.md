---

description: "Task list for feature 008: Donation link"
---

# Tasks: Apoyá ChePagame (donaciones)

**Input**: documentos de diseño en `specs/008-donation-link/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/donate-ui.md](contracts/donate-ui.md),
[quickstart.md](quickstart.md)

**Tests**: incluidos (Principio VII). Los tests de cada fase se escriben primero y tienen que
fallar antes de implementar.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes).
- **[Story]**: US1 (Web) o US2 (App).

## Convenciones

- Colores, espaciados y tipografía solo de la identidad (los tests `noHardcodedColors` de Web y
  App lo controlan).
- Textos en `web/src/i18n/messages/` y `mobile/src/i18n/locales/` (es/en).
- El link nunca se escribe en el código: sale de `DONATION_URL` / `EXPO_PUBLIC_DONATION_URL`.

---

## Phase 1: Setup

- [X] T001 Agregar `DONATION_URL=` y `EXPO_PUBLIC_DONATION_URL=` (vacías, con un comentario: link `https` de la página de donaciones, opcional; vacía en los builds para las tiendas) a `.env.example` en la raíz.

---

## Phase 2: User Story 1 - Apoyar el proyecto desde la Web (Priority: P1) 🎯 MVP

**Goal**: el botón en el footer, "Quiénes somos" y el Perfil, solo con un link `https` válido.

**Independent Test**: quickstart escenarios 1, 2, 3, 6 y 7.

### Tests (primero, tienen que fallar)

- [X] T002 [P] [US1] Test `web/src/__tests__/lib/donation.test.ts`: `parseDonationUrl` devuelve la dirección para `https://cafecito.app/chepagame` (también con espacios alrededor) y `null` para `undefined`, `""`, `http://…`, `javascript:alert(1)`, `ftp://…` y texto sin esquema.
- [X] T003 [P] [US1] Test `web/src/__tests__/components/DonateSection.test.tsx`: con `url`, título, frase y link con `href` igual a la dirección, `target="_blank"`, `rel` con `noopener` y `noreferrer`, `referrerpolicy="no-referrer"` y nombre accesible "Apoyá ChePagame (se abre en una pestaña nueva)"; con `url={null}` no renderiza nada; en inglés dice "Support ChePagame".
- [X] T004 [P] [US1] Ampliar `web/src/__tests__/components/LegalPage.test.tsx` (footer): `SiteFooter` con `donationUrl` muestra el link "Apoyá ChePagame"; sin él, no.

### Implementación

- [X] T005 [P] [US1] Crear `web/src/lib/donation.ts` con `parseDonationUrl(value?: string): string | null` (recorta espacios, `new URL`, solo protocolo `https:`, devuelve `url.href`).
- [X] T006 [P] [US1] Agregar el ícono `heart` a `web/src/components/ui/Icon.tsx` y las claves `donate.button`, `donate.title`, `donate.body` y `donate.newTab` en `web/src/i18n/messages/es.json` y `en.json`.
- [X] T007 [US1] Crear `web/src/components/donate/DonateLink.tsx` y `DonateSection.tsx` según [contracts/donate-ui.md](contracts/donate-ui.md), con estilos en `web/src/styles/components.css` (variables de la identidad).
- [X] T008 [US1] Usarlos: `web/src/components/SiteFooter.tsx` recibe `donationUrl` y muestra `DonateLink`; `web/src/app/layout.tsx` pasa `parseDonationUrl(process.env.DONATION_URL)` al footer en los dos armazones; `web/src/app/(public)/about/page.tsx` y `web/src/app/(private)/profile/page.tsx` agregan `DonateSection`.

**Checkpoint**: US1 funciona y se valida sola.

---

## Phase 3: User Story 2 - Apoyar el proyecto desde la App (Priority: P2)

**Goal**: la sección en el Perfil de la App, solo con el link en el build.

**Independent Test**: quickstart escenarios 4 y 5.

### Tests (primero, tienen que fallar)

- [X] T009 [P] [US2] Test `mobile/src/__tests__/utils/donation.test.ts`: los mismos casos de T002 para `parseDonationUrl`.
- [X] T010 [P] [US2] Test `mobile/src/__tests__/components/donateSection.test.tsx`: con `url`, el botón "Apoyá ChePagame" llama a `Linking.openURL` con la dirección; si `openURL` rechaza, aparece el error con `role="alert"`; con `url={null}` no renderiza nada.

### Implementación

- [X] T011 [P] [US2] Crear `mobile/src/utils/donation.ts` con `parseDonationUrl` (mismo comportamiento que T005) y las claves `donate.button`, `donate.title`, `donate.body` y `donate.openError` en `mobile/src/i18n/locales/es.json` y `en.json`.
- [X] T012 [US2] Crear `mobile/src/components/DonateSection.tsx` (título, frase, `AppButton` con ícono `heart-outline` que abre con `Linking.openURL`; `StatusNotice kind="error"` si falla) y agregarlo como sección de `mobile/src/screens/ProfileScreen.tsx` con `parseDonationUrl(process.env.EXPO_PUBLIC_DONATION_URL)`.

**Checkpoint**: US2 funciona y se valida sola.

---

## Phase 4: Polish y validación

- [X] T013 [P] Agregar a `README.md` (raíz) la sección "Donations (feature 008)": variables, que el botón no aparece sin un link `https`, y que los builds para Google Play o el App Store se compilan con `EXPO_PUBLIC_DONATION_URL` vacía (y vacía en el perfil `production` cuando exista `eas.json`).
- [X] T014 Correr en `web/` `npx jest`, `npm run lint`, `npx tsc --noEmit` y `npx next build`, y en `mobile/` `npx jest`, `npm run lint` y `npx tsc --noEmit`.
- [X] T015 Configurar el link en el `.env` (lo hace el usuario), reiniciar el contenedor de Web y recompilar o recargar la App, y validar los 7 escenarios de [quickstart.md](quickstart.md). Validación del usuario.

---

## Dependencies & Execution Order

- Setup (T001) → US1 (T002–T008) y US2 (T009–T012) en paralelo → Polish (T013–T015).
- Dentro de cada historia: tests primero; T005 y T006 antes de T007; T007 antes de T008; T011
  antes de T012.

### Oportunidades de paralelismo

- T002, T003 y T004 juntos; T005 y T006 juntos.
- T009, T010 y T011 juntos.
- US1 y US2 completas en paralelo (proyectos distintos).

## Implementation Strategy

1. T001.
2. US1 (MVP): el botón en la Web. **Parar y validar** con el link configurado.
3. US2: el Perfil de la App.
4. Polish y la validación del usuario (T015).
