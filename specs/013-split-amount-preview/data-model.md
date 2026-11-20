# Data Model: Importe por participante al cargar un gasto

Sin cambios de datos ni de API.

## Parte (solo en el cliente)

| Campo | Tipo | Regla |
|---|---|---|
| `participantId` | string | tildado en el formulario |
| `minor` | bigint | `q` o `q + 1` según R1 |
| `amount` | string decimal | `fromMinor(minor, decimals)`, se pasa a `formatMoney` |

Invariante: la suma de `minor` es el importe en unidades mínimas.

## Caso compartido (`test-vectors/split-equal.json`)

```json
{ "name": "100 between 3", "amount": "100.00", "decimals": 2,
  "accountOrder": ["a", "b", "c", "d"], "selected": ["c", "a", "b"],
  "expected": { "a": "33.34", "b": "33.33", "c": "33.33" } }
```
