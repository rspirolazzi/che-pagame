# Implementation Plan: Identidad visual y diseño de la App Mobile

**Branch**: `006-mobile-visual-identity` | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-mobile-visual-identity/spec.md`

## Summary

La App Mobile adopta la identidad "Celeste y sol" con un rediseño completo de sus pantallas, sin
cambiar su comportamiento:

- Celeste principal, amarillo sol de acento y colores fijos para "te deben", "debés" y "pendiente
  de asignación", en claro, oscuro y según el dispositivo.
- Una tipografía propia para títulos, importes y logo; el texto corrido con la del sistema.
- Barra inferior con Inicio, Cuentas y Perfil.
- Logo, ícono de App y pantalla de inicio propios.
- Saldos y estados que se entienden sin depender del color.
- Antes de implementar, el usuario aprueba las maquetas de las pantallas clave, el logo y la
  tipografía.

Enfoque técnico ([research.md](research.md)):

- **Fuente común**: `design/tokens.json` con colores, tipografía, espaciados, radios y pares de
  contraste. El generador `design/build-tokens.ts` verifica el contraste y escribe
  `mobile/src/theme/tokens.generated.ts` y `web/src/styles/tokens.generated.css` (esta última sin
  usar hasta la 007). `--check` detecta salidas desactualizadas (R1, R9).
- **Tema**: el tema de React Native Paper se arma desde los tokens, con un tema extendido para
  `positive`, `negative` y `warning` (R3). Borde de controles nuevo para llegar a 3:1 (R2).
- **Tipografía**: embebida con el config plugin de `expo-font`; candidatas Sora, Outfit y
  Bricolage Grotesque (R4).
- **Navegación**: grupo `(tabs)` con `Tabs` de expo-router y `BottomNavigation.Bar` de Paper; los
  formularios quedan fuera de la barra; las URLs no cambian (R5).
- **Logo e íconos**: SVG en `design/logo/`, PNG generados con `@resvg/resvg-js` (dependencia de
  desarrollo nueva) (R7).
- **Verificaciones**: tests de Jest de contraste, de colores escritos a mano y del mapeo del tema
  (R8, R9).

Sin cambios en el backend ni en la Web visible.

## Technical Context

**Language/Version**: TypeScript 5.x `strict` sobre Node.js v22.13.0, igual que en las features
anteriores. El generador corre con `node --experimental-strip-types` (Node 22.6 o superior).

**Primary Dependencies**:

- Mobile: las existentes (Expo SDK 56, expo-router 56.2.22, React Native Paper 5.15.4, expo-font,
  expo-splash-screen, expo-status-bar, expo-system-ui, expo-image, @expo/vector-icons).
- Nueva, solo de desarrollo en Mobile: `@resvg/resvg-js` (versión fija) para rasterizar el logo.
- Archivos de fuente de la tipografía elegida (licencia SIL OFL), dos pesos.
- Backend y Web: ninguna.

**Storage**: N/A. La preferencia de tema ya existe (`preferences.theme`).

**Testing**: Jest y React Native Testing Library en Mobile, más los tests nuevos de contraste,
colores escritos a mano y mapeo del tema. `npm run tokens:check`. Validación manual en el
development build ([quickstart.md](quickstart.md)).

**Target Platform**: App Mobile Android (principal) e iOS, con el development build. La Web no
cambia de aspecto.

**Project Type**: mobile-app (dentro del monorepo backend + web + mobile).

**Performance Goals**: el cambio de tema se ve en menos de 1 segundo (SC-005). La fuente embebida
no demora el inicio. Fuentes de menos de 200 KB en total.

**Constraints**:

- Contraste 4,5:1 para texto y 3:1 para controles e íconos, verificado en cada cambio (SC-001).
- Cero colores escritos a mano fuera de `src/theme/` (SC-002).
- Mismo comportamiento: las pruebas existentes verifican lo mismo (SC-004).
- Sin descargas de terceros al usar la App (Principio VI).
- Texto del sistema hasta 150% y elementos tocables de 48 dp.

**Scale/Scope**: 19 rutas de Mobile y 18 pantallas a rediseñar, 6 de ellas con maqueta previa.
Unos 25 componentes y pantallas tocados y 5 componentes nuevos (`AmountText`, `StatusNotice`,
`Logo`, `AppTabBar`, `AppButton`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento |
| --- | --- |
| I. Acceso directo y multiplataforma | ✅ Sin cambios en la API ni en el login. La Web adopta la misma identidad en la 007 desde la misma fuente. |
| II. Internacionalización | ✅ Textos nuevos (slogan ya existe; nombres accesibles del logo, íconos y pestañas) en es/en; el test de paridad de catálogos los cubre. Importes con el formato actual. |
| III. Moneda y exactitud | ✅ No se tocan cálculos; `AmountText` formatea con `formatMoney`, sin aritmética nueva. |
| IV. Auditoría y bajas lógicas | ✅ Sin cambios de datos; las confirmaciones de acciones destructivas se mantienen. |
| V. Strict English | ✅ Código, archivos y claves en inglés; specs en español. |
| VI. Privacidad | ✅ La fuente va embebida en el build, sin pedidos a terceros. Sin telemetría. Ningún secreto involucrado. |
| VII. Test-first | ✅ Tests de contraste, de colores escritos a mano, del mapeo del tema, de `AmountText`, `StatusNotice` y la barra inferior, antes o junto con la implementación. Las pruebas existentes siguen verificando lo mismo. |
| VIII. Simplicidad | ✅ con justificación: una dependencia de desarrollo nueva (`@resvg/resvg-js`), ver Complexity Tracking. Sin capas nuevas: el tema de Paper existente se alimenta de los tokens. |
| Stack | ✅ Sin cambios de versiones. React Native Paper sigue siendo la UI de Mobile. |
| Navegación y UI Base ("Panel Principal") | ✅ La barra inferior materializa Dashboard, Accounts y Profile, como describe la constitución. |
| Quality gates | ✅ Tests, lint, tipos, `tokens:check` y validación manual en la App (quickstart). |

**Enmienda hecha (v4.5.0, 2026-11-12)**: la constitución suma la subsección "Identidad visual" en
"Estructura de Navegación y UI Base" (tokens como única fuente, contraste verificado, nada
comunicado solo con color, tipografía embebida) y la barra inferior de Mobile en "Panel Principal"
(research R14). Este plan la cumple.

**Re-check post-design**: ✅ sin violaciones nuevas. El diseño de Phase 1 (tokens, generador,
tema extendido, grupo `(tabs)`, componentes nuevos) no agrega servicios, colecciones ni
dependencias de producción.

## Project Structure

### Documentation (this feature)

```text
specs/006-mobile-visual-identity/
├── plan.md              # Este archivo
├── research.md          # Phase 0 (R1–R14)
├── data-model.md        # Phase 1: estructura de los tokens, tema y recursos
├── quickstart.md        # Phase 1: validación automática y 12 escenarios manuales
├── contracts/
│   └── tokens.md        # Generador, salidas, tema, componentes y verificaciones
├── mockups/             # Maquetas aprobadas (HTML), antes de implementar pantallas
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
design/                                    # NUEVO: fuente común de la identidad
├── tokens.json                            # Colores, tipografía, espaciados, radios, pares
├── build-tokens.ts                        # Valida contraste y genera las salidas (--check)
├── build-icons.ts                         # SVG del logo → PNG de ícono, splash y logo
└── logo/
    ├── symbol.svg
    ├── wordmark-light.svg
    └── wordmark-dark.svg

mobile/
├── package.json                           # + scripts tokens, tokens:check, icons; + @resvg/resvg-js (dev)
├── app.config.ts                          # Ícono, adaptativo, splash (claro/oscuro) y plugin expo-font desde tokens
├── assets/
│   ├── fonts/                             # NUEVO: tipografía elegida (2 pesos) + OFL.txt
│   └── images/                            # Íconos, splash y logo generados; se borran los de la plantilla
├── app/
│   ├── _layout.tsx                        # StatusBar y fondo del sistema según el modo
│   └── (app)/
│       ├── _layout.tsx                    # Stack: (tabs), onboarding y formularios a pantalla completa
│       ├── (tabs)/                        # NUEVO grupo con la barra inferior
│       │   ├── _layout.tsx                # Tabs + AppTabBar
│       │   ├── index.tsx                  # Inicio (Dashboard)
│       │   ├── profile.tsx                # Perfil
│       │   └── accounts/                  # Stack de Cuentas (las rutas existentes se mueven acá)
│       │       ├── _layout.tsx
│       │       ├── index.tsx, new.tsx, join.tsx
│       │       └── [accountId]/index.tsx, balances.tsx, settings.tsx, expenses/[expenseId]/index.tsx
│       ├── accounts/[accountId]/expenses/new.tsx            # Fuera de la barra (misma URL)
│       ├── accounts/[accountId]/expenses/[expenseId]/edit.tsx
│       ├── accounts/[accountId]/settlements/new.tsx
│       └── onboarding-currency.tsx
└── src/
    ├── theme/
    │   ├── tokens.generated.ts            # NUEVO (generado)
    │   ├── index.ts                       # lightTheme/darkTheme desde tokens, AppTheme, useAppColors
    │   └── fonts.ts                       # NUEVO: configureFonts de Paper (marca + sistema)
    ├── components/
    │   ├── AmountText.tsx                 # NUEVO
    │   ├── StatusNotice.tsx               # NUEVO
    │   ├── Logo.tsx                       # NUEVO
    │   ├── AppTabBar.tsx                  # NUEVO
    │   ├── AppButton.tsx                  # NUEVO: botón con alto mínimo de 48 dp
    │   └── ... (FormBits, accounts/, balances/, expenses/, exports/ rediseñados)
    ├── screens/                           # Las 18 pantallas rediseñadas
    └── __tests__/
        ├── theme/contrast.test.ts         # NUEVO
        ├── theme/noHardcodedColors.test.ts# NUEVO
        ├── theme/appTheme.test.ts         # NUEVO
        ├── components/amountText.test.tsx # NUEVO
        ├── components/statusNotice.test.tsx # NUEVO
        ├── components/appTabBar.test.tsx  # NUEVO
        ├── components/touchTargets.test.tsx # NUEVO: 48 dp en AppButton y la barra
        └── support/render.tsx             # Envuelve con el tema de la identidad

web/
└── src/styles/tokens.generated.css        # NUEVO (generado; sin importar hasta la 007)
```

**Structure Decision**: monorepo existente (backend, web, mobile) más una carpeta `design/` en la
raíz como única fuente de la identidad. Cada proyecto recibe una copia generada y commiteada, así
siguen compilándose y montándose en Docker por separado. Solo cambia Mobile y se agrega el CSS
generado de Web sin usarlo.

## Orden de trabajo

1. Enmienda de la constitución (4.5.0): hecha.
2. Tokens, generador, tema y verificaciones automáticas (US4): la base de todo lo demás.
3. Maquetas de las pantallas clave, propuestas de logo y tipografías candidatas, publicadas para
   aprobación (FR-014a). **Bloqueante**: nada de las pantallas se implementa hasta la aprobación.
4. Con la aprobación: tipografía embebida, logo, íconos y splash (US3).
5. Componentes base (`AmountText`, `StatusNotice`, `Logo`, `AppTabBar`) y la barra inferior.
6. Rediseño de pantallas: primero saldos (US2), después el resto (US1).
7. Validación manual completa (quickstart) con el development build recompilado.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Dependencia de desarrollo `@resvg/resvg-js` | Generar desde un solo SVG todos los PNG que pide Expo (ícono, adaptativo, monocromo, splash y logo en 3 densidades) | Exportarlos a mano se desactualiza con cada ajuste del logo; `sharp` es más pesado y trae binarios nativos; `react-native-svg` en la App sería una dependencia nativa de producción solo para el logo |
| Carpeta `design/` fuera de los tres proyectos | La identidad es común a App y Web (FR-001, FR-003) | Ponerla dentro de `mobile/` haría que la Web dependa de Mobile en la 007; un paquete de workspaces obliga a reorganizar el repositorio y los Dockerfile |
