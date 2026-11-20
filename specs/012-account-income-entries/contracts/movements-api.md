# Contract: movimientos y detalle de reembolso

## `GET /api/v1/accounts/{accountId}/movements`

Query: `limit` (1–100, default igual que gastos), `cursor` (opaco, ≤ 512).

**200**

```json
{
  "items": [
    { "kind": "settlement", "settlement": { "id": "…", "accountId": "…", "date": "2026-11-19",
      "from": { "id": "p1", "name": "Ana" }, "to": { "id": "p2", "name": "Beto" },
      "amount": "5000.00", "currency": "ARS", "isExcluded": false,
      "recordedBy": { "id": "p2", "name": "Beto" }, "createdAt": "…" } },
    { "kind": "expense", "expense": { "...": "ExpenseResponse sin cambios" } }
  ],
  "nextCursor": "…" 
}
```

Solo activos (`isDeleted: false`). Cuenta cerrada: se lista igual.

**Errores**: 401; 404 `not_found` (no miembro o Cuenta inexistente); 422 cursor inválido.

## `GET /api/v1/accounts/{accountId}/settlements/{settlementId}`

**200** `SettlementResponse` (con `recordedBy`).

**Errores**: 401; 404 `not_found` (no miembro, Cuenta inexistente, reembolso inexistente o dado de baja).

## Sin cambios

`POST /settlements` (alta, idempotente por `clientRequestId`), `DELETE /settlements/{id}` (baja
lógica auditada, 409 si la Cuenta está cerrada), `GET /settlements` (lista de Saldos).
