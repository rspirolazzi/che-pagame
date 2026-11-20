# Data Model: Ingresos en la lista de gastos

Sin cambios en MongoDB. Un "Ingreso" es un documento de `settlements` (feature 004).

## Movement (respuesta, no se guarda)

| Campo | Tipo | Regla |
|---|---|---|
| `kind` | `"expense"` \| `"settlement"` | discriminador |
| `expense` | `ExpenseResponse` | solo si `kind = expense` |
| `settlement` | `SettlementResponse` | solo si `kind = settlement` |

Orden: `date` desc, `createdAt` desc, `_id` desc (igual que hoy en cada colección).

## SettlementResponse (cambio)

| Campo nuevo | Tipo | Regla |
|---|---|---|
| `recordedBy` | `ParticipantRef \| null` | participante vinculado a `createdBy`; `null` si no hay |

Los demás campos no cambian (`id`, `accountId`, `date`, `from`, `to`, `amount`, `currency`,
`isExcluded`, `createdAt`).
