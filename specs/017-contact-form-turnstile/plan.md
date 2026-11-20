# Implementation Plan: Formulario de contacto y protección anti-bots

**Branch**: `017-contact-form-turnstile` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/017-contact-form-turnstile/spec.md`

> **Nota de implementación:** en lugar de `httpx` se usó `urllib.request` de la biblioteca estándar, ejecutado con `asyncio.to_thread` y timeout de 5 s. No suma dependencias y los tests mockean la función de transporte (`_post` / `_get`).

## Summary

- **Backend**:
  - Configuración nueva: CallMeBot y Turnstile, obligatoria solo con `ENVIRONMENT=production`.
  - `turnstile_service.verify(token)` llama a `siteverify` de Cloudflare con `urllib` (ver nota).
  - `contact_service.send(...)` arma el texto y llama a CallMeBot.
  - `POST /api/v1/contact` (nuevo) exige Turnstile y aplica límites por email y en total.
  - `POST /api/v1/auth/register` exige Turnstile.
  - `GET /api/v1/public-config` (nuevo) devuelve `{ turnstileSiteKey }`: la clave pública solo en
    producción y `null` en los demás entornos. La App lo usa para saber si mostrar el desafío.
  - Fuera de producción no se verifica nada y no se envía ningún WhatsApp: solo se registra un log
    sin datos personales.
- **Web**:
  - `TurnstileWidget` (cliente) carga el script de Cloudflare solo si recibe la clave.
  - La clave se lee en el servidor en tiempo de ejecución, así no hace falta un `build-arg`.
  - Contacto suma `ContactForm` con consentimiento explícito para CallMeBot, y el registro suma el
    widget.
  - La página `/turnstile` (sin layout) muestra solo el desafío y le devuelve el token a la App por
    `postMessage`.
- **App**:
  - Componente `TurnstileGate`: un `WebView` de `react-native-webview` (dependencia nueva) que carga
    `https://chepagame.com.ar/turnstile`, porque Cloudflare valida el dominio.
  - Formulario de contacto en "Acerca de" (011) y token en el registro.
- **Constitución**: el Principio VI y la FR-017 de la 011 (sin scripts de terceros) chocan con
  Turnstile y con enviar datos a CallMeBot. La enmienda 4.10.0 (T001) explicita la excepción.

## Technical Context

**Language/Version**: Python 3.13; TypeScript (Next.js 16; Expo 56 / RN 0.85)

**Primary Dependencies**:
- Sin dependencias nuevas en el backend: `urllib` de la biblioteca estándar.
- `react-native-webview`: dependencia nueva de la App, soportada por Expo.
- Script de Cloudflare Turnstile, solo en registro, Contacto y `/turnstile`.

**Storage**: `auth_attempts` para los límites, con dos propósitos nuevos: `contact` (por HMAC del
email) y `contact_global`. Los mensajes no se guardan.

**Testing**:
- pytest con `httpx.MockTransport` para Cloudflare y CallMeBot. Ningún test llama a servicios
  reales.
- Jest + Testing Library en Web y App.

**Target Platform**: servidor Linux (Docker), navegadores, Android

**Project Type**: web-service + web-app + mobile-app

**Performance Goals**: enviar Contacto toma < 3 s (verificación + envío); los timeouts externos
son de 5 s

**Constraints**:
- Las claves secretas quedan solo en el servidor (FR-014).
- Los logs no incluyen datos personales (FR-003).
- Si falta configuración en producción, el servidor no arranca (FR-007).
- Los tests corren sin credenciales (SC-004).

**Scale/Scope**:
- Backend: 2 servicios, 2 endpoints nuevos y 1 endpoint modificado.
- Web: 1 componente, 1 formulario y 1 página.
- App: 1 componente, 1 pantalla y 1 cambio en el registro.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regla | Cumplimiento |
|---|---|
| VI. Datos a terceros solo con opt-in | ⚠️ → ✅ Contacto: casilla explícita (FR-013). Turnstile: es seguridad, no analytics, pero carga un script de un tercero y procesa la IP. Se resuelve con la enmienda 4.10.0 (T001) y el aviso en Privacidad (FR-012). |
| 011 FR-017: sin scripts de terceros en páginas públicas | ⚠️ → ✅ Turnstile se carga solo en `/register`, `/contact` y `/turnstile`. T001 actualiza la 011 con esa excepción. |
| VI. Sin secretos en el repo | ✅ Todo sale de `.env`; la clave pública se sirve en tiempo de ejecución |
| I. Paridad Web y Mobile | ✅ Los mismos endpoints y el mismo widget (la App lo carga desde la Web) |
| II. Internacionalización | ✅ Textos en es/en; el widget usa el idioma y el tema elegidos |
| VII. Accesibilidad y Test-First | ✅ Formulario accesible; tests de servicios y endpoints primero |
| VIII. Simplicidad | ✅ Sin colecciones nuevas; los límites reusan `auth_attempts` |

Re-check post-design: sin violaciones; la enmienda 4.10.0 fue aprobada el 2026-11-20.

## Project Structure

### Documentation (this feature)

```text
specs/017-contact-form-turnstile/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/contact-and-bot-check-api.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── pyproject.toml                          # httpx to main dependencies
└── app/
    ├── core/config.py                      # callmebot_*, turnstile keys; required in production
    ├── core/errors.py                      # BOT_CHECK_FAILED, CONTACT_UNAVAILABLE
    ├── services/turnstile_service.py       # NEW: verify(token, client_ip=None)
    ├── services/contact_service.py         # NEW: send(message) via CallMeBot or log
    ├── services/rate_limit_service.py      # + contact limits
    ├── repositories/auth_attempts.py       # LimitPurpose + contact, contact_global
    ├── schemas/contact.py                  # NEW: ContactRequest
    ├── schemas/auth.py                     # RegisterRequest.turnstile_token
    ├── api/v1/contact.py                   # NEW: POST /contact
    ├── api/v1/public_config.py             # NEW: GET /public-config
    ├── api/v1/auth.py                      # register checks Turnstile
    └── main.py                             # routers
web/src/
├── lib/turnstile.ts                        # NEW: turnstileSiteKey() server-side (production only)
├── components/TurnstileWidget.tsx          # NEW
├── components/ContactForm.tsx              # NEW
├── components/ContactContent.tsx           # + form
├── components/RegisterForm.tsx             # + widget, token to the action
├── app/actions/contact.ts                  # NEW: sendContactAction
├── app/actions/auth.ts                     # register forwards the token
├── app/turnstile/page.tsx                  # NEW: bare page for the App's WebView
└── i18n/messages/{es,en}.json              # contact form, errors, privacy section
mobile/
├── package.json                            # + react-native-webview
├── src/components/TurnstileGate.tsx        # NEW
├── src/screens/about/ContactFormScreen.tsx # NEW (or inside AboutScreens from 011)
├── src/screens/RegisterScreen.tsx          # + gate
├── src/services/api/{contact,publicConfig,auth}.ts
└── src/i18n/locales/{es,en}.json
.env.example                                # new variables with empty values
```

**Structure Decision**:
- Dos servicios backend chicos y testeables con transporte mockeado.
- La página `/turnstile` de la Web evita mantener una segunda integración en la App.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Script de un tercero (Cloudflare) en tres páginas | El usuario pidió verificación anti-bots en registro y Contacto | Un captcha propio es más débil y menos accesible. Un honeypot solo frena bots simples. |
| `react-native-webview` en la App | Turnstile solo funciona en un navegador con el dominio permitido | No hay SDK nativo de Turnstile para React Native |
