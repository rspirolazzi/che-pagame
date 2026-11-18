---

description: "Task list for feature 009: Docker deploy workflows"
---

# Tasks: Deploy automático del Backend y la Web

**Input**: documentos de diseño en `specs/009-docker-deploy-workflows/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/health.md](contracts/health.md),
[contracts/workflows.md](contracts/workflows.md),
[contracts/server-compose.md](contracts/server-compose.md), [quickstart.md](quickstart.md)

**Tests**: incluidos para el código nuevo (Principio VII): endpoints de salud, información de
build y "Quiénes somos". Se escriben primero y tienen que fallar antes de implementar. Los
workflows, Dockerfiles y el compose se validan con builds locales y con [quickstart.md](quickstart.md).

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes).
- **[Story]**: US1 (deploy del Backend), US2 (deploy de la Web), US3 (deploy manual y rollback).

## Convenciones

- Todo el código, YAML, Dockerfiles, comentarios y commits en inglés (Principio V).
- Ningún valor secreto en archivos del repo: los workflows leen `secrets.*` y `vars.*`, y las
  plantillas van vacías (Principio VI y "Despliegue", constitución 4.7.0).
- `docker-compose.yml` y los `Dockerfile` de desarrollo NO se modifican (FR-004).
- Los nombres de la información de build son los mismos en todo el proyecto: `APP_VERSION`,
  `BUILD_NUMBER`, `BUILD_DATE`, `RELEASE_TAG` y `GIT_SHA` (ver [data-model.md](data-model.md)).

---

## Phase 1: Setup

- [X] T001 [P] Crear `.github/dependabot.yml` con el ecosistema `github-actions`, directorio `/`, frecuencia `monthly` (R13).
- [X] T002 [P] Crear `backend/Dockerfile.prod.dockerignore` (lo de `backend/.dockerignore` más `tests/`) y `web/Dockerfile.prod.dockerignore` (lo de `web/.dockerignore` más `src/__tests__/`, `jest.*` y `tsconfig.tsbuildinfo`), los dos con `.env` y `.env.*` (FR-009). BuildKit usa el archivo `<Dockerfile>.dockerignore` solo para ese Dockerfile, así que los `.dockerignore` y las imágenes de desarrollo no cambian (FR-004).

---

## Phase 2: Foundational (configuración del servidor, la necesitan US1 y US2)

- [X] T003 Crear `deploy/docker-compose.prod.yml` según [contracts/server-compose.md](contracts/server-compose.md):
  - Nombre de proyecto `chepagame`.
  - `chepagame-mongodb`: `mongo:8.0`, el mismo arranque con keyfile y healthcheck que `docker-compose.yml`, pero con `host: 'chepagame-mongodb:27017'` en `rs.initiate`, volúmenes `mongodb_data` y `mongodb_config`, sin `ports`.
  - `chepagame-backend`: `${DOCKERHUB_NAMESPACE:?Set DOCKERHUB_NAMESPACE in .env}/chepagame-backend:${BACKEND_TAG:-latest}`, `env_file: .env`, `MONGODB_HOST_OVERRIDE=chepagame-mongodb:27017`, puerto `${PUBLISH_ADDRESS:-127.0.0.1}:8000:8000`, healthcheck con `python -c` y `urllib` contra `http://localhost:8000/api/v1/health` (interval 10s, timeout 5s, retries 6, start_period 20s), `depends_on` mongodb `service_healthy`.
  - `chepagame-frontend`: `${DOCKERHUB_NAMESPACE:?Set DOCKERHUB_NAMESPACE in .env}/chepagame-frontend:${FRONTEND_TAG:-latest}`, `env_file: .env`, `API_INTERNAL_BASE_URL=http://chepagame-backend:8000/api/v1`, `AUTH_TRUST_HOST=true`, `NEXT_TELEMETRY_DISABLED=1`, puerto `${PUBLISH_ADDRESS:-127.0.0.1}:3000:3000`, healthcheck con `wget -qO- http://localhost:3000/api/health`, `depends_on` backend `service_started`.
  - Todos con `restart: unless-stopped`. Comentario en inglés: copiar al servidor como `docker-compose.yml`.
- [X] T004 [P] Crear `deploy/.env.production.example` con las claves de MongoDB, Backend y Web de `.env.example` (sin las de Mobile, `MONGO_PORT`, `MONGODB_TEST_DB_NAME` ni `API_INTERNAL_BASE_URL`), todas vacías o con valores ficticios, `ENVIRONMENT=production`, `EMAIL_DELIVERY=resend`, `MONGODB_URI` con el host `chepagame-mongodb:27017` y `replicaSet=rs0`, más `DOCKERHUB_NAMESPACE=`, `BACKEND_TAG=latest`, `FRONTEND_TAG=latest`, `PUBLISH_ADDRESS=127.0.0.1` y `FORWARDED_ALLOW_IPS=`, con comentarios en inglés.
- [X] T005 Validar el compose: `docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.production.example config --quiet` (con `DOCKERHUB_NAMESPACE=example` en el entorno) termina sin errores y sin `ports` en `chepagame-mongodb`.

**Checkpoint**: la configuración del servidor existe y es válida.

---

## Phase 3: User Story 1 - Publicar el Backend con un merge a main (Priority: P1) 🎯 MVP

**Goal**: un merge con cambios en `backend/` termina con la imagen nueva corriendo en el servidor
y su información de build visible en `/api/v1/health`.

**Independent Test**: escenarios 1, 3, 4, 5 y 9 de [quickstart.md](quickstart.md) con un cambio
en `backend/`.

### Tests (primero, tienen que fallar)

- [X] T006 [P] [US1] Test `backend/tests/unit/test_build_info.py`: `get_build_info()` devuelve `version`, `buildNumber`, `buildDate`, `releaseTag` y `commit` leídos de `APP_VERSION`, `BUILD_NUMBER`, `BUILD_DATE`, `RELEASE_TAG` y `GIT_SHA` (con `monkeypatch`); sin variables, `version == "dev"` y el resto `None`; `GIT_SHA` no hexadecimal de 7 a 40 caracteres → `None`; `BUILD_NUMBER` no numérico → `None`; `RELEASE_TAG` fuera de `^main-\d+$` → `None`; `BUILD_DATE` que no es ISO 8601 → `None`.
- [X] T007 [P] [US1] Test `backend/tests/contract/test_health_contract.py` según [contracts/health.md](contracts/health.md): `GET /api/v1/health` sin token → `200`, `{"status": "ok", "build": {...}}` con exactamente esas claves y `Cache-Control: no-store`; con el `ping` de MongoDB que lanza una excepción (monkeypatch) → `503` con `status: "unavailable"` y sin el texto de la excepción en el cuerpo.

### Implementación

- [X] T008 [P] [US1] Crear `backend/app/core/build_info.py` con `get_build_info() -> dict[str, str | None]` y la validación de T006 (regex por campo; nunca refleja un valor inválido).
- [X] T009 [US1] Crear `backend/app/api/v1/health.py` con `GET /health` (sin dependencias de auth): `ping` a la base con un timeout de 2 s, `200`/`503` y `Cache-Control: no-store`, log del fallo sin la URI ni credenciales; registrarlo en `backend/app/main.py` bajo `/api/v1`.
- [X] T010 [US1] Crear `backend/Dockerfile.prod` (R2): `python:3.13-slim`, uv `0.13` copiado de `ghcr.io/astral-sh/uv`, `uv sync --frozen --no-dev` en `/opt/venv`, `ARG`/`ENV` de `APP_VERSION`, `BUILD_NUMBER`, `BUILD_DATE`, `RELEASE_TAG` y `GIT_SHA`, `PYTHONUNBUFFERED=1`, usuario `app` sin privilegios (`USER app`), `EXPOSE 8000` y `CMD` con `/opt/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers` (sin `--reload`).
- [X] T011 [US1] Crear `.github/workflows/deploy-backend.yml` según [contracts/workflows.md](contracts/workflows.md):
  - `on` (push a `main` con `paths` `backend/**` y el propio workflow, más `workflow_dispatch`), `permissions: contents: read`, `concurrency` `deploy-backend` sin cancelar.
  - Job `verify` (`working-directory: backend`):
    - setup-uv y `uv sync --frozen`; `ruff check` y `ruff format --check`.
    - MongoDB 8.0 con `docker run -d --name mongo -p 27017:27017 mongo:8.0 --replSet rs0 --bind_ip_all` e inicio con `docker exec mongo mongosh --quiet --eval "rs.initiate()"` y espera hasta `rs.status().ok`.
    - Secretos de test con `openssl rand -hex 32` enmascarados con `::add-mask::` y exportados a `$GITHUB_ENV`; `ENVIRONMENT=test`, `EMAIL_DELIVERY=console`, `MONGODB_URI=mongodb://localhost:27017/?directConnection=true`; `uv run pytest`.
  - Job `deploy` (`needs: verify`, `if: github.ref == 'refs/heads/main'`) con los pasos 1 a 7 del contrato:
    - Check configuration: un bucle de bash sobre los 8 nombres, pasados por `env:`, que imprime solo el nombre que falta.
    - Versión con `tomllib`, metadatos de build, buildx, login, metadata, build-push con `context: backend`, `file: backend/Dockerfile.prod` y caché `type=gha,scope=backend`.
    - `appleboy/ssh-action@v1.2.0` con `fingerprint`, `envs: DEPLOY_PATH` y el script de `chepagame-backend`, que termina con `docker compose images chepagame-backend` para mostrar la etiqueta que quedó corriendo.

**Checkpoint**: tests del Backend en verde; `docker build -f backend/Dockerfile.prod backend` funciona; el workflow está listo para el primer merge.

---

## Phase 4: User Story 2 - Publicar la Web con un merge a main (Priority: P2)

**Goal**: un merge con cambios en `web/` termina con la imagen nueva corriendo y la versión
visible en "Quiénes somos" y en `/api/health`, sin reiniciar el Backend.

**Independent Test**: escenarios 2 y 8 de [quickstart.md](quickstart.md).

### Tests (primero, tienen que fallar)

- [X] T012 [P] [US2] Test `web/src/__tests__/lib/buildInfo.test.ts`: `getBuildInfo()` con las cinco variables, sin variables (`version: "dev"`, resto `null`) y con valores inválidos (mismas reglas que T006).
- [X] T013 [P] [US2] Test `web/src/__tests__/api/healthRoute.test.ts`: `GET` de `web/src/app/api/health/route.ts` → `200`, `{ status: "ok", build }` con exactamente esas claves y `Cache-Control: no-store`.
- [X] T014 [P] [US2] Test `web/src/__tests__/components/AboutVersion.test.tsx`: `AboutVersion` muestra "Versión 0.1.0 · build 42" con build, "Versión dev" sin build, "Version 0.1.0 · build 42" en inglés, y el commit en el atributo `title` solo cuando existe.

### Implementación

- [X] T015 [P] [US2] Crear `web/src/lib/buildInfo.ts` con `getBuildInfo()` (lee `process.env` en tiempo de ejecución, sin `NEXT_PUBLIC_`; validación de T012) y `web/src/app/api/health/route.ts` (`export const dynamic = "force-dynamic"`, `GET` con `Cache-Control: no-store`).
- [X] T016 [P] [US2] Agregar `pages.about.version` ("Versión {version}") y `pages.about.versionBuild` ("Versión {version} · build {build}") en `web/src/i18n/messages/es.json`, con sus equivalentes en `en.json` ("Version {version}", "Version {version} · build {build}").
- [X] T017 [US2] Crear `web/src/components/about/AboutVersion.tsx` (línea secundaria con la clase existente de texto atenuado, sin colores literales) y usarlo en `web/src/app/(public)/about/page.tsx` con `getBuildInfo()`; la página queda dinámica (`export const dynamic = "force-dynamic"`), así que lee la información de la imagen y no la del momento del build.
- [X] T018 [US2] Agregar `output: "standalone"` en `web/next.config.ts` (con un comentario: lo usa `Dockerfile.prod`; `npm run dev` no cambia).
- [X] T019 [US2] Crear `web/Dockerfile.prod` (R3), multi-stage sobre `node:22.13.0-alpine`:
  - `deps`: `npm ci --no-audit --no-fund`.
  - `build`: `NEXT_TELEMETRY_DISABLED=1`, `npm run build`.
  - `runner`: `NODE_ENV=production`, `HOSTNAME=0.0.0.0`, `PORT=3000`, `ARG`/`ENV` de las cinco variables de build; copia `.next/standalone`, `.next/static` y `public` con `--chown=node:node`; `USER node`, `EXPOSE 3000` y `CMD ["node", "server.js"]`.
- [X] T020 [US2] Crear `.github/workflows/deploy-web.yml` con la misma forma que T011 (incluida la condición `if` de `main` en `deploy` y `docker compose images chepagame-frontend` al final):
  - Job `verify` con `working-directory: web`: setup-node con `node-version-file: .nvmrc` y caché npm (`cache-dependency-path: web/package-lock.json`), `npm ci`, `npm run lint`, `npx tsc --noEmit` y `npm test -- --ci`.
  - Job `deploy`:
    - Versión con `node -p "require('./web/package.json').version"`.
    - Build-push con `context: web`, `file: web/Dockerfile.prod` y caché `type=gha,scope=web`.
    - Script SSH para `chepagame-frontend`.

**Checkpoint**: tests de la Web en verde; `docker build -f web/Dockerfile.prod web` funciona y la imagen responde en `/api/health`.

---

## Phase 5: User Story 3 - Deploy manual y rollback (Priority: P3)

**Goal**: lanzar un deploy a mano y volver a una imagen anterior en menos de 5 minutos.

**Independent Test**: escenarios 6 y 7 de [quickstart.md](quickstart.md).

- [X] T021 [US3] Verificar que los dos workflows tengan `workflow_dispatch`, que `deploy` solo corra en `refs/heads/main` y que `BACKEND_TAG` / `FRONTEND_TAG` del compose (T003) se usen tanto en `pull` como en `up`.
- [X] T022 [US3] Agregar a `README.md` (raíz) la sección "Deploy (feature 009)", en inglés:
  - Qué hace cada workflow y cuándo corre.
  - La tabla de los 6 secretos y las 2 variables de GitHub, con lo que es cada uno y sin valores.
  - Cómo preparar el servidor: clave SSH dedicada, huella de host, copiar `deploy/` y completar `.env`.
  - Lanzar un deploy a mano ("Run workflow").
  - En `DROPLET_SSH_FINGERPRINT` va solo el campo `SHA256:…` de `ssh-keygen -lf`.
  - Rollback con `BACKEND_TAG` / `FRONTEND_TAG=sha-<commit>` y la vuelta a `latest`; con una etiqueta fijada, los deploys publican pero el servidor no cambia (el log de SSH muestra la etiqueta que corre).
  - Los cambios en `deploy/` no se aplican solos: copiarlos al servidor y correr `docker compose up -d`.
  - Que HTTPS y el proxy inverso quedan a cargo del servidor.

---

## Phase 6: Polish y validación

- [X] T023 [P] Correr en `backend/` `python -m uv run ruff check .`, `python -m uv run ruff format --check .` y `python -m uv run pytest`, y en `web/` `npx jest`, `npm run lint`, `npx tsc --noEmit` y `npx next build`.
- [X] T024 Construir las dos imágenes de producción localmente y comprobar la sección 1 de [quickstart.md](quickstart.md):
  - `whoami` no es `root`.
  - La imagen no tiene `.env`, `src/__tests__/` (Web), `tests/` (Backend) ni pytest, ruff o jest.
  - Los healthchecks responden.
  - `docker compose up -d` de desarrollo sigue funcionando con recarga en caliente.
- [X] T025 [P] Validar los workflows con `actionlint` (vía `docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:latest`) y revisar que ningún `run:` imprima `secrets.*` ni interpole `${{ secrets.* }}` dentro de un script.
- [X] T026 Quitar el comentario "Sync Impact Report" del principio de `.specify/memory/constitution.md` antes del commit.
- [X] T027 Cargar los secretos y variables en GitHub, preparar el servidor (lo hace el usuario), hacer push de `main` y validar los 11 escenarios de la sección 3 y el tiempo total de la sección 4 de [quickstart.md](quickstart.md) (SC-001). Validación del usuario.

---

## Dependencies & Execution Order

- Setup (T001–T002) → Foundational (T003–T005) → US1 (T006–T011) → US2 (T012–T020) → US3
  (T021–T022) → Polish (T023–T027).
- US2 no depende del código de US1, pero sí de su circuito validado: conviene probar el deploy del
  Backend primero, porque la Web lo necesita en el servidor.
- Dentro de cada historia, primero los tests: T006–T007 antes de T008–T009; T012–T014 antes
  de T015–T017. T008 antes de T009; T015 y T016 antes de T017; T018 antes de T019.
- T027 necesita que el usuario haga el push (yo no hago push).

### Oportunidades de paralelismo

- T001 y T002; T004 en paralelo con T003.
- T006 y T007; T008 en paralelo con T010.
- T012, T013 y T014; T015 y T016; T018 en paralelo con T015–T017.
- T023 y T025.

## Implementation Strategy

1. Setup y Foundational: la configuración del servidor lista y validada.
2. US1 (MVP): deploy del Backend. **Parar y validar** el primer deploy real.
3. US2: deploy de la Web con el mismo circuito.
4. US3: guía de deploy manual y rollback.
5. Polish y la validación del usuario (T027).
