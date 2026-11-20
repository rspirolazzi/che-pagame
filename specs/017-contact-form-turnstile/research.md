# Research: Formulario de contacto y protección anti-bots

## R1. Configuración y entorno

- **Decision**: `Settings` suma los siguientes campos:
  - `callmebot_url` (por ejemplo `https://api.callmebot.com/whatsapp.php`), `callmebot_phone` y
    `callmebot_apikey`;
  - `cloudflare_turnstile_secret_key`;
  - `next_public_turnstile_site_key`: la API lo lee del mismo `.env` para servirlo a la App.

  Un `model_validator` exige los cinco cuando `environment == "production"`. El mensaje de error
  nombra las variables que faltan y nunca sus valores (FR-007). La propiedad `bot_check_enabled`
  vale `environment == "production"`. `ENVIRONMENT` ya acepta `production`; si viene en mayúsculas
  se normaliza (validator `mode="before"` con `lower()`).
- **Rationale**: el mismo patrón que `EMAIL_DELIVERY`, y una sola fuente que decide si está activo.

## R2. Verificación Turnstile en el servidor

- **Decision**: `turnstile_service.verify(token, remote_ip=None)`:
  - hace `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` con `secret`,
    `response` y, si existe, `idempotency_key`;
  - usa `httpx.AsyncClient` con timeout de 5 s;
  - si `success` es falso, el token está vacío, ya se usó o hay timeout o error de red, levanta
    `AppError(403, BOT_CHECK_FAILED)`;
  - fuera de producción devuelve `None` sin llamar a Cloudflare.

  Cloudflare ya rechaza los tokens repetidos (`timeout-or-duplicate`), así que no hace falta
  guardarlos.
- **Rationale**: FR-004; con un solo uso alcanza la verificación de Cloudflare.

## R3. Envío por CallMeBot

- **Decision**: `contact_service.send(name, email, message, language, client)`:
  - arma un texto plano de hasta 1.800 caracteres: "ChePagame – nuevo mensaje", nombre, email,
    idioma, cliente, fecha UTC y mensaje;
  - lo envía con `GET {callmebot_url}?phone=…&text=<urlencoded>&apikey=…` y timeout de 5 s;
  - si la respuesta no es 2xx o hay error de red, levanta `AppError(502, CONTACT_UNAVAILABLE)`.

  Fuera de producción solo escribe `logger.info("contact message received", extra={"length": n,
  "language": …, "client": …})`. Nunca se loguean la URL con la clave, el nombre, el email ni el
  texto (FR-003). `httpx` se configura para no loguear la URL (logger `httpx` en WARNING).
- **Rationale**: la clave queda solo en el servidor (FR-014). El texto plano evita problemas de
  formato en WhatsApp.

## R4. Límites

- **Decision**:
  - `LimitPurpose` suma `contact`: 5 por hora por HMAC del email, con
    `check_and_record_email_request`.
  - `LimitPurpose` suma `contact_global`: 30 por hora, con una clave fija `"*"`.
  - Si se supera alguno, se devuelve 429 `rate_limited` con `retryAfter`, como hoy.
  - Si el envío falla, `release()` libera los dos intentos.
- **Rationale**: la API no ve la IP real cuando llama la Web (server action). El tope total
  protege el número del responsable (ver el ajuste en la spec).

## R5. Clave pública y entorno en los clientes

- **Decision**:
  - `GET /api/v1/public-config` devuelve `{"turnstileSiteKey": "<key>" | null}`: `null` fuera de
    producción. Es público y se cachea 5 min.
  - La Web, en sus server components (`lib/turnstile.ts`), lee `ENVIRONMENT` y
    `NEXT_PUBLIC_TURNSTILE_SITE_KEY` del entorno en tiempo de ejecución, sin llamar a la API, y le
    pasa la clave al widget como prop.
  - La App consulta `public-config` al abrir Registro o Contacto.
- **Rationale**: la imagen de la Web se compila en GitHub sin `.env`, así que las variables
  `NEXT_PUBLIC_*` no se incrustarían en el bundle. Leerlas en el servidor evita un `build-arg`. La
  App no necesita una variable de build nueva.

## R6. Widget en la Web

- **Decision**: `TurnstileWidget({ siteKey, onToken, onExpire, onError, language, theme })`:
  - carga `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` con un `<script>`
    propio, solo cuando se monta;
  - llama a `turnstile.render` con `language` y `theme` (`auto`/`light`/`dark`) y
    `refresh-expired: "auto"`;
  - el formulario guarda el token en un campo oculto `turnstileToken`;
  - el botón Enviar queda deshabilitado hasta tener token, con texto de ayuda;
  - si `onError` se dispara, muestra "No pudimos verificar que no sos un robot. Reintentá" y un
    botón para reintentar.
- **Rationale**: sin dependencias. El script solo se carga donde hace falta.

## R7. Widget en la App

- **Decision**:
  - La Web publica `/turnstile?lang=es&theme=dark`: una página mínima (fuera de los layouts
    público y privado, con `noindex`) que muestra el widget y llama a
    `window.ReactNativeWebView.postMessage(JSON.stringify({ token }))`; también avisa `expired` y
    `error`.
  - `TurnstileGate` (App) muestra un `WebView` de unos 70 dp de alto que apunta a
    `EXPO_PUBLIC_WEB_BASE_URL + /turnstile`, recibe el token por `onMessage` y lo devuelve al
    formulario.
  - Solo se acepta un mensaje si la URL de origen coincide con la Web configurada.
  - Si `public-config` dice `null`, el componente no se muestra y devuelve `token = null`.
- **Rationale**:
  - Cloudflare exige que el widget corra en un hostname permitido; la página de la Web lo cumple.
  - Si la App se compila sin `EXPO_PUBLIC_WEB_BASE_URL`, el registro en producción falla de forma
    visible, en lugar de quedar sin protección (el link de invitación ya depende de esa variable).
- **Alternatives considered**:
  - `WebView` con HTML inline y `baseUrl`: depende de cómo cada plataforma trata el origen.
  - Librerías de terceros para Turnstile en React Native: poco mantenidas.

## R8. Registro

- **Decision**:
  - `RegisterRequest` suma `turnstile_token: str | None = Field(default=None, max_length=2048)`.
  - En producción, `auth_service.register` llama a `turnstile_service.verify` antes del límite y
    antes de enviar el email; si falla, devuelve 403 `bot_check_failed` y no manda email.
  - El login con contraseña, con código y con Google no cambian (FR-005).
  - El reenvío del código de registro tampoco cambia: ya tiene límite y solo sirve para emails con
    registro pendiente.

## R9. Constitución y 011

- **Decision**: enmienda MINOR 4.10.0 del Principio VI:
  - Se permite la verificación anti-bots de un tercero solo en formularios que crean cuentas o
    envían mensajes, informada en Privacidad.
  - El envío del formulario de contacto a un servicio de mensajería del responsable requiere
    consentimiento explícito en el formulario.
  - La FR-017 de la 011 se ajusta a "sin scripts de terceros, salvo la verificación anti-bots de la
    017 en registro y Contacto".
- **Rationale**: los cambios de reglas van a la constitución (Governance) y no se resuelven en
  silencio.
