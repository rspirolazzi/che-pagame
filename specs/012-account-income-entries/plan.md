# Implementation Plan: Ingresos en la lista de gastos

**Branch**: `012-account-income-entries` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/012-account-income-entries/spec.md`

## Summary

"Ingreso" es el nombre en la interfaz del reembolso de la feature 004; no hay entidad nueva ni
cambia el cálculo de saldos. El backend suma:

- `GET /accounts/{id}/movements`: gastos y reembolsos activos juntos, con el mismo orden y el
  mismo cursor keyset `(date, createdAt, _id)` que ya comparten las dos colecciones;
- `GET /accounts/{id}/settlements/{settlementId}`: detalle de un reembolso;
- `recordedBy` en `SettlementResponse` (quién lo registró).

Web y App cambian la lista de la Cuenta para usar `movements`, muestran el ingreso con ícono,
color y texto propios, convierten "+" en un menú "Gasto / Ingreso" (el ingreso abre el formulario
de reembolso existente con "recibió" = mi participante) y suman el detalle del ingreso con
eliminar (sin editar).

## Technical Context

**Language/Version**: Python 3.13 (backend); TypeScript (Web Next.js 16, App Expo 56 / RN 0.85)

**Primary Dependencies**: FastAPI, PyMongo async, next-intl, Expo Router, React Native Paper

**Storage**: MongoDB `expenses` y `settlements` (sin cambios de esquema ni índices nuevos: el
índice de lista de cada colección ya cubre `accountId, isDeleted, date, createdAt, _id`)

**Testing**: pytest (contract, integration); Jest + Testing Library en Web y App

**Target Platform**: servidor Linux (Docker), navegadores, Android

**Project Type**: web-service + web-app + mobile-app

**Performance Goals**: página de 20 movimientos en < 300 ms con 5.000 gastos y 1.000 reembolsos

**Constraints**: importes exactos como texto (Principio III); saldos idénticos (SC-003, SC-005);
reglas de 004 sin cambios (Cuenta Cerrada, participantes quitados, idempotencia)

**Scale/Scope**: 2 endpoints nuevos, 1 campo nuevo; lista, menú "+", detalle en Web y App

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regla | Cumplimiento |
|---|---|
| I. Misma API para Web y Mobile | ✅ `movements` y el detalle se usan en los dos |
| II. Internacionalización | ✅ "Ingreso", "X le pagó a Y" y ayudas en es/en |
| III. Exactitud monetaria | ✅ Sin cálculo nuevo; importes como texto decimal |
| IV. Bajas lógicas y auditoría | ✅ Reusa `settlement_service` (alta y baja auditadas) |
| VII. Accesibilidad y Test-First | ✅ Ícono + texto, no solo color; tests de contrato e integración primero |
| VIII. Simplicidad | ✅ Sin entidad nueva; merge de dos consultas keyset ya ordenadas |

Re-check post-design: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/012-account-income-entries/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/movements-api.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/app/
├── api/v1/movements.py            # NEW: GET /accounts/{id}/movements
├── api/v1/settlements.py          # + GET /{settlement_id}
├── services/movement_service.py   # NEW: merge of expense and settlement pages
├── services/settlement_service.py # + get_settlement(); recordedBy in responses
├── repositories/settlements.py    # + find_one_active()
├── schemas/movement.py            # NEW: Movement (discriminated union), MovementPage
├── schemas/settlement.py          # + recorded_by
└── main.py                        # include movements router
backend/tests/{contract,integration}/  # movements + settlement detail
web/src/
├── app/(private)/accounts/[accountId]/page.tsx        # list from movements
├── app/(private)/accounts/[accountId]/settlements/[settlementId]/page.tsx # NEW detail
├── app/(private)/accounts/[accountId]/settlements/new/page.tsx # ?to=me default, back to list
├── app/actions/expenses.ts                            # loadMoreMovementsAction
├── components/expenses/ExpenseList.tsx                # renders both kinds
├── components/expenses/IncomeRow.tsx                  # NEW
├── components/expenses/AddMovementMenu.tsx            # NEW "+": Gasto / Ingreso
└── components/balances/SettlementDetail.tsx           # NEW
mobile/
├── app/(app)/accounts/[accountId]/settlements/[settlementId].tsx # NEW
├── src/screens/expenses/AccountExpensesScreen.tsx     # movements + FAB menu
├── src/components/expenses/ExpenseBits.tsx            # + IncomeRow
├── src/screens/balances/SettlementDetailScreen.tsx    # NEW
├── src/screens/balances/SettlementFormScreen.tsx      # defaults from params
└── src/services/api/{movements,settlements}.ts        # list movements, get settlement
```

**Structure Decision**: un servicio `movement_service` de solo lectura; alta y baja siguen en
`settlement_service`.

## Complexity Tracking

Sin violaciones.
