---

description: "Task list for feature 015: delete my user account"
---

# Tasks: Eliminar mi cuenta de usuario

**Input**: documentos de diseño en `specs/015-delete-user-account/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/delete-account-api.md](contracts/delete-account-api.md),
[quickstart.md](quickstart.md)

**Tests**: incluidos (Principio VII): el borrado es lógica de dominio con datos personales,
auditoría y saldos. Los tests de cada historia se escriben primero y tienen que fallar antes de
implementar.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes).
- **[Story]**: US1 (borrar mi cuenta desde el Perfil), US2 (las Cuentas compartidas siguen
  funcionando), US3 (página pública para borrar sin la App).

## Convenciones

- Código, comentarios, mensajes de error y commits en inglés (Principio V); textos de UI en es y
  en (Principio II), con los tests de paridad de mensajes en verde.
- Ningún log ni respuesta incluye el email o el nombre del usuario (FR-014).
- Textos fijos: "Usuario eliminado" / "Deleted user" (nombre del participante); `"[deleted]"`
  (valor anonimizado en la auditoría); propósito `delete_account`.
- Rutas: API `POST /api/v1/users/me/deletion` y `/users/me/deletion/confirm`; Web
  `/profile/delete` (privada) y `/delete-account` (pública); App `mobile/app/(app)/delete-account.tsx`.

---

## Phase 1: Setup

**Purpose**: valores nuevos que usan todas las historias.

- [X] T001 [P] Agregar `"delete_account"` a `CodePurpose` en `backend/app/repositories/verification_codes.py` y a `LimitPurpose` en `backend/app/repositories/auth_attempts.py`; revisar `backend/app/services/rate_limit_service.py` para que el límite de pedidos de `delete_account` sea el mismo que el de `login`.
- [X] T002 [P] Agregar las acciones `"user.deleted"` y `"account.member_deleted"` a `AuditAction` en `backend/app/services/audit_service.py`.
- [X] T003 [P] Crear las plantillas `backend/app/templates/emails/es/delete_account.html` y `backend/app/templates/emails/en/delete_account.html` (extienden `base.html` como `login_code.html`): el código, que sirve para **eliminar la cuenta**, cuánto dura y "si no lo pediste, ignorá este email; tu cuenta sigue igual". Registrar `delete_account` en el tipo `EmailTemplate` de `backend/app/services/email_service.py`.

---

## Phase 2: Foundational (bloquea US1 y US2)

**Purpose**: nombre traducido del participante anonimizado y anonimización de la auditoría.

- [X] T004 [P] Test en `backend/tests/unit/test_account_permissions.py`: `participant_display_name(p, "es")` devuelve "Usuario eliminado" y con `"en"` "Deleted user" cuando `anonymizedAt` no es nulo; devuelve `p["name"]` cuando es nulo o no existe.
- [X] T005 Implementar `participant_display_name(participant, language)` en `backend/app/services/account_permissions.py` con los textos en `backend/app/core/i18n.py`, y usarlo donde hoy se lee `p["name"]` para mostrar: `account_permissions.py` (respuesta de la Cuenta, que además suma `is_anonymized` en `ParticipantResponse` de `backend/app/schemas/account.py`), `balance_service.py`, `expense_service.py`, `expense_history.py`, `export_builder.py` e `invitation_service.py`. Los endpoints que no reciben el idioma suman `LanguageDep` en `backend/app/api/v1/`.
- [X] T006 [P] Test en `backend/tests/unit/test_audit_immutability.py`: actualizar `test_repository_exposes_only_insert_and_reads` para aceptar exactamente `insert`, `list_for_entity` y `anonymize_user`, y agregar un test que verifique que `anonymize_user` solo se llama desde `backend/app/services/account_deletion_service.py`.
- [X] T007 [P] Test en `backend/tests/integration/test_audit_anonymization.py`: con entradas `user.email_changed`, `user.email_change_requested`, `user.profile_updated` del usuario y entradas de Cuentas con `participant: {id, name}` y `participant.<id>.name` de su participante, `anonymize_user` deja `"[deleted]"` en esos valores, no toca otras claves (`actorUserId`, `action`, `createdAt`) ni entradas de otros usuarios o participantes, y no borra ninguna entrada.
- [X] T008 Implementar `anonymize_user(user_id, participant_ids, session)` en `backend/app/repositories/audit_logs.py` con `update_many` y pipelines de agregación; actualizar el docstring del módulo: la única modificación permitida es reemplazar datos personales durante el borrado de un usuario (constitución 4.9.0, Principios IV y VI) y la API no la expone.

**Checkpoint**: tests de T004, T006 y T007 en verde; el resto de la suite del backend sigue en verde.

---

## Phase 3: User Story 1 - Borrar mi cuenta desde el Perfil (Priority: P1) 🎯 MVP

**Goal**: el usuario pide un código, lo confirma y su usuario, sesiones y datos personales
desaparecen.

**Independent Test**: quickstart escenarios 1–4, 9–11 y 14.

### Tests for User Story 1

- [X] T009 [P] [US1] Contract test `backend/tests/contract/test_account_deletion_contract.py`: `POST /users/me/deletion` → 202 `{status: "accepted"}`, 401 sin token, 429 con `retryAfterSeconds` al superar el límite; `POST /users/me/deletion/confirm` → 204, 400 `invalid_code`, 422 con un código que no tiene 6 dígitos, 401 sin token.
- [X] T010 [P] [US1] Integration test `backend/tests/integration/test_account_deletion.py` (parte US1): después del 204, el documento de `users` no existe; los `refresh_tokens`, `verification_codes` y `pending_registrations` de su email y `pendingEmail` tampoco; el access token anterior da 401 en `GET /users/me` y el refresh token da 401 en `/auth/refresh`; un código incorrecto no cambia nada y el código correcto no se gasta si la transacción falla (simular un error); un usuario solo de Google recibe el código y se borra igual; registrarse otra vez con el mismo email crea un usuario nuevo sin Cuentas; hay una entrada `user.deleted` con `changes: {}` y sin email ni nombre en ningún campo.
- [X] T011 [P] [US1] En `backend/tests/integration/test_no_sensitive_data.py`: durante el borrado, `caplog` no contiene el email ni el nombre del usuario; y después, una búsqueda del email y del nombre de perfil en todas las colecciones no devuelve nada (SC-002).

### Implementation for User Story 1

- [X] T012 [US1] Agregar `DeletionConfirmRequest` (`code`: 6 dígitos, con la misma validación que `EmailChangeConfirmRequest`) en `backend/app/schemas/user.py`.
- [X] T013 [P] [US1] Agregar helpers de borrado: `delete(user_id, session)` en `backend/app/repositories/users.py`, `delete_all_for_user(user_id, session)` en `refresh_tokens.py`, `delete_for_emails(emails, session)` en `verification_codes.py` y `pending_registrations.py`.
- [X] T014 [US1] Crear `backend/app/services/account_deletion_service.py` con `request_deletion(user_id, client)` (usa `verification_service.issue_code` con `purpose="delete_account"`, `limit_purpose="delete_account"`, `template="delete_account"` y el idioma del usuario) y `confirm_deletion(user_id, code, client)`: en un `run_in_transaction` verifica el código, llama al paso de Cuentas (T020, por ahora un stub que devuelve los contadores en cero), `audit_logs.anonymize_user`, registra `user.deleted` (metadata `{client, accountsDeleted, accountsKept}`), borra tokens, códigos y registros pendientes y por último el usuario. Los logs solo usan el id.
- [X] T015 [US1] Agregar los endpoints `POST /me/deletion` (202, `Accepted`) y `POST /me/deletion/confirm` (204) en `backend/app/api/v1/users.py`, y regenerar los tipos de la API (`web/src/lib/api/schema.d.ts`, `mobile/src/services/api/schema.d.ts`) con `npm run gen:api` en `web/` y en `mobile/` (backend levantado).
- [X] T016 [P] [US1] Web: `requestAccountDeletionAction()` y `confirmAccountDeletionAction(code)` en `web/src/app/actions/profile.ts`; el confirm, si sale bien, llama a `signOut({ redirectTo: "/login?deleted=1" })`.
- [X] T017 [US1] Web: componente `web/src/components/DeleteAccountFlow.tsx` (qué se borra, qué se conserva, `ExportButton` de "Exportar mis datos", botón "Enviarme el código", `CodeInput`, errores `invalid_code` y `rate_limited` con `FormMessage`, botón Cancelar que vuelve al Perfil) y página `web/src/app/(private)/profile/delete/page.tsx`; sección "Eliminar mi cuenta" con estilo de zona destructiva y link a esa página en `web/src/app/(private)/profile/page.tsx`; aviso "Tu cuenta fue eliminada" en `web/src/app/(public)/login/page.tsx` cuando `deleted=1`. Textos en `web/src/i18n/messages/es.json` y `en.json`. Test en `web/src/__tests__/components/DeleteAccountFlow.test.tsx` (pasos, errores, cancelar).
- [X] T018 [P] [US1] App: `requestDeletion()` y `confirmDeletion(code)` en `mobile/src/services/api/users.ts`; `mobile/src/screens/DeleteAccountScreen.tsx` con el mismo contenido que la Web (exportar con la exportación existente, `CodeInput`, `StatusNotice` para errores, botón con tono `danger`); ruta `mobile/app/(app)/delete-account.tsx`; botón "Eliminar mi cuenta" en `mobile/src/screens/ProfileScreen.tsx`. Al confirmar, limpia los tokens con el mismo camino que `logout` pero sin llamar a `/auth/logout`, y vuelve al login con el aviso. Textos en `mobile/src/i18n/locales/es.json` y `en.json`. Test en `mobile/src/__tests__/screens/deleteAccount.test.tsx`.

**Checkpoint**: T009–T011 en verde; quickstart escenarios 1–4 y 9–11 en local.

---

## Phase 4: User Story 2 - Las Cuentas compartidas siguen funcionando (Priority: P1)

**Goal**: los demás miembros conservan gastos y saldos; el participante queda "Usuario
eliminado"; el Owner pasa al siguiente; las Cuentas sin otros miembros se dan de baja.

**Independent Test**: quickstart escenarios 5–8.

### Tests for User Story 2

- [X] T019 [P] [US2] Integration test `backend/tests/integration/test_account_deletion.py` (parte US2):
  - en una Cuenta con otro miembro registrado, el participante queda con `userId: null`, `anonymizedAt` fijado, `nameKey` `"\u0000deleted:<id>"`, y `GET /accounts/{id}` lo devuelve como "Usuario eliminado" (`Accept-Language: es`) o "Deleted user" (`en`) con `isAnonymized: true`;
  - los saldos (`GET /accounts/{id}/balances`) son iguales antes y después (SC-003);
  - si era Owner, `ownerId` pasa al participante con `userId` y menor `linkedAt`;
  - en una Cuenta donde los demás participantes son de texto libre, queda `isDeleted: true` y su invitación responde como inválida;
  - las Cuentas cerradas también se procesan;
  - hay una entrada `account.member_deleted` por Cuenta;
  - dos usuarios que se borran a la vez en la misma Cuenta (dos tareas concurrentes) terminan con la Cuenta dada de baja y sin errores;
  - renombrar al participante anonimizado lo deja como uno de texto libre (`anonymizedAt: null`) y después se puede quitar con la regla existente.

### Implementation for User Story 2

- [X] T020 [US2] Implementar el paso de Cuentas en `backend/app/services/account_deletion_service.py` (reemplaza el stub de T014): busca las Cuentas, cerradas incluidas, con un participante activo `userId == user`; por cada una aplica con `accounts.update` y `array_filters` sobre `p.userId == user` la anonimización de [data-model.md](data-model.md), y transfiere `ownerId` o fija `isDeleted`/`deletedAt`; registra `account.member_deleted`; devuelve los ids de los participantes (para `anonymize_user`) y los contadores.
- [X] T021 [US2] En `rename_participant` de `backend/app/services/account_service.py`, renombrar un participante anonimizado pone `anonymizedAt: null` (y el `nameKey` del nombre nuevo, como ya hace).
- [X] T022 [P] [US2] Web y App: si `isAnonymized` es true, mostrar el nombre en itálica o con el color secundario en la lista de participantes (`web/src/components/accounts/ParticipantList.tsx` y `mobile/src/screens/accounts/AccountDetailScreen.tsx`). Actualizar los tests existentes de esas listas si cambian.

**Checkpoint**: T019 en verde; quickstart escenarios 5–8.

---

## Phase 5: User Story 3 - Página pública para borrar sin la App (Priority: P1)

**Goal**: una URL pública para Google Play que explique cómo borrar la cuenta, enlazada desde
Privacidad y el footer.

**Independent Test**: quickstart escenarios 12–13.

- [X] T023 [P] [US3] Página `web/src/app/(public)/delete-account/page.tsx` (con `metadata` de título y descripción): pasos, qué se borra, qué se conserva y botón "Eliminar mi cuenta" que va a `/profile/delete` si hay sesión o a `/login?callbackUrl=/profile/delete` si no. Verificar que `safeCallbackUrl` acepta esa ruta. Textos en `web/src/i18n/messages/es.json` y `en.json` (`deleteAccountPage.*`). Test en `web/src/__tests__/components/DeleteAccountPage.test.tsx`.
- [X] T024 [P] [US3] Sección `legal.privacy.sections.delete` ("Eliminar tus datos" / "Delete your data") con link a `/delete-account` en es y en (ubicada después de `export`, si `LegalPage` recorre las secciones en orden); actualizar `legal.lastUpdated`; actualizar `web/src/__tests__/components/LegalPage.test.tsx` si cuenta secciones.
- [X] T025 [P] [US3] Link "Eliminar mi cuenta" junto a Privacidad en `web/src/components/SiteFooter.tsx` y, si `web/src/proxy.ts` lista las rutas públicas, agregar `/delete-account`.

**Checkpoint**: quickstart escenarios 12–13 sin sesión, en computadora y teléfono.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T026 [P] README: en la sección de privacidad o de la API, mencionar los endpoints de borrado y la URL `https://chepagame.com.ar/delete-account` para el formulario de Google Play.
- [X] T027 Quality gates: `ruff check`, `ruff format --check` y `pytest` en `backend/`; `npm run lint`, `npx tsc --noEmit` y `npm test` en `web/` y `mobile/` (paridad de mensajes incluida).
- [ ] T028 Validación manual del usuario: recorrer los 15 escenarios de [quickstart.md](quickstart.md) en local y, después del deploy, abrir `/delete-account` en producción sin sesión.

---

## Dependencies & Execution Order

- **Setup (T001–T003)** → **Foundational (T004–T008)** → US1 y US2.
- **US1 (T009–T018)** es el MVP: sin US2, el stub de T014 no toca las Cuentas, así que US1 se
  prueba con un usuario sin Cuentas. No se despliega a producción sin US2.
- **US2 (T019–T022)** depende de T014 (servicio) y T005 (nombre traducido).
- **US3 (T023–T025)** solo depende de que exista `/profile/delete` (T017) para el botón; el
  texto se puede hacer en paralelo desde el principio.
- **Polish (T026–T028)** al final.

### Parallel Opportunities

- T001, T002 y T003 en paralelo.
- T004, T006 y T007 (tests) en paralelo; después T005 y T008.
- En US1: T009, T010 y T011 en paralelo; T013 en paralelo con T012; T016 y T018 en paralelo con
  T017 una vez hecho T015.
- US3 (T023–T025) en paralelo con US2.

## Implementation Strategy

1. Setup + Foundational.
2. US1 completo (backend, Web y App) → probar con un usuario sin Cuentas.
3. US2 → probar con Cuentas compartidas (quickstart 5–8). Recién acá se puede desplegar.
4. US3 → cargar la URL en Google Play.
5. Polish y validación manual.
