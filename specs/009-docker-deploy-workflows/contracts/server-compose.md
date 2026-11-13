# Contract: configuración de producción del servidor

Archivos del repo: `deploy/docker-compose.prod.yml` y `deploy/.env.production.example`. En el
servidor se copian una vez a `DEPLOY_PATH` como `docker-compose.yml` y `.env`; el `.env` se
completa a mano y nunca vuelve al repo.

## Servicios

| Servicio | Imagen | Puertos | Healthcheck | Depende de |
|----------|--------|---------|-------------|------------|
| `chepagame-mongodb` | `mongo:8.0` | ninguno publicado | `rs.status().ok` (inicia el replica set la primera vez), como en desarrollo | — |
| `chepagame-backend` | `${DOCKERHUB_NAMESPACE:?…}/chepagame-backend:${BACKEND_TAG:-latest}` | `${PUBLISH_ADDRESS:-127.0.0.1}:8000:8000` | `GET http://localhost:8000/api/v1/health` = 200 | mongodb `service_healthy` |
| `chepagame-frontend` | `${DOCKERHUB_NAMESPACE:?…}/chepagame-frontend:${FRONTEND_TAG:-latest}` | `${PUBLISH_ADDRESS:-127.0.0.1}:3000:3000` | `GET http://localhost:3000/api/health` = 200 | backend `service_started` |

Todos con `restart: unless-stopped` y `env_file: .env`. MongoDB usa keyfile generado al
arrancar, auth con las credenciales del `.env` y los volúmenes `mongodb_data` y
`mongodb_config`. El Backend recibe `MONGODB_HOST_OVERRIDE=chepagame-mongodb:27017`; la Web,
`API_INTERNAL_BASE_URL=http://chepagame-backend:8000/api/v1`, `AUTH_TRUST_HOST=true` y
`NEXT_TELEMETRY_DISABLED=1`.

## `.env.production.example`

Mismas claves que `.env.example` para MongoDB, Backend y Web (sin las de Mobile ni las de
desarrollo), todas vacías o con valores ficticios, más:

```dotenv
DOCKERHUB_NAMESPACE=
# Pin an image for rollback, e.g. sha-397655e; empty or "latest" follows the last deploy.
BACKEND_TAG=latest
FRONTEND_TAG=latest
# 127.0.0.1 behind a reverse proxy on the host; 0.0.0.0 exposes the ports directly.
PUBLISH_ADDRESS=127.0.0.1
ENVIRONMENT=production
EMAIL_DELIVERY=resend
FORWARDED_ALLOW_IPS=
```

## Rollback

1. Elegir la etiqueta `sha-<commit>` anterior (Docker Hub o lista de ejecuciones).
2. En el servidor: poner `BACKEND_TAG=sha-<commit>` (o `FRONTEND_TAG`) en `.env`.
3. `docker compose up -d --no-deps --wait <servicio>`.
4. Para volver a seguir los deploys: `BACKEND_TAG=latest` en `.env` y el próximo deploy.

Mientras la etiqueta esté fijada, un deploy automático publica la imagen nueva pero el
servicio sigue con la fijada (el pull de `latest` no la reemplaza). La ejecución queda en verde y
el paso de SSH muestra la etiqueta que quedó corriendo (`docker compose images`).

## Cambios en `deploy/`

Los workflows no copian `deploy/` al servidor. Después de cambiar el compose o la plantilla, se
copia a mano a `DEPLOY_PATH` y se aplica con `docker compose up -d`.
