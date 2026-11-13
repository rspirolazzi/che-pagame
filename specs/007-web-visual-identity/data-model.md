# Data Model: Identidad visual y diseño de la Web

**Feature**: `007-web-visual-identity` | **Date**: 2026-11-13

No hay datos de usuario nuevos ni cambios en la API ni en el backend. La identidad es la de la
feature 006 ([data-model de la 006](../006-mobile-visual-identity/data-model.md)): esta feature no
cambia `design/tokens.json`.

## Lo que consume la Web

| Origen | Archivo en la Web | Uso |
| --- | --- | --- |
| `design/tokens.json` → `design/build-tokens.ts` | `web/src/styles/tokens.generated.css` | Variables `--color-*`, `--space-*`, `--radius-*`, `--size-touch-target`, `--font-brand` |
| `design/tokens.json` → `design/build-tokens.ts` | `web/src/styles/tokens.generated.json` (nuevo) | Colores para el manifest (`theme_color`, `background_color`) |
| `mobile/assets/fonts/Sora-*.ttf` → `design/build-icons.ts` | `web/src/app/fonts/Sora-SemiBold.ttf`, `Sora-Bold.ttf` | Tipografía de la marca con `next/font/local` |
| `design/build-icons.ts` | `web/src/app/icon.svg`, `web/src/app/apple-icon.png`, `web/public/icons/icon-192.png`, `icon-512.png` | Favicon, ícono de iOS y del manifest |

## Configuración nueva

| Variable | Dónde | Valor | Regla |
| --- | --- | --- | --- |
| `CONTACT_EMAIL` | `.env` (y vacía en `.env.example`) | Email de contacto público | Opcional; vacía muestra un texto neutro (FR-008c). No es un secreto |

## Textos nuevos (es/en)

| Clave | Contenido |
| --- | --- |
| `home.benefits.split`, `.clear`, `.yours` (`title`, `body`) | Los tres beneficios de Inicio |
| `home.preview.label`, `home.preview.title` | Etiqueta "Ejemplo" y título del vistazo |
| `home.cta.howItWorks`, `home.ctaSignedIn` | Link a "Cómo funciona" y "Ir a mis Cuentas" |
| `pages.howItWorks.steps.create`, `.add`, `.balances`, `.settle` (`title`, `body`) | Los 4 pasos |
| `pages.about.body` | Párrafo de "Quiénes somos" (reemplaza el actual) |
| `pages.contact.intro`, `.copy`, `.copied`, `.write`, `.unavailable` | Página de Contacto |
| `nav.menu`, `nav.closeMenu`, `nav.more`, `nav.skipToContent`, `nav.tabHome`, `nav.tabAccounts`, `nav.tabProfile` | Navegación |
| `a11y.owed`, `.owes`, `.settled`, `.warning`, `.error`, `.readOnly`, `.info`, `.back` | Nombres accesibles (mismos que la App) |
| `balances.suggested` | Chip "Sugerido" |

El test de paridad de catálogos existente verifica que todas existan en los dos idiomas.
