# Implementation Plan: Identidad visual y diseño de la Web

**Branch**: `007-web-visual-identity` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/007-web-visual-identity/spec.md`

## Summary

La Web adopta la identidad "Celeste y sol" de la feature 006 con un rediseño completo y sin cambiar
su comportamiento:

- Colores, espaciados y radios desde el CSS que ya genera `design/tokens.json`; Sora servida por
  el propio sitio para títulos, importes y logotipo.
- Claro, oscuro y según el dispositivo, sin parpadeo.
- Header público sin sesión y barra lateral (Inicio, Cuentas, Perfil, "Más", Salir) con sesión; en
  celular, un menú compacto.
- Logotipo "A. Tilde final" e ícono "Che" (favicon, ícono de iOS y manifest).
- Inicio con secciones y contenido nuevo en Cómo funciona, Quiénes somos y Contacto (email
  configurable).
- Saldos y estados que no dependen solo del color, como en la App.
- La Cuenta mantiene sus pestañas; en escritorio, dos columnas.
- Accesible: contraste verificado, foco visible, teclado, texto al 200%, tamaño táctil.
- Maquetas en escritorio y celular aprobadas antes de implementar.

Enfoque técnico ([research.md](research.md)):

- `globals.css` importa `tokens.generated.css`; los estilos se reescriben en `src/styles/` sin
  colores propios (R1).
- `next-themes` pasa a `attribute="data-theme"` para que el CSS generado funcione en las dos
  direcciones (R2).
- `next/font/local` con los archivos de Sora copiados por `npm run icons` (R3).
- `Logo` en HTML y SVG con variables de tema (R4); íconos del sitio generados desde `design/` (R5).
- Armazón según la sesión: `PublicHeader` o `AppShell` con `SideNav`, y `CompactMenu` (R6).
- Componentes `Icon`, `AmountText`, `StatusNotice` y `CopyEmail`, sin dependencias nuevas (R8, R9).
- Tests de colores escritos a mano y de tokens al día con contraste (R7).

Sin cambios en el backend, en la API ni en la App.

## Technical Context

**Language/Version**: TypeScript 5.x `strict` sobre Node.js v22.13.0 (Web). El generador de la 006
corre con `node --experimental-strip-types`.

**Primary Dependencies**: las existentes de la Web (Next.js 16 con App Router, React 19,
`next-intl`, `next-themes`, `next-auth`). Ninguna nueva. Se usa `next/font/local` (incluido en
Next.js).

**Storage**: N/A. Una variable de entorno nueva y opcional, `CONTACT_EMAIL` (no es un secreto).

**Testing**: Jest y Testing Library en la Web (190 tests hoy), más los tests nuevos de tokens,
colores escritos a mano, `SideNav`, `CompactMenu`, `AmountText`, `StatusNotice`, `CopyEmail` y
Contacto. `next build`. Validación manual con el [quickstart](quickstart.md).

**Target Platform**: navegadores actuales en escritorio y celular (Chrome, Safari, Firefox, Edge).

**Project Type**: web-app (Next.js con BFF) dentro del monorepo backend + web + mobile.

**Performance Goals**: sin parpadeo de tema; la tipografía no bloquea el primer pintado (`swap`,
dos archivos de unos 58 KB); el armazón no agrega pedidos al backend.

**Constraints**:

- Contraste 4,5:1 texto y 3:1 controles en ambos modos; cero colores escritos a mano (SC-001,
  SC-002).
- Mismo comportamiento: las pruebas existentes verifican lo mismo, salvo el menú de usuario que la
  spec reemplaza por la barra lateral (R13).
- Sin pedidos a terceros (Principio VI): fuente servida por el sitio.
- 320 px a 1440 px sin desplazamiento horizontal; texto al 200%; teclado; 44 px táctiles.

**Scale/Scope**: 25 páginas (11 públicas, incluida Inicio, y 14 privadas), 39 componentes,
`globals.css` de 514 líneas reescrito, 10 componentes nuevos y 6 páginas con maqueta previa.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento |
| --- | --- |
| I. Acceso directo y multiplataforma | ✅ Sin cambios en la API ni en el login. App y Web comparten la identidad desde la misma fuente. |
| II. Internacionalización | ✅ Todo texto nuevo (contenido de Inicio y páginas informativas, navegación, nombres accesibles) en es/en; el test de paridad lo cubre. |
| III. Moneda y exactitud | ✅ `AmountText` usa `formatMoney` existente; sin aritmética nueva; totales por moneda como hoy. |
| IV. Auditoría y bajas lógicas | ✅ Sin cambios de datos; confirmaciones de acciones destructivas intactas. |
| V. Strict English | ✅ Código, claves y archivos en inglés; specs en español. |
| VI. Privacidad | ✅ Sora servida por el sitio; sin analítica ni pedidos a terceros. `CONTACT_EMAIL` no es un secreto y vive en `.env`. |
| VII. Test-first | ✅ Tests nuevos antes o junto con la implementación. El cambio del test del header con sesión está documentado en la spec (Clarifications) y en R13. |
| VIII. Simplicidad | ✅ Sin dependencias nuevas: CSS con variables, `next/font/local` e íconos SVG propios. |
| Navegación y UI Base (v4.6.0) | ✅ Header público sin sesión, barra lateral con sesión, menú compacto en celular, footer con los legales. |
| Identidad visual (v4.5.0) | ✅ Tokens como única fuente, contraste verificado, nada solo con color, tipografía servida por el sitio. |
| Quality gates | ✅ Tests, lint, tipos, `next build` y validación manual. |

**Enmienda hecha (v4.6.0, 2026-11-13)**: "Header (logueado)" pasa a "Barra lateral (con sesión)" y
se suma el menú compacto en celular, como pide la spec (Clarifications).

**Re-check post-design**: ✅ sin violaciones. El diseño de Phase 1 no agrega dependencias,
servicios, colecciones ni endpoints.

## Project Structure

### Documentation (this feature)

```text
specs/007-web-visual-identity/
├── plan.md              # Este archivo
├── research.md          # Phase 0 (R1–R14)
├── data-model.md        # Phase 1: lo que consume la Web, configuración y textos nuevos
├── quickstart.md        # Phase 1: verificaciones y 11 escenarios manuales
├── contracts/
│   └── web-ui.md        # Armazón, componentes, clases y verificaciones
├── mockups/             # Maquetas aprobadas (HTML)
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
design/
└── build-icons.ts                         # + íconos de la Web y copia de Sora a web/

web/
├── .prettierignore                        # (ya ignora el CSS generado)
├── public/icons/icon-192.png, icon-512.png   # NUEVO (generado)
└── src/
    ├── app/
    │   ├── layout.tsx                     # Armazón según la sesión, fuente y "Saltar al contenido"
    │   ├── manifest.ts                    # NUEVO: nombre, colores e íconos
    │   ├── icon.svg, apple-icon.png       # NUEVO (generado); se borra favicon.ico
    │   ├── fonts/Sora-SemiBold.ttf, Sora-Bold.ttf   # NUEVO (copiado)
    │   ├── globals.css                    # Importa tokens y src/styles/*
    │   ├── page.tsx                       # Inicio con secciones
    │   ├── (public)/…                     # Páginas públicas rediseñadas; contenido nuevo
    │   └── (private)/…                    # Páginas privadas rediseñadas; Cuenta en dos columnas
    ├── styles/
    │   ├── tokens.generated.css           # (generado en la 006)
    │   ├── base.css, layout.css, components.css   # NUEVO: estilos con variables de la identidad
    ├── components/
    │   ├── AppProviders.tsx               # attribute="data-theme"
    │   ├── PublicHeader.tsx, AppShell.tsx, SideNav.tsx, CompactMenu.tsx, SiteFooter.tsx   # NUEVO / reemplaza SiteHeader.tsx
    │   ├── ui/Logo.tsx, Icon.tsx, AmountText.tsx, StatusNotice.tsx, CopyEmail.tsx          # NUEVO
    │   └── … (accounts/, balances/, expenses/, exports/ y formularios rediseñados)
    └── __tests__/
        ├── theme/noHardcodedColors.test.ts, tokens.test.ts   # NUEVO
        └── components/SideNav, CompactMenu, AmountText, StatusNotice, CopyEmail, ContactPage   # NUEVO

.env.example                               # + CONTACT_EMAIL= (vacía)
```

**Structure Decision**: solo cambia la Web, más una salida adicional del generador de recursos de
marca de la 006. Todo lo que usa la Web queda dentro de `web/` porque su contenedor monta solo esa
carpeta.

## Orden de trabajo

1. Enmienda de la constitución (4.6.0): hecha.
2. Base: tokens importados, `data-theme`, Sora, verificaciones automáticas y estilos base sin
   colores propios (la Web ya toma la paleta sin tocar páginas).
3. Maquetas de las páginas clave en escritorio y celular, para aprobación. **Bloqueante.**
4. Componentes compartidos y armazón (header público, barra lateral, menú compacto, footer, logo,
   íconos del sitio).
5. Saldos y estados (US2), después todas las páginas (US1), después responsive y accesibilidad
   fina (US3).
6. Contenido de Inicio y páginas informativas (con el email de contacto que defina el usuario).
7. Validación manual completa.

## Complexity Tracking

No hay violaciones que justificar: sin dependencias, servicios ni capas nuevas.
