# Contract: preferencias al crear la cuenta

## `POST /api/v1/auth/register` (cambio)

```json
{ "email": "ana@example.com", "password": "…", "firstName": "Ana", "lastName": null,
  "language": "en", "theme": "dark" }
```

- `theme`: opcional, `light` | `dark` | `system`, default `system`. Otro valor → 422.
- Al verificar el email, el usuario se crea con `preferences.language` y `preferences.theme`
  recibidos.

## `POST /api/v1/auth/google` (cambio)

```json
{ "idToken": "…", "language": "en", "theme": "dark" }
```

- `language` y `theme` opcionales. Solo se usan si este login crea la cuenta; si la cuenta ya
  existe se ignoran y se devuelven las preferencias del perfil.

## Sin cambios

`PATCH /api/v1/users/me` con `preferences` (lo usan el Perfil y el encabezado con sesión).
