# Data Model: Formulario de contacto y protección anti-bots

## Mensaje de contacto (request, no se guarda)

| Campo | Tipo | Regla |
|---|---|---|
| `name` | string | 1–100 caracteres, sin espacios al inicio ni al final |
| `email` | email | válido |
| `message` | string | 10–2.000 caracteres |
| `language` | `es` \| `en` | idioma de la interfaz |
| `consent` | boolean | MUST ser `true` (FR-013) |
| `turnstileToken` | string \| null | ≤ 2.048 caracteres; obligatorio en producción |

`client` (`web`/`mobile`) sale del encabezado `X-Client`, como en el resto de la API.

## Límites (`auth_attempts`, sin cambios de esquema)

| Propósito | Clave | Límite |
|---|---|---|
| `contact` | HMAC del email | 5 por hora |
| `contact_global` | `"*"` | 30 por hora |

## Configuración (`.env`, gitignored)

| Variable | Dónde se usa | Obligatoria |
|---|---|---|
| `CALLMEBOT_URL`, `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY` | API | en producción |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | API | en producción |
| `CLOUDFLARE_TURNSTILE_SITE_KEY` | Web (servidor) y API (`public-config`) | en producción |
| `ENVIRONMENT` | API y Web | ya existe |
