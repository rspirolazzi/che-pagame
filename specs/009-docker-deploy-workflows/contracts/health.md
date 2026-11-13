# Contract: endpoints de salud y versión

Públicos, sin autenticación, sin cookies ni sesión, `Cache-Control: no-store`. Solo `GET`.
No devuelven configuración, variables de entorno, versiones de dependencias, hostnames ni
detalles de errores.

## Backend: `GET /api/v1/health`

**200 OK** (MongoDB responde al `ping`):

```json
{
  "status": "ok",
  "build": {
    "version": "0.1.0",
    "buildNumber": "42",
    "buildDate": "2026-11-13T18:40:00Z",
    "releaseTag": "main-42",
    "commit": "397655e"
  }
}
```

**503 Service Unavailable** (el `ping` falla o tarda más de 2 s): mismo cuerpo con
`"status": "unavailable"`. No se incluye el mensaje de la excepción. El error se loguea sin
la URI de conexión.

Sin variables de build (desarrollo): `"version": "dev"` y el resto de los campos `null`.

## Web: `GET /api/health`

**200 OK**: `{ "status": "ok", "build": { ... } }` con el mismo formato. No consulta al
Backend (su salud se verifica por separado y así un fallo del Backend no reinicia la Web).

## "Quiénes somos" (`/about`)

Debajo del texto, una línea secundaria:

- es: `Versión 0.1.0 · build 42` (sin build: `Versión dev`)
- en: `Version 0.1.0 · build 42` (sin build: `Version dev`)

El commit corto va en el atributo `title` de esa línea y en `/api/health`, para soporte.

## Tests

- Backend (`tests/contract/test_health.py`): 200 con base disponible; 503 con `ping` que
  falla (mock); valores de build leídos del entorno; `commit` inválido → `null`; sin claves
  extra en la respuesta.
- Web: `buildInfo` (valores, ausentes, inválidos), la ruta `/api/health` y la línea de versión
  de "Quiénes somos" en es y en.
