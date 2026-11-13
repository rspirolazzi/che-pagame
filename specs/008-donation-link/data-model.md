# Data Model: Apoyá ChePagame (donaciones)

**Feature**: `008-donation-link` | **Date**: 2026-11-13

No hay datos de usuario, colecciones ni cambios en la API o el backend. Solo configuración.

| Variable | Proyecto | Dónde se lee | Regla |
| --- | --- | --- | --- |
| `DONATION_URL` | Web | En el servidor, en cada pedido | Opcional. Solo se usa si es una dirección `https` válida; si no, no hay botón |
| `EXPO_PUBLIC_DONATION_URL` | App | Incrustada al compilar | Igual. Vacía en los builds para las tiendas |

Ninguna es un secreto. Las dos van vacías en `.env.example`.

`parseDonationUrl(value: string | undefined): string | null`

| Entrada | Resultado |
| --- | --- |
| `undefined`, `""`, espacios | `null` |
| `https://cafecito.app/chepagame` | `"https://cafecito.app/chepagame"` |
| `http://…`, `javascript:…`, `ftp://…`, texto sin esquema | `null` |
