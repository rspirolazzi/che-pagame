# Contract: Eliminar mi cuenta de usuario

Base: `/api/v1`. Errores con el formato existente `{ "error": { "code", "message",
"retryAfterSeconds?" } }`. Requieren `Authorization: Bearer <access token>`; `X-Client: web |
mobile` y `Accept-Language` como en el resto de la API.

## `POST /users/me/deletion`

Envía un código de un solo uso al email del usuario (plantilla `delete_account`).

- Cuerpo: ninguno.
- `202 Accepted` → `{ "status": "accepted" }` (mismo `Accepted` que `email-change`).
- `401 unauthorized`: sin sesión o el usuario ya no existe.
- `429 rate_limited` (+ `retryAfterSeconds`): superó el límite de pedidos de código.
- `503 email_unavailable`: no se pudo enviar el email.

Pedir otro código invalida el anterior.

## `POST /users/me/deletion/confirm`

Verifica el código y elimina al usuario en una transacción (research R3–R6).

- Cuerpo: `{ "code": "123456" }` (6 dígitos).
- `204 No Content`: usuario eliminado; todas sus sesiones dejan de valer.
- `400 invalid_code`: código incorrecto, vencido, ya usado o sin intentos. No cambia nada.
- `401 unauthorized`: sin sesión o el usuario ya no existe.
- `422 validation_error`: el cuerpo no tiene un código de 6 dígitos.

Después del `204`, cualquier pedido con el mismo access token o refresh token responde `401`.

## Cambios en respuestas existentes

- Todo nombre de participante con `anonymizedAt` se devuelve traducido según `Accept-Language`
  ("Usuario eliminado" / "Deleted user"): cuentas, saldos, gastos, historial, invitaciones y
  exportaciones.
- `ParticipantResponse` suma `isAnonymized: boolean` para que los clientes puedan mostrarlo con un
  estilo distinto (opcional en la UI).

## Rutas de la Web

| Ruta | Acceso | Contenido |
|---|---|---|
| `/delete-account` | Pública | Pasos, qué se borra, qué se conserva y botón "Eliminar mi cuenta" (→ `/login?callbackUrl=/profile/delete` sin sesión). |
| `/profile/delete` | Con sesión | Explicación, "Exportar mis datos", pedir código, ingresar código, confirmar. |
| `/login?deleted=1` | Pública | Login con el aviso "Tu cuenta fue eliminada". |
| `/privacy` | Pública | Nueva sección "Eliminar tus datos" con link a `/delete-account`. |

## Pantalla de la App

`mobile/app/(app)/delete-account.tsx`, abierta desde el Perfil. Al confirmar, borra los tokens
guardados y vuelve al login con el aviso.
