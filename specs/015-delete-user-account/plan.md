# Implementation Plan: Eliminar mi cuenta de usuario

**Branch**: `015-delete-user-account` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/015-delete-user-account/spec.md`

## Summary

Google Play y la constitución 4.9.0 (Principio VI) exigen que el usuario pueda eliminar su
cuenta desde la App y con un link web. El backend suma dos endpoints (`POST /users/me/deletion` y
`/confirm`) que confirman con un código por email (mismo mecanismo que el cambio de email) y, en
una transacción:

- borran el documento del usuario, sus sesiones, códigos y registros pendientes;
- anonimizan su participante en las Cuentas compartidas ("Usuario eliminado", traducido),
  pasan el rol de Owner al miembro registrado más antiguo y dan de baja las Cuentas donde era el
  único miembro registrado;
- registran `user.deleted` y quitan sus datos personales de la auditoría existente.

La Web suma `/profile/delete`, la página pública `/delete-account` y una sección en Privacidad; la
App suma una pantalla desde el Perfil. Sin dependencias nuevas.

## Technical Context

**Language/Version**: Python 3.13 (backend), TypeScript (Web, Next.js 16; App, Expo 56 / RN 0.85)

**Primary Dependencies**: FastAPI, PyMongo async, Auth.js v5, next-intl, Expo Router,
React Native Paper (todas ya en uso)

**Storage**: MongoDB (`users`, `accounts`, `audit_logs`, `refresh_tokens`, `verification_codes`,
`pending_registrations`); transacciones con `run_in_transaction`

**Testing**: pytest (unit, integration, contract) en `backend/`; Jest + Testing Library en `web/` y
`mobile/`

**Target Platform**: servidor Linux (Docker), navegadores, Android (iOS igual por la misma App)

**Project Type**: web-service + web-app + mobile-app (monorepo)

**Performance Goals**: el borrado completo en < 2 s para un usuario con 50 Cuentas

**Constraints**: atómico (FR-009); sin datos personales en logs (FR-014); la auditoría solo se
modifica para anonimizar (FR-010)

**Scale/Scope**: 2 endpoints, 1 servicio nuevo, 1 función de auditoría, 1 helper de nombres en ~7
lugares; 2 páginas Web + 1 sección; 1 pantalla de la App; textos es/en

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regla | Cumplimiento |
|---|---|
| VI. Eliminar la cuenta desde Web y Mobile con confirmación | ✅ R1, R2, R8, R9: código por email en los dos clientes |
| VI. Borrar o anonimizar email, nombre, credenciales, sesiones y Google | ✅ R3: borrado físico del usuario, tokens y códigos |
| VI. Página pública + Privacidad que la enlaza | ✅ R8: `/delete-account` y sección en `/privacy` |
| VI. Sin datos personales en logs | ✅ R7 con test |
| IV. Auditoría inmutable y bajas lógicas | ✅ R5: las entradas se conservan; solo se reemplazan datos personales (excepción que la constitución 4.9.0 permite). Cuentas con baja lógica (R4) |
| IV. Operaciones destructivas con confirmación explícita | ✅ Código por email + botón de confirmar |
| I. Misma API para Web y Mobile | ✅ Dos endpoints compartidos |
| II. Internacionalización | ✅ Textos es/en; nombre anonimizado traducido por `Accept-Language` |
| III. Exactitud monetaria | ✅ Los gastos no se tocan; saldos iguales (SC-003, test) |
| V. Strict English Rule | ✅ Código y comentarios en inglés; specs en español |
| VII. Test-First | ✅ Tests del servicio de borrado, la anonimización y los endpoints antes del código |
| VIII. Simplicidad | ✅ Sin colecciones ni dependencias nuevas; reusa `verification_service` |

Re-check post-design: sin violaciones. Complexity Tracking vacío.

## Project Structure

### Documentation (this feature)

```text
specs/015-delete-user-account/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── delete-account-api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
backend/app/
├── api/v1/users.py                      # + POST /me/deletion, /me/deletion/confirm
├── services/account_deletion_service.py # NEW: request_deletion, confirm_deletion (R3–R7)
├── services/account_permissions.py      # + participant_display_name(); AccountResponse uses it
├── services/{balance,expense,expense_history,export_builder,invitation}_service.py # display name
├── services/audit_service.py            # + user.deleted, account.member_deleted
├── services/account_service.py          # rename clears anonymizedAt
├── repositories/audit_logs.py           # + anonymize_user() (documented exception)
├── repositories/{users,refresh_tokens,verification_codes,pending_registrations}.py # delete helpers
├── repositories/verification_codes.py   # CodePurpose + delete_account
├── repositories/auth_attempts.py        # LimitPurpose + delete_account
├── schemas/{user,account}.py            # DeletionConfirmRequest; isAnonymized
├── core/i18n.py                         # "Usuario eliminado" / "Deleted user"
└── templates/emails/{es,en}/delete_account.html
backend/tests/{unit,integration,contract}/  # deletion tests
web/src/
├── app/(private)/profile/delete/page.tsx   # NEW
├── app/(public)/delete-account/page.tsx    # NEW
├── app/(private)/profile/page.tsx          # + "Eliminar mi cuenta" section
├── app/(public)/login/page.tsx             # deleted=1 notice
├── app/actions/profile.ts                  # + request/confirm deletion actions
├── components/DeleteAccountFlow.tsx        # NEW
├── components/SiteFooter.tsx               # + link
└── i18n/messages/{es,en}.json              # texts, privacy section, lastUpdated
mobile/
├── app/(app)/delete-account.tsx            # NEW
├── src/screens/DeleteAccountScreen.tsx     # NEW
├── src/screens/ProfileScreen.tsx           # + button
├── src/services/api/users.ts               # + requestDeletion, confirmDeletion
└── src/i18n/locales/{es,en}.*               # texts
```

**Structure Decision**: un servicio nuevo `account_deletion_service.py` concentra el borrado para
que `user_service` no crezca y la transacción quede en un solo lugar. El resto son cambios
puntuales sobre módulos existentes.

## Implementation Notes

- **Orden en la transacción**: verificar el código → listar Cuentas con el participante
  vinculado → por cada una, anonimizar y transferir Owner o dar de baja → auditoría
  (`account.member_deleted`, `anonymize_user`, `user.deleted`) → borrar tokens, códigos y
  registros pendientes → borrar el usuario.
- **Código y transacción**: `verify_code` consume el código dentro de la sesión, igual que en
  `confirm_email_change`, así que si la transacción falla el código no se gasta.
- **Owner**: si el usuario es Owner y queda otro miembro registrado, `ownerId` pasa al de menor
  `linkedAt`; `require_owner` sigue funcionando sin cambios.
- **Clientes**: la Web cierra la sesión con `signOut` de Auth.js; la App limpia `tokenStorage`
  sin llamar a `/auth/logout` (respondería 401).
- **Textos legales**: actualizar `legal.lastUpdated` en es y en.

## Complexity Tracking

Sin violaciones.
