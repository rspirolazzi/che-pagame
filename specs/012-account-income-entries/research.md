# Research: Ingresos en la lista de gastos

## R1. Lista combinada en el servidor

- **Decision**: `GET /api/v1/accounts/{id}/movements?limit&cursor`. El servicio pide `limit + 1`
  gastos activos y `limit + 1` reembolsos activos con el mismo `keyset_after(cursor)`, los mezcla
  por `LIST_SORT` (`date`, `createdAt`, `_id` desc), devuelve los primeros `limit` y
  `nextCursor` = `encode_cursor(último)` si sobró alguno.
- **Rationale**: las dos colecciones ya comparten orden y cursor (`app/core/cursor.py`), así que
  el merge es exacto y la paginación no repite ni salta elementos. El cliente no tiene que
  combinar dos paginaciones.
- **Alternatives considered**: mezclar en el cliente (dos cursores, saltos al paginar); una
  colección nueva de movimientos (duplica datos, Principio VIII).

## R2. Forma de cada movimiento

- **Decision**: unión discriminada `{"kind": "expense", "expense": ExpenseResponse}` |
  `{"kind": "settlement", "settlement": SettlementResponse}`. Mismos esquemas que hoy.
- **Rationale**: los clientes reusan sus tipos y componentes; `openapi-typescript` genera una
  unión discriminada por `kind`.

## R3. Quién lo registró (FR-009)

- **Decision**: `SettlementResponse.recordedBy: ParticipantRef | null`: el participante de la
  Cuenta cuyo `userId` es `createdBy`, con `participant_display_name`; `null` si ya no hay
  participante vinculado (usuario eliminado o quitado). La App/Web muestra "Registrado por X el
  <fecha>" o solo la fecha.
- **Rationale**: no expone ids de usuario ni emails; reusa el nombre traducido de la 015.

## R4. Detalle

- **Decision**: `GET /accounts/{id}/settlements/{settlementId}` → `SettlementResponse` de un
  reembolso activo; 404 `not_found` si no existe o está dado de baja (edge case
  "eliminado por otro"). Mismo control de membresía que la lista.

## R5. Alta desde la lista

- **Decision**: "Ingreso" abre el formulario de reembolso existente (`settlements/new`) con
  `to` = participante del usuario y fecha de hoy; al guardar vuelve a la lista de la Cuenta
  (parámetro `returnTo=list`). El título del formulario dice "Ingreso" cuando viene de la lista.
  `source` = `manual` (sin valor nuevo).
- **Rationale**: FR-003 (mismo reembolso, mismas validaciones e idempotencia).

## R6. Totales

- **Decision**: los totales de la lista siguen saliendo de `expenses.totals` (solo gastos), sin
  sumar reembolsos (FR-007). La lista no agrega totales nuevos.

## R7. Presentación

- **Decision**: fila de ingreso con ícono `swap-horizontal`/`cash-refund` en un círculo con el
  color "positivo" de la marca, texto "Ana le pagó a Beto" (`expenses.income.row`), la etiqueta
  "Ingreso" visible y el importe sin signo. Si `isExcluded`, se muestra igual que en Saldos.
  Accesible: nombre "Ingreso: Ana le pagó a Beto, 5.000,00 ARS".
