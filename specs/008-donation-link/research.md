# Research: Apoyá ChePagame (donaciones)

**Feature**: `008-donation-link` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

Punto de partida (rama creada desde `007-web-visual-identity`):

- Web: `SiteFooter` es un Server Component usado en los dos armazones (con y sin sesión);
  "Quiénes somos" y el Perfil son páginas de servidor. `CONTACT_EMAIL` ya sigue el patrón de una
  variable opcional leída en el servidor.
- App: `ProfileScreen` arma el Perfil con secciones (`Section`) y ya usa `StatusNotice` y
  `AppButton`. No hay `eas.json`: los builds se hacen con `npx expo run:android`, y las variables
  `EXPO_PUBLIC_*` se incrustan en el bundle al compilar.

## R1. Configuración del link

- **Decision**: `DONATION_URL` (Web, leída en el servidor) y `EXPO_PUBLIC_DONATION_URL` (App,
  incrustada al compilar), las dos vacías en `.env.example`. Una función pura
  `parseDonationUrl(value)` en cada proyecto devuelve la dirección normalizada si es `https` y
  válida, o `null` en cualquier otro caso (vacía, `http`, `javascript:`, texto inválido).
- **Rationale**: FR-001 y FR-002; el mismo patrón que `CONTACT_EMAIL`. Validar `https` evita
  ofrecer un link roto o un esquema peligroso por error de configuración.

## R2. Cómo se abre el link

- **Decision**:
  - Web: `<a href target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">`, sin
    parámetros agregados. Nombre accesible: "Apoyá ChePagame (se abre en una pestaña nueva)".
  - App: `Linking.openURL(url)` de React Native, que abre el navegador del sistema (no un
    navegador dentro de la App). Si falla, `StatusNotice kind="error"` con el texto
    `donate.openError`.
- **Rationale**: FR-003 y FR-011. `noreferrer` y `no-referrer` evitan que la plataforma sepa desde
  qué página de ChePagame llega la persona; el navegador del sistema deja la sesión de ChePagame
  fuera del pago.
- **Alternatives considered**: `expo-web-browser` (abre una pestaña dentro de la App; la tienda
  lo ve igual como link de pago y no suma privacidad).

## R3. Componentes

- **Decision**:
  - Web: `DonateLink` (link con ícono `heart` nuevo en `Icon`, estilo `.button.secondary`) y
    `DonateSection` (título, frase y `DonateLink`) en `src/components/donate/`. El footer usa
    `DonateLink`; "Quiénes somos" y el Perfil usan `DonateSection`. Las páginas reciben la
    dirección ya validada desde el servidor.
  - App: `DonateSection` en `src/components/DonateSection.tsx` con `AppButton` (ícono
    `heart-outline`) dentro de una `Section` del Perfil.
- **Rationale**: un solo componente por lugar, con la identidad de las 006 y 007 (sin colores
  escritos a mano: los tests existentes lo controlan).

## R4. Builds para las tiendas

- **Decision**: documentar en el README y en el quickstart que, para un build que se publique en
  Google Play o el App Store, `EXPO_PUBLIC_DONATION_URL` tiene que estar vacía al compilar (y,
  cuando se agregue `eas.json`, vacía en el perfil `production`). Un test verifica que sin la
  variable la sección no se muestra.
- **Rationale**: FR-008. Las políticas de pago de ambas tiendas pueden rechazar un link externo de
  donación al desarrollador (ver la conversación de la spec); la forma aceptada es una compra
  dentro de la App, fuera de alcance.

## R5. Textos

- **Decision**: claves `donate.button` ("Apoyá ChePagame" / "Support ChePagame"),
  `donate.title`, `donate.body` ("ChePagame es gratuito y sin publicidad. Si te sirve, podés
  apoyarlo con un aporte." / en), `donate.newTab` y, en la App, `donate.openError`. En los dos
  proyectos, cubiertas por los tests de paridad de catálogos existentes.
