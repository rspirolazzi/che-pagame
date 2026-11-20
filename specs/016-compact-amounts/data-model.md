# Data Model: Importes grandes abreviados (K y M)

Sin cambios de datos ni de API. Solo presentación.

## Importe mostrado

| Entrada | Tipo |
|---|---|
| `amount` | texto decimal exacto (`"10000000.00"`), puede venir con signo |
| `currency` | código ISO |
| `decimals` | decimales de la moneda |
| `locale` | `es` \| `en` |

| Salida | Regla |
|---|---|
| `compact` | R1/R2 de research; igual a `exact` si el valor absoluto es < 10.000 |
| `exact` | `formatMoney` actual |

## Caso compartido (`test-vectors/compact-amounts.json`)

```json
{ "amount": "25500.00", "currency": "ARS", "decimals": 2, "locale": "es",
  "expected": "25,5 K ARS" }
```
