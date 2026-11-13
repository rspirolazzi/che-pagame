# Research: Identidad visual y diseño de la Web

**Feature**: `007-web-visual-identity` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

Punto de partida relevado en el código (rama creada desde `006-mobile-visual-identity`):

- Next.js 16 con App Router, `next-intl` y `next-themes` (`attribute="class"`: el modo oscuro es
  la clase `dark` en `<html>`). Sin librerías de UI ni de íconos.
- `src/app/globals.css` (514 líneas, 72 reglas de clase) con 20 colores escritos a mano en
  variables propias (`--bg`, `--primary`, `--error`...).
- `src/app/layout.tsx` dibuja siempre `SiteHeader` y `SiteFooter`, con o sin sesión; el header
  con sesión tiene un menú de usuario (`<details>`) con Accounts, Profile y Logout.
- `web/src/styles/tokens.generated.css` ya existe (feature 006) y no se importa. Usa
  `prefers-color-scheme` con `:root:not([data-theme="light"])` y `:root[data-theme="dark"]`.
- Favicon: `src/app/favicon.ico` de la plantilla de Next.js. Sin manifest ni ícono para la
  pantalla de inicio.
- 30 archivos de test de componentes, 190 tests; `SiteHeader.test.tsx` verifica el menú de
  usuario con sesión.
- El contenedor `web` monta solo `./web`: todo lo que use la Web tiene que estar dentro de `web/`.

## R1. Tokens en la Web

- **Decision**: `globals.css` importa `../styles/tokens.generated.css` al principio y todas las
  reglas usan sus variables (`--color-*`, `--space-*`, `--radius-*`, `--font-brand`,
  `--size-touch-target`). Las variables propias actuales (`--bg`, `--primary`, `--error`...)
  desaparecen; los estilos se reescriben por partes en `src/styles/` (`base.css`, `layout.css`,
  `components.css`) importados desde `globals.css`.
- **Rationale**: es la salida que la 006 dejó lista para la Web (SC-008). CSS plano y variables:
  sin dependencias nuevas, compatible con los Server Components y con el CSS que ya existe.
- **Alternatives considered**: Tailwind (otra forma de escribir estilos y una dependencia nueva
  para un sitio chico); CSS Modules por componente (reescribe la forma de todo el sitio sin una
  ventaja clara frente a variables globales).

## R2. Tema: `data-theme` en lugar de la clase `dark`

- **Decision**: `ThemeProvider` pasa a `attribute="data-theme"`. Con `enableSystem`,
  `next-themes` escribe siempre el modo resuelto (`light` o `dark`) en `<html data-theme>` antes
  del primer pintado; el CSS generado lo respeta en las dos direcciones, y su bloque
  `prefers-color-scheme` cubre el instante sin JavaScript. Se quitan las reglas `html.dark`.
- **Rationale**: con la clase, un usuario con tema Claro y el sistema en oscuro vería la paleta
  oscura del bloque `prefers-color-scheme`. Con `data-theme` el bloque solo aplica si no hay
  atributo. Cumple FR-005 sin tocar el CSS generado.
- **Alternatives considered**: cambiar el generador para usar `.dark` (rompe el patrón
  compartido y no cubre el caso sin JavaScript).

## R3. Tipografía Sora en la Web

- **Decision**: `next/font/local` con `Sora-SemiBold.ttf` y `Sora-Bold.ttf` en
  `web/src/app/fonts/` (copiados desde `mobile/assets/fonts/` por `npm run icons`, que pasa a
  generar todos los recursos de marca), `display: "swap"` y fallback `system-ui`. La variable CSS
  que define `next/font` se asigna a `--font-brand`. Títulos, importes y logotipo usan
  `var(--font-brand)` con `font-variant-numeric: tabular-nums` en importes; el texto corrido,
  `system-ui`.
- **Rationale**: Next.js sirve el archivo desde el propio sitio con `preload` y sin pedidos a
  terceros (Principio VI); `swap` evita texto invisible (edge case). Los archivos ya están
  verificados (tnum y caracteres del español).
- **Alternatives considered**: `next/font/google` (descarga de Google en el build, contra el
  criterio de la 006); `@font-face` a mano en `public/` (sin preload ni ajuste de métricas).

## R4. Logotipo en la Web

- **Decision**: componente `Logo` en HTML y SVG en línea: "Che" con `--color-primary`, "Pagame"
  con `--color-text` en la tipografía de la marca, y el tilde de "saldado" como SVG con
  `--color-accent`. Nombre accesible "ChePagame" (`aria-label`) y link a Inicio (o al Dashboard
  con sesión).
- **Rationale**: cambia de modo solo, con las variables, sin dos imágenes; usa el mismo trazo del
  tilde que `design/build-icons.ts`. Nítido en cualquier zoom.
- **Alternatives considered**: `<img>` con los PNG de la App (dos archivos por tema y pierde
  nitidez al 200%).

## R5. Favicon e ícono para la pantalla de inicio

- **Decision**: `design/build-icons.ts` suma salidas para la Web: `web/src/app/icon.png` (64 × 64,
  el ícono "Che" con el tilde; PNG y no SVG porque un navegador dibuja el favicon SVG sin la
  fuente de la marca, ajuste hecho al implementar), `web/src/app/apple-icon.png` (180 × 180) y
  `web/public/icons/icon-192.png` y `icon-512.png`, referenciados desde `web/src/app/manifest.ts`
  (nombre, colores de tema y fondo desde los tokens). Se borra `favicon.ico` de la plantilla.
- **Rationale**: las convenciones de archivos del App Router generan las etiquetas `<link>`; el
  manifest permite "agregar a la pantalla de inicio" (FR-007). Misma fuente que los íconos de la
  App.
- **Alternatives considered**: mantener `favicon.ico` regenerado (hace falta un codificador ICO;
  los navegadores actuales usan el SVG o el PNG).

## R6. Barra lateral con sesión y header público

- **Decision**: el layout raíz elige el armazón según la sesión:
  - Sin sesión: `PublicHeader` (logotipo; Inicio, Cómo funciona, Quiénes somos, Contacto, Login /
    Registro) + contenido + `SiteFooter`.
  - Con sesión (también en las páginas informativas): `AppShell` con `SideNav` fija a la
    izquierda (logotipo; Inicio, Cuentas, Perfil con ícono y texto; un grupo "Más" con las
    páginas informativas; Salir) y el contenido a la derecha, más `SiteFooter`.
  - En anchos de celular (`< 768px`) el header y la barra lateral se compactan en una barra
    superior con el logotipo y un botón "Menú" que abre el panel de navegación
    (`aria-expanded`, `aria-controls`, foco al primer link, Escape y elegir un destino cierran).
  - El destino activo usa `aria-current="page"` más la píldora de acento y el texto en negrita.
- **Rationale**: FR-005a y FR-005b y la constitución v4.6.0. Un solo componente de menú compacto
  sirve para los dos armazones.
- **Alternatives considered**: barra lateral solo en `(private)` (las páginas informativas con
  sesión quedarían con el header público y un menú de usuario distinto).

## R7. Verificaciones automáticas de la Web

- **Decision**: dos tests de Jest en `web/src/__tests__/theme/`:
  - `noHardcodedColors.test.ts`: recorre `src/` (`.ts`, `.tsx`, `.css`) salvo
    `styles/tokens.generated.css` y `__tests__/`, y falla con archivo y línea ante `#rgb`,
    `#rrggbb`, `#rrggbbaa`, `rgb(`, `rgba(`, `hsl(`, o ante `--color-accent` usado como `color:`
    (FR-004).
  - `tokens.test.ts`: lee `../design/tokens.json` y comprueba que `tokens.generated.css` tiene los
    mismos valores (salida al día) y que cada par declarado cumple su mínimo en ambos modos.
- **Rationale**: FR-002, SC-001 y SC-002 con la suite de siempre. Los tests corren en el host,
  donde el repositorio completo está disponible.

## R8. Componentes compartidos de la Web

- **Decision**: componentes nuevos en `src/components/ui/`:
  - `Icon`: un set chico de íconos SVG en línea (`home`, `accounts`, `profile`, `logout`,
    `menu`, `close`, `plus`, `check`, `alert`, `lock`, `info`, `arrow-left`, `copy`, `mail`,
    `export`...) con `aria-hidden` y `currentColor`.
  - `AmountText`: equivalente al de la App (insignia "+", "−" o tilde con nombre accesible y la
    frase de siempre, color por signo, cifras tabulares).
  - `StatusNotice`: aviso con ícono, texto y color (`warning`, `error` con `role="alert"`,
    `readOnly`, `info`) y acción opcional.
  - `Button` (clases `.button`, `.button.secondary`, `.button.danger`, `.link-button`) con alto
    mínimo `--size-touch-target` en celular.
- **Rationale**: mismo lenguaje que la App (US2) sin sumar una librería de íconos: el set
  necesario son unos 15 trazos.
- **Alternatives considered**: `lucide-react` (dependencia nueva para pocos íconos).

## R9. Contenido de las páginas informativas y email de contacto

- **Decision**: textos nuevos en `pages.howItWorks.steps.*`, `pages.about.body`, `home.benefits.*`
  y `pages.contact.*` (es/en). El email sale de la variable de entorno `CONTACT_EMAIL` (leída en
  el servidor, en `.env.example` vacía); si está vacía, la página muestra "Pronto vas a poder
  escribirnos." Un componente cliente `CopyEmail` copia con `navigator.clipboard` y, si falla,
  selecciona el texto; al lado, un link `mailto:`.
- **Rationale**: FR-008a a FR-008d; configurable sin tocar el código, sin backend ni formulario.

## R10. Página de Inicio

- **Decision**: secciones en este orden: hero (logotipo, slogan, "Empezar" o "Ir a mis Cuentas"
  con sesión), tres beneficios (ícono, título, frase), un vistazo de la pantalla de saldos hecho
  con los componentes reales (`AmountText`) y datos de ejemplo con la etiqueta "Ejemplo", y un
  link a "Cómo funciona".
- **Rationale**: FR-008 y la respuesta de clarify; el vistazo usa los componentes reales, así
  siempre coincide con la identidad.

## R11. La Cuenta en escritorio

- **Decision**: las páginas de Gastos y de Saldos usan una grilla de dos columnas desde
  `1024px` (`minmax(0, 2fr) minmax(280px, 1fr)`): Gastos con la lista a la izquierda y el
  resumen (total, cantidad, pendientes, exportar) a la derecha; Saldos con los saldos a la
  izquierda y sugerencias y reembolsos a la derecha. Por debajo, una columna. Las pestañas y las
  rutas no cambian.
- **Rationale**: FR-013a.

## R12. Accesibilidad

- **Decision**:
  - Foco: `:focus-visible` con contorno de 2px en `--color-primary` y separación de 2px (3:1
    sobre fondo y superficie, verificado en la 006).
  - Link "Saltar al contenido" como primer elemento enfocable.
  - Unidades `rem` y `flex-wrap`/`minmax(0, …)` en filas, para el texto al 200% (FR-018) y el
    zoom al 400% (1.4.10).
  - `@media (prefers-reduced-motion: reduce)` desactiva transiciones (FR-019).
  - Tamaño táctil: `min-height: var(--size-touch-target)` en botones y links de navegación en
    anchos de celular (FR-017: 44 px pedidos; se usan los 48 de los tokens).
- **Rationale**: FR-014 a FR-019, WCAG 2.2 AA.

## R13. Pruebas existentes

- **Decision**: las pruebas que buscan por rol, etiqueta o texto siguen igual. `SiteHeader.test`
  cambia de forma documentada: el menú de usuario con sesión deja de existir por diseño (spec,
  Clarifications) y sus verificaciones pasan al test de `SideNav` (mismos destinos: Cuentas,
  Perfil y Salir). Esto cumple el Principio VII porque el cambio de comportamiento de la
  navegación está documentado en la spec.

## R14. Maquetas

- **Decision**: igual que en la 006: página de maquetas publicada como artifact privado con
  Inicio, login, Dashboard, la Cuenta (Gastos y Saldos), formulario de gasto y Perfil, cada una
  en escritorio (1280px) y celular (375px), en claro y oscuro, con la barra lateral y el menú
  compacto; el HTML queda en `specs/007-web-visual-identity/mockups/`. Ninguna página se rediseña
  antes de la aprobación.
