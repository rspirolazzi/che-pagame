# Implementation Plan: Importes grandes abreviados (K y M)

**Branch**: `016-compact-amounts` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/016-compact-amounts/spec.md`

## Summary

Una función pura `formatCompactMoney(amount, currency, decimals, locale)` en el `money.ts` de cada
cliente abrevia desde 10.000 con "K" y desde 1.000.000 con "M" (máximo un decimal, sin ceros
finales, redondeo half-up con `BigInt` sobre el texto decimal) y conserva la posición de la
moneda del idioma usando `formatToParts`. Un componente `Money` (Web y App) muestra la forma
abreviada y expone la exacta como nombre accesible y, en la Web, como `title`. `AmountText` y las
listas pasan a usarlo; formularios, "Marcar como pagado", vista previa de la división (013) y
exportaciones siguen exactos. El detalle de gasto y de reembolso muestra el abreviado grande y el
exacto debajo. El encabezado del detalle de la App se rearma para que el título y la fecha no se
corten letra por letra. Casos compartidos en `test-vectors/compact-amounts.json`. Sin cambios en
el backend.

## Technical Context

**Language/Version**: TypeScript (Web Next.js 16; App Expo 56 / RN 0.85)

**Primary Dependencies**: Intl (nativo), next-intl, react-i18next, React Native Paper

**Storage**: N/A

**Testing**: Jest + Testing Library (Web y App) con casos compartidos

**Target Platform**: navegadores, Android

**Project Type**: web-app + mobile-app

**Performance Goals**: formatear 500 importes de una lista en < 20 ms

**Constraints**: solo presentación (FR-004, Principio III); mismo texto en Web y App (FR-010);
Hermes soporta `BigInt` e `Intl.NumberFormat.formatToParts`

**Scale/Scope**: 1 función + 1 componente por cliente; ~20 lugares que muestran importes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regla | Cumplimiento |
|---|---|
| I. Paridad Web y Mobile | ✅ Misma función y mismos casos compartidos |
| II. Formato según idioma | ✅ Separador decimal y posición de la moneda del idioma; K/M acordados con el usuario |
| III. Exactitud monetaria | ✅ Solo presentación; cálculos, formularios y exportaciones exactos; redondeo con `BigInt` |
| VII. Accesibilidad | ✅ Nombre accesible con el importe exacto; signo/color/indicador de saldo intactos; layout sin cortes al 200 % |
| VIII. Simplicidad | ✅ Sin dependencias; un componente reemplaza llamadas directas |

Re-check post-design: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/016-compact-amounts/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── tasks.md
```

Sin `contracts/` (no cambia ninguna interfaz externa).

### Source Code (repository root)

```text
test-vectors/compact-amounts.json             # NEW: shared cases
web/src/lib/money.ts                          # + formatCompactMoney()
web/src/components/ui/Money.tsx               # NEW: compact text, exact as title + aria-label
web/src/components/ui/AmountText.tsx          # uses compact formatting
web/src/components/{accounts/AccountList,HomePreview}.tsx
web/src/components/balances/{BalanceList,BalanceSummary,SettlementList,SuggestionList}.tsx
web/src/components/expenses/{ExpenseList,ExpenseDetail}.tsx  # detail: compact + exact below
mobile/src/utils/money.ts                     # + formatCompactMoney()
mobile/src/components/Money.tsx               # NEW
mobile/src/components/AmountText.tsx
mobile/src/components/balances/{BalanceList,BalanceSummary,SettlementList,SuggestionList}.tsx
mobile/src/components/expenses/ExpenseBits.tsx
mobile/src/screens/accounts/AccountsScreen.tsx
mobile/src/screens/expenses/{AccountExpensesScreen,ExpenseDetailScreen}.tsx # header layout
```

Se quedan exactos: `MarkPaidDialog`, formularios, `ExpenseHistory` (cambios de importe en el
historial), partes del detalle (ver R5) y exportaciones.

**Structure Decision**: un componente `Money` concentra la regla "abreviado visible, exacto
accesible" para no repetirla en cada lista.

## Complexity Tracking

Sin violaciones.
