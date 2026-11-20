---

description: "Task list for feature 014: language and theme from anywhere"
---

# Tasks: Idioma y tema desde cualquier pantalla

**Input**: documentos de diseño en `specs/014-header-language-theme/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/preferences-on-signup.md](contracts/preferences-on-signup.md),
[quickstart.md](quickstart.md)

**Tests**: incluidos (Principio VII). Se escriben primero y fallan antes de implementar.

## Formato: `[ID] [P?] [Story] Descripción`

- **[Story]**: US1 (Web sin sesión), US2 (Web con sesión), US3 (registro y login respetan la
  elección), US4 (App sin sesión).

## Convenciones

- Textos `preferences.{language,theme,openMenu,saveFailed}` y `theme.{light,dark,system}` en es/en
  (Web y App). Reusar los que ya existan en el Perfil.
- Valores fijos: idiomas `es`|`en`; temas `light`|`dark`|`system`; cookie `NEXT_LOCALE`; clave
  SecureStore `device-preferences`.

---

## Phase 1: Foundational (backend)

- [X] T001 [P] Tests de contrato en `backend/tests/contract/test_auth_register_contract.py` y `test_auth_google_contract.py`: `theme` opcional (`light|dark|system`, otro valor → 422) en register; `language`/`theme` opcionales en google.
- [X] T002 [P] Test de integración `backend/tests/integration/test_signup_preferences.py`: registro con `language: en`, `theme: dark` → tras verificar el email, `preferences` = en/dark; Google que crea cuenta con en/dark → se guardan; Google con cuenta existente → se ignoran; pending registration viejo sin `theme` → `system`.
- [X] T003 Agregar `theme: ThemeName = "system"` a `RegisterRequest` y `language: LanguageCode | None`, `theme: ThemeName | None` a `GoogleLoginRequest` en `backend/app/schemas/auth.py`.
- [X] T004 Guardar `theme` en `backend/app/repositories/pending_registrations.py`, aceptar `theme` en `new_user_document` (`backend/app/repositories/users.py`) y pasarlo en `backend/app/services/auth_service.py` (alta por email y alta por Google).
- [X] T005 Regenerar `schema.d.ts` de Web y App desde `app.openapi()`.

**Checkpoint**: `pytest` en verde.

---

## Phase 2: User Story 1 - Web sin sesión (P1) 🎯 MVP

**Goal**: controles en el encabezado público; elección guardada en el navegador.

**Independent Test**: escenarios 1–5 y 11 de [quickstart.md](quickstart.md).

- [X] T006 [P] [US1] Test `web/src/__tests__/i18n/request.test.ts`: orden sesión → cookie `NEXT_LOCALE` válida → `Accept-Language` → `es`; cookie inválida se ignora.
- [X] T007 [P] [US1] Test `web/src/__tests__/components/PreferenceControls.test.tsx`: muestra idioma y tema con la opción actual (`aria-checked`); elegir inglés llama a `setLocaleAction("en")` y refresca; elegir oscuro llama a `setTheme("dark")` y escribe la cookie `theme-pref`; operable con teclado.
- [X] T008 [US1] Implementar `setLocaleAction` en `web/src/app/actions/preferences.ts` (cookie `NEXT_LOCALE` según R1; sin sesión no llama a la API) y leer la cookie en `web/src/i18n/request.ts`.
- [X] T009 [US1] Crear `web/src/components/PreferenceControls.tsx` (R6: menú con `CompactMenu` en anchos chicos, `menuitemradio`) y agregarlo a `web/src/components/PublicHeader.tsx`; estilos en `globals.css`; actualizar el test del header.

**Checkpoint**: cambio de idioma y tema sin sesión.

---

## Phase 3: User Story 2 - Web con sesión (P1)

**Goal**: los mismos controles con sesión, guardados en el perfil.

**Independent Test**: escenarios 8 y 9 de [quickstart.md](quickstart.md).

- [X] T010 [P] [US2] Tests: con sesión, `PreferenceControls` aplica local y llama a la acción de preferencias del Perfil; si falla, muestra `preferences.saveFailed` y conserva el cambio local; `LocaleSync` escribe la cookie con el idioma del perfil.
- [X] T011 [US2] Extender `web/src/app/actions/preferences.ts` para que con sesión también haga `PATCH /users/me` (reusar la lógica de `web/src/app/actions/profile.ts`) y devolver el error; mostrar el aviso en `PreferenceControls`.
- [X] T012 [US2] Agregar `PreferenceControls` al encabezado con sesión (`web/src/components/AppShell.tsx` o `SideNav.tsx`) y `LocaleSync` en `web/src/components/AppProviders.tsx`; `ThemeSync` sigue aplicando el tema del perfil.

**Checkpoint**: misma preferencia desde el encabezado y el Perfil.

---

## Phase 4: User Story 3 - Registro y login respetan la elección (P2)

**Goal**: el perfil nuevo toma la elección; el login aplica el perfil.

**Independent Test**: escenarios 6, 7 y 10 de [quickstart.md](quickstart.md).

- [X] T013 [P] [US3] Tests Web: `RegisterForm` envía `language` (idioma actual) y `theme` (tema actual); el alta con Google envía `language`/`theme` desde las cookies.
- [X] T014 [US3] Web: `web/src/components/RegisterForm.tsx` y su acción mandan `language` y `theme`; `web/src/auth.ts` lee `NEXT_LOCALE` y `theme-pref` en el login con Google y los manda a `/auth/google`.
- [X] T015 [US3] Verificar que al cerrar sesión se conservan cookie y tema (sin borrar `NEXT_LOCALE` ni `theme` en `LogoutButton`/`signOut`); agregar un test.

**Checkpoint**: registro y login coherentes.

---

## Phase 5: User Story 4 - App sin sesión (P2)

**Goal**: "Idioma y tema" en las pantallas sin sesión, guardado en el dispositivo.

**Independent Test**: escenarios 12–14 de [quickstart.md](quickstart.md).

- [X] T016 [P] [US4] Test `mobile/src/__tests__/hooks/useDevicePreferences.test.tsx` (SecureStore mockeado): carga, guarda, valores inválidos se ignoran.
- [X] T017 [P] [US4] Test `mobile/src/__tests__/screens/preferenceSheet.test.tsx`: el botón en Login abre la hoja; elegir inglés cambia `i18n.language`; elegir oscuro cambia el tema; registro y Google envían las preferencias del dispositivo; al iniciar sesión el perfil reemplaza al dispositivo.
- [X] T018 [US4] Crear `mobile/src/hooks/useDevicePreferences.ts` y usarlo en `mobile/app/_layout.tsx` (tema = perfil ?? dispositivo) y en el arranque de idioma (`mobile/src/i18n/index.ts` o un efecto en el layout).
- [X] T019 [US4] Crear `mobile/src/components/PreferenceSheet.tsx` y el botón "Idioma y tema" en `mobile/src/screens/{LoginScreen,RegisterScreen,CodeSignInScreen}.tsx`.
- [X] T020 [US4] `mobile/src/services/api/auth.ts`: `register` y `google` mandan `language`/`theme`; `useAuth` copia las preferencias del perfil al dispositivo al iniciar sesión.

**Checkpoint**: paridad con la Web.

---

## Phase 6: Polish

- [X] T021 Quality gates: backend `ruff` y `pytest`; Web y App `npm run lint`, `npx tsc --noEmit`, `npm test`, `prettier --check` sobre lo tocado.
- [X] T022 Revisar Privacidad: mencionar que se guardan idioma y tema en el dispositivo (cookie funcional); actualizar `legal.lastUpdated` si cambia el texto.
- [ ] T023 Validación manual del usuario: escenarios 1–14 de [quickstart.md](quickstart.md).

---

## Dependencies

- Phase 1 bloquea US3 y la parte de registro de US4. US1 → US2 (mismo componente). US4 es
  independiente de la Web.
- Paralelo: T001/T002; T006/T007; T016/T017; US4 en paralelo con US1–US3.

## Implementation Strategy

MVP = US1 (lo que pidió el usuario: cambiar sin sesión). Después US2, US3 y US4.
