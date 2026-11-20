# ChePagame en producción (DigitalOcean) — guía paso a paso

Runbook del servidor de producción: un droplet con Docker Compose donde un **nginx compartido**
publica varios sitios. ChePagame se suma como tres servicios más (MongoDB, backend y web) y queda
expuesto en:

| URL | Destino dentro de Docker |
|-----|--------------------------|
| `https://chepagame.com.ar` (y `www`) | `chepagame-frontend:3000` |
| `https://api.chepagame.com.ar/v1/...` | `chepagame-backend:8000/api/v1/...` |

> Sin secretos en este documento ni en el repo: todos los valores reales viven sólo en el `.env`
> del servidor. Los comandos de abajo generan secretos **sin mostrarlos** en pantalla.

Todos los comandos se ejecutan en el servidor, en la carpeta del compose (`DEPLOY_PATH`).

---

## 1. DNS

Registros **A** apuntando a la IP del droplet:

- `chepagame.com.ar`
- `www.chepagame.com.ar`
- `api.chepagame.com.ar`

```bash
dig +short chepagame.com.ar www.chepagame.com.ar api.chepagame.com.ar
```

Las tres líneas tienen que mostrar la IP del droplet.

## 2. Servicios en el `docker-compose.yml`

Fragmento a sumar al compose del servidor (junto a nginx, certbot y los demás sitios). Ninguno
publica puertos al host: sólo nginx entra a ellos por la red de Docker.

```yaml
  mongodb:
    image: mongo:8.0
    restart: unless-stopped
    # Single-node replica set: required for transactions. No auth, no published ports.
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all", "--wiredTigerCacheSizeGB", "0.25"]
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
    healthcheck:
      test:
        - CMD-SHELL
        - >-
          mongosh --quiet --eval
          "try { rs.status().ok } catch (e) { rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'mongodb:27017' }] }).ok }"
      interval: 10s
      timeout: 10s
      retries: 10
      start_period: 30s

  chepagame-backend:
    image: <DOCKERHUB_NAMESPACE>/chepagame-backend:latest
    container_name: chepagame-backend
    restart: unless-stopped
    env_file: .env
    expose:
      - "8000"
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health', timeout=4)"]
      interval: 10s
      timeout: 5s
      retries: 6
      start_period: 20s
    depends_on:
      mongodb:
        condition: service_healthy

  chepagame-frontend:
    image: <DOCKERHUB_NAMESPACE>/chepagame-frontend:latest
    container_name: chepagame-frontend
    restart: unless-stopped
    env_file: .env
    environment:
      API_INTERNAL_BASE_URL: http://chepagame-backend:8000/api/v1
      AUTH_TRUST_HOST: "true"
      NEXT_TELEMETRY_DISABLED: "1"
    expose:
      - "3000"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 6
      start_period: 20s
    depends_on:
      chepagame-backend:
        condition: service_started

volumes:
  mongodb_data:
  mongodb_config:
```

Notas:

- Los nombres `chepagame-backend` y `chepagame-frontend` son los que usan los workflows de GitHub
  para hacer `docker compose pull/up`: no cambiarlos.
- La web escucha en el **3000 dentro del contenedor**. Si además se publica al host
  (`ports: "3080:3000"`), nginx igual tiene que apuntar a `chepagame-frontend:3000`, nunca al
  puerto del host.
- En un droplet de 1 GB conviene limitar la caché de MongoDB (`--wiredTigerCacheSizeGB`) y no
  sumar límites de memoria por encima de la RAM real.

## 3. `.env` del servidor

Partir de [`.env.production.example`](.env.production.example) y completar los valores **editando
el archivo en el servidor**. Puntos que importan en este setup:

| Variable | Valor en este setup |
|----------|---------------------|
| `MONGODB_URI` | `mongodb://mongodb:27017/?directConnection=true` (sin usuario: Mongo no tiene auth) |
| `ENVIRONMENT` | `production` |
| `EMAIL_DELIVERY` | `resend`, con `RESEND_API_KEY` y `EMAIL_FROM` completos |
| `AUTH_URL` | `https://chepagame.com.ar` |
| `FORWARDED_ALLOW_IPS` | `*` (seguro sólo porque el backend no publica puertos; ver §2) |
| `JWT_SECRET`, `CODE_HASH_SECRET`, `AUTH_SECRET` | aleatorios, generados como abajo |
| `CALLMEBOT_URL`, `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY` | los de tu cuenta de CallMeBot (URL con `https`) |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY`, `CLOUDFLARE_TURNSTILE_SITE_KEY` | los del widget de Turnstile |

Generar un secreto faltante sin imprimirlo (repetir con cada nombre):

```bash
grep -q '^CODE_HASH_SECRET=' .env || echo "CODE_HASH_SECRET=$(openssl rand -hex 32)" >> .env
```

Después de cambiar el `.env`, recrear el servicio afectado:

```bash
docker compose up -d --force-recreate chepagame-backend chepagame-frontend
```

> No usar `docker exec … env` ni `docker inspect` completo para revisar la config: imprimen los
> secretos.

### Contacto y Turnstile (feature 017)

- Con `ENVIRONMENT=production` el backend **no arranca** si falta alguna de las cinco variables de
  arriba; el log nombra la variable, nunca el valor.
- En el panel de Cloudflare Turnstile, el widget tiene que permitir el hostname
  `chepagame.com.ar` (y `www.chepagame.com.ar` si se usa). La App muestra el widget desde
  `https://chepagame.com.ar/turnstile`, así que no hace falta otro hostname.
- La Web lee `CLOUDFLARE_TURNSTILE_SITE_KEY` en tiempo de ejecución, del `.env` del servidor: no
  hace falta un `build-arg` ni reconstruir la imagen. Alcanza con recrear los dos servicios.

## 4. MongoDB: primera vez

```bash
docker compose up -d mongodb
docker compose ps mongodb
```

El healthcheck inicia el replica set con el host `mongodb:27017`. Cuando figure `healthy`:

```bash
docker compose exec mongodb mongosh --quiet --eval "db.hello().isWritablePrimary"
```

Tiene que imprimir `true`.

## 5. nginx

El nginx oficial carga **sólo** `conf.d/*.conf`: el archivo tiene que terminar en `.conf`.
Archivo `nginx/conf.d/chepagame.com.ar.conf`:

```nginx
# HTTP: Let's Encrypt challenge + redirect to HTTPS (for every ChePagame host)
server {
    listen 80;
    server_name chepagame.com.ar www.chepagame.com.ar api.chepagame.com.ar;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# Web
server {
    listen 443 ssl;
    http2 on;
    server_name chepagame.com.ar www.chepagame.com.ar;

    ssl_certificate     /etc/letsencrypt/live/chepagame.com.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chepagame.com.ar/privkey.pem;

    location / {
        proxy_pass http://chepagame-frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
    }
}

# API: https://api.chepagame.com.ar/v1/x -> http://chepagame-backend:8000/api/v1/x
server {
    listen 443 ssl;
    http2 on;
    server_name api.chepagame.com.ar;

    ssl_certificate     /etc/letsencrypt/live/chepagame.com.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chepagame.com.ar/privkey.pem;

    client_max_body_size 5m;

    location = /v1 {
        return 301 /v1/;
    }

    # The trailing slash on both sides swaps the /v1/ prefix for /api/v1/.
    location /v1/ {
        proxy_pass http://chepagame-backend:8000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location / {
        return 404;
    }
}
```

Claves:

- **Cada dominio tiene que estar en un bloque `listen 80`**. Si no, cae en el `default_server`
  (que responde 444) y Let's Encrypt no puede validarlo.
- El `root` del challenge tiene que ser la carpeta compartida con el contenedor de certbot.
- Los bloques 443 sólo pasan `nginx -t` si el certificado ya existe: emitir el certificado
  (paso 6) **antes** de agregarlos, o agregarlos después.

Validar y aplicar (siempre los dos pasos):

```bash
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload
```

## 6. Certificado HTTPS (Let's Encrypt)

ChePagame tiene **su propio certificado** (`chepagame.com.ar`), separado del de los otros sitios.
Con nginx ya sirviendo el bloque del puerto 80:

```bash
docker compose run --rm --entrypoint certbot certbot certonly --webroot -w /var/www/certbot \
  --cert-name chepagame.com.ar --expand \
  -d chepagame.com.ar -d www.chepagame.com.ar -d api.chepagame.com.ar --dry-run
```

Si el dry run es exitoso, repetir **sin** `--dry-run` y recargar nginx.

- Para sumar un subdominio nuevo: agregarlo al `listen 80`, recargar nginx y repetir el comando
  con **todos** los dominios más el nuevo (`--expand`).
- `certbot certonly` con una lista distinta a la de un certificado existente y sin
  `--cert-name` crea uno nuevo con sufijo `-0001`. Listar con
  `docker compose run --rm --entrypoint certbot certbot certificates` y borrar los que ningún
  `.conf` use.
- La renovación (`certbot renew`) incluye este certificado sin configuración extra.

## 7. Verificación

```bash
# Certificate served for each host (must list chepagame.com.ar, www and api)
echo | openssl s_client -connect chepagame.com.ar:443 -servername chepagame.com.ar 2>/dev/null \
  | openssl x509 -noout -subject -issuer -ext subjectAltName -dates

# Web and API over HTTPS, validating the certificate (ssl_verify_result 0 = OK)
curl -sI https://chepagame.com.ar -o /dev/null -w "%{http_code} %{ssl_verify_result}\n"
curl -s https://api.chepagame.com.ar/v1/health

# Container status
docker compose ps
```

## 8. Problemas conocidos

| Síntoma | Causa | Solución |
|---------|-------|----------|
| MongoDB nunca `healthy`; logs con `already initialized` / `REMOVED` / `NodeNotFound` | El replica set se inició con el ID del contenedor como host y el contenedor se recreó | `docker compose exec mongodb mongosh --eval "rs.reconfig({_id:'rs0',members:[{_id:0,host:'mongodb:27017'}]},{force:true})"` |
| Backend no arranca: `code_hash_secret` (u otro) missing | Falta la variable en `.env` | Generarla (§3) y recrear |
| Backend: `Authentication failed` | `MONGODB_URI` con usuario y contraseña contra un Mongo sin auth | Usar la URI sin credenciales (§3) |
| `500` al registrarse; `PermissionError: '/app/.dev-outbox'` | `EMAIL_DELIVERY=console`: la imagen de producción no puede escribir el outbox | `EMAIL_DELIVERY=resend` (§3) |
| nginx responde `444` / conexión cortada | El dominio no coincide con ningún `server_name`, o el archivo no termina en `.conf` | Revisar nombre del archivo y `server_name` |
| `502 Bad Gateway` | `proxy_pass` apunta a un puerto del host en vez del puerto del contenedor | `chepagame-frontend:3000` / `chepagame-backend:8000` |
| `nginx -t`: no encuentra `live/chepagame.com.ar/...` | El certificado todavía no existe | Emitirlo primero (§6) |
| Chrome: `ERR_CERT_COMMON_NAME_INVALID` | El certificado no incluye ese dominio | Verificar con `openssl` (§7) y ampliarlo con `--expand` (§6) |
| certbot: `Error getting validation data` | El dominio no está en ningún bloque `listen 80` | Agregarlo (§5), recargar y repetir |
| Chrome muestra "Not secure" con el certificado ya correcto | Excepción guardada de cuando se aceptó un certificado inválido | Candado → **Turn on warnings**, o reiniciar Chrome. Probar en incógnito |

## 9. Clientes

- **Web:** habla con el backend por la red interna (`API_INTERNAL_BASE_URL`), no por la URL
  pública.
- **App móvil:** al compilar para producción,
  `EXPO_PUBLIC_API_BASE_URL=https://api.chepagame.com.ar/v1`.

## 10. Deploy automático

Los workflows de GitHub (`deploy-backend.yml`, `deploy-web.yml`) construyen las imágenes, las
publican en Docker Hub y hacen `pull` + `up` de **un** servicio en `DEPLOY_PATH`. Secretos,
variables y rollback: ver la sección "Deploy (feature 009)" del [README](../README.md).
