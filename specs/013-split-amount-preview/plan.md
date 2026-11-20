# Implementation Plan: Importe por participante al cargar un gasto

**Branch**: `013-split-amount-preview` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/013-split-amount-preview/spec.md`

## Summary

El formulario de gasto (alta y edición, Web y App) muestra al lado de cada persona tildada en
"Lo comparten" su parte, recalculada al instante en el cliente. El cálculo replica
`split_equal` del backend (`backend/app/core/money.py`): partes iguales en unidades mínimas con
`BigInt` y el sobrante de a una unidad según el orden de los participantes de la Cuenta. Un
archivo de casos compartido (`test-vectors/split-equal.json`) lo prueban pytest,
la Web y la App, así las tres implementaciones no pueden divergir (SC-001). Sin cambios en el
backend ni en la API.

## Technical Context

**Language/Version**: TypeScript (Web Next.js 16; App Expo 56 / RN 0.85); Python 3.13 solo para
el test de los casos compartidos

**Primary Dependencies**: las existentes (next-intl, React Native Paper, react-i18next)

**Storage**: N/A

**Testing**: Jest + Testing Library (Web, App); pytest para validar los casos contra `split_equal`

**Target Platform**: navegadores, Android

**Project Type**: web-app + mobile-app

**Performance Goals**: recálculo < 100 ms (SC-003); es O(n) con n ≤ participantes

**Constraints**: nunca convertir importes a `number` (Principio III); mismo resultado que el
servidor (FR-003, FR-004)

**Scale/Scope**: 1 función pura por cliente, 2 formularios, 1 archivo de casos

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regla | Cumplimiento |
|---|---|
| I. Paridad Web y Mobile | ✅ Misma función y mismos casos en los dos |
| II. Internacionalización | ✅ `formatMoney` por idioma; textos es/en |
| III. Exactitud monetaria | ✅ Unidades mínimas con `BigInt`; la suma es el total; casos compartidos con el servidor |
| VII. Accesibilidad y Test-First | ✅ Parte incluida en el nombre accesible; tests primero |
| VIII. Simplicidad | ✅ Sin backend nuevo; una función pura |

Re-check post-design: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/013-split-amount-preview/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── tasks.md
```

No hay `contracts/`: la feature no cambia ninguna interfaz externa.

### Source Code (repository root)

```text
test-vectors/split-equal.json   # NEW: shared cases
backend/tests/unit/test_split_equal_cases.py    # NEW: cases vs split_equal
web/src/lib/money.ts                            # + toMinor(), fromMinor(), splitEqual()
web/src/components/expenses/ExpenseForm.tsx     # share next to each participant
web/src/__tests__/lib/splitEqual.test.ts        # NEW: reads the shared cases
mobile/src/utils/money.ts                       # same functions
mobile/src/screens/expenses/ExpenseFormScreen.tsx
mobile/src/__tests__/utils/splitEqual.test.ts   # NEW
```

**Structure Decision**: las funciones viven junto a `parseAmountInput`/`formatMoney` en el
`money.ts` de cada cliente, como el resto de la lógica de importes.

## Complexity Tracking

Sin violaciones.
