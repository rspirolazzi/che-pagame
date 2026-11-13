# Implementation Plan: Apoyá ChePagame (donaciones)

**Branch**: `008-donation-link` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/008-donation-link/spec.md`

## Summary

Un botón "Apoyá ChePagame" que abre la página de donaciones (Cafecito) fuera de ChePagame. En la
Web va en el footer, en "Quiénes somos" y en el Perfil; en la App, en el Perfil. El link sale de
`DONATION_URL` (Web) y `EXPO_PUBLIC_DONATION_URL` (App); si falta o no es `https`, el botón no
aparece. Es un link común: sin widgets, scripts ni datos de la persona (Principio VI), y
ChePagame no procesa pagos. Los builds para las tiendas se compilan sin el link.

Enfoque técnico ([research.md](research.md)): una función `parseDonationUrl` en cada proyecto
(R1); en la Web un link con `noopener noreferrer` y `no-referrer` (R2), en la App
`Linking.openURL` con mensaje de error si falla (R2); componentes `DonateLink` y `DonateSection`
con la identidad existente (R3); documentación para los builds de tienda (R4).

## Technical Context

**Language/Version**: TypeScript 5.x `strict` sobre Node.js v22.13.0 (Web y App).

**Primary Dependencies**: las existentes. `Linking` de React Native (incluido). Ninguna nueva.

**Storage**: N/A. Dos variables de entorno opcionales, no secretas.

**Testing**: Jest en Web y App (función de validación, componentes y footer). Validación manual
con el [quickstart](quickstart.md).

**Target Platform**: Web (navegadores actuales) y App Android/iOS (development build).

**Project Type**: web-app + mobile-app dentro del monorepo.

**Performance Goals**: cero pedidos a la plataforma al cargar páginas (SC-003).

**Constraints**: Principio VI (sin terceros hasta que la persona toca); sin colores escritos a
mano; textos es/en; builds de tienda sin link.

**Scale/Scope**: 4 lugares (3 en la Web, 1 en la App), 3 componentes, 2 funciones, unos 6 tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento |
| --- | --- |
| I. Acceso directo y multiplataforma | ✅ Mismo comportamiento en Web y App, salvo la limitación documentada de los builds de tienda. Sin cambios en la API. |
| II. Internacionalización | ✅ Textos `donate.*` en es/en; paridad cubierta por los tests existentes. |
| III. Moneda y exactitud | ✅ No aplica: ChePagame no maneja dinero de donaciones. |
| IV. Auditoría | ✅ No aplica: no hay datos nuevos. |
| V. Strict English | ✅ Código y claves en inglés. |
| VI. Privacidad | ✅ Link común, sin widgets ni scripts, sin referer ni parámetros; nada se contacta hasta el toque. Las variables viven en `.env`. |
| VII. Test-first | ✅ Tests de la validación y de los componentes antes de implementar. |
| VIII. Simplicidad | ✅ Sin dependencias ni capas nuevas. |
| Identidad visual | ✅ Componentes con los tokens y el ícono propio; sin colores escritos a mano. |

**Re-check post-design**: ✅ sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/008-donation-link/
├── plan.md, research.md, data-model.md, quickstart.md
├── contracts/donate-ui.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
.env.example                               # + DONATION_URL=, EXPO_PUBLIC_DONATION_URL= (vacías)
README.md                                  # + sección de donaciones y builds de tienda
web/src/
├── lib/donation.ts                        # NUEVO: parseDonationUrl
├── components/ui/Icon.tsx                 # + ícono heart
├── components/donate/DonateLink.tsx, DonateSection.tsx   # NUEVO
├── components/SiteFooter.tsx              # + DonateLink
├── app/(public)/about/page.tsx            # + DonateSection
├── app/(private)/profile/page.tsx         # + DonateSection
├── i18n/messages/es.json, en.json         # + donate.*
└── __tests__/lib/donation.test.ts, components/DonateSection.test.tsx   # NUEVO
mobile/src/
├── utils/donation.ts                      # NUEVO: parseDonationUrl
├── components/DonateSection.tsx           # NUEVO
├── screens/ProfileScreen.tsx              # + sección
├── i18n/locales/es.json, en.json          # + donate.*
└── __tests__/utils/donation.test.ts, components/donateSection.test.tsx   # NUEVO
```

**Structure Decision**: cambios chicos en la Web y la App existentes; sin backend.

## Complexity Tracking

No hay violaciones que justificar.
