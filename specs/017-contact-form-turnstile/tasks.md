---

description: "Task list for feature 017: contact form and anti-bot check"
---

# Tasks: Formulario de contacto y protección anti-bots

**Input**: documentos de diseño en `specs/017-contact-form-turnstile/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/contact-and-bot-check-api.md](contracts/contact-and-bot-check-api.md),
[quickstart.md](quickstart.md)

**Tests**: incluidos (Principio VII). Se escriben primero y fallan antes de implementar. Ningún
test llama a Cloudflare ni a CallMeBot: se usa `httpx.MockTransport` o mocks.

## Formato: `[ID] [P?] [Story] Descripción`

- **[Story]**: US1 (formulario de contacto), US2 (registro protegido), US3 (solo en producción).

## Convenciones

- Las credenciales solo en `.env`. Nunca se escriben en código, tests, logs ni chat.
- Códigos de error nuevos: `bot_check_failed` (403) y `contact_unavailable` (502).
- Textos: `contact.form.*`, `contact.errors.*`, `botCheck.*` y `legal.privacy.sections.thirdParties`
  en es/en, en Web y App.

---

## Phase 1: Setup

- [X] T001 Enmienda de la constitución 4.10.0 con `/speckit-constitution`, según research R9: excepción en el Principio VI para la verificación anti-bots y el envío del formulario de contacto con consentimiento explícito. Ajustar la FR-017 de `specs/011-seo-public-pages/spec.md`. Aprobada por el usuario el 2026-11-20.
- [ ] T002 [P] Pasar `httpx` de `[dependency-groups].dev` a `dependencies` en `backend/pyproject.toml` y actualizar el lock (`uv lock`).
- [ ] T003 [P] Agregar `react-native-webview` con `npx expo install react-native-webview` en `mobile/`.
- [ ] T004 [P] Agregar a `.env.example`, con valores vacíos y un comentario que diga "solo en producción": `CALLMEBOT_URL`, `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY`, `CLOUDFLARE_TURNSTILE_SECRET_KEY` y `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

---

## Phase 2: Foundational (configuración y servicios)

- [ ] T005 [P] Test `backend/tests/unit/test_config_production.py`:
  - Con `ENVIRONMENT=production` y cada variable faltante, `Settings()` falla y el mensaje nombra la variable sin mostrar ningún valor.
  - `ENVIRONMENT=PRODUCTION` se normaliza a `production`.
  - En `development` no hace falta ninguna variable.
- [ ] T006 [P] Test `backend/tests/unit/test_turnstile_service.py`, con transporte mock:
  - `success: true` pasa.
  - `success: false`, `timeout-or-duplicate`, token vacío, timeout o error de red levantan 403 `bot_check_failed`.
  - Fuera de producción no hace ninguna llamada.
- [ ] T007 [P] Test `backend/tests/unit/test_contact_service.py`, con transporte mock:
  - El texto incluye nombre, email, idioma, cliente, fecha y mensaje, y se corta en 1.800 caracteres.
  - La URL lleva `phone`, `text` y `apikey` codificados.
  - Una respuesta no 2xx o un error de red levantan 502 `contact_unavailable`.
  - Fuera de producción no llama y loguea solo largo, idioma y cliente; `caplog` no tiene email, nombre, texto ni apikey.
- [ ] T008 Implementar los campos y el validador de producción en `backend/app/core/config.py` (R1) y agregar `BOT_CHECK_FAILED` y `CONTACT_UNAVAILABLE` en `backend/app/core/errors.py`.
- [ ] T009 [P] Implementar `backend/app/services/turnstile_service.py` (R2).
- [ ] T010 [P] Implementar `backend/app/services/contact_service.py` (R3) y subir el logger `httpx` a WARNING en la configuración de logging.
- [ ] T011 Crear `GET /api/v1/public-config` en `backend/app/api/v1/public_config.py` (R5, con `Cache-Control: public, max-age=300`) e incluirlo en `backend/app/main.py`, con un test de contrato en `backend/tests/contract/test_public_config_contract.py` (devuelve `null` fuera de producción y la clave en producción).

**Checkpoint**: servicios probados sin credenciales.

---

## Phase 3: User Story 1 - Formulario de contacto (P1) 🎯 MVP

**Goal**: Contacto en Web y App envía el mensaje por WhatsApp (en producción).

**Independent Test**: escenarios 2–6, 8, 9 y 13 de [quickstart.md](quickstart.md).

- [ ] T012 [P] [US1] Test de contrato `backend/tests/contract/test_contact_contract.py` para `POST /api/v1/contact`:
  - Responde 202 en el caso feliz.
  - Responde 422 si hay campos inválidos o `consent` no es `true`.
  - En producción, con el servicio mockeado, responde 403 sin token.
  - Responde 429 con `retryAfter`.
  - Responde 502 cuando falla el envío.
- [ ] T013 [P] [US1] Test de integración `backend/tests/integration/test_contact_limits.py`:
  - 5 envíos por email por hora y 30 en total.
  - Un envío fallido libera los intentos.
  - No se guarda nada fuera de `auth_attempts`.
- [ ] T014 [US1] Backend:
  - Agregar `contact` y `contact_global` a `LimitPurpose` (`backend/app/repositories/auth_attempts.py`) y los límites en `rate_limit_service.py` (R4).
  - Crear `ContactRequest` en `backend/app/schemas/contact.py` (data-model.md).
  - Crear `POST /contact` en `backend/app/api/v1/contact.py`, que verifica Turnstile, aplica los límites y envía; incluir el router.
- [ ] T015 [US1] Regenerar `schema.d.ts` de Web y App.
- [ ] T016 [P] [US1] Test Web `web/src/__tests__/components/ContactForm.test.tsx`:
  - Validaciones, contador de caracteres y casilla de consentimiento sin marcar por defecto.
  - El botón queda deshabilitado sin token cuando hay clave.
  - El éxito muestra "Mensaje enviado".
  - El 502 muestra el email de contacto y conserva el texto; el 429 muestra el aviso de límite.
  - Con sesión, nombre y email vienen completados.
  - Un doble clic envía una sola vez.
- [ ] T017 [US1] Web:
  - Crear `web/src/lib/turnstile.ts` (clave solo si `ENVIRONMENT` es `production`, leída en el servidor).
  - Crear `web/src/components/TurnstileWidget.tsx` (R6) y `web/src/components/ContactForm.tsx`.
  - Crear `sendContactAction` en `web/src/app/actions/contact.ts`.
  - Integrar el formulario en `web/src/components/ContactContent.tsx` y `web/src/app/(public)/contact/page.tsx`, manteniendo el email como alternativa.
- [ ] T018 [P] [US1] Test App `mobile/src/__tests__/screens/contactForm.test.tsx`: los mismos casos que T016, con `TurnstileGate` mockeado.
- [ ] T019 [US1] App:
  - Crear `contactApi.send` y `publicConfigApi.get` en `mobile/src/services/api/`.
  - Crear `mobile/src/components/TurnstileGate.tsx` (R7).
  - Crear la pantalla de Contacto con formulario: si la 011 ya creó "Acerca de", agregarla ahí; si no, crear `mobile/app/(app)/contact.tsx` con un acceso desde el Perfil.
- [ ] T020 [US1] Web: crear la página `web/src/app/turnstile/page.tsx` (contrato) con `noindex` y fuera del header y el footer. Si hace falta, sacarla del layout raíz con un grupo de rutas.
- [ ] T021 [US1] Agregar los textos `contact.form.*`, `contact.errors.*` y `botCheck.*` en es/en, en Web y App.

**Checkpoint**: Contacto funciona en desarrollo (log) y queda listo para producción.

---

## Phase 4: User Story 2 - Registro protegido (P1)

**Goal**: en producción, el registro con email exige Turnstile en Web y App.

**Independent Test**: escenarios 10–12 de [quickstart.md](quickstart.md).

- [ ] T022 [P] [US2] Test de integración `backend/tests/integration/test_register_bot_check.py`, con producción simulada y `turnstile_service` mockeado:
  - Sin token, o con un token rechazado, responde 403 y no se envía ningún email ni se crea un registro pendiente.
  - Con un token válido, el registro sigue como hoy.
  - Los logins con contraseña, con código y con Google no piden token.
- [ ] T023 [US2] Backend:
  - Agregar `turnstile_token` a `RegisterRequest` (`backend/app/schemas/auth.py`).
  - Verificar el token al principio de `auth_service.register` (R8).
- [ ] T024 [P] [US2] Tests de registro en Web y App:
  - Con clave, se muestra el widget y el token llega a la acción o a la API.
  - Sin clave (desarrollo), no se muestra nada.
  - Un 403 `bot_check_failed` muestra un mensaje traducido para reintentar.
- [ ] T025 [US2] Web: `web/src/components/RegisterForm.tsx` y la acción de registro mandan `turnstileToken`.
- [ ] T026 [US2] App: `mobile/src/screens/RegisterScreen.tsx` usa `TurnstileGate` y `authApi.register` manda el token.

**Checkpoint**: registro protegido en los dos clientes.

---

## Phase 5: User Story 3 - Solo en producción (P1)

**Goal**: nada se activa fuera de producción, y producción no arranca incompleta.

**Independent Test**: escenarios 1, 2 y 7 de [quickstart.md](quickstart.md).

- [ ] T027 [US3] Revisar que todos los tests de backend, Web y App corran sin las variables nuevas: `ENVIRONMENT=test` y CI sin secrets. Agregar un test que importe la app con `ENVIRONMENT=development` y verifique que `public-config` devuelve `null`.
- [ ] T028 [US3] `deploy/docker-compose.prod.yml` y `deploy/DIGITALOCEAN.md`:
  - Documentar las variables nuevas en el `.env` del servidor (sin valores).
  - Documentar el hostname permitido en Cloudflare.
  - Explicar que la Web lee la clave pública en tiempo de ejecución, así que no hace falta un `build-arg`.

---

## Phase 6: Polish

- [ ] T029 Privacidad (FR-012): sumar la sección `legal.privacy.sections.thirdParties` (CallMeBot para Contacto, con consentimiento; Cloudflare Turnstile en registro y Contacto) en es/en, en Web y App si tiene Privacidad, y actualizar `legal.lastUpdated`.
- [ ] T030 Quality gates:
  - Backend: `ruff check`, `ruff format --check` y `pytest`.
  - Web y App: `npm run lint`, `npx tsc --noEmit`, `npm test` y `prettier --check` sobre lo tocado.
- [ ] T031 README: sección "Contacto y verificación anti-bots (feature 017)" con las variables (sin valores), el comportamiento por entorno y cómo probar en local.
- [ ] T032 Validación manual del usuario:
  - Escenarios 1–7 de [quickstart.md](quickstart.md) en local.
  - Escenarios 8–15 en producción, con las credenciales cargadas en el `.env` del servidor.

---

## Dependencies

- T001 (constitución) antes de implementar.
- Phase 2 bloquea las historias. US1 y US2 se pueden hacer en paralelo después de T008–T011; T020 (`/turnstile`) es necesaria para la App en US1 y en US2.
- Paralelo: T002–T004; T005–T007; T009/T010; los tests de cada historia.

## Implementation Strategy

- **MVP**: Phase 2 + US1 en la Web.
- Después sigue US2, que es la protección principal contra bots.
- Por último la App, con la página `/turnstile` y `TurnstileGate`, y la documentación de US3.
