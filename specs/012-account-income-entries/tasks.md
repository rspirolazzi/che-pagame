---

description: "Task list for feature 012: income entries in the expense list"
---

# Tasks: Ingresos en la lista de gastos

**Input**: documentos de diseño en `specs/012-account-income-entries/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/movements-api.md](contracts/movements-api.md),
[quickstart.md](quickstart.md)

**Tests**: incluidos (Principio VII). Se escriben primero y fallan antes de implementar.

## Formato: `[ID] [P?] [Story] Descripción`

- **[Story]**: US1 (registrar un ingreso), US2 (ver ingresos y gastos juntos), US3 (detalle y
  eliminar).

## Convenciones

- "Ingreso" / "Income" es solo texto de UI; en código se sigue llamando `settlement`.
- Textos: `expenses.add.{expense,income}`, `expenses.income.{label,row,recordedBy,noEdit,...}`
  en es/en (Web y App), con los tests de paridad en verde.
- Importes como texto decimal (Principio III); errores 404 con el código genérico `not_found`.

---

## Phase 1: Foundational (backend)

**Purpose**: `recordedBy`, detalle y lista combinada, que usan las tres historias.

- [X] T001 [P] Test de contrato `backend/tests/contract/test_movements_contract.py`: forma de `GET /api/v1/accounts/{id}/movements` (`items[].kind` en `expense|settlement`, `expense`/`settlement` según `kind`, `nextCursor`), 404 `not_found` para no miembro, 422 para cursor inválido, `limit` fuera de 1–100 → 422.
- [X] T002 [P] Test de contrato `backend/tests/contract/test_settlement_detail_contract.py`: `GET /accounts/{id}/settlements/{sid}` devuelve `SettlementResponse` con `recordedBy`; 404 `not_found` si no existe, está dado de baja o el usuario no es miembro.
- [X] T003 [P] Test de integración `backend/tests/integration/test_movements.py`: orden combinado por `date`, `createdAt`, `_id` desc con gastos y reembolsos en las mismas fechas; paginar de a 2 recorre todo sin repetir ni saltar; excluye dados de baja; `recordedBy` = participante vinculado al creador, `null` si el creador ya no está vinculado; los saldos y `expenses.totals` no cambian.
- [X] T004 Agregar `recorded_by: ParticipantRef | None` a `SettlementResponse` en `backend/app/schemas/settlement.py` y completarlo en `backend/app/services/settlement_service.py` (participante con `userId == createdBy`, nombre con `participant_display_name`); actualizar los tests de contrato de settlements existentes.
- [X] T005 Agregar `find_one_active(account_id, settlement_id)` en `backend/app/repositories/settlements.py` y `get_settlement(account_id, settlement_id, user_id)` en `settlement_service` (membresía igual que la lista; 404 `not_found`); exponer `GET /{settlement_id}` en `backend/app/api/v1/settlements.py`.
- [X] T006 Crear `backend/app/schemas/movement.py` (`ExpenseMovement`, `SettlementMovement` con `kind` literal, `Movement` como unión discriminada, `MovementPage`) y `backend/app/services/movement_service.py` (`list_movements`: `limit + 1` de cada repositorio con el mismo `keyset_after`, merge por `LIST_SORT`, `encode_cursor` del último devuelto) reusando los conversores de `expense_service` y `settlement_service`.
- [X] T007 Crear `backend/app/api/v1/movements.py` (`GET /accounts/{account_id}/movements`, mismos límites de `limit`/`cursor` que gastos) e incluir el router en `backend/app/main.py`.
- [X] T008 Regenerar `web/src/lib/api/schema.d.ts` y `mobile/src/services/api/schema.d.ts` desde `app.openapi()` con `openapi-typescript`; agregar `isAnonymized`/`recordedBy` a los fixtures de tests de Web y App que construyen settlements.

**Checkpoint**: `pytest` en verde; los clientes compilan.

---

## Phase 2: User Story 2 - Ver ingresos y gastos juntos (P1)

**Goal**: la lista de la Cuenta muestra gastos e ingresos mezclados por fecha.

**Independent Test**: escenarios 5–8 de [quickstart.md](quickstart.md).

- [X] T009 [P] [US2] Test Web `web/src/__tests__/components/expenses/ExpenseList.test.tsx`: renderiza movimientos de los dos tipos agrupados por fecha; el ingreso muestra la etiqueta "Ingreso", el texto "Ana le pagó a Beto", ícono con nombre accesible y enlaza a `settlements/{id}`; "Cargar más" usa `nextCursor`.
- [X] T010 [P] [US2] Test App `mobile/src/__tests__/screens/accountExpenses.test.tsx`: igual que T009 con `movementsApi.list`.
- [X] T011 [US2] Web: `loadMoreMovementsAction` en `web/src/app/actions/expenses.ts`, la página `web/src/app/(private)/accounts/[accountId]/page.tsx` pide `/movements`, `ExpenseList.tsx` renderiza `kind` y nuevo `web/src/components/expenses/IncomeRow.tsx` (R7).
- [X] T012 [US2] App: `mobile/src/services/api/movements.ts` (`list(accountId, cursor?)`), `IncomeRow` en `mobile/src/components/expenses/ExpenseBits.tsx` y `mobile/src/screens/expenses/AccountExpensesScreen.tsx` con movimientos; `mobile/src/screens/accounts/AccountDetailScreen.tsx` si muestra los últimos gastos.
- [X] T013 [US2] Textos `expenses.income.{label,row,a11y}` en es/en (Web y App).

**Checkpoint**: lista combinada en Web y App.

---

## Phase 3: User Story 1 - Registrar un ingreso desde la lista (P1) 🎯 MVP

**Goal**: "+" ofrece "Gasto" e "Ingreso"; el ingreso usa el formulario de reembolso.

**Independent Test**: escenarios 1–4, 11 y 13 de [quickstart.md](quickstart.md).

- [X] T014 [P] [US1] Test Web `web/src/__tests__/components/expenses/AddMovementMenu.test.tsx`: el menú ofrece las dos opciones y enlaza a `expenses/new` y `settlements/new?from=list`; en Cuenta Cerrada no se muestra "Ingreso". Test de `SettlementForm`: con `from=list` el título es "Ingreso", "recibió" = mi participante, fecha de hoy y al guardar vuelve a la lista.
- [X] T015 [P] [US1] Test App `mobile/src/__tests__/screens/settlementForm.test.tsx` y el de la lista: FAB con menú "Gasto / Ingreso", parámetros por defecto y regreso a la lista; sin "Ingreso" en Cuenta Cerrada.
- [X] T016 [US1] Web: `web/src/components/expenses/AddMovementMenu.tsx` reemplaza el botón "+" de la lista; `web/src/app/(private)/accounts/[accountId]/settlements/new/page.tsx` y `web/src/components/balances/SettlementForm.tsx` aceptan `from=list` (título, `to` por defecto y redirección).
- [X] T017 [US1] App: FAB con `FAB.Group` o menú en `AccountExpensesScreen.tsx`; `mobile/src/screens/balances/SettlementFormScreen.tsx` lee `from=list` de los parámetros de `mobile/app/(app)/accounts/[accountId]/settlements/new.tsx`.
- [X] T018 [US1] Textos `expenses.add.{expense,income}`, `settlements.form.incomeTitle` en es/en.

**Checkpoint**: alta de ingresos desde la lista.

---

## Phase 4: User Story 3 - Detalle y eliminar un ingreso (P2)

**Goal**: detalle con datos, "Registrado por" y eliminar con confirmación; sin editar.

**Independent Test**: escenarios 9, 10 y 12 de [quickstart.md](quickstart.md).

- [X] T019 [P] [US3] Test Web `web/src/__tests__/components/balances/SettlementDetail.test.tsx`: muestra pagó, recibió, importe, fecha, "Registrado por" (u omitido si `recordedBy` es null), la ayuda de no edición; eliminar pide confirmación y llama a la acción existente; sin eliminar en Cuenta Cerrada; 404 muestra "ya no existe".
- [X] T020 [P] [US3] Test App `mobile/src/__tests__/screens/settlementDetail.test.tsx`: igual que T019.
- [X] T021 [US3] Web: `web/src/components/balances/SettlementDetail.tsx` y la página `web/src/app/(private)/accounts/[accountId]/settlements/[settlementId]/page.tsx` (`notFound()` ante 404); reusar la acción de baja de Saldos y volver a la lista.
- [X] T022 [US3] App: `settlementsApi.get(accountId, id)` en `mobile/src/services/api/settlements.ts`, `mobile/src/screens/balances/SettlementDetailScreen.tsx` y la ruta `mobile/app/(app)/accounts/[accountId]/settlements/[settlementId].tsx`.
- [X] T023 [US3] Textos `settlements.detail.{title,from,to,recordedBy,noEdit,deleted}` en es/en.

**Checkpoint**: ciclo completo.

---

## Phase 5: Polish

- [X] T024 Quality gates: backend `ruff check`, `ruff format --check`, `pytest`; Web y App `npm run lint`, `npx tsc --noEmit`, `npm test`, `prettier --check` sobre lo tocado.
- [X] T025 Si la 011 ya está implementada, agregar la pregunta "¿Cómo registro que alguien me devolvió plata?" a `pages.faq` (Web y App).
- [X] T026 README: mencionar "Ingresos" en la sección de gastos/saldos.
- [ ] T027 Validación manual del usuario: escenarios 1–14 de [quickstart.md](quickstart.md) en Web y App.

---

## Dependencies

- Phase 1 bloquea todo. US2 antes de US1 (la lista tiene que mostrar el ingreso recién cargado);
  US3 depende de T005.
- Paralelo: T001–T003; T009/T010; T014/T015; T019/T020; Web y App de cada historia.

## Implementation Strategy

MVP = Phase 1 + US2 + US1 (cargar y ver). US3 completa el ciclo.
