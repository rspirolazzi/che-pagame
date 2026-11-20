---

description: "Task list for feature 016: compact amounts (K and M)"
---

# Tasks: Importes grandes abreviados (K y M)

**Input**: documentos de diseño en `specs/016-compact-amounts/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [quickstart.md](quickstart.md)

**Tests**: incluidos (Principio VII, SC-003, SC-005). Se escriben primero y fallan antes de
implementar.

## Formato: `[ID] [P?] [Story] Descripción`

- **[Story]**: US1 (leer importes grandes), US2 (ver el exacto), US3 (pantallas que no se
  desarman).

## Convenciones

- Umbrales: K desde 10.000; M desde 1.000.000; un decimal como máximo, sin ceros finales,
  half-up; "K"/"M" en es y en (research R1, R2).
- Nunca abreviar en formularios, `MarkPaidDialog`, vista previa de la división, historial,
  partes del detalle ni exportaciones (R5).

---

## Phase 1: Foundational

- [ ] T001 Crear `test-vectors/compact-amounts.json` con ~30 casos (research R6): 9.999,99 / 10.000 / 25.500 / 999.949 / 999.950 / 1.000.000 / 1.234.567,89 / 10.000.000 / 999.999.999,99 / 1.250.000.000 / negativos / CLP y KWD / es y en.
- [ ] T002 [P] Test `web/src/__tests__/lib/formatCompactMoney.test.ts`: lee los casos compartidos y compara con espacios normalizados.
- [ ] T003 [P] Test `mobile/src/__tests__/utils/formatCompactMoney.test.ts`: lo mismo para la App.
- [ ] T004 [P] Implementar `formatCompactMoney(amount, currency, decimals, locale)` en `web/src/lib/money.ts` con `BigInt` y `formatToParts` (R1, R2).
- [ ] T005 [P] Implementar la misma función en `mobile/src/utils/money.ts`.

**Checkpoint**: Web y App dan el mismo texto para todos los casos.

---

## Phase 2: User Story 2 - Ver el exacto (P1)

Va antes que US1 porque el componente `Money` es la forma segura de abreviar en las listas.

**Goal**: el importe exacto siempre disponible (accesible, mouse/foco, detalle).

**Independent Test**: escenarios 4–6, 8 y 9 de [quickstart.md](quickstart.md).

- [ ] T006 [P] [US2] Test `web/src/__tests__/components/ui/Money.test.tsx`: abreviado visible, `title` y `aria-label` con el exacto; sin atributos si no abrevia.
- [ ] T007 [P] [US2] Test `mobile/src/__tests__/components/Money.test.tsx`: texto abreviado y `accessibilityLabel` exacto.
- [ ] T008 [US2] Crear `web/src/components/ui/Money.tsx` y `mobile/src/components/Money.tsx` (R3).
- [ ] T009 [US2] Detalle de gasto: `web/src/components/expenses/ExpenseDetail.tsx` y `mobile/src/screens/expenses/ExpenseDetailScreen.tsx` muestran el abreviado grande y, si difiere, el exacto debajo en texto secundario; las partes siguen exactas. Tests de ambos detalles actualizados.
- [ ] T010 [US2] Si la 012 ya está implementada, aplicar lo mismo al detalle de reembolso (`SettlementDetail` Web y App).

**Checkpoint**: componente y detalle listos.

---

## Phase 3: User Story 1 - Leer importes grandes de un vistazo (P1) 🎯 MVP

**Goal**: listas, saldos, sugerencias, tarjetas de Cuentas e Inicio abreviados.

**Independent Test**: escenarios 1–3, 10–12 de [quickstart.md](quickstart.md).

- [ ] T011 [P] [US1] Tests Web: `AmountText` abrevia y su nombre accesible usa el exacto, con signo/color/indicador intactos; `ExpenseList`, `BalanceSummary`, `SuggestionList`, `SettlementList`, `AccountList` y `HomePreview` muestran "10 M ARS" para 10.000.000; `MarkPaidDialog` sigue prellenando exacto.
- [ ] T012 [P] [US1] Tests App: lo mismo en `AmountText`, `ExpenseBits`, `AccountExpensesScreen`, `AccountsScreen`, `BalanceList`, `BalanceSummary`, `SuggestionList`, `SettlementList`.
- [ ] T013 [US1] Web: `web/src/components/ui/AmountText.tsx` usa `formatCompactMoney` para el texto y el exacto para `aria-label`; reemplazar `formatMoney` por `Money` en `web/src/components/expenses/ExpenseList.tsx`, `web/src/components/balances/{BalanceList,BalanceSummary,SettlementList,SuggestionList}.tsx`, `web/src/components/accounts/AccountList.tsx` y `web/src/components/HomePreview.tsx`.
- [ ] T014 [US1] App: lo mismo en `mobile/src/components/AmountText.tsx`, `mobile/src/components/expenses/ExpenseBits.tsx`, `mobile/src/components/balances/{BalanceList,BalanceSummary,SettlementList,SuggestionList}.tsx`, `mobile/src/screens/accounts/AccountsScreen.tsx` y `mobile/src/screens/expenses/AccountExpensesScreen.tsx`.
- [ ] T015 [US1] Si la 012 ya está implementada, `IncomeRow` (Web y App) usa `Money`.

**Checkpoint**: importes abreviados en todas las vistas de resumen.

---

## Phase 4: User Story 3 - Pantallas que no se desarman (P2)

**Goal**: título, fecha e importe legibles en 360 dp y con texto al 200 %.

**Independent Test**: escenario 7 de [quickstart.md](quickstart.md).

- [ ] T016 [P] [US3] Test App en `mobile/src/__tests__/screens/expenseDetail.test.tsx`: el encabezado tiene dos filas (ícono + título/fecha; importe debajo) y el título no está en la misma fila que el importe.
- [ ] T017 [US3] App: rearmar el encabezado de `mobile/src/screens/expenses/ExpenseDetailScreen.tsx` en dos filas (R4) con `flexShrink: 1` en el título; revisar las filas de `ExpenseBits` para que el título trunque con elipsis y el importe no se corte.
- [ ] T018 [US3] Web: en `web/src/components/expenses/ExpenseDetail.tsx`, `header.row` con `flex-wrap: wrap` y `min-width: 12ch` en el título (`web/src/app/globals.css`).

**Checkpoint**: la pantalla de la captura se ve bien.

---

## Phase 5: Polish

- [ ] T019 Quality gates: Web y App `npm run lint`, `npx tsc --noEmit`, `npm test`, `prettier --check` sobre lo tocado.
- [ ] T020 Validación manual del usuario: escenarios 1–12 de [quickstart.md](quickstart.md) en Web y App (el 7 en un teléfono real).

---

## Dependencies

- Phase 1 → US2 (`Money`) → US1. US3 es independiente (solo layout) y puede ir en paralelo.
- Paralelo: T002–T005; T006/T007; T011/T012; Web y App de cada historia.

## Implementation Strategy

MVP = Phase 1 + US2 + US1. US3 resuelve el resto del bug de la captura.
