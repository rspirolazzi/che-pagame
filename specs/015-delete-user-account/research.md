# Research: Eliminar mi cuenta de usuario

## R1. Endpoints

- **Decision**: dos endpoints nuevos en `users`, con el mismo patrón que el cambio de email:
  `POST /api/v1/users/me/deletion` (202, envía el código) y
  `POST /api/v1/users/me/deletion/confirm` con `{ "code": "123456" }` (204, borra). Ver
  [contracts/delete-account-api.md](contracts/delete-account-api.md).
- **Rationale**: Web y App usan la misma API (Principio I). Dos pasos separan "mandar el código" de
  "borrar", igual que `email-change` y `email-change/confirm`.
- **Alternatives considered**: `DELETE /users/me` con el código en el cuerpo; se descartó porque
  muchos clientes y proxies no mandan cuerpo en `DELETE` y el pedido del código igual necesitaría
  otro endpoint.

## R2. Código de confirmación (FR-003)

- **Decision**: nuevo propósito `delete_account` en `verification_codes` (`CodePurpose`) y en
  `auth_attempts` (`LimitPurpose`), con `verification_service.issue_code` / `verify_code` tal como
  están: mismo vencimiento, máximo 5 intentos y el mismo límite de pedidos por email que el login
  con código. Nueva plantilla de email `delete_account` en `templates/emails/es` y `en`, con un
  aviso de que el código borra la cuenta y que si no lo pidió no haga nada.
- **Rationale**: reusa el mecanismo probado y funciona igual para usuarios con contraseña o solo
  con Google (el código va al email de la cuenta).
- **Alternatives considered**: pedir la contraseña (no sirve para usuarios de Google); volver a
  iniciar sesión con Google (dos flujos distintos en cada cliente).

## R3. Qué pasa con el documento del usuario (FR-004, FR-005, FR-011)

- **Decision**: borrado **físico** del documento en `users`, dentro de la transacción del borrado.
  En la misma transacción se borran sus `refresh_tokens`, los `verification_codes` de su email (y
  de su `pendingEmail`, si tiene) y los `pending_registrations` de esos emails.
- **Rationale**:
  - El Principio IV exige bajas lógicas para Cuentas y Gastos, no para usuarios; y el Principio VI
    (4.9.0) pide borrar los datos personales de forma irreversible. Borrar el documento es la forma
    más simple de cumplirlo y libera el índice único de email para un registro nuevo (FR-011).
  - `get_current_user_id` ya verifica en cada pedido que el usuario exista, así que un access
    token todavía vigente (15 min) falla con 401 en cuanto se borra el documento (FR-005). Los
    refresh tokens borrados no se pueden renovar.
  - Los `auth_attempts` guardan un HMAC del email, no el email; se dejan para que el borrado no
    sirva para saltear el límite de pedidos, y vencen solos.
- **Alternatives considered**: anonimizar el documento (`email` = `deleted-<id>@invalid`) y
  marcarlo `isDeleted`; deja un registro que hay que excluir en cada consulta y no aporta nada.

## R4. Participantes en las Cuentas (FR-006, FR-007, FR-008)

- **Decision**: para cada Cuenta (incluso cerradas) donde el usuario tiene un participante
  vinculado (`participants.userId == user`):
  - **Si queda otro participante activo con `userId`**: el participante del usuario queda con
    `userId: null`, `anonymizedAt: <fecha>`, `name: "Usuario eliminado"` y
    `nameKey: "\u0000deleted:<participantId>"` (una clave que nunca coincide con un nombre real, así
    dos usuarios eliminados no chocan por nombre duplicado). Si el usuario era `ownerId`, pasa al
    participante activo con `userId` y el `linkedAt` más antiguo.
  - **Si no queda ninguno**: la Cuenta queda `isDeleted: true` (misma baja lógica que
    `delete_account`; los gastos y reembolsos dejan de verse con ella y las invitaciones fallan
    porque `_valid_account` exige `isDeleted: false`). El participante igual se anonimiza.
- **Nombre traducido**: un helper `participant_display_name(participant, language)` devuelve el
  texto traducido ("Usuario eliminado" / "Deleted user") cuando `anonymizedAt` no es nulo y el
  nombre guardado en otro caso. Reemplaza los `p["name"]` de `account_permissions`,
  `balance_service`, `expense_service`, `expense_history`, `export_builder` e `invitation_service`.
  El idioma sale de un `ContextVar` (`request_language` en `core/i18n.py`) que una dependencia
  global del router `/api/v1` fija con `Accept-Language`; las exportaciones pasan su idioma
  explícito. Así no cambian las firmas de una docena de funciones (se descartó sumar
  `LanguageDep` en cada endpoint).
- **Renombrar**: si un miembro renombra a "Usuario eliminado", el participante vuelve a ser uno de
  texto libre normal (`anonymizedAt: null`, `nameKey` del nombre nuevo). Quitarlo usa la regla de
  remoción existente.
- **Rationale**: los gastos referencian el `id` del participante, no al usuario, así que saldos,
  gastos y reembolsos no cambian (SC-003). Usar `linkedAt` como "se unió primero" es determinista:
  el creador tiene `linkedAt` desde la creación.
- **Alternatives considered**: quitar el participante (cambia los saldos de los demás, descartado
  en Clarifications); guardar el nombre en español sin traducir (rompe el Principio II).

## R5. Auditoría (FR-010, Principio IV)

- **Decision**:
  - Nueva acción `user.deleted` (`actorUserId` = `entityId` = el id del usuario, `changes: {}`,
    metadata `{client, accountsDeleted, accountsKept}`), más una entrada `account.member_deleted`
    por Cuenta afectada con `ownerId` antes/después si cambió y `deleted: true` si se dio de baja.
  - Nueva función `audit_logs.anonymize_user(user_id, participant_ids, session)`, la única que
    modifica entradas existentes y solo dentro del borrado:
    - entradas con `entityType: "user"` y `entityId` = usuario: los valores de `email`,
      `pendingEmail`, `firstName` y `lastName` en `changes` (`before`/`after`) pasan a
      `"[deleted]"`;
    - entradas de Cuentas que nombran a sus participantes (`participant` con su `id`,
      `participant.<id>.name`): los nombres pasan a `"[deleted]"`.
  - El docstring de `audit_logs` y el de la función explican la excepción y que la API no la expone.
- **Rationale**: cumple el Principio IV (las entradas siguen existiendo, con quién, qué y cuándo
  por id interno) y el VI (sin datos personales). El historial de gastos ya muestra nombres desde
  la Cuenta, no desde la auditoría.
- **Alternatives considered**: borrar las entradas del usuario (rompe el Principio IV); dejarlas
  con el email (rompe el VI y SC-002).

## R6. Atomicidad y concurrencia (FR-009)

- **Decision**: todo el borrado (verificar el código, Cuentas, auditoría, tokens, códigos,
  registros pendientes y usuario) corre en un `run_in_transaction`, que reintenta ante conflictos
  de escritura. Las actualizaciones de Cuentas usan filtros condicionales
  (`participants.$[p].userId == user`), así que dos usuarios que se borran a la vez en la misma
  Cuenta se serializan y el segundo ve el estado del primero (si ya no queda nadie, la Cuenta se da
  de baja).
- **Rationale**: un usuario de una app entre amigos tiene pocas Cuentas (decenas), así que una sola
  transacción alcanza. Si algo falla, no queda nada a medias.

## R7. Logs (FR-014)

- **Decision**: los logs del borrado solo usan el id del usuario y contadores; nunca email ni
  nombre. Un test verifica con `caplog` que el email no aparece.

## R8. Web

- **Decision**:
  - Página privada `/profile/delete`: explica qué se borra y qué se conserva, enlaza "Exportar mis
    datos", pide el código y lo confirma con el `CodeInput` existente. Server actions
    `requestAccountDeletionAction` y `confirmAccountDeletionAction` en
    `web/src/app/actions/profile.ts`; al confirmar, `signOut({ redirectTo: "/login?deleted=1" })`
    y el login muestra "Tu cuenta fue eliminada".
  - El Perfil suma una sección "Eliminar mi cuenta" (zona destructiva) con un link a esa página.
  - Página pública `/delete-account` (en el grupo `(public)`, como `privacy`) con `LegalPage` o un
    componente similar: pasos, qué se borra, qué se conserva y un botón a
    `/login?callbackUrl=/profile/delete` (o directo a `/profile/delete` si hay sesión). Link en el
    footer junto a Privacidad.
  - `legal.privacy.sections` suma `delete` ("Eliminar tus datos") con el link, y se actualiza
    `legal.lastUpdated`.
- **Rationale**: Google Play pide una URL pública; `/delete-account` en inglés sigue la
  convención de las otras rutas (`/privacy`, `/about`).

## R9. App

- **Decision**: pantalla `mobile/app/(app)/delete-account.tsx` (stack, fuera de las pestañas) con
  el mismo contenido que la Web; el Perfil suma un botón "Eliminar mi cuenta" con tono `danger`.
  `usersApi.requestDeletion()` y `usersApi.confirmDeletion(code)`; al confirmar, borra los tokens
  guardados con la misma ruta que `logout` (sin llamar a `/auth/logout`, que ya fallaría) y vuelve
  al login con el aviso. "Exportar mis datos" abre la exportación existente. Para quien ya
  desinstaló la App, la página web de R8.
- **Rationale**: misma API y mismos textos (Principio I y II); sin dependencias nuevas.
