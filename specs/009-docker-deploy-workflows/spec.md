# Feature Specification: Deploy automático del Backend y la Web

**Feature Branch**: `009-docker-deploy-workflows`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Incorporar al proyecto, adaptado, un workflow de GitHub para el
backend y otro para el frontend. Ambos funcionan igual: construyen una imagen Docker, la publican
y actualizan el contenedor en el servidor de DigitalOcean (pull y reinicio). Las variables y
credenciales viven en GitHub como variables y secretos." El workflow de referencia corre al hacer
push a `main`, publica la imagen con las etiquetas `latest` y `sha-<commit>`, incluye en la imagen
la versión de la app, el número de build, la fecha, la etiqueta de release (`main-<número>`) y el
commit corto, y en el servidor ejecuta `docker compose pull` y `docker compose up -d` del
servicio, limpia las imágenes sin uso y lista el estado de los contenedores.

## Clarifications

### Session 2026-11-13

- Q: ¿El repositorio incluye la configuración de producción del servidor o el servidor ya está
  armado? → A: El repositorio incluye el compose de producción (Backend, Web y MongoDB) y una
  plantilla de su `.env`.
- Q: ¿Las imágenes de Docker Hub son públicas o privadas? → A: Públicas. El repositorio de
  GitHub también es público (el proyecto es una práctica de SDD).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publicar el Backend con un merge a main (Priority: P1)

Como responsable de ChePagame, cuando un cambio del Backend llega a `main`, quiero que se
construya la versión de producción del Backend, se publique en el registro de imágenes y el
servidor pase a usarla, sin que yo tenga que entrar al servidor.

**Why this priority**: el Backend es la base de la Web y de la App; sin él publicado no hay
producto en línea. Es el caso más simple para validar todo el circuito (construir, publicar,
actualizar el servidor).

**Independent Test**: hacer un cambio menor en `backend/`, llevarlo a `main` y comprobar que la
ejecución termina bien, que el registro tiene una imagen nueva con la etiqueta del commit y que
el servidor responde con la versión y el commit nuevos.

**Acceptance Scenarios**:

1. **Given** un cambio en `backend/` mergeado a `main`, **When** termina la ejecución del deploy
   del Backend, **Then** el registro tiene una imagen con la etiqueta `latest` y otra con la del
   commit, y el servidor corre esa imagen.
2. **Given** el Backend ya actualizado, **When** se consulta su información de versión, **Then**
   informa la versión de la app, el número de build, la fecha, la etiqueta de release y el
   commit corto de ese deploy.
3. **Given** que los tests o el lint del Backend fallan, **When** se ejecuta el deploy, **Then**
   no se publica ninguna imagen, el servidor sigue con la versión anterior y la ejecución queda
   marcada como fallida.

---

### User Story 2 - Publicar la Web con un merge a main (Priority: P2)

Como responsable de ChePagame, cuando un cambio de la Web llega a `main`, quiero que se
construya la versión de producción de la Web, se publique y el servidor pase a usarla, igual que
el Backend.

**Why this priority**: la Web depende del Backend publicado; reutiliza el mismo circuito, así
que se valida después.

**Independent Test**: hacer un cambio menor en `web/`, llevarlo a `main` y comprobar que la
ejecución termina bien y que la Web pública muestra la versión, el build y el commit nuevos.

**Acceptance Scenarios**:

1. **Given** un cambio en `web/` mergeado a `main`, **When** termina la ejecución del deploy de
   la Web, **Then** el registro tiene la imagen nueva (`latest` y la del commit) y el servidor la
   corre.
2. **Given** la Web actualizada, **When** un visitante abre "Quiénes somos", **Then** ve la
   versión de la app y el número de build del deploy, y el commit corto queda disponible para
   soporte.
3. **Given** un cambio solo en `web/`, **When** llega a `main`, **Then** el Backend no se vuelve
   a construir ni a reiniciar (y viceversa).

---

### User Story 3 - Volver a una versión anterior y desplegar a mano (Priority: P3)

Como responsable, quiero poder lanzar un deploy a mano (por ejemplo, después de cambiar una
variable en GitHub) y poder volver a una imagen anterior si la nueva falla.

**Why this priority**: es el plan B; el circuito automático ya entrega valor sin esto.

**Independent Test**: lanzar a mano el deploy de la Web sin cambios de código y ver que termina
bien; luego seguir la guía de rollback para volver a la imagen del commit anterior.

**Acceptance Scenarios**:

1. **Given** cualquier estado de `main`, **When** el responsable lanza a mano el deploy del
   Backend o de la Web, **Then** se ejecuta el mismo circuito que con un push.
2. **Given** una imagen nueva con problemas, **When** el responsable sigue la guía de rollback,
   **Then** el servidor vuelve a la imagen etiquetada con un commit anterior en menos de 5
   minutos.

---

### Edge Cases

- El contenedor nuevo no arranca o no responde a la verificación de salud: la ejecución queda
  fallida y lo muestra; la imagen anterior sigue disponible con su etiqueta de commit para el
  rollback.
- Falta un secreto o una variable en GitHub: la ejecución falla al principio, con un mensaje que
  nombra lo que falta (sin mostrar ningún valor), antes de construir nada.
- El servidor no responde por SSH o su identidad no coincide con la registrada: la ejecución
  falla sin cambiar nada y la imagen ya publicada queda en el registro.
- Dos merges seguidos del mismo componente: los deploys de ese componente no se pisan; corren de
  a uno y el último merge es el que queda en el servidor.
- Un cambio toca a la vez `backend/` y `web/`: corren los dos deploys, cada uno por su lado.
- Un cambio solo en `mobile/`, `specs/` o documentación: no dispara ningún deploy.
- Un cambio en `deploy/` (configuración del servidor) no dispara ningún deploy ni actualiza el
  servidor: hay que copiarlo al servidor a mano, como indica el README.
- El registro de imágenes no está disponible o rechaza las credenciales: la ejecución falla y el
  servidor no se toca.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El proyecto MUST tener dos circuitos de deploy independientes, uno para el Backend
  y otro para la Web, con los mismos pasos: verificar, construir la imagen de producción,
  publicarla en el registro y actualizar ese servicio en el servidor.
- **FR-002**: Cada circuito MUST dispararse cuando llega a `main` un cambio en su carpeta (o en
  su propio archivo de workflow), y MUST poder lanzarse a mano solo desde `main`: una ejecución manual desde otra rama MUST NOT
  publicar ni desplegar. Los cambios en otras carpetas MUST NOT dispararlo.
- **FR-003**: Antes de construir, cada circuito MUST correr los tests y el lint de su componente;
  si fallan, MUST NOT publicar ni desplegar.
- **FR-004**: Las imágenes MUST ser de producción: sin recarga en caliente, sin herramientas de
  desarrollo ni dependencias de test, y corriendo con un usuario sin privilegios de
  administrador. Los archivos de desarrollo local (`docker-compose.yml`, Dockerfiles de
  desarrollo) MUST seguir funcionando como hoy.
- **FR-005**: Cada imagen MUST publicarse con dos etiquetas: `latest` y `sha-<commit corto>`.
- **FR-006**: Cada imagen MUST llevar la versión de la app (tomada del manifiesto de su
  componente: `package.json` de la Web, `pyproject.toml` del Backend), el número de build, la
  fecha de build en UTC, la etiqueta de release `main-<número de build>` y el commit corto.
- **FR-007**: La Web MUST mostrar la versión y el número de build en "Quiénes somos" y el
  Backend MUST exponerlos en un endpoint público de salud y versión, que no revela nada más
  (ni configuración, ni entorno, ni dependencias).
- **FR-008**: Las credenciales (registro de imágenes, acceso al servidor, identidad del servidor)
  MUST guardarse solo como secretos de GitHub; los datos no secretos (cuenta de las imágenes y
  carpeta del deploy en el servidor) MUST guardarse como
  variables de GitHub. Ningún valor MUST escribirse en el repositorio ni aparecer en los logs.
- **FR-009**: Las imágenes MUST NOT contener secretos ni archivos `.env`; los secretos de
  ejecución viven solo en el servidor.
- **FR-010**: El acceso al servidor MUST verificar la identidad del servidor (huella de su clave)
  antes de ejecutar nada, y MUST usar una clave dedicada al deploy.
- **FR-011**: En el servidor, cada circuito MUST actualizar solo su servicio (descargar la imagen
  nueva y recrear ese contenedor), limpiar las imágenes sin uso y verificar que el servicio quedó
  en marcha y responde; si no responde dentro de un tiempo límite, la ejecución MUST fallar.
- **FR-012**: Los deploys del mismo componente MUST ejecutarse de a uno, sin cancelar uno que ya
  está actualizando el servidor.
- **FR-013**: Si falta un secreto o una variable, la ejecución MUST fallar antes de construir y
  nombrar lo que falta, sin mostrar valores.
- **FR-014**: El proyecto MUST documentar (README) los secretos y variables necesarios, cómo
  preparar el servidor y cómo volver a una imagen anterior (rollback).
- **FR-015**: El repositorio MUST incluir la configuración de producción del servidor: el
  compose de producción con los servicios `chepagame-backend`, `chepagame-frontend` y MongoDB
  (replica set, volumen nombrado, puertos de MongoDB no expuestos a internet) y una plantilla de
  su `.env` sin valores. El `.env` real se crea a mano en el servidor y MUST NOT subirse al
  repositorio.
- **FR-016**: Las imágenes MUST publicarse en repositorios públicos de Docker Hub; el servidor las
  descarga sin login. Como el repositorio de GitHub y las imágenes son públicos, nada que se
  publique (código, imágenes, logs de las ejecuciones) MUST contener valores secretos.

### Key Entities

- **Imagen publicada**: la versión de producción de un componente (Backend o Web) en el
  registro, con las etiquetas `latest` y `sha-<commit>` y su información de build.
- **Información de build**: versión de la app, número de build, fecha UTC, etiqueta de release y
  commit corto; viaja dentro de la imagen y se muestra en la Web y en el endpoint del Backend.
- **Ejecución de deploy**: una corrida de un circuito, con su resultado (éxito o fallo) y el paso
  en el que falló.
- **Configuración del deploy**: los secretos y variables de GitHub que necesitan los circuitos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un cambio mergeado a `main` queda en producción sin pasos manuales en menos de 15
  minutos.
- **SC-002**: El 100% de las imágenes publicadas pasaron antes los tests y el lint de su
  componente.
- **SC-003**: Desde la Web y el Backend en producción se puede identificar el commit exacto que
  está corriendo en menos de 1 minuto.
- **SC-004**: Volver a la imagen anterior lleva menos de 5 minutos siguiendo la guía.
- **SC-005**: Ninguna credencial aparece en el repositorio, en las imágenes ni en los logs de las
  ejecuciones (revisión de los logs y del contenido de la imagen).
- **SC-006**: Un cambio que solo toca un componente no reinicia el otro (0 reinicios no
  necesarios).

## Assumptions

- Los circuitos corren en GitHub Actions y publican en Docker Hub con la cuenta del responsable;
  el servidor es un droplet de DigitalOcean con Docker y Docker Compose, accesible por SSH, y el
  deploy vive en una carpeta configurable (hoy `/root/projects`).
- Los servicios del compose del servidor se llaman `chepagame-backend` y `chepagame-frontend`, y
  las imágenes, `<cuenta>/chepagame-backend` y `<cuenta>/chepagame-frontend`. El contenedor de
  la Web en desarrollo sigue llamándose `chepagame-web`; la diferencia es intencional.
- La Web llama al Backend solo desde su servidor, por la red interna del servidor; la imagen de
  la Web no depende de ninguna URL fija y su configuración vive en el `.env` del servidor.
- HTTPS, dominio, proxy inverso y backups de la base del servidor quedan fuera de esta feature;
  se asume que el servidor ya los resuelve o se tratarán aparte.
- La App móvil no se despliega con estos circuitos: sus builds para las tiendas siguen siendo
  manuales.
- Solo existe un entorno (producción); no hay entorno de staging en esta feature.
