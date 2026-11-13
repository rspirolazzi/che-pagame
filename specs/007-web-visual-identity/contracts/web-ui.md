# Contract: armazón, componentes y verificaciones de la Web

**Feature**: `007-web-visual-identity`

No hay endpoints nuevos ni cambios en la REST API ni en el BFF. Los contratos son internos de la
Web.

## 1. Armazón según la sesión (`src/app/layout.tsx`)

| Situación | Ancho ≥ 768px | Ancho < 768px |
| --- | --- | --- |
| Sin sesión | `PublicHeader` arriba (logotipo + 5 links) | Barra superior con logotipo y botón "Menú" |
| Con sesión (privadas e informativas) | `SideNav` fija a la izquierda (logotipo, Inicio, Cuentas, Perfil, "Más", Salir) | Barra superior con logotipo y botón "Menú" |
| Siempre | `SiteFooter` (textos, Privacidad, Términos) y link "Saltar al contenido" | Igual |

## 2. Componentes nuevos

| Componente | Props | Garantías |
| --- | --- | --- |
| `Logo` | `href: string`, `size?: "sm" \| "md" \| "lg"` | "Che" + "Pagame" + tilde con variables de tema; `aria-label="ChePagame"` |
| `SideNav` | `user: UserResponse` | `nav` con `aria-label`; destino activo con `aria-current="page"`; ícono + texto; Salir es un botón |
| `CompactMenu` | `children` (los links) | Botón con `aria-expanded`/`aria-controls`; Escape cierra y devuelve el foco al botón; elegir un destino cierra |
| `Icon` | `name`, `size?` | SVG en línea, `aria-hidden`, `currentColor` |
| `AmountText` | `amount: string`, `currency`, `decimals`, `subject?: "me" \| "other" \| "none"`, `size?: "md" \| "lg"` | Insignia "+", "−" o tilde con nombre accesible, frase de siempre sin cambios, color por signo, cifras tabulares |
| `StatusNotice` | `kind: "warning" \| "error" \| "readOnly" \| "info"`, `children`, `action?` | Ícono + texto + color; `error` con `role="alert"` |
| `CopyEmail` | `email: string` | Texto seleccionable, botón "Copiar" (clipboard con respaldo de selección) y link `mailto:` |

## 3. Clases base (`src/styles/components.css`)

| Clase | Uso |
| --- | --- |
| `.button`, `.button.secondary`, `.button.danger`, `.link-button` | Acciones; alto mínimo `--size-touch-target` en celular |
| `.card` | Superficie con borde decorativo y `--radius-md` |
| `.field` (`input`, `select`, `textarea`) | Borde `--color-control-border`, foco con `--color-primary` |
| `.chip-accent` | Fondo `--color-accent` con texto `--color-on-accent` (único uso del acento) |
| `.page-grid` | Dos columnas desde 1024px (FR-013a) |

## 4. Verificaciones automáticas (Jest, Web)

| Test | Falla cuando |
| --- | --- |
| `theme/noHardcodedColors.test.ts` | Hay un literal de color en `src/` fuera de `styles/tokens.generated.css`, o `--color-accent` usado como `color:` (archivo y línea) |
| `theme/tokens.test.ts` | `tokens.generated.css` no coincide con `design/tokens.json`, o un par no llega a su mínimo |
| `components/SideNav.test.tsx` | Faltan Inicio, Cuentas, Perfil o Salir, o el activo no tiene `aria-current` |
| `components/CompactMenu.test.tsx` | El botón no abre, Escape no cierra o el foco no vuelve al botón |
| `components/AmountText.test.tsx`, `StatusNotice.test.tsx` | Igual que en la App (signo, nombre accesible, color, `role="alert"`) |
| `components/CopyEmail.test.tsx` y `ContactPage.test.tsx` | No copia, o muestra una dirección vacía sin `CONTACT_EMAIL` |
