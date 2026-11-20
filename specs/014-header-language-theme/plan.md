# Implementation Plan: Idioma y tema desde cualquier pantalla

**Branch**: `014-header-language-theme` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/014-header-language-theme/spec.md`

## Summary

- **Web**: un componente `PreferenceControls` (idioma + tema) en `PublicHeader` y en el encabezado
  con sesión (`AppShell`/`SideNav`). El idioma sin sesión se guarda en la cookie `NEXT_LOCALE`
  (la lee `i18n/request.ts`, después de la sesión y antes de `Accept-Language`); el tema sigue con
  `next-themes` (ya guarda en `localStorage` y aplica antes de pintar). Con sesión, el cambio
  también llama a la acción que hoy usa el Perfil. Al iniciar sesión, la cookie y el tema se
  alinean con el perfil; al registrarse, el formulario manda el idioma y el tema actuales.
- **App**: las pantallas sin sesión muestran un botón "Idioma y tema" que abre una hoja con los
  dos controles; la elección se guarda en `expo-secure-store` y se usa al abrir la App. El
  registro y el primer login con Google mandan esas preferencias.
- **Backend**: `RegisterRequest` suma `theme` (ya tiene `language`), `pending_registrations` y
  `new_user_document` lo guardan, y `GoogleLoginRequest` suma `language`/`theme` opcionales que
  solo se usan si el login crea la cuenta.

## Technical Context

**Language/Version**: Python 3.13; TypeScript (Next.js 16; Expo 56 / RN 0.85)

**Primary Dependencies**: next-themes, next-intl, react-i18next, expo-localization,
expo-secure-store (todas en uso; sin dependencias nuevas)

**Storage**: cookie `NEXT_LOCALE` y `localStorage` (`theme`) en la Web; SecureStore en la App;
`users.preferences` y `pending_registrations` en MongoDB

**Testing**: pytest (contract, integration); Jest + Testing Library en Web y App

**Target Platform**: navegadores, Android

**Project Type**: web-service + web-app + mobile-app

**Performance Goals**: cambio aplicado en < 300 ms; 0 parpadeos de tema (SC-003)

**Constraints**: buscadores sin cookie reciben español (FR-011); cookie estrictamente funcional
(sin banner, Principio VI); sin cambiar URLs

**Scale/Scope**: 1 componente Web, 1 hoja en la App, 2 campos en 2 requests del backend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regla | Cumplimiento |
|---|---|
| I. Paridad Web y Mobile | ✅ Controles sin sesión en los dos; misma API de registro |
| II. Internacionalización (idioma y tema en el Perfil) | ✅ El Perfil no cambia; el encabezado suma acceso |
| VI. Privacidad | ✅ Cookie y almacenamiento locales, funcionales, sin terceros |
| VII. Accesibilidad y Test-First | ✅ Controles con nombre, estado y teclado; tests primero |
| VIII. Simplicidad | ✅ Reusa next-themes, la acción de preferencias y SecureStore |
| Panel principal: header | ✅ El header público suma los controles sin tapar logo ni ingreso (menú en teléfono) |

Re-check post-design: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/014-header-language-theme/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/preferences-on-signup.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/app/
├── schemas/auth.py                       # RegisterRequest.theme; GoogleLoginRequest.language/theme
├── repositories/pending_registrations.py # + theme
├── repositories/users.py                 # new_user_document(theme=...)
└── services/auth_service.py              # pass theme; Google create uses optional prefs
web/src/
├── components/PreferenceControls.tsx     # NEW: language + theme (menu on mobile widths)
├── components/PublicHeader.tsx           # + controls
├── components/AppShell.tsx | SideNav.tsx # + controls with session
├── app/actions/preferences.ts            # NEW: setLocaleAction (cookie) + profile update when logged in
├── i18n/request.ts                       # session > NEXT_LOCALE cookie > Accept-Language
├── components/AppProviders.tsx           # ThemeSync also writes the locale cookie after login
├── components/RegisterForm.tsx           # sends current language and theme
└── auth.ts                               # Google sign-in sends language/theme
mobile/
├── src/hooks/useDevicePreferences.ts     # NEW: SecureStore load/save, used before login
├── src/components/PreferenceSheet.tsx    # NEW: language + theme sheet
├── src/screens/{LoginScreen,RegisterScreen,CodeSignInScreen}.tsx # + "Idioma y tema" button
├── app/_layout.tsx                       # theme from user ?? device preference
├── src/i18n/index.ts                     # initial language from device preference
└── src/services/api/auth.ts              # register/google send preferences
```

**Structure Decision**: una sola acción Web (`preferences.ts`) decide si guarda solo en el
dispositivo o también en el perfil; en la App, `useDevicePreferences` es la única fuente sin
sesión y se sincroniza al iniciar sesión.

## Complexity Tracking

Sin violaciones.
