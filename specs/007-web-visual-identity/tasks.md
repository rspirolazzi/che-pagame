---

description: "Task list for feature 007: Web visual identity"
---

# Tasks: Identidad visual y diseño de la Web

**Input**: documentos de diseño en `specs/007-web-visual-identity/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/web-ui.md](contracts/web-ui.md),
[quickstart.md](quickstart.md)

**Tests**: están incluidos. El Principio VII exige al menos un test unitario con Jest por feature, y
la constitución ("Identidad visual") exige verificar el contraste automáticamente. Los tests de
cada fase se escriben primero y tienen que fallar antes de implementar.

**Organización**: por User Story. La base (tokens, tema, tipografía y verificaciones) es
fundacional porque todas las historias la usan.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes).
- **[Story]**: la User Story a la que pertenece (US1 a US4).
- Las rutas son relativas a `web/` salvo que digan otra carpeta.

## Convenciones

- **Colores**: solo variables `--color-*` de `src/styles/tokens.generated.css`. Ningún literal de
  color en `src/` fuera de ese archivo; el test `noHardcodedColors` lo controla.
- **Acento**: solo como fondo (`.chip-accent`, pill activa) con `--color-on-accent` encima; nunca
  como `color:`.
- **Tipografía**: `var(--font-brand)` en títulos, importes y logotipo; `system-ui` en el resto.
  Importes con `font-variant-numeric: tabular-nums`.
- **Espaciado, radios y tamaño táctil**: `--space-*`, `--radius-*`, `--size-touch-target`; `rem`
  para tamaños de texto.
- **Comportamiento**: el rediseño no cambia datos, acciones, validaciones ni rutas (FR-012). Los
  tests existentes se ajustan solo en cómo encuentran un elemento; la única excepción
  documentada es el menú de usuario del header con sesión (R13).
- **Accesibilidad**: se conservan los `aria-*`, roles y textos que usan los tests y los lectores
  de pantalla.
- **Generado**: `tokens.generated.css`, los íconos del sitio y las copias de Sora no se editan a
  mano: `npm run tokens` y `npm run icons` desde `mobile/`.
- **Node y contenedor**: `export PATH="$APPDATA/nvm/v22.13.0:$PATH"`; después de cambiar rutas o
  fuentes, `docker restart chepagame-web`.

---

## Phase 1: Setup

- [X] T001 Confirmar la rama `007-web-visual-identity` (creada desde `006-mobile-visual-identity`) y que pasan `npx jest`, `npm run lint`, `npx tsc --noEmit` y `npx next build` en `web/` antes de empezar.
- [X] T002 [P] Agregar `CONTACT_EMAIL=` (vacía, con un comentario: email público de contacto, opcional) a `.env.example` en la raíz.

---

## Phase 2: Foundational (base de la identidad en la Web; base de la US4)

**Purpose**: la Web toma la paleta, el tema y la tipografía desde la fuente común, con las
verificaciones automáticas. Todo lo demás depende de esta fase.

### Tests (primero, tienen que fallar)

- [X] T003 [P] Test `src/__tests__/theme/noHardcodedColors.test.ts`: recorre `src/` (`.ts`, `.tsx`, `.css`) salvo `styles/tokens.generated.css` y `__tests__/`, y falla con archivo y línea ante `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb(`, `rgba(` o `hsl(`, o ante `color: var(--color-accent)`. Hoy falla por los colores de `globals.css`.
- [X] T004 [P] Test `src/__tests__/theme/tokens.test.ts` (entorno node): lee `../design/tokens.json` y `src/styles/tokens.generated.css`; falla si algún `--color-<rol>` claro u oscuro no coincide con el JSON (salida desactualizada) o si un par de `contrastPairs` no llega a su mínimo en algún modo, con el par, el modo y el contraste. Si `../design/tokens.json` no existe (por ejemplo, dentro del contenedor de Web), se saltea con un mensaje que lo explica.

### Implementación

- [X] T005 Ampliar `design/build-icons.ts` (raíz del repositorio) según [research.md](research.md) R3 y R5: copia `Sora-SemiBold.ttf` y `Sora-Bold.ttf` a `web/src/app/fonts/`; genera `web/src/app/icon.svg` (el ícono "Che" con el tilde, colores de los tokens), `web/src/app/apple-icon.png` (180 × 180) y `web/public/icons/icon-192.png` e `icon-512.png`. Correr `npm run icons` desde `mobile/`, borrar `web/src/app/favicon.ico` y agregar `src/app/fonts/` y los íconos generados al `.prettierignore` de la Web si hace falta.
- [X] T006 Agregar a `design/build-tokens.ts` (raíz) la salida `web/src/styles/tokens.generated.json` con los colores (igual que la de la App), incluida en `--check`, y regenerar con `npm run tokens`. Crear `src/app/manifest.ts` con `name` y `short_name` "ChePagame", `theme_color` (`primary` claro) y `background_color` (`background` claro) leídos de ese JSON, e íconos `/icons/icon-192.png` y `/icons/icon-512.png`.
- [X] T007 Cambiar `src/components/AppProviders.tsx` a `attribute="data-theme"` (R2) y quitar las reglas `html.dark` de los estilos.
- [X] T008 Cargar Sora con `next/font/local` en `src/app/layout.tsx` (pesos 600 y 700, `display: "swap"`, `variable` asignada a `--font-brand` con fallback `system-ui`).
- [X] T009 Reescribir los estilos base: `src/app/globals.css` importa `../styles/tokens.generated.css`, `../styles/base.css`, `../styles/layout.css` y `../styles/components.css`. `base.css`: fondo, texto, tipografía, links, `:focus-visible` con `--color-primary` (R12), `prefers-reduced-motion`. `components.css`: `.button`, `.button.secondary`, `.button.danger`, `.link-button`, `.card`, campos con `--color-control-border`, `.chip-accent`, `.form-error`. Mantener los nombres de clase que usan los componentes actuales, ahora con variables de la identidad. Sin ningún literal de color.
- [X] T010 Verificar que pasan T003 y T004, `npx jest`, `npm run lint`, `npx tsc --noEmit` y `npx next build`, y que la Web levantada (`docker restart chepagame-web`) ya usa la paleta y Sora en claro y oscuro sin cambiar ninguna página.

**Checkpoint**: la Web ya se ve con la paleta Celeste y sol, sin colores propios, y las
verificaciones protegen la identidad.

---

## Phase 3: Diseño aprobado (bloqueante, FR-013)

**Purpose**: el usuario aprueba las maquetas antes de rediseñar páginas. **Ninguna tarea de las
Phases 5 a 7 empieza hasta cerrar T012.**

- [X] T011 Armar y publicar como artifact privado `specs/007-web-visual-identity/mockups/web-pages.html`, con colores leídos de `design/tokens.json` y Sora: Inicio (con las secciones de FR-008), login, Dashboard, la Cuenta en Gastos y en Saldos (dos columnas en escritorio), formulario de gasto y Perfil, cada una en escritorio (1280px) y celular (375px), en claro y oscuro, con el header público, la barra lateral y el menú compacto abierto; y una vista de "Cómo funciona" con los 4 pasos.
- [X] T012 Registrar la aprobación en `specs/007-web-visual-identity/mockups/README.md` (maquetas aprobadas, ajustes pedidos, fecha) y pedir al usuario el email de contacto para `CONTACT_EMAIL` (o que quede vacío). Si pide cambios, actualizar T011 y volver a pedir aprobación.

**Checkpoint**: diseño aprobado.

---

## Phase 4: User Story 4 - Una sola fuente de identidad, también en la Web (Priority: P2)

**Goal**: un cambio en la fuente común llega a la App y a la Web; la verificación rechaza colores
escritos a mano y contrastes insuficientes.

**Independent Test**: los casos de la US4 en la spec.

- [X] T013 [US4] Probar los tres casos de la US4 y dejar el resultado en una sección "Verificaciones de la fuente común" al final de `specs/007-web-visual-identity/quickstart.md`: cambiar `primary` en `design/tokens.json` y regenerar cambia la Web (y `tokens.test.ts` detecta el CSS viejo antes de regenerar); un color escrito a mano en un componente hace fallar `noHardcodedColors.test.ts`; un par sin contraste hace fallar el generador. Revertir los cambios de prueba.
- [X] T014 [P] [US4] Actualizar la sección "Visual identity" de `README.md` (raíz): la Web usa la misma fuente, `npm run icons` también genera los íconos del sitio y copia Sora, `CONTACT_EMAIL` opcional.

**Checkpoint**: US4 completa.

---

## Phase 5: User Story 2 - Entender los saldos de un vistazo (Priority: P1) 🎯 MVP visible

**Goal**: saldos, pendientes, errores y solo lectura se entienden sin depender del color.

**Independent Test**: Dashboard y Saldos con todos los estados, en claro, oscuro y escala de
grises (quickstart escenario 5).

### Tests (primero, tienen que fallar)

- [X] T015 [P] [US2] Test `src/__tests__/components/AmountText.test.tsx`: positivo con "+", "Te deben" (o "Le deben" con `subject="other"`), nombre accesible "A favor" y la clase de color positiva; negativo con "−", "Debés"/"Debe" y "En contra"; cero con tilde, "Estás al día"/"Al día", estilo neutro; `subject="none"` muestra solo el importe; la frase sale de `formatMoney`.
- [X] T016 [P] [US2] Test `src/__tests__/components/StatusNotice.test.tsx`: `warning`, `error`, `readOnly` e `info` con ícono, nombre accesible y texto; `error` con `role="alert"`; la acción opcional es un botón.

### Implementación

- [X] T017 [P] [US2] Crear `src/components/ui/Icon.tsx` con el set de íconos SVG de [research.md](research.md) R8 (`aria-hidden`, `currentColor`, tamaño en `em`).
- [X] T018 [US2] Crear `src/components/ui/AmountText.tsx` y `src/components/ui/StatusNotice.tsx` según [contracts/web-ui.md](contracts/web-ui.md) §2, con sus estilos en `src/styles/components.css`, y las claves `a11y.*` y `balances.suggested` en `src/i18n/messages/es.json` y `en.json`.
- [X] T019 [US2] Rediseñar según las maquetas `src/components/balances/BalanceSummary.tsx` (tarjeta destacada por moneda con `AmountText size="lg"`) y `src/components/balances/BalanceList.tsx` (filas con `AmountText`; pendientes con `StatusNotice kind="warning"` y "Pendiente de asignación").
- [X] T020 [US2] Rediseñar `src/components/balances/SuggestionList.tsx` (chip "Sugerido" con `.chip-accent`, importe con la tipografía de la marca, "Marcar como pagado" principal) y `src/components/balances/SettlementList.tsx` (reembolso excluido con `StatusNotice kind="info"`), y que `FormMessage.tsx` muestre los errores con `StatusNotice kind="error"`.
- [X] T021 [US2] Ajustar `src/__tests__/components/BalanceList.test.tsx`, `BalanceSummary.test.tsx`, `SuggestionList.test.tsx` y `SettlementList.test.tsx` solo en cómo encuentran los elementos, si hace falta, y correr `npx jest`.

**Checkpoint**: US2 funciona y se puede validar sola.

---

## Phase 6: User Story 1 - La Web se ve como ChePagame (Priority: P1)

**Goal**: todas las páginas rediseñadas con la identidad, el armazón nuevo y el contenido nuevo,
con el mismo comportamiento.

**Independent Test**: quickstart escenarios 1 a 4, 9, 10 y 11.

### Tests (primero, tienen que fallar)

- [X] T022 [P] [US1] Test `src/__tests__/components/SideNav.test.tsx`: Inicio, Cuentas y Perfil con ícono y texto y sus `href` (`/dashboard`, `/accounts`, `/profile`); el activo con `aria-current="page"`; "Más" con las páginas informativas; Salir como botón. Reemplaza las verificaciones del menú de usuario de `SiteHeader.test.tsx` (R13).
- [X] T023 [P] [US1] Test `src/__tests__/components/Logo.test.tsx`: link con nombre accesible "ChePagame" al `href` dado; contiene "Che" y "Pagame".
- [X] T024 [P] [US1] Tests `src/__tests__/components/CopyEmail.test.tsx` (copia con `navigator.clipboard`; si falla, selecciona el texto; link `mailto:`) y `src/__tests__/components/ContactPage.test.tsx` (con y sin `CONTACT_EMAIL`: sin dirección muestra el texto neutro, nunca una dirección vacía).

### Armazón y marca

- [X] T025 [US1] Crear `src/components/ui/Logo.tsx` (R4) y `src/components/PublicHeader.tsx` (logotipo; Inicio, Cómo funciona, Quiénes somos, Contacto, Login / Registro), y separar `SiteFooter` en `src/components/SiteFooter.tsx` rediseñado.
- [X] T026 [US1] Crear `src/components/SideNav.tsx` y `src/components/AppShell.tsx` (barra lateral fija y contenido; grupo "Más" con las páginas informativas; Salir con la acción de logout existente) con las claves `nav.*` nuevas en es/en.
- [X] T027 [US1] Cambiar `src/app/layout.tsx`: sin sesión, `PublicHeader` + contenido + `SiteFooter`; con sesión, `AppShell` (también en las páginas informativas) + `SiteFooter`; link "Saltar al contenido" al principio. Borrar `src/components/SiteHeader.tsx` y mover a `PublicHeader.test.tsx` las verificaciones sin sesión de `SiteHeader.test.tsx`. Sumar a `PublicHeader.test.tsx` que el primer elemento enfocable es el link "Saltar al contenido" y apunta a `#main`.

### Componentes compartidos

- [X] T028 [P] [US1] Rediseñar los componentes de Cuentas: `src/components/accounts/AccountList.tsx` (tarjetas con ícono, nombre, detalle, `AmountText` e insignia "Cerrada"), `AccountTabs.tsx` (pestañas con indicador), `AccountDetail.tsx`, `AccountForm.tsx`, `AccountEditForm.tsx`, `AccountActions.tsx` (acciones destructivas con `.button.danger`), `ParticipantList.tsx`, `InvitePanel.tsx`, `JoinAccountForm.tsx`, `JoinByCodeForm.tsx`, `ConfirmDialog.tsx` y `AccountIcon.tsx`.
- [X] T029 [P] [US1] Rediseñar los componentes de Gastos: `src/components/expenses/ExpenseList.tsx` (filas con categoría, concepto, pagó o pendiente con ícono, importe tabular), `ExpenseDetail.tsx`, `ExpenseForm.tsx`, `ExpenseHistory.tsx`, `CategoryIcon.tsx`, y `src/components/balances/SettlementForm.tsx`, `MarkPaidDialog.tsx`, `src/components/exports/ExportButton.tsx` (errores con `StatusNotice`).
- [X] T030 [P] [US1] Rediseñar los formularios de acceso y perfil: `LoginForm.tsx`, `RegisterForm.tsx`, `VerifyEmailForm.tsx`, `CodeSignInFlow.tsx`, `CodeInput.tsx`, `GoogleSignInButton.tsx`, `OnboardingCurrencyForm.tsx`, `CurrencySelect.tsx`, `ProfileForms.tsx` y `LogoutButton.tsx` en `src/components/`.

### Páginas (según las maquetas aprobadas)

- [X] T031 [US1] Rediseñar `src/app/(private)/dashboard/page.tsx` (saludo, `BalanceSummary`, Cuentas recientes y "Nueva Cuenta"), `src/app/(private)/accounts/page.tsx` y `src/app/(private)/accounts/new/page.tsx`.
- [X] T032 [US1] Rediseñar la Cuenta con dos columnas desde 1024px (FR-013a, R11): `src/app/(private)/accounts/[accountId]/page.tsx` (lista a la izquierda; total, cantidad, pendientes y exportar a la derecha) y `src/app/(private)/accounts/[accountId]/balances/page.tsx` (saldos a la izquierda; sugerencias y reembolsos a la derecha), con un encabezado común de la Cuenta (volver, ícono, nombre, moneda, "Cerrada", configuración) y `.page-grid` en `src/styles/layout.css`. Con la Cuenta cerrada, Gastos, Saldos y configuración muestran `StatusNotice kind="readOnly"` con "Esta Cuenta está cerrada: es de solo lectura." (FR-010, US2 escenario 3).
- [X] T033 [P] [US1] Rediseñar `src/app/(private)/accounts/[accountId]/settings/page.tsx`, `expenses/new/page.tsx`, `expenses/[expenseId]/page.tsx`, `expenses/[expenseId]/edit/page.tsx` y `settlements/new/page.tsx` (bajo `src/app/(private)/accounts/[accountId]/`), y `src/app/(private)/invite/[code]/page.tsx`, `join/page.tsx`, `onboarding/currency/page.tsx` y `profile/page.tsx` (secciones en tarjetas; exportación).
- [X] T034 [P] [US1] Rediseñar las páginas de acceso: `src/app/(public)/login/page.tsx`, `register/page.tsx`, `verify-email/page.tsx`, `login-code/page.tsx` y `forgot-password/page.tsx`.

### Contenido

- [X] T035 [US1] Rediseñar `src/app/page.tsx` (Inicio) con las secciones de FR-008: hero con `Logo`, slogan y "Empezar" o "Ir a mis Cuentas" con sesión; tres beneficios con `Icon`; vistazo de saldos con `AmountText` y datos de ejemplo con la etiqueta "Ejemplo"; link a "Cómo funciona". Claves `home.*` nuevas en es/en.
- [X] T036 [US1] Contenido y diseño de las páginas informativas: `src/app/(public)/how-it-works/page.tsx` (4 pasos ilustrados con `Icon`), `about/page.tsx` (párrafo nuevo), `contact/page.tsx` (lee `process.env.CONTACT_EMAIL` en el servidor; `CopyEmail` o el texto neutro), y `src/components/InfoPage.tsx` y `LegalPage.tsx` rediseñados. Crear `src/components/ui/CopyEmail.tsx`. Claves `pages.*` nuevas en es/en.
- [X] T037 [US1] Ajustar los tests existentes de `src/__tests__/` solo en cómo encuentran los elementos reorganizados (salvo la excepción documentada de T022 y T027), y correr `npx jest`, `npm run lint`, `npx tsc --noEmit` y `npx next build`.

**Checkpoint**: US1 completa; con US2, todas las páginas tienen la identidad.

---

## Phase 7: User Story 3 - Usar la Web en el celular y con teclado (Priority: P2)

**Goal**: celular, texto al 200% y teclado sin pérdidas.

**Independent Test**: quickstart escenarios 6 a 8.

- [X] T038 [P] [US3] Tests de teclado: `src/__tests__/components/CompactMenu.test.tsx` (el botón "Menú" abre el panel con `aria-expanded="true"`, Escape lo cierra y devuelve el foco al botón, elegir un destino lo cierra) y, en `src/__tests__/components/ConfirmDialog.test.tsx` y un test nuevo de `MarkPaidDialog`, que Escape cierra el diálogo sin confirmar (FR-016).
- [X] T039 [US3] Crear `src/components/CompactMenu.tsx` y usarlo en `PublicHeader.tsx` y `AppShell.tsx` por debajo de 768px (R6), con las reglas de `src/styles/layout.css`.
- [X] T040 [US3] Revisar `src/styles/layout.css` y `components.css` para 320px a 1440px y texto al 200%: `rem`, `flex-wrap`, `minmax(0, …)`, sin anchos fijos que provoquen desplazamiento horizontal, tablas y listas que pasan a una columna, y `min-height: var(--size-touch-target)` en botones y links de navegación en celular. Sumar a `src/__tests__/theme/noHardcodedColors.test.ts` (o un test hermano `touchTargets.test.ts`) la comprobación de que `src/styles/components.css` aplica `--size-touch-target` a `.button` y `src/styles/layout.css` a los links de navegación dentro de la media query de celular (FR-017).
- [X] T041 [US3] Recorrer las páginas en el navegador integrado a 320px, 375px, 768px y 1280px (claro y oscuro) y con zoom al 200%, y corregir lo que se corte o desborde; recorrer con teclado Inicio, login, Dashboard, la Cuenta y el formulario de gasto, y corregir el orden o el foco donde falle; abrir Inicio y login con JavaScript desactivado y comprobar que se leen con la identidad (edge case "Sin JavaScript").

**Checkpoint**: US3 completa.

---

## Phase 8: Polish y validación

- [X] T042 Correr en `web/` `npx jest`, `npm run lint`, `npx tsc --noEmit` y `npx next build`, y en `mobile/` `npm run tokens:check` y `npx jest` (la fuente común no debe haber cambiado para la App).
- [X] T043 [P] Quitar el comentario "Sync Impact Report" del principio de `.specify/memory/constitution.md` antes del commit de la feature.
- [X] T044 Reiniciar el contenedor (`docker restart chepagame-web`) y validar los 11 escenarios manuales de [quickstart.md](quickstart.md). Validación del usuario.

---

## Dependencies & Execution Order

- **Setup (1)** → **Foundational (2)** → **Diseño aprobado (3)** → historias → **Polish (8)**.
- **US4 (Phase 4)** depende solo de la Phase 2; puede ir en paralelo con la Phase 3.
- **US2 (5)**, **US1 (6)** y **US3 (7)** dependen de la aprobación (T012).
- **US2** antes que **US1**: las páginas usan `AmountText`, `StatusNotice` e `Icon`.
- **US3** después del armazón de US1 (T025 a T027), porque el menú compacto vive en el header y
  la barra lateral.
- Dentro de cada fase, los tests primero. T005 → T006 (el manifest usa la salida JSON). T025 →
  T026 → T027. T035 y T036 necesitan `Logo`, `Icon` y `AmountText`.

### Oportunidades de paralelismo

- Phase 2: T003 y T004 juntos.
- Phase 5: T015, T016 y T017 juntos.
- Phase 6: T022, T023 y T024 juntos; T028, T029 y T030 juntos; T033 y T034 juntos.

## Parallel Example: User Story 1

```text
Juntas, después de T027:
T028 Componentes de Cuentas
T029 Componentes de Gastos, reembolsos y exportación
T030 Formularios de acceso y perfil
```

## Implementation Strategy

### MVP

1. Phases 1 y 2: la Web ya usa la paleta y Sora, con las verificaciones.
2. Phase 3: maquetas aprobadas y email de contacto definido.
3. Phase 5 (US2): saldos y estados sin depender del color. **Parar y validar** el Dashboard y
   Saldos.

### Incremental

4. Phase 6 (US1): armazón, todas las páginas y el contenido nuevo.
5. Phase 7 (US3): celular, texto al 200% y teclado.
6. Phase 4 (US4) en cualquier momento después de la Phase 2.
7. Phase 8: verificaciones y la validación manual del usuario (T044).
