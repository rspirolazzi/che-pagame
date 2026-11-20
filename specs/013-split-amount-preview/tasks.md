---

description: "Task list for feature 013: split amount preview"
---

# Tasks: Importe por participante al cargar un gasto

**Input**: documentos de diseño en `specs/013-split-amount-preview/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [quickstart.md](quickstart.md)

**Tests**: incluidos (Principio VII y SC-001). Se escriben primero y fallan antes de implementar.

## Formato: `[ID] [P?] [Story] Descripción`

- **[Story]**: US1 (ver la parte de cada uno), US2 (quien no comparte).

## Convenciones

- Importes como texto decimal o `bigint`, nunca `number` (Principio III).
- Textos nuevos `expenses.form.{shareOf,notSharing}` en es/en (Web y App).

---

## Phase 1: Foundational

- [X] T001 Crear `test-vectors/split-equal.json` con ~20 casos (data-model.md): 0, 2 y 3 decimales; 1 a 6 personas; sobrante 0, 1 y n−1; selección en desorden; un participante fuera de `selected` en medio del orden; importe máximo `999999999.999` con 3 decimales; 1 unidad mínima entre 3.
- [X] T002 [P] Test `backend/tests/unit/test_split_equal_cases.py`: para cada caso, `split_equal(to_minor(amount), selected, accountOrder)` formateado con los decimales del caso es igual a `expected` y la suma es el total.
- [X] T003 [P] Test `web/src/__tests__/lib/splitEqual.test.ts`: lee el JSON con `fs` desde la raíz del repo y verifica `splitEqual(amount, decimals, selected, accountOrder)` contra `expected`; más `toMinor`/`fromMinor` (ida y vuelta, 0 y 3 decimales).
- [X] T004 [P] Test `mobile/src/__tests__/utils/splitEqual.test.ts`: igual que T003 para la App.
- [X] T005 [P] Implementar `toMinor`, `fromMinor` y `splitEqual` (devuelve `Map<string, string>` decimal) en `web/src/lib/money.ts` (R1, R2).
- [X] T006 [P] Implementar las mismas funciones en `mobile/src/utils/money.ts`.

**Checkpoint**: las tres implementaciones pasan los mismos casos.

---

## Phase 2: User Story 1 - Ver cuánto pone cada uno (P1) 🎯 MVP

**Goal**: la parte al lado de cada persona tildada, recalculada al instante.

**Independent Test**: escenarios 1–4, 7–12 de [quickstart.md](quickstart.md).

- [X] T007 [P] [US1] Test Web en `web/src/__tests__/components/expenses/ExpenseForm.test.tsx`: con 100 y tres tildados muestra 33,34/33,33/33,33; al destildar y al cambiar el importe se recalcula; en edición muestra las partes iniciales; el nombre accesible del checkbox incluye la parte; el foco no se mueve.
- [X] T008 [P] [US1] Test App en `mobile/src/__tests__/screens/expenseForm.test.tsx`: los mismos casos con `ExpenseFormScreen`.
- [X] T009 [US1] Web: en `web/src/components/expenses/ExpenseForm.tsx`, `useMemo` con `parseAmountInput` + `splitEqual` usando el orden de `account.participants`; mostrar `formatMoney(share)` alineado a la derecha dentro del `<label>` con cifras tabulares (R5); estilos en `web/src/app/globals.css` si hace falta.
- [X] T010 [US1] App: en `mobile/src/screens/expenses/ExpenseFormScreen.tsx`, lo mismo con un `Text` a la derecha de cada `Checkbox.Item` y `accessibilityLabel` con la parte; el nombre trunca y el importe no.
- [X] T011 [US1] Textos `expenses.form.shareOf` ("{name}, {amount}") en es/en de Web y App.

**Checkpoint**: partes visibles y exactas.

---

## Phase 3: User Story 2 - Quien no comparte (P2)

**Goal**: los destildados no muestran importe y se entiende sin color; sin partes con importe
inválido.

**Independent Test**: escenarios 2, 5 y 6 de [quickstart.md](quickstart.md).

- [X] T012 [P] [US2] Tests (Web y App, mismos archivos que T007/T008): destildado muestra "No participa" sin importe; importe vacío, inválido, con decimales de más o mayor al máximo → ninguna parte; nadie tildado → ninguna parte.
- [X] T013 [US2] Mostrar `expenses.form.notSharing` atenuado en los destildados (Web y App) y ocultar todas las partes cuando el importe no es válido o no hay tildados; textos es/en.

**Checkpoint**: formulario completo.

---

## Phase 4: Polish

- [X] T014 Quality gates: backend `pytest tests/unit/test_split_equal_cases.py` y `ruff`; Web y App `npm run lint`, `npx tsc --noEmit`, `npm test`, `prettier --check` sobre lo tocado.
- [ ] T015 Validación manual del usuario: escenarios 1–12 de [quickstart.md](quickstart.md) en Web y App.

---

## Dependencies

- Phase 1 bloquea las historias. US2 se puede hacer junto con US1 (mismos archivos, en serie).
- Paralelo: T002–T006; T007/T008; Web y App de cada historia.

## Implementation Strategy

MVP = Phase 1 + US1. US2 es un ajuste visual chico.
