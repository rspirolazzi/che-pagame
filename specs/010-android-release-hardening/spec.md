# Feature Specification: Build de release de Android confiable

**Feature Branch**: `010-android-release-hardening`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Mejorar la calidad del APK: en VirusTotal un antivirus (1 de 66,
AhnLab `PUP/Android.Malct`) lo marcó como potencialmente no deseado." El análisis mostró que el
APK de release se firma con la clave debug, no reduce el código, incluye las cuatro arquitecturas
en un único archivo de ~100 MB y declara permisos que la App no usa (`SYSTEM_ALERT_WINDOW`,
lectura y escritura del almacenamiento externo). La constitución 4.8.0 agrega las reglas de
"Builds Móviles de Release" que esta feature aplica.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instalar un APK que los antivirus no marcan (Priority: P1)

Como persona que recibe el APK de ChePagame, quiero instalarlo sin que el teléfono ni los
antivirus me avisen que es peligroso, para confiar en la App.

**Why this priority**: es el problema que disparó la feature; un aviso de malware frena la
instalación y daña la confianza en el producto.

**Independent Test**: generar el APK de release, subirlo a VirusTotal y revisar el resultado y
los permisos que pide la App al instalarla.

**Acceptance Scenarios**:

1. **Given** un APK de release nuevo, **When** se analiza en VirusTotal, **Then** no tiene
   detecciones o, si un proveedor lo marca, el falso positivo queda reportado a ese proveedor.
2. **Given** el APK instalado, **When** se revisan sus permisos en Ajustes del teléfono, **Then**
   solo aparecen los que la App usa (Internet y los que pidan sus funciones), sin "mostrar sobre
   otras apps" ni acceso al almacenamiento.
3. **Given** el APK de release, **When** se inspecciona su firma, **Then** está firmado con la
   clave de release del proyecto y no con la clave debug.

---

### User Story 2 - Generar el release sin exponer la clave (Priority: P1)

Como responsable de ChePagame, quiero generar el APK o el AAB de release en mi máquina con un
paso a paso documentado, usando una clave de firma que vive fuera del repositorio.

**Why this priority**: sin una clave propia no hay release confiable ni publicación en Google
Play; y el repositorio es público, así que la clave nunca puede quedar en él.

**Independent Test**: seguir el paso a paso del README en una máquina con la clave configurada y
obtener el binario firmado; repetirlo sin la clave y comprobar que el build falla con un mensaje
claro en lugar de firmar con la clave debug.

**Acceptance Scenarios**:

1. **Given** la clave de release y sus contraseñas configuradas fuera del repositorio, **When** se
   sigue el paso a paso, **Then** se obtiene un binario de release firmado con esa clave.
2. **Given** que falta la clave o alguna contraseña, **When** se intenta generar el release,
   **Then** el build falla con un mensaje que dice qué falta, sin firmar con la clave debug.
3. **Given** el repositorio después del cambio, **When** se busca la clave o sus contraseñas,
   **Then** no aparecen en ningún archivo versionado.

---

### User Story 3 - Descargar un APK más liviano (Priority: P2)

Como persona que instala ChePagame, quiero descargar un archivo chico, para no gastar datos ni
espacio.

**Why this priority**: mejora la experiencia y también reduce señales sospechosas (binarios
enormes con código nativo de varias arquitecturas), pero no bloquea la instalación.

**Independent Test**: comparar el tamaño del APK para teléfonos actuales (arm64) con el APK
universal de hoy (~100 MB).

**Acceptance Scenarios**:

1. **Given** el release nuevo, **When** se genera el APK para arm64, **Then** pesa al menos un 50 %
   menos que el APK universal actual.
2. **Given** el release con el código reducido, **When** se recorren los flujos principales
   (login con email y con Google, cuentas, gastos, saldos, exportar, perfil), **Then** funcionan
   igual que en el build de desarrollo.

---

### User Story 4 - Compilar el release en GitHub (Priority: P2)

Como responsable de ChePagame, quiero que al crear una versión GitHub compile, firme y publique
el APK y el AAB, para no depender de mi máquina (un build local tarda ~16 minutos) y tener un link
fijo de descarga por versión.

**Why this priority**: ahorra tiempo y hace los releases reproducibles, pero el build local de las
User Stories 1 a 3 ya resuelve el problema principal.

**Independent Test**: con los secrets y variables cargados en GitHub, correr el workflow a mano
y descargar el APK firmado; después pushear el tag de la versión y comprobar que se crea el
Release con el APK y el AAB.

**Acceptance Scenarios**:

1. **Given** los secrets y variables cargados, **When** se pushea un tag `mobile-v<versión>` igual
   a la versión de la App, **Then** se corren lint, tipos y tests, se compilan el APK arm64 y el
   AAB firmados con la clave propia y se publica un Release con los dos archivos y su SHA-256.
2. **Given** un tag que no coincide con la versión de la App, **When** corre el workflow,
   **Then** falla antes de compilar y dice por qué.
3. **Given** que falta un secret o una variable, **When** corre el workflow, **Then** falla
   nombrando lo que falta, sin mostrar valores.
4. **Given** una ejecución manual, **When** termina, **Then** los binarios quedan como artifact de
   la ejecución, sin crear un Release.
5. **Given** cualquier ejecución, **When** se lee el log, **Then** no aparece ningún valor de la
   clave ni de sus contraseñas, y el archivo de la clave se borra del runner al terminar.

---

### Edge Cases

- **Inicio de sesión con Google**: Google valida la huella (SHA-1) de la clave que firma la App.
  Con la clave nueva, su huella MUST estar registrada en el cliente OAuth de Android; si no, el
  login con Google falla. El paso a paso MUST incluir cómo obtenerla y dónde registrarla.
- **Actualizar una App instalada con la clave debug**: Android no permite actualizar una App
  firmada con otra clave; hay que desinstalar la anterior. El paso a paso MUST avisarlo.
- **Pérdida de la clave**: sin la clave no se pueden publicar actualizaciones de la misma App. El
  paso a paso MUST indicar que se guarde una copia de seguridad fuera del repositorio.
- **Código que el reductor elimina por error** (librerías que usan reflexión): el release MUST
  probarse con los flujos de la User Story 3 antes de distribuirse.
- **Falsos positivos que persisten**: si un proveedor sigue marcando el binario sin causa, se
  reporta y se documenta; no se cambia la App para esquivar un antivirus.

## Requirements *(mandatory)*

### Functional Requirements

**Firma**

- **FR-001**: El build de release MUST firmarse con una clave de release propia del proyecto.
- **FR-002**: La clave y sus contraseñas MUST leerse de la configuración local fuera del
  repositorio (`.env` o equivalente ignorado por git); MUST NOT commitearse ni mostrarse en logs.
- **FR-003**: Si falta la configuración de la clave, el build de release MUST fallar con un
  mensaje claro; MUST NOT usar la clave debug como respaldo.
- **FR-004**: Los builds de desarrollo MUST seguir funcionando sin la clave de release.

**Permisos**

- **FR-005**: La App MUST declarar solo los permisos que usa. MUST bloquear `SYSTEM_ALERT_WINDOW`,
  `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `USE_BIOMETRIC` y `USE_FINGERPRINT`, y cualquier otro que agreguen las librerías
  sin que la App lo necesite.
- **FR-006**: Los permisos MUST configurarse en la configuración de Expo (no en archivos
  generados), para que sobrevivan a cada regeneración del proyecto nativo.

**Tamaño y código**

- **FR-007**: El build de release MUST reducir el código (R8) y los recursos no usados.
- **FR-008**: El release MUST poder generarse como AAB (para Google Play) y como APK por
  arquitectura (para distribución directa).
- **FR-009**: Cada release MUST tener un número de versión interno mayor al anterior y la versión
  visible de la App.

**Documentación y verificación**

- **FR-010**: El README MUST incluir el paso a paso para: crear la clave, configurarla, generar
  AAB y APK, obtener la huella SHA-1 y registrarla en Google Cloud, y verificar el binario.
- **FR-011**: Antes de distribuir un binario, el paso a paso MUST indicar analizarlo en VirusTotal
  y, ante un falso positivo, cómo reportarlo al proveedor.

**Build en GitHub**

- **FR-012**: Un workflow de GitHub MUST compilar el release al pushear un tag `mobile-v<versión>`
  y MUST poder correrse a mano.
- **FR-013**: El workflow MUST fallar antes de compilar si el tag no coincide con la versión de la
  App o si falta algún secret o variable (nombrándolos, sin valores).
- **FR-014**: El workflow MUST correr lint, tipos y tests de la App antes de compilar
  (constitución, Despliegue).
- **FR-015**: La clave MUST vivir solo en GitHub Secrets; el workflow MUST escribirla en un archivo
  temporal del runner, borrarlo al terminar (aun si falla) y no mostrar valores en el log.
- **FR-016**: La configuración pública del build (URL de la API, URL web, client ID web de
  Google, link de donaciones) MUST venir de variables de GitHub, no del repositorio.
- **FR-017**: Con un tag, el workflow MUST publicar un Release de GitHub con el APK arm64, el AAB y
  sus SHA-256; con una ejecución manual, MUST dejarlos como artifact.

### Key Entities

- **Clave de release**: archivo de firma del proyecto y sus contraseñas. Vive solo en la máquina
  de quien publica (y en su copia de seguridad), nunca en el repositorio.
- **Binario de release**: AAB o APK por arquitectura, con versión visible y número de versión
  interno.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: VirusTotal informa 0 detecciones para el binario nuevo, o cada detección restante
  tiene un reporte de falso positivo enviado.
- **SC-002**: El APK para arm64 pesa al menos un 50 % menos que el APK universal actual (~100 MB).
- **SC-003**: La App instalada pide 0 permisos fuera de los que usa (ninguno de los tres
  bloqueados en FR-005).
- **SC-004**: El 100 % de los flujos de la User Story 3 funcionan en el release, incluido el login
  con Google.
- **SC-005**: Una persona con la clave genera un release firmado siguiendo solo el README.
- **SC-006**: 0 archivos versionados contienen la clave o sus contraseñas.
- **SC-007**: Desde el push del tag, el Release con APK y AAB está disponible en 30 minutos o menos.
- **SC-008**: 0 valores de secrets aparecen en los logs del workflow.

## Assumptions

- La distribución inicial es directa (APK); publicar en Google Play queda fuera de alcance, pero
  el AAB queda listo para hacerlo.
- El release se genera con Gradle, localmente o en GitHub Actions (User Story 4); usar EAS Build
  es opcional y no se requiere.
- El repositorio es público, así que los Releases (y el APK) se pueden descargar sin cuenta; los
  datos del build que quedan dentro del APK (URLs, client ID web) no son secretos.
- El análisis en VirusTotal sigue siendo manual (no se suma una API key al workflow).
- La App hoy solo necesita Internet (y vibración para la respuesta táctil); si una feature futura
  necesita otro permiso, se agrega de forma explícita.
- iOS queda fuera de alcance.
