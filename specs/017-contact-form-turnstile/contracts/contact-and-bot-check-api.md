# Contract: contacto, configuración pública y registro con verificación

## `GET /api/v1/public-config`

Público, sin sesión. Se puede cachear 5 minutos.

**200**

```json
{ "turnstileSiteKey": "0x4AAAA…" }
```

`turnstileSiteKey` es `null` fuera de producción.

## `POST /api/v1/contact`

Público. Si hay sesión, se ignora.

```json
{ "name": "Ana", "email": "ana@example.com", "message": "Hola, …", "language": "es",
  "consent": true, "turnstileToken": "…" }
```

**202 Accepted**, sin cuerpo: el mensaje se envió por WhatsApp (en producción) o se registró en el
log (en los demás entornos).

**Errores**:

| Código | `code` | Cuándo |
|---|---|---|
| 422 | `validation_error` | Campo inválido o `consent` distinto de `true` |
| 403 | `bot_check_failed` | En producción: token ausente, inválido, vencido o ya usado |
| 429 | `rate_limited` | Se superó el límite por email o el total; incluye `retryAfter` |
| 502 | `contact_unavailable` | CallMeBot falló. Los clientes ofrecen el email de contacto |

## `POST /api/v1/auth/register` (cambio)

Suma el campo `turnstileToken` (string ≤ 2.048 o `null`). En producción se verifica antes de
cualquier otra cosa. Si falla, responde 403 `bot_check_failed` y no envía el email.

## Página Web `GET /turnstile?lang=es|en&theme=light|dark|auto`

Página sin layout, con `noindex`, que solo muestra el desafío. Le envía a la App
`window.ReactNativeWebView.postMessage` con uno de estos mensajes:

- `{"type":"token","token":"…"}`
- `{"type":"expired"}`
- `{"type":"error"}`

Fuera de producción muestra "Verificación desactivada" y envía `{"type":"token","token":null}`.
