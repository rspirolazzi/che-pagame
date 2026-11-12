---

description: "Task list for feature 006: Mobile visual identity"
---

# Tasks: Identidad visual y diseño de la App Mobile

**Input**: documentos de diseño en `specs/006-mobile-visual-identity/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/tokens.md](contracts/tokens.md),
[quickstart.md](quickstart.md)

**Tests**: están incluidos. El Principio VII exige al menos un test unitario con Jest por feature, y
la constitución v4.5.0 ("Identidad visual") exige verificar el contraste automáticamente. Los tests
de cada fase se escriben primero y tienen que fallar antes de implementar.

**Organización**: las tareas están agrupadas por User Story, para implementar y probar cada una por
separado. La fuente común (base de la US4) es fundacional porque todas las demás la usan.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes).
- **[Story]**: la User Story a la que pertenece (US1 a US4).
- Cada tarea indica la ruta exacta del archivo. Las rutas de Mobile son relativas a `mobile/`.

## Convenciones

- **Colores**: solo desde el tema (`theme.colors.*` o `useAppColors()`). Ningún literal de color
  fuera de `mobile/src/theme/`; el test `noHardcodedColors` lo controla.
- **Tipografía**: variantes de `Text` de Paper (`displaySmall`, `headlineMedium`, `titleLarge`...)
  y los estilos de importe del tema; nunca `fontFamily` suelto en una pantalla.
- **Espaciado y radios**: desde `tokens.spacing` y `tokens.radius`; nada de números mágicos para
  márgenes o bordes.
- **Tamaño táctil**: los botones de las pantallas usan `AppButton` (alto mínimo
  `tokens.size.touchTarget`, 48 dp), no el `Button` de Paper directo; los botones de ícono usan
  `size` y área táctil de 48 dp.
- **Acento**: solo como fondo de un destacado con `onAccent` encima; nunca como color de texto.
- **Accesibilidad**: el rediseño conserva cada `accessibilityLabel`, `accessibilityRole` y texto que
  hoy usan los tests y los lectores de pantalla (FR-020).
- **Comportamiento**: el rediseño no cambia datos, acciones, validaciones ni rutas (FR-016). Los
  tests existentes se ajustan solo en cómo encuentran un elemento (SC-004).
- **Idioma**: código en inglés; textos nuevos en `src/i18n/locales/es.json` y `en.json`.
- **Generado**: `src/theme/tokens.generated.ts` y `web/src/styles/tokens.generated.css` no se
  editan a mano; se regeneran con `npm run tokens`.
- **Node**: `export PATH="$APPDATA/nvm/v22.13.0:$PATH"` antes de los comandos en Git Bash.

---

## Phase 1: Setup

**Purpose**: confirmar el punto de partida y preparar scripts y dependencia de desarrollo.

- [ ] T001 Confirmar la rama `006-mobile-visual-identity` (creada desde `main`) y que pasan `npx jest`, `npm run lint` y `npx tsc --noEmit` en `mobile/` antes de empezar.
- [ ] T002 [P] Agregar `@resvg/resvg-js` como dependencia de desarrollo con versión fija en `mobile/package.json`, y los scripts `tokens` (`node --experimental-strip-types ../design/build-tokens.ts`), `tokens:check` (lo mismo con `--check`) e `icons` (`node --experimental-strip-types ../design/build-icons.ts`).

---

## Phase 2: Foundational (fuente común y tema; base de la US4)

**Purpose**: la identidad en un solo lugar, el generador con la verificación de contraste y el tema
de Paper alimentado por los tokens. Todo lo demás depende de esta fase.

### Tests (primero, tienen que fallar)

- [ ] T003 [P] Test de contraste en `src/__tests__/theme/contrast.test.ts`: recorre `tokens.contrastPairs` en `light` y `dark` y falla con "`<fg> on <bg> (<mode>) is X:1, minimum Y:1`" si alguno no llega (4,5 texto, 3 controles).
- [ ] T004 [P] Test de colores escritos a mano en `src/__tests__/theme/noHardcodedColors.test.ts`: recorre `src/` y `app/` (sin `src/theme/` ni `src/__tests__/`) buscando `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb(`, `rgba(` y `hsl(`, y lista archivo y línea de cada hallazgo. Hoy falla por los dos `#c62828`. En el mismo test, fallar también si `accent` (de `useAppColors()` o del tema) se asigna a una prop o estilo de color de texto (`color`, `textColor`), con archivo y línea (FR-017).
- [ ] T005 [P] Test del mapeo del tema en `src/__tests__/theme/appTheme.test.ts`: `lightTheme.colors.primary` es `tokens.color.light.primary`, `error` es `negative`, `outline` es `controlBorder`, `outlineVariant` es `border`, `background` y `surface` coinciden, `custom.positive`/`negative`/`warning` existen en ambos temas, y `useAppTheme("system")` sigue `useColorScheme()`.

### Implementación

- [ ] T006 Crear `design/tokens.json` con `version: 1`, los 14 roles de color de [data-model.md](data-model.md) para `light` y `dark` (valores `#RRGGBB` en mayúsculas, incluidos `controlBorder` `#748899` / `#647A8C` y `scrim`), los 16 pares de contraste declarados, `typography` (con `brandFamily` provisorio `"System"` hasta la aprobación de T014), `spacing` (`xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 24`, `xxl 32`), `radius` (`sm 8`, `md 14`, `lg 22`, `full 999`) y `size` (`touchTarget 48`).
- [ ] T007 Crear `design/build-tokens.ts` según [contracts/tokens.md](contracts/tokens.md) §1: valida roles iguales en ambos modos, formato `#RRGGBB` y contraste WCAG 2.x de cada par; escribe `mobile/src/theme/tokens.generated.ts` (§2) y `web/src/styles/tokens.generated.css` (§3) con el encabezado "Generated ... Do not edit by hand"; con `--check` no escribe y falla si las salidas commiteadas difieren. Código de salida 1 ante cualquier error.
- [ ] T008 Correr `npm run tokens` desde `mobile/` y commitear las dos salidas generadas: `mobile/src/theme/tokens.generated.ts` y `web/src/styles/tokens.generated.css` (sin importarlo en la Web).
- [ ] T009 Reescribir `src/theme/index.ts`: `AppTheme = MD3Theme & { custom }`, `lightTheme` y `darkTheme` armados desde `tokens` con el mapeo de [research.md](research.md) R3 (incluidos `elevation.level1..5` derivados de `surface` y `roundness` desde `tokens.radius.sm`), `useAppTheme(preference)` como hoy y `useAppColors()` sobre `useTheme<AppTheme>()`. Quitar los colores `#1f6feb` y `#58a6ff`.
- [ ] T010 Reemplazar los dos `textColor="#c62828"` por `theme.colors.error` en `src/screens/accounts/AccountDetailScreen.tsx` y `src/screens/expenses/ExpenseDetailScreen.tsx`.
- [ ] T011 Hacer que `src/__tests__/support/render.tsx` envuelva con `lightTheme` en el `PaperProvider`, para que los componentes que usan `useAppColors()` funcionen en los tests.
- [ ] T012 Barras del sistema en `app/_layout.tsx`: `StatusBar` de `expo-status-bar` con `style` según el modo efectivo y `SystemUI.setBackgroundColorAsync(theme.colors.background)` al cambiar de modo (FR-007).

**Checkpoint**: T003–T005 pasan; `npm run tokens:check` pasa; la App ya muestra los colores de la
identidad en los componentes de Paper sin tocar las pantallas.

---

## Phase 3: Diseño aprobado (bloqueante, FR-014a)

**Purpose**: que el usuario apruebe maquetas, logo y tipografía antes de implementar pantallas.
**Ninguna tarea de las Phases 5 y 6 empieza hasta cerrar T014.**

- [ ] T013 Armar y publicar como artifact privado la página de maquetas en `specs/006-mobile-visual-identity/mockups/mobile-screens.html`, con colores leídos de `design/tokens.json`: login (logo, nombre, slogan), Dashboard, la Cuenta con Gastos y con Saldos, formulario de gasto y Perfil, en claro y oscuro, con la barra inferior; 2 o 3 propuestas de logo (símbolo y logotipo); un selector para ver las pantallas con Sora, Outfit y Bricolage Grotesque en títulos e importes; y una vista del Dashboard y de Saldos con el texto al 150%, para revisar que los importes y nombres largos pasan de línea sin cortarse (FR-019).
- [ ] T014 Registrar la aprobación del usuario en `specs/006-mobile-visual-identity/mockups/README.md`: maquetas aprobadas (con los ajustes pedidos), logo elegido y tipografía elegida, con fecha. Si el usuario pide cambios, actualizar T013 y volver a pedir aprobación.

**Checkpoint**: diseño, logo y tipografía aprobados por el usuario.

---

## Phase 4: User Story 4 - Una sola fuente de identidad para App y Web (Priority: P2)

**Goal**: cambiar un valor en un solo lugar lo cambia en toda la App, y la verificación rechaza
contrastes insuficientes y colores escritos a mano.

**Independent Test**: escenarios de la US4 en la spec (cambiar el principal, romper un par,
escribir un color a mano) más `npm run tokens:check`.

- [ ] T015 [US4] Probar a mano los tres casos de la US4 y dejar el resultado en una sección "Verificaciones de la fuente común" al final de `specs/006-mobile-visual-identity/quickstart.md`: cambiar `primary` en `design/tokens.json` y regenerar cambia toda la App; poner `textMuted` con poco contraste hace fallar `npm run tokens` y `contrast.test.ts`; escribir `#ff0000` en una pantalla hace fallar `noHardcodedColors.test.ts`. Revertir los cambios de prueba.
- [ ] T016 [P] [US4] Agregar al `README.md` de la raíz una sección "Visual identity (feature 006)": dónde está `design/tokens.json`, cómo regenerar (`npm run tokens`), cómo verificar (`npm run tokens:check`), que las salidas no se editan a mano y que la Web las adopta en la 007.

**Checkpoint**: US4 completa (la fuente común quedó lista también para la Web).

---

## Phase 5: User Story 2 - Entender los saldos de un vistazo (Priority: P1) 🎯 MVP visible

**Goal**: a favor, en contra, al día y pendientes se distinguen por color y además por texto, signo
o ícono, en el Dashboard y en Saldos.

**Independent Test**: Dashboard y pestaña Saldos con todos los estados, en claro, oscuro y escala
de grises (quickstart escenario 6).

### Tests (primero, tienen que fallar)

- [ ] T017 [P] [US2] Test de `AmountText` en `src/__tests__/components/amountText.test.tsx`: positivo muestra "+", "Te deben" (o "Le deben" con `subject="other"`), el color `positive` y un ícono con nombre accesible; negativo muestra "−", "Debés"/"Debe" y `negative`; cero muestra "Estás al día"/"Al día" en estilo neutro; el importe sale de `formatMoney`.
- [ ] T018 [P] [US2] Test de `StatusNotice` en `src/__tests__/components/statusNotice.test.tsx`: `warning`, `error`, `readOnly` e `info` muestran ícono + texto con su color; `error` tiene `accessibilityRole="alert"`; la `action` opcional se renderiza como botón.

### Implementación

- [ ] T019 [P] [US2] Crear `src/components/AmountText.tsx` según [contracts/tokens.md](contracts/tokens.md) §5: reutiliza `balanceText`, `amountSign` y `absAmount`; íconos `arrow-down-left` (a favor), `arrow-up-right` (en contra) y `check` (al día) de MaterialCommunityIcons; cifras tabulares con el estilo de importe del tema.
- [ ] T020 [P] [US2] Crear `src/components/StatusNotice.tsx` con los cuatro `kind` y los íconos `alert-circle-outline` (aviso), `alert-octagon-outline` (error), `lock-outline` (solo lectura) e `information-outline` (info).
- [ ] T021 [US2] Rediseñar según las maquetas `src/components/balances/BalanceSummary.tsx` (tarjeta destacada "Te deben" / "Debés" por moneda con `AmountText variant="large"`) y `src/components/balances/BalanceList.tsx` (filas con `AmountText`; el aviso de pendientes con `StatusNotice kind="warning"` y el texto "Pendiente de asignación" más su acción "Completarlos en Gastos").
- [ ] T022 [US2] Rediseñar según las maquetas `src/components/balances/SuggestionList.tsx` (chip "Sugerido" con `accent`/`onAccent`, importe con `AmountText`, botón principal "Marcar como pagado") y `src/components/balances/SettlementList.tsx` (el reembolso excluido por participante quitado con `StatusNotice kind="info"`).
- [ ] T023 [US2] Agregar a `src/i18n/locales/es.json` y `en.json` los nombres accesibles nuevos de íconos de estado (`a11y.owed`, `a11y.owes`, `a11y.settled`, `a11y.warning`, `a11y.error`, `a11y.readOnly`) y ajustar `src/__tests__/screens/balances.test.tsx`, `dashboardBalances.test.tsx` y `suggestions.test.tsx` solo en cómo encuentran los elementos, si hace falta.

**Checkpoint**: US2 funciona y se puede validar sola: los saldos se entienden sin color. Antes de
seguir con la US1, ver el Dashboard y Saldos en el teléfono con el texto del sistema al 150% y en
escala de grises (quickstart escenarios 6 y 10, solo esas pantallas); si algo se corta, corregir el
patrón en `AmountText` y `BalanceSummary` antes de aplicarlo al resto.

---

## Phase 6: User Story 1 - La App se ve como ChePagame (Priority: P1)

**Goal**: todas las pantallas rediseñadas con la identidad, la tipografía de la marca y la barra
inferior, en claro, oscuro y según el dispositivo, con el mismo comportamiento.

**Independent Test**: quickstart escenarios 1 a 5 y 7.

### Tests (primero, tienen que fallar)

- [ ] T024 [P] [US1] Test de la barra en `src/__tests__/components/appTabBar.test.tsx`: muestra Inicio, Cuentas y Perfil con ícono y texto; marca el destino activo con `accessibilityState.selected`; tocar un destino navega; tocar el activo vuelve a su pantalla principal. Y test de tamaño táctil en `src/__tests__/components/touchTargets.test.tsx`: cada destino de la barra y `AppButton` tienen alto mínimo de `tokens.size.touchTarget` (48) (FR-018).
- [ ] T025 [P] [US1] Test de cambio de tema en `src/__tests__/theme/themeSwitch.test.tsx`: con un formulario con texto cargado, cambiar `preferences.theme` de `light` a `dark` cambia los colores del `PaperProvider` y el texto cargado sigue en el campo.

### Tipografía (con la elección de T014)

- [ ] T026 [US1] Copiar los dos pesos aprobados (semibold y bold) de la tipografía elegida y su `OFL.txt` a `assets/fonts/`, actualizar `typography.brandFamily` y `brandWeights` en `design/tokens.json`, regenerar con `npm run tokens` y registrar las fuentes con el config plugin de `expo-font` en `app.config.ts`.
- [ ] T027 [US1] Crear `src/theme/fonts.ts` con `configureFonts` de Paper: marca en `display*`, `headline*` y `title*`; sistema en `body*` y `label*`; estilos `amount` y `amountLarge` con `fontVariant: ["tabular-nums"]`. Usarlo en `lightTheme` y `darkTheme` de `src/theme/index.ts`.

### Navegación

- [ ] T028 [US1] Crear `src/components/AppTabBar.tsx` con `BottomNavigation.Bar` de Paper para la prop `tabBar` de `Tabs`, con íconos `home-variant-outline`, `account-group-outline` y `account-circle-outline` (variantes rellenas al estar activos) y etiquetas nuevas `nav.tabHome` ("Inicio" / "Home"), `nav.tabAccounts` ("Cuentas" / "Accounts") y `nav.tabProfile` ("Perfil" / "Profile") en `src/i18n/locales/es.json` y `en.json` (las claves `nav.accounts` y `nav.profile` existentes dicen "Accounts" y "Profile" también en español porque son las del menú de la Web, y no se tocan).
- [ ] T029 [US1] Primero, una prueba mínima: crear solo `app/(app)/(tabs)/_layout.tsx` y `app/(app)/(tabs)/accounts/[accountId]/index.tsx`, dejar `app/(app)/accounts/[accountId]/expenses/new.tsx` fuera del grupo y confirmar con `npx expo start` y un test de navegación que `/accounts/{id}` muestra la barra y `/accounts/{id}/expenses/new` no. Si expo-router no resuelve el directorio `accounts/` repartido entre dos grupos, usar la alternativa de [research.md](research.md) R5 (ocultar la barra en esas pantallas) y anotarlo en research. Después, reorganizar las rutas según [plan.md](plan.md) (Source Code) sin cambiar URLs: crear `app/(app)/(tabs)/_layout.tsx` (`Tabs` + `AppTabBar`), mover `app/(app)/index.tsx` y `profile.tsx` a `app/(app)/(tabs)/`, mover Mis Cuentas, crear Cuenta, unirse, la Cuenta, Saldos, configuración y detalle de gasto a `app/(app)/(tabs)/accounts/` con su `_layout.tsx` (`Stack`), y dejar en `app/(app)/` los formularios de gasto (nuevo y editar), de reembolso y `onboarding-currency.tsx`. Actualizar `app/(app)/_layout.tsx`.
- [ ] T030 [US1] Verificar que `chepagame://invite/<code>`, `router.push("/accounts/new")`, `/accounts/{id}/expenses/new` y el regreso tras sesión vencida (`app/_layout.tsx`) siguen funcionando; ajustar `src/__tests__/screens/appScreens.test.tsx` y `join.test.tsx` solo en cómo navegan si hace falta.

### Componentes compartidos

- [ ] T031 [P] [US1] Crear `src/components/AppButton.tsx` (envuelve el `Button` de Paper con `contentStyle` de alto mínimo `tokens.size.touchTarget` y los modos `contained`, `outlined` y `text`, más `tone="danger"` que usa `theme.colors.error`). Rediseñar `src/components/FormBits.tsx` (campos `outlined` con `controlBorder`, errores con `StatusNotice kind="error"`, `CodeInput`), `src/components/CurrencyPicker.tsx` y `src/components/GoogleSignInButton.tsx` según las maquetas, con alto mínimo de 48 dp y `AppButton`.
- [ ] T032 [P] [US1] Rediseñar `src/components/accounts/AccountBits.tsx` (ítem de Cuenta en tarjeta con ícono, nombre, moneda y saldo con `AmountText`; badges "Cerrada" y "Sos el dueño") y `src/components/accounts/AccountTabs.tsx` (pestañas Gastos y Saldos con indicador `primary`).
- [ ] T033 [P] [US1] Rediseñar `src/components/expenses/ExpenseBits.tsx` (fila de gasto con ícono de categoría, concepto, fecha en `textMuted`, importe tabular y el aviso de pendiente con `StatusNotice kind="warning"`) y `src/components/exports/ExportButton.tsx` (estados de progreso y error con `StatusNotice`).

### Pantallas (según las maquetas aprobadas)

- [ ] T034 [US1] Rediseñar `src/screens/DashboardScreen.tsx`: saludo, `BalanceSummary` destacado, Cuentas recientes y acción principal "Nueva Cuenta"; quitar los enlaces a Cuentas y Perfil que pasan a la barra.
- [ ] T035 [P] [US1] Rediseñar `src/screens/accounts/AccountsScreen.tsx`, `NewAccountScreen.tsx` y `JoinScreens.tsx` (Mis Cuentas, crear Cuenta, unirse e invitación).
- [ ] T036 [US1] Rediseñar `src/screens/accounts/AccountDetailScreen.tsx` (configuración, participantes, invitación y acciones; la Cuenta Cerrada con `StatusNotice kind="readOnly"`; las acciones destructivas con `error` y su confirmación de siempre).
- [ ] T037 [P] [US1] Rediseñar `src/screens/expenses/AccountExpensesScreen.tsx`, `ExpenseDetailScreen.tsx` (con el historial) y `ExpenseFormScreen.tsx` (formulario a pantalla completa, acción principal fija abajo).
- [ ] T038 [P] [US1] Rediseñar `src/screens/balances/AccountBalancesScreen.tsx` y `SettlementFormScreen.tsx` (formulario a pantalla completa).
- [ ] T039 [P] [US1] Rediseñar `src/screens/RegisterScreen.tsx`, `VerifyEmailScreen.tsx`, `CodeSignInScreen.tsx` y `OnboardingCurrencyScreen.tsx`.
- [ ] T040 [US1] Rediseñar `src/screens/ProfileScreen.tsx` (datos personales, preferencias con el selector de tema, email y la sección "Exportar mis datos") según las maquetas.
- [ ] T041 [US1] Ajustar los tests de pantallas existentes en `src/__tests__/screens/` solo en cómo encuentran los elementos reorganizados, sin cambiar qué verifican (SC-004). Las búsquedas por `accessibilityLabel`, rol y texto se conservan: si una deja de encontrar su elemento, se corrige la pantalla, no el test (FR-020). Correr `npx jest` completo.

**Checkpoint**: US1 completa; con US2 ya hecha, la App entera tiene la identidad.

---

## Phase 7: User Story 3 - Logo, ícono y pantalla de inicio (Priority: P2)

**Goal**: ícono, ícono adaptativo y monocromo, pantalla de inicio y login con el logo aprobado.

**Independent Test**: quickstart escenarios 8 y 9.

- [ ] T042 [P] [US3] Test del login en `src/__tests__/screens/authScreens.test.tsx`: el login muestra el logo con nombre accesible "ChePagame", el nombre y el slogan en es; con `i18n` en `en`, el slogan en inglés.
- [ ] T043 [US3] Guardar el logo aprobado en `design/logo/symbol.svg`, `design/logo/wordmark-light.svg` y `design/logo/wordmark-dark.svg`, con colores de `design/tokens.json`.
- [ ] T044 [US3] Crear `design/build-icons.ts` con `@resvg/resvg-js`: genera en `mobile/assets/images/` `icon.png` (1024×1024), `android-icon-foreground.png`, `android-icon-background.png` y `android-icon-monochrome.png` (432×432 con zona segura de 66%), `splash-icon.png` y `logo-light.png`/`logo-dark.png` en 1x, 2x y 3x. Correrlo con `npm run icons` y borrar `assets/images/expo-badge*.png` y `assets/expo.icon`.
- [ ] T045 [US3] Actualizar `app.config.ts`: `icon`, `ios.icon`, `android.adaptiveIcon` (`backgroundColor` desde `tokens.color.light.primary`) y el plugin `expo-splash-screen` con `backgroundColor` y variante `dark` desde los tokens, sin literales de color escritos a mano.
- [ ] T046 [US3] Crear `src/components/Logo.tsx` (`variant: "full" | "symbol"`, `size`; elige la versión clara u oscura según el tema; `accessibilityLabel` "ChePagame" con la clave `common.appName`) y usarlo en `src/screens/LoginScreen.tsx` junto al nombre y el slogan, rediseñando el login según las maquetas.

**Checkpoint**: US3 completa; requiere recompilar el development build para verla en el teléfono.

---

## Phase 8: Polish y validación

- [ ] T047 Correr en `mobile/` `npm run tokens:check`, `npx jest`, `npm run lint` y `npx tsc --noEmit`; corregir lo que falle.
- [ ] T048 [P] Correr en `web/` `npx jest`, `npm run lint` y `npx tsc --noEmit` para confirmar que el CSS generado sin importar no rompe nada y que la Web se ve igual.
- [X] T049 [P] Quitar el comentario "Sync Impact Report" del principio de `.specify/memory/constitution.md` antes del commit de la feature.
- [ ] T050 Recompilar el development build (`npx expo run:android` desde `mobile/`) y validar los 12 escenarios manuales de [quickstart.md](quickstart.md) en el teléfono, incluidos texto al 150% y escala de grises. Validación del usuario.

---

## Dependencies & Execution Order

### Phases

- **Setup (1)** → **Foundational (2)** → **Diseño aprobado (3)** → User Stories → **Polish (8)**.
- **US4 (Phase 4)** depende solo de la Phase 2; puede hacerse en paralelo con la Phase 3.
- **US2 (Phase 5)**, **US1 (Phase 6)** y **US3 (Phase 7)** dependen de la aprobación (T014).
- **US2** antes que **US1**: US1 usa `AmountText` y `StatusNotice` en listas y formularios.
- **US3** puede ir en paralelo con US1 (archivos distintos) salvo `LoginScreen.tsx`, que solo toca
  T046.

### Dentro de cada fase

- Los tests marcados primero se escriben antes y tienen que fallar.
- T006 → T007 → T008 → T009 (el tema necesita las salidas generadas).
- T026 → T027 (las fuentes registradas antes de usarlas en el tema).
- T028 → T029 → T030 (la barra antes de reorganizar rutas; después verificar enlaces).
- T043 → T044 → T045 → T046.

### Oportunidades de paralelismo

- Phase 2: T003, T004 y T005 juntos.
- Phase 5: T017 y T018 juntos; después T019 y T020 juntos.
- Phase 6: T024 y T025 juntos; T031, T032 y T033 juntos; T035, T037, T038 y T039 juntos (pantallas
  en archivos distintos).
- Phase 8: T048 y T049 junto con T047.

## Parallel Example: User Story 1

```text
Juntas, después de T029:
T031 Rediseñar FormBits, CurrencyPicker y GoogleSignInButton
T032 Rediseñar AccountBits y AccountTabs
T033 Rediseñar ExpenseBits y ExportButton

Juntas, después de T034:
T035 Mis Cuentas, crear Cuenta y unirse
T037 Gastos, detalle y formulario de gasto
T038 Saldos y formulario de reembolso
T039 Registro, verificación, código y moneda
```

## Implementation Strategy

### MVP

1. Phases 1 y 2: la identidad ya se ve en los componentes de Paper y la verificación funciona.
2. Phase 3: maquetas, logo y tipografía aprobados.
3. Phase 5 (US2): los saldos se entienden sin color. **Parar y validar** el Dashboard y Saldos,
   también con el texto al 150% y en escala de grises.

### Incremental

4. Phase 6 (US1): resto de pantallas, tipografía y barra inferior.
5. Phase 7 (US3): logo, íconos y pantalla de inicio; recompilar.
6. Phase 4 (US4) se cierra en cualquier momento después de la Phase 2.
7. Phase 8: verificaciones y la validación manual del usuario (T050).
