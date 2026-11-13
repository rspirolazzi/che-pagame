# Implementation Plan: Deploy automático del Backend y la Web

**Branch**: `009-docker-deploy-workflows` | **Date**: 2026-11-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/009-docker-deploy-workflows/spec.md`

## Summary

Dos workflows de GitHub Actions, `deploy-backend.yml` y `deploy-web.yml`, con la misma forma:
un job `verify` (lint y tests del componente) y un job `deploy` que comprueba la configuración,
construye la imagen de producción con su información de build, la publica en Docker Hub
(`latest` y `sha-<commit>`) y, por SSH con la huella del servidor verificada, actualiza solo ese
servicio en el droplet y espera a que su healthcheck quede `healthy`. Se agregan Dockerfiles de
producción, endpoints de salud y versión (Backend y Web), la versión en "Quiénes somos", y una
carpeta `deploy/` con el compose de producción y la plantilla de su `.env`. Ver
[research.md](research.md).

## Technical Context

**Language/Version**: Python 3.13 (Backend), TypeScript con Node 22.13.0 (Web), YAML de GitHub
Actions y Docker Compose

**Primary Dependencies**: FastAPI y uvicorn; Next.js 16 (modo `standalone`) y next-intl;
acciones `actions/checkout`, `actions/setup-node`, `astral-sh/setup-uv`, `docker/*` y
`appleboy/ssh-action`

**Storage**: MongoDB 8.0 en el servidor (replica set de un nodo, volúmenes nombrados); sin
cambios de esquema

**Testing**: pytest (endpoint de salud del Backend), Jest (versión en "Quiénes somos", ruta de
salud de la Web y helper de información de build); validación manual del circuito completo con
[quickstart.md](quickstart.md)

**Target Platform**: runners `ubuntu-latest` de GitHub; droplet Linux de DigitalOcean con Docker
Engine 24+ y Compose v2.22+

**Project Type**: web-service + web-app (infraestructura de entrega)

**Performance Goals**: merge → producción en menos de 15 minutos (SC-001); rollback en menos de
5 minutos (SC-004)

**Constraints**: ningún secreto en el repo público, en las imágenes públicas ni en los logs
(SC-005); desarrollo local sin cambios (FR-004); un componente no reinicia al otro (SC-006)

**Scale/Scope**: 2 workflows, 2 Dockerfiles de producción, 2 endpoints de salud, 1 compose de
producción; un único entorno (producción)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / sección | Evaluación |
|---------------------|------------|
| I. Acceso directo y multiplataforma | ✅ No cambia la autenticación ni la API de negocio. El endpoint de salud es público y no expone datos. |
| II. Internacionalización | ✅ La línea de versión de "Quiénes somos" usa claves `pages.about.version*` en es/en. |
| III. Moneda y exactitud | ✅ No aplica. |
| IV. Auditoría y bajas lógicas | ✅ No aplica; sin cambios de esquema ni migraciones. |
| V. Strict English | ✅ Workflows, Dockerfiles, compose, código y commits en inglés; spec y README funcional pueden ir en español. |
| VI. Privacidad y secretos | ✅ Desde la constitución 4.7.0, los secretos pueden vivir en GitHub Secrets y en el `.env` del servidor. `.env` fuera de las imágenes (`.dockerignore`), plantilla sin valores, telemetría de Next desactivada, endpoint de salud sin datos personales ni configuración. |
| Despliegue (4.7.0) | ✅ Dockerfiles de producción aparte, `verify` antes de publicar, imágenes sin secretos, `deploy/` con plantilla, MongoDB sin puertos, huella SSH, endpoints de salud mínimos, etiqueta `sha-<commit>`. |
| VII. Test-First | ✅ Sin lógica de dominio. Tests con pytest y Jest para lo nuevo (salud, versión). |
| VIII. Simplicidad | ✅ Archivos de producción aparte, healthchecks de Compose en vez de scripts de espera, sin entorno de staging. |
| Stack | ✅ Mismas versiones (Python 3.13, Node 22.13.0, MongoDB 8.0, Docker 24 / Compose v2.22). |
| Infraestructura local (Docker) | ✅ `docker-compose.yml` y los `Dockerfile` de desarrollo no cambian. El compose de producción repite las reglas: replica set, volúmenes nombrados, credenciales desde `.env`, MongoDB sin puertos publicados. |
| Quality gates | ✅ El job `verify` corre lint y tests antes de publicar. |

**Resultado**: pasa sin violaciones (constitución 4.7.0, enmendada para esta feature).

**Re-check post-diseño**: sin cambios; el diseño de Phase 1 no agrega violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/009-docker-deploy-workflows/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── health.md            # GET /api/v1/health (Backend) y GET /api/health (Web)
│   ├── workflows.md         # disparadores, jobs, secretos, variables, build args, etiquetas
│   └── server-compose.md    # servicios, variables del .env del servidor, rollback
├── checklists/requirements.md
└── tasks.md                 # /speckit-tasks
```

### Source Code (repository root)

```text
.github/
├── workflows/
│   ├── deploy-backend.yml        # nuevo
│   └── deploy-web.yml            # nuevo
└── dependabot.yml                # nuevo (github-actions)

deploy/
├── docker-compose.prod.yml       # nuevo: chepagame-mongodb, chepagame-backend, chepagame-frontend
└── .env.production.example       # nuevo: variables del servidor, sin valores

backend/
├── Dockerfile.prod               # nuevo
├── app/
│   ├── core/build_info.py        # nuevo: lee APP_VERSION, BUILD_NUMBER, ...
│   ├── api/v1/health.py          # nuevo: GET /api/v1/health
│   └── main.py                   # registra el router de salud
└── tests/{unit/test_build_info.py,contract/test_health_contract.py}  # nuevos

web/
├── Dockerfile.prod               # nuevo
├── next.config.ts                # output: "standalone"
├── src/
│   ├── lib/buildInfo.ts          # nuevo
│   ├── app/api/health/route.ts   # nuevo: GET /api/health
│   ├── app/(public)/about/page.tsx  # muestra versión y build
│   ├── i18n/messages/{es,en}.json  # claves pages.about.version*
└── src/**/__tests__/             # tests de buildInfo, ruta de salud y "Quiénes somos"

README.md                         # sección "Deploy (feature 009)"
```

**Structure Decision**: se mantiene la estructura web-service + web-app existente (`backend/`,
`web/`). Lo nuevo de infraestructura va en `.github/` (lo que corre en GitHub) y `deploy/` (lo
que vive en el servidor). `mobile/` no cambia.

## Complexity Tracking

Sin violaciones que justificar.
