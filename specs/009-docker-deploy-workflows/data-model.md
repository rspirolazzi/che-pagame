# Data Model: Deploy automático del Backend y la Web (feature 009)

Esta feature no agrega colecciones ni cambia el esquema de MongoDB. Sus "entidades" son
configuración y metadatos de build.

## BuildInfo

Información de build que viaja dentro de cada imagen como variables de entorno (R5).

| Campo (JSON) | Variable de entorno | Ejemplo | Regla |
|--------------|---------------------|---------|-------|
| `version` | `APP_VERSION` | `0.1.0` | De `web/package.json` o `backend/pyproject.toml`; sin valor → `dev` |
| `buildNumber` | `BUILD_NUMBER` | `42` | `github.run_number`; sin valor → `null` |
| `buildDate` | `BUILD_DATE` | `2026-11-13T18:40:00Z` | UTC, ISO 8601; sin valor → `null` |
| `releaseTag` | `RELEASE_TAG` | `main-42` | `main-<BUILD_NUMBER>`; sin valor → `null` |
| `commit` | `GIT_SHA` | `397655e` | 7 caracteres hexadecimales; sin valor → `null` |

- En desarrollo local ninguna variable está definida: la Web muestra "Versión dev" y los
  endpoints devuelven `version: "dev"` y el resto en `null`.
- Valores que no cumplen el formato (ej. `GIT_SHA` con caracteres no hexadecimales) se tratan
  como ausentes; nunca se refleja texto arbitrario.

## HealthStatus

Respuesta de los endpoints de salud ([contracts/health.md](contracts/health.md)).

| Campo | Tipo | Regla |
|-------|------|-------|
| `status` | `"ok"` \| `"unavailable"` | Backend: `unavailable` si el `ping` a MongoDB falla. Web: siempre `ok` si responde. |
| `build` | `BuildInfo` | Siempre presente. |

## DeployConfiguration

Configuración que necesitan los workflows ([contracts/workflows.md](contracts/workflows.md)).

| Nombre | Tipo GitHub | Uso |
|--------|-------------|-----|
| `DOCKERHUB_USERNAME` | Secret | Login en Docker Hub |
| `DOCKERHUB_TOKEN` | Secret | Token de acceso con permiso de escritura |
| `DROPLET_IP` | Secret | Host del servidor |
| `DROPLET_USER` | Secret | Usuario SSH |
| `SSH_PRIVATE_KEY` | Secret | Clave privada dedicada al deploy |
| `DROPLET_SSH_FINGERPRINT` | Secret | Huella SHA256 de la clave de host del servidor |
| `DOCKERHUB_NAMESPACE` | Variable | Cuenta de las imágenes (`<ns>/chepagame-backend`, `<ns>/chepagame-frontend`) |
| `DEPLOY_PATH` | Variable | Carpeta del compose de producción en el servidor |

## ServerEnvironment

Variables del `.env` del servidor ([contracts/server-compose.md](contracts/server-compose.md)).
Se agrupan en: imágenes y etiquetas (`DOCKERHUB_NAMESPACE`, `BACKEND_TAG`, `FRONTEND_TAG`),
red (`PUBLISH_ADDRESS`), MongoDB, Backend y Web (las mismas claves que `.env.example`, con
`ENVIRONMENT=production`).

## DeployRun (estados)

```text
queued → verify ─┬─ fail → failed (nada publicado, servidor sin cambios)
                 └─ ok → check-config ─┬─ fail → failed (nada publicado)
                                       └─ ok → build-push ─┬─ fail → failed (servidor sin cambios)
                                                           └─ ok → update-server ─┬─ healthy → succeeded
                                                                                  └─ not healthy / ssh error → failed
                                                                                     (imagen publicada; rollback con sha-<commit> anterior)
```
