# Contract: workflows de deploy

Dos archivos con la misma forma: `.github/workflows/deploy-backend.yml` y
`.github/workflows/deploy-web.yml`. Abajo, `<c>` es `backend` o `web` y `<svc>` es
`chepagame-backend` o `chepagame-frontend`.

## Disparadores y límites

```yaml
on:
  push:
    branches: [main]
    paths: ["<c>/**", ".github/workflows/deploy-<c>.yml"]
  workflow_dispatch:
permissions:
  contents: read
concurrency:
  group: deploy-<c>
  cancel-in-progress: false
```

## Job `verify`

| Paso | Backend | Web |
|------|---------|-----|
| Setup | `astral-sh/setup-uv`, `uv sync --frozen` | `actions/setup-node` (`node-version-file: .nvmrc`, caché npm), `npm ci` |
| Lint | `uv run ruff check .` y `uv run ruff format --check .` | `npm run lint` y `npx tsc --noEmit` |
| Base de test | MongoDB 8.0 en `docker run` como replica set `rs0` sin auth, `rs.initiate()` con `mongosh` | — |
| Tests | `uv run pytest` con `ENVIRONMENT=test`, `MONGODB_URI=mongodb://localhost:27017/?directConnection=true` y `JWT_SECRET`/`CODE_HASH_SECRET` generados con `openssl rand -hex 32` (enmascarados con `::add-mask::`) | `npm test -- --ci` |

## Job `deploy` (`needs: verify`, `if: github.ref == 'refs/heads/main'`)

Una ejecución manual desde otra rama corre `verify` pero no `deploy`.

1. **Check configuration**: falla con `Missing GitHub secret or variable: <NAME>` si falta
   alguno de `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `DROPLET_IP`, `DROPLET_USER`,
   `SSH_PRIVATE_KEY`, `DROPLET_SSH_FINGERPRINT`, `DOCKERHUB_NAMESPACE`, `DEPLOY_PATH`. Nunca
   imprime valores.
2. **Read app version**: Web `node -p "require('./web/package.json').version"`; Backend
   `python3 -c "import tomllib; print(tomllib.load(open('backend/pyproject.toml','rb'))['project']['version'])"`.
3. **Prepare build metadata**: `date` (`date -u +%Y-%m-%dT%H:%M:%SZ`), `sha_short`
   (`${GITHUB_SHA::7}`), `release_tag` (`main-${GITHUB_RUN_NUMBER}`).
4. **Buildx + login** (`docker/setup-buildx-action`, `docker/login-action`).
5. **Metadata** (`docker/metadata-action`): imagen `${{ vars.DOCKERHUB_NAMESPACE }}/<svc>`,
   etiquetas `type=raw,value=latest` y `type=sha,prefix=sha-`.
6. **Build and push** (`docker/build-push-action`): `context: <c>`,
   `file: <c>/Dockerfile.prod`, `push: true`, caché `type=gha,scope=<c>`, build args
   `APP_VERSION`, `BUILD_NUMBER`, `BUILD_DATE`, `RELEASE_TAG`, `GIT_SHA`.
7. **Update server** (`appleboy/ssh-action`, con `fingerprint`):

   ```bash
   set -euo pipefail
   cd "$DEPLOY_PATH"
   docker compose pull <svc>
   docker compose up -d --no-deps --wait --wait-timeout 180 <svc>
   docker image prune -f
   docker compose ps
   docker compose images <svc>   # shows the tag actually running (pinned or latest)
   ```

   `DEPLOY_PATH` llega por `envs:` y no se interpola dentro del script.

## Garantías

- Si `verify` falla, `deploy` no corre: no se publica ni se toca el servidor.
- `deploy` solo corre en `main`, también cuando se lanza a mano.
- Si el build o el push fallan, el servidor no se toca.
- Si el servicio no queda `healthy` en 180 s, el paso falla y la ejecución queda en rojo.
- Ningún paso imprime secretos; los valores generados en `verify` se enmascaran.
