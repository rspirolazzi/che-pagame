# Research: Deploy automático del Backend y la Web (feature 009)

Cada decisión resuelve un punto abierto del Technical Context de [plan.md](plan.md).

## R1. Imágenes de producción: Dockerfile aparte

- **Decision**: agregar `backend/Dockerfile.prod` y `web/Dockerfile.prod`. Los `Dockerfile`
  actuales (recarga en caliente, usados por `docker-compose.yml`) no cambian.
- **Rationale**: FR-004 pide no romper el desarrollo local. Un archivo aparte no toca el compose
  de desarrollo y se lee de una vez.
- **Alternatives considered**: un único Dockerfile multi-stage con targets `dev`/`prod` (obliga
  a tocar `docker-compose.yml` y mezcla los dos casos); construir con `npm run dev` en
  producción (descartado: lento, inseguro, contradice FR-004).

## R2. Backend de producción

- **Decision**: `python:3.13-slim` con uv, `uv sync --frozen --no-dev` (sin pytest ni ruff),
  usuario sin privilegios, `uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers`
  sin `--reload`. `FORWARDED_ALLOW_IPS` se toma del `.env` del servidor (por defecto, solo la red
  interna).
- **Rationale**: FR-004. El backend no usa la IP del cliente para nada, pero con un proxy
  inverso delante `--proxy-headers` deja bien el esquema (`https`) de las URLs.
- **Alternatives considered**: gunicorn con workers uvicorn (más piezas; un solo proceso alcanza
  para el volumen de una práctica).

## R3. Web de producción

- **Decision**: `output: "standalone"` en `next.config.ts` y una imagen multi-stage sobre
  `node:22.13.0-alpine`: etapa `deps` (`npm ci`), etapa `build` (`next build`) y etapa final
  que copia solo `.next/standalone`, `.next/static` y `public`, corre `node server.js` con el
  usuario `node` y `NEXT_TELEMETRY_DISABLED=1`.
- **Rationale**: la imagen final no lleva `node_modules` completos ni código fuente
  (FR-004) y pesa mucho menos, lo que acelera el pull (SC-001). El modo standalone no cambia
  `npm run dev`.
- **Alternatives considered**: `next start` con todo `node_modules` (imagen de ~1 GB).

## R4. La Web no necesita la URL del Backend al construirse

- **Decision**: la Web llama al Backend solo desde el servidor de Next.js (`apiFetch` es
  `server-only` y lee `API_INTERNAL_BASE_URL` en tiempo de ejecución). En producción esa variable
  vale `http://chepagame-backend:8000/api/v1`, dentro de la red del compose. No hace falta
  ninguna variable `NEXT_PUBLIC_*` al construir.
- **Rationale**: la misma imagen sirve para cualquier dominio; la configuración vive en el
  `.env` del servidor. Corrige el supuesto de la spec ("la Web toma la URL pública del Backend
  al construirse"): no es necesario.
- **Alternatives considered**: pasar `NEXT_PUBLIC_API_BASE_URL` como build arg como en el
  workflow de referencia (ataría la imagen a un dominio sin necesidad).

## R5. Información de build: mismas variables en las dos imágenes

- **Decision**: los dos Dockerfiles de producción reciben los build args `APP_VERSION`,
  `BUILD_NUMBER`, `BUILD_DATE`, `RELEASE_TAG` y `GIT_SHA` y los dejan como `ENV` de la imagen
  (más las labels OCI que genera `docker/metadata-action`). Se leen en tiempo de ejecución: el
  Backend en su endpoint de salud y la Web en "Quiénes somos" (componente de servidor) y en su
  ruta de salud. Sin valores, se muestra `dev`.
- **Rationale**: los nombres sin `NEXT_PUBLIC_` no se incrustan en el JavaScript del navegador y
  son iguales en los dos componentes. La versión sale de `web/package.json` y
  `backend/pyproject.toml` (en Python, con `tomllib`, que viene con Python 3.11+).
- **Alternatives considered**: `NEXT_PUBLIC_*` como en el workflow de referencia (solo hace
  falta si un componente de cliente los lee; aquí no).

## R6. Endpoints de salud

- **Decision**: Backend `GET /api/v1/health` y Web `GET /api/health`, públicos, sin sesión. El
  Backend hace un `ping` a MongoDB: `200` con `status: "ok"` o `503` con `status: "unavailable"`,
  sin detalle del error. Los dos devuelven la información de build y nada más
  ([contracts/health.md](contracts/health.md)).
- **Rationale**: FR-007 y FR-011 (verificar que el servicio responde) y SC-003 (identificar el
  commit en producción). El ping detecta un Backend que arrancó sin base.
- **Alternatives considered**: verificar solo que el contenedor está "running" (`docker compose
  ps` del workflow de referencia), que no detecta un servicio colgado.

## R7. Verificación del rollout en el servidor

- **Decision**: el compose de producción define un `healthcheck` por servicio que llama a su
  endpoint de salud (Backend con `python -c` y `urllib`; Web con `wget`, que trae alpine). El
  workflow ejecuta `docker compose pull <servicio>` y luego
  `docker compose up -d --no-deps --wait --wait-timeout 180 <servicio>`; si no queda `healthy`,
  el comando falla y la ejecución también. Después, `docker image prune -f` y
  `docker compose ps`.
- **Rationale**: FR-011 con herramientas que ya trae Compose v2.22, sin scripts de espera
  propios. `--no-deps` evita reiniciar MongoDB o el otro servicio (SC-006).
- **Alternatives considered**: un bucle `curl` en el script de SSH (más código que mantener).

## R8. Disparo, filtros y concurrencia

- **Decision**: `on: push: branches: [main]` con `paths: [backend/**,
  .github/workflows/deploy-backend.yml]` (y el equivalente de la Web) más `workflow_dispatch`.
  `concurrency: { group: deploy-backend, cancel-in-progress: false }` (y `deploy-web`).
  `permissions: contents: read`.
- **Rationale**: FR-002, FR-012, SC-006. Con `cancel-in-progress: false`, GitHub deja en espera
  la siguiente ejecución y descarta las intermedias, así que el último merge es el que queda.
- **Alternatives considered**: un único workflow con dos jobs y `dorny/paths-filter` (una acción
  más de terceros y peor lectura en la lista de ejecuciones).

## R9. Tests y lint antes de construir

- **Decision**: un job `verify` y un job `deploy` con `needs: verify`.
  - Backend: `astral-sh/setup-uv`, `uv sync --frozen`, `uv run ruff check`, `uv run ruff format
    --check` y `uv run pytest`. MongoDB 8.0 se levanta con `docker run` como replica set de un
    nodo sin auth (los `services:` de Actions no permiten pasar `--replSet`) y se inicia con
    `mongosh`. `JWT_SECRET` y `CODE_HASH_SECRET` se generan en la ejecución con `openssl rand`:
    son descartables, no son secretos del proyecto.
  - Web: `actions/setup-node` con `.nvmrc`, `npm ci`, `npm run lint`, `npx tsc --noEmit` y
    `npm test`.
- **Rationale**: FR-003, SC-002 y la quality gate de la constitución. Las transacciones
  multi-documento exigen replica set también en los tests.
- **Alternatives considered**: correr los tests dentro de la imagen (mezcla dependencias de test
  en producción, contra FR-004).

## R10. Secretos, variables y su verificación

- **Decision**:
  - Secretos: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` (token de acceso de Docker Hub con permiso
    de escritura), `DROPLET_IP`, `DROPLET_USER`, `SSH_PRIVATE_KEY` (clave dedicada al deploy) y
    `DROPLET_SSH_FINGERPRINT` (huella SHA256 de la clave del servidor).
  - Variables: `DOCKERHUB_NAMESPACE` (ej. `rspirolazzi`) y `DEPLOY_PATH` (ej. `/root/projects`).
  - Primer paso de cada job `deploy`: un script que recorre los nombres requeridos y falla con
    `Missing GitHub secret or variable: <NOMBRE>` si alguno está vacío, sin imprimir valores.
- **Rationale**: FR-008, FR-010, FR-013. GitHub enmascara los secretos en los logs; las variables
  no son secretas. `appleboy/ssh-action` acepta `fingerprint` para verificar la identidad del
  servidor.
- **Alternatives considered**: guardar el nombre de la imagen fijo en el workflow (el repo es
  público y reutilizable: mejor una variable).

## R11. Etiquetas, caché y registro

- **Decision**: `docker/metadata-action` con `type=raw,value=latest` y
  `type=sha,prefix=sha-` (commit corto de 7 caracteres), `docker/build-push-action` con
  `file: backend/Dockerfile.prod` (o `web/`), `context: backend` (o `web`) y caché
  `type=gha` por componente (`scope=backend` / `scope=web`). Repositorios públicos en Docker
  Hub (se crean públicos con el primer push).
- **Rationale**: FR-005, FR-016 y SC-001 (la caché evita reinstalar dependencias en cada
  ejecución). El contexto por carpeta respeta los `.dockerignore` existentes, que ya excluyen
  `.env`.
- **Alternatives considered**: `context: .` del workflow de referencia (enviaría todo el repo,
  incluido `mobile/`, al build).

## R12. Configuración del servidor en el repositorio

- **Decision**: carpeta `deploy/` con `docker-compose.prod.yml` y `.env.production.example`. En
  el servidor se copian a `DEPLOY_PATH` como `docker-compose.yml` y `.env` (este último se
  completa a mano). Servicios: `chepagame-mongodb` (`mongo:8.0`, replica set con keyfile como
  en desarrollo, auth, volúmenes nombrados, sin puertos publicados), `chepagame-backend` y
  `chepagame-frontend` (imágenes `${DOCKERHUB_NAMESPACE}/chepagame-<x>:${<X>_TAG:-latest}`,
  `restart: unless-stopped`, healthcheck). La Web y el Backend publican sus puertos en
  `${PUBLISH_ADDRESS:-127.0.0.1}` para un proxy inverso del host.
- **Rationale**: FR-015. Las variables `BACKEND_TAG` y `FRONTEND_TAG` del `.env` permiten fijar
  `sha-<commit>` para el rollback (US3, SC-004) sin editar el compose.
- **Alternatives considered**: que el workflow copie el compose al servidor en cada deploy
  (cambia la configuración del servidor de forma implícita; la spec pide solo pull y reinicio
  del servicio).

## R13. Versiones de las acciones

- **Decision**: las del workflow de referencia (`actions/checkout@v4`,
  `docker/setup-buildx-action@v3`, `docker/login-action@v3`, `docker/metadata-action@v5`,
  `docker/build-push-action@v6`, `appleboy/ssh-action@v1.2.0`) más `actions/setup-node@v4` y
  `astral-sh/setup-uv@v6`, y Dependabot (`.github/dependabot.yml`, ecosistema
  `github-actions`, mensual) para mantenerlas al día.
- **Rationale**: mantiene lo que el usuario ya conoce; Dependabot cubre las actualizaciones de
  seguridad sin trabajo manual.
- **Alternatives considered**: fijar cada acción por SHA completo (más seguro ante una etiqueta
  movida, pero ilegible para una práctica; queda como mejora posible).
