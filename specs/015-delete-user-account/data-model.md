# Data Model: Eliminar mi cuenta de usuario

Sin colecciones nuevas. Cambios sobre las existentes:

## `users`

| Cambio | Detalle |
|---|---|
| Borrado físico | El documento se elimina al confirmar (research R3). Libera `email_unique` y `google_subject_unique`. |

## `accounts.participants[]` (embebido)

| Campo | Tipo | Regla |
|---|---|---|
| `anonymizedAt` | `datetime \| null` (nuevo) | Se fija cuando el usuario vinculado se elimina. Ausente o `null` en los participantes existentes: no hace falta migración. |
| `userId` | `ObjectId \| null` | Pasa a `null` al eliminar el usuario. |
| `name` | `string` | Pasa a `"Usuario eliminado"`; las respuestas lo traducen según el idioma del pedido mientras `anonymizedAt` no sea nulo. |
| `nameKey` | `string` | Pasa a `"\u0000deleted:<participantId>"`, que nunca coincide con un nombre real. |

**Transiciones**:

- vinculado → anonimizado: al eliminar el usuario.
- anonimizado → texto libre: si un miembro lo renombra (`anonymizedAt: null`, `nameKey` del
  nombre nuevo).
- anonimizado → quitado: regla de remoción existente.

## `accounts`

| Campo | Regla |
|---|---|
| `ownerId` | Si era el usuario eliminado y quedan miembros registrados: el participante activo con `userId` y menor `linkedAt`. |
| `isDeleted`, `deletedAt` | `true` y la fecha si no queda ningún participante activo con `userId`. |

## `refresh_tokens`, `verification_codes`, `pending_registrations`

Se borran los documentos del usuario (`userId`) o de sus emails (`email` y `pendingEmail`).

## `verification_codes.purpose` y `auth_attempts.purpose`

Nuevo valor `delete_account`.

## `audit_logs`

| Cambio | Detalle |
|---|---|
| Acción `user.deleted` | `actorUserId` = `entityId` = id del usuario; `changes: {}`; metadata `{client, accountsDeleted, accountsKept}`. |
| Acción `account.member_deleted` | Una por Cuenta afectada; `changes` con `participant.<id>.userId` (antes: id, después: null), `ownerId` si cambió y `isDeleted` si se dio de baja. |
| Anonimización | En entradas existentes del usuario, los valores de `email`, `pendingEmail`, `firstName`, `lastName` y los nombres de sus participantes pasan a `"[deleted]"` (research R5). Es la única modificación permitida y solo la hace el borrado. |
