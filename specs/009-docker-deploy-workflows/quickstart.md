# Quickstart: validar el deploy automático (feature 009)

Guía de validación de punta a punta. Los valores reales de secretos y del `.env` del servidor
los cargás vos; nunca se pegan en un chat ni se suben al repo.

## 1. Local (sin servidor)

1. Tests y lint: `cd backend && python -m uv run ruff check . && python -m uv run pytest`;
   `cd web && npm run lint && npx tsc --noEmit && npm test`.
2. Imágenes de producción:

   ```bash
   docker build -f backend/Dockerfile.prod --build-arg APP_VERSION=0.1.0 --build-arg GIT_SHA=abc1234 -t chepagame-backend:local backend
   docker build -f web/Dockerfile.prod --build-arg APP_VERSION=0.1.0 --build-arg BUILD_NUMBER=1 -t chepagame-frontend:local web
   ```

   **Esperado**: las dos terminan bien; `docker run --rm chepagame-backend:local whoami` no
   devuelve `root`; `docker run --rm chepagame-frontend:local ls -a` no muestra `.env` ni
   `src/`; ninguna imagen tiene pytest, ruff ni jest.
3. Desarrollo intacto: `docker compose up -d` sigue levantando `chepagame-backend` y
   `chepagame-web` con recarga en caliente.
4. Salud: `curl -s localhost:8000/api/v1/health` → `200`, `"version": "dev"`;
   `curl -s localhost:3000/api/health` → `200`. Con MongoDB detenido, el Backend devuelve `503`.
5. "Quiénes somos" muestra "Versión dev" (es) / "Version dev" (en).

## 2. Preparar GitHub y el servidor (una vez)

1. Docker Hub: crear un token de acceso (Read & Write).
2. Servidor: crear una clave SSH dedicada, agregar la pública a `authorized_keys` del usuario de
   deploy y obtener la huella de la clave de host (`ssh-keygen -lf
   /etc/ssh/ssh_host_ed25519_key.pub`). En `DROPLET_SSH_FINGERPRINT` va solo el campo
   `SHA256:…` de esa salida, sin el tamaño, el comentario ni el tipo de clave.
3. GitHub → Settings → Secrets and variables → Actions: cargar los 6 secretos y las 2
   variables de [contracts/workflows.md](contracts/workflows.md).
4. Servidor: copiar `deploy/docker-compose.prod.yml` y `deploy/.env.production.example` a
   `DEPLOY_PATH` como `docker-compose.yml` y `.env`, y completar el `.env`.

## 3. Escenarios en GitHub

| # | Acción | Esperado |
|---|--------|----------|
| 1 | Merge a `main` con un cambio en `backend/` | Corre solo "Deploy backend"; Docker Hub tiene `latest` y `sha-<commit>`; `/api/v1/health` del servidor muestra ese commit y el build (US1, SC-003). |
| 2 | Merge con un cambio en `web/` | Corre solo "Deploy web"; "Quiénes somos" muestra la versión y el build nuevos; el Backend no se reinició (`docker compose ps`, US2, SC-006). |
| 3 | Merge con un test roto | `verify` en rojo, `deploy` no corre, el servidor sigue igual (FR-003). |
| 4 | Borrar temporalmente `DEPLOY_PATH` | Falla en "Check configuration" nombrando `DEPLOY_PATH`, sin valores (FR-013). |
| 5 | Huella SSH incorrecta | Falla al conectar; el servidor no cambia (FR-010). |
| 6 | Lanzar "Deploy web" a mano (Run workflow) | Mismo circuito que con un push (US3). |
| 7 | Rollback con `FRONTEND_TAG=sha-<anterior>` | La Web vuelve a la versión anterior en menos de 5 minutos (SC-004). |
| 8 | Cambio solo en `specs/` o `mobile/` | No corre ningún deploy (FR-002). |
| 9 | Revisar los logs de las ejecuciones | Ningún secreto visible; solo `***` (SC-005). |
| 10 | Lanzar "Deploy web" a mano desde otra rama | Corre `verify`; `deploy` queda salteado y no se publica nada (FR-002). |
| 11 | Con `BACKEND_TAG=sha-<anterior>` fijado, merge en `backend/` | La imagen nueva se publica, el servidor sigue con la fijada y el log de SSH muestra esa etiqueta. |

## 4. Tiempo total

Medir desde el merge hasta que el healthcheck queda `healthy`: menos de 15 minutos (SC-001).
