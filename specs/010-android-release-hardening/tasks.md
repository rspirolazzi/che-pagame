---

description: "Task list for feature 010: Android release hardening"
---

# Tasks: Build de release de Android confiable

**Input**: documentos de diseño en `specs/010-android-release-hardening/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/release-build.md](contracts/release-build.md),
[quickstart.md](quickstart.md)

**Tests**: incluidos para el código nuevo (Principio VII): la transformación del `build.gradle`,
las propiedades de Gradle, `versionCodeFrom` y la configuración de Expo. Se escriben primero y
tienen que fallar antes de implementar. El build real, la firma, los permisos y VirusTotal se
validan con [quickstart.md](quickstart.md).

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes).
- **[Story]**: US1 (APK que los antivirus no marcan), US2 (release sin exponer la clave),
  US3 (APK más liviano), US4 (compilar el release en GitHub).

## Convenciones

- Código, comentarios, mensajes de Gradle y commits en inglés (Principio V); la documentación
  para el usuario en el README sigue el idioma del README.
- Ningún secreto en archivos del repo ni en archivos generados: el plugin escribe solo nombres
  de variables; `.env.example` va con las variables vacías ("Builds Móviles de Release",
  constitución 4.8.0).
- `mobile/android/` es generado: nunca se edita a mano; todo cambio pasa por `app.config.ts` o
  por el plugin y se verifica con `npx expo prebuild --platform android --clean`.
- Nombres de variables: `ANDROID_UPLOAD_STORE_FILE`, `ANDROID_UPLOAD_STORE_PASSWORD`,
  `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD` ([data-model.md](data-model.md)).

---

## Phase 1: Setup

- [X] T001 Agregar a la sección Mobile de `.env.example` las cuatro variables `ANDROID_UPLOAD_*` vacías, con un comentario en inglés: ruta absoluta al `.jks` fuera del repositorio, nunca commitear valores, y que no deben llevar el prefijo `EXPO_PUBLIC_` (R2).
- [X] T002 [P] Crear `mobile/src/__tests__/fixtures/build.gradle.txt` con una copia del `mobile/android/app/build.gradle` generado hoy por Expo SDK 56 (bloques `signingConfigs { debug { ... } }` y `buildTypes { release { signingConfig signingConfigs.debug ... } }`), para testear la transformación sin correr `prebuild`. Confirmar que `src/__tests__/fixtures/` no matchea `testMatch` (solo `*.test.ts(x)`).

---

## Phase 2: Foundational (bloquea todas las historias)

**Purpose**: regenerar el proyecto nativo de forma reproducible es requisito de las tres historias.

- [X] T003 Crear `mobile/plugins/withReleaseSigning.js` (CommonJS) con el esqueleto del config plugin: `module.exports = withReleaseSigning` usando `withAppBuildGradle` y `withGradleProperties` de `expo/config-plugins`, y exportando las funciones puras `applyReleaseSigning(buildGradle)` y `setReleaseGradleProperties(properties)` (todavía sin lógica). Registrarlo en `plugins` de `mobile/app.config.ts` como `"./plugins/withReleaseSigning"`.
- [X] T004 Verificar que `cd mobile && npx expo prebuild --platform android --clean` corre con el plugin registrado y que `npm run lint` y `npx tsc --noEmit` pasan.

**Checkpoint**: el plugin se carga en cada `prebuild`; las historias pueden empezar.

---

## Phase 3: User Story 2 - Generar el release sin exponer la clave (Priority: P1) 🎯 MVP

**Goal**: el release se firma con la clave propia leída de `mobile/.env` o del entorno; sin
clave, el release falla con un mensaje claro y el debug sigue funcionando.

**Independent Test**: escenarios 1, 2, 3 y 11 de [quickstart.md](quickstart.md).

> Va antes que US1 porque la firma propia es requisito de US1 (escenario 3 de US1) y de
> publicar cualquier binario.

### Tests for User Story 2 ⚠️

- [X] T005 [US2] Escribir `mobile/src/__tests__/config/withReleaseSigning.test.ts` con casos para `applyReleaseSigning` sobre el fixture de T002: (a) agrega `signingConfigs.release` que lee las cuatro variables `ANDROID_UPLOAD_*` de `System.getenv` y, si no están, de `rootProject.file("../.env")`; (b) el bloque `buildTypes.release` usa `signingConfigs.release` y ya no contiene `signingConfig signingConfigs.debug`, mientras `buildTypes.debug` sigue con `signingConfigs.debug`; (c) registra un `gradle.taskGraph.whenReady` que lanza `GradleException` con el texto `Release signing is not configured. Missing:` solo para tareas `packageRelease`/`bundleRelease`; (d) es idempotente (aplicarla dos veces da el mismo resultado); (e) lanza un error explícito si no encuentra el ancla del template; (f) el resultado no contiene ningún valor de contraseña, solo nombres de variables. Confirmar que los tests fallan.

### Implementation for User Story 2

- [X] T006 [US2] Implementar `applyReleaseSigning` en `mobile/plugins/withReleaseSigning.js` según [research.md](research.md) R1–R3 y las Implementation Notes de [plan.md](plan.md): parser de `.env` en Groovy (líneas `KEY=VALUE`, ignora vacías y `#`, quita comillas), prioridad de `System.getenv`, `signingConfigs.release` solo si las cuatro variables están y el archivo existe, lista de faltantes y error en `whenReady` sin imprimir valores. Conectarla en `withAppBuildGradle` (solo para `language === "groovy"`). Hacer pasar T005.
- [X] T007 [US2] Validación manual (usuario): crear la clave con `keytool` fuera del repositorio y completar `mobile/.env` (quickstart secciones 1 y 2). Yo no creo la clave ni veo sus valores.
- [X] T008 [US2] Correr los escenarios 1, 2 y 3 de [quickstart.md](quickstart.md): release sin una variable falla con el mensaje del contrato; `npx expo run:android` (debug) funciona sin la clave; con la clave, `assembleRelease` genera un APK que `apksigner verify --print-certs` muestra firmado con el certificado propio (no `CN=Android Debug`).

> T008: verificado con una clave descartable de prueba (fuera del repo): sin clave el release falla con el mensaje del contrato; `assembleDebug` no la pide; con clave, `apksigner` muestra el certificado propio. Falta repetir el escenario 3 con la clave real (después de T007).

**Checkpoint**: US2 funciona sola: hay un release firmado con la clave propia.

---

## Phase 4: User Story 1 - Instalar un APK que los antivirus no marcan (Priority: P1)

**Goal**: el binario pide solo los permisos que usa, está firmado con la clave propia (US2) y
pasa VirusTotal sin detecciones o con el falso positivo reportado.

**Independent Test**: escenarios 5, 6 y 10 de [quickstart.md](quickstart.md).

### Tests for User Story 1 ⚠️

- [X] T009 [P] [US1] Escribir `mobile/src/__tests__/config/appConfig.test.ts`: evaluar el default export de `mobile/app.config.ts` con un `config` mínimo y comprobar que `android.blockedPermissions` contiene exactamente `android.permission.SYSTEM_ALERT_WINDOW`, `android.permission.READ_EXTERNAL_STORAGE`, `android.permission.WRITE_EXTERNAL_STORAGE`, `android.permission.USE_BIOMETRIC` y `android.permission.USE_FINGERPRINT`, y que `plugins` incluye `./plugins/withReleaseSigning`. Confirmar que falla.

### Implementation for User Story 1

- [X] T010 [US1] Agregar `blockedPermissions` en `android` de `mobile/app.config.ts`, con un comentario en inglés que explique por qué cada permiso no se usa (R4). Hacer pasar T009.
- [X] T011 [US1] Regenerar (`npx expo prebuild --platform android --clean`) y verificar en `mobile/android/app/src/main/AndroidManifest.xml` que los tres permisos aparecen con `tools:node="remove"`.
- [X] T012 [US1] Escenario 5 de [quickstart.md](quickstart.md): `aapt2 dump permissions` sobre el APK release lista solo `INTERNET`, `VIBRATE` y los internos del contrato (garantía 3 de [contracts/release-build.md](contracts/release-build.md)).
- [X] T013 [US1] Validación manual (usuario): escenario 6 de [quickstart.md](quickstart.md). Obtener el SHA-1 release con `./gradlew signingReport`, registrarlo en un cliente OAuth Android (`com.chepagame.app`) en Google Cloud, desinstalar la App firmada con debug, instalar el APK y probar el login con Google.
- [X] T014 [US1] Validación manual (usuario): escenario 10 de [quickstart.md](quickstart.md). Subir el APK a VirusTotal; si queda una detección, reportar el falso positivo al proveedor con el SHA-256.

> T012: el primer APK de prueba mostró además `USE_BIOMETRIC` y `USE_FINGERPRINT` (de `expo-secure-store`); se bloquearon y el manifest release combinado quedó en `INTERNET`, `VIBRATE`, `ACCESS_NETWORK_STATE` y el permiso interno.

**Checkpoint**: US1 + US2: binario firmado, con permisos mínimos y verificado.

---

## Phase 5: User Story 3 - Descargar un APK más liviano (Priority: P2)

**Goal**: R8 y shrink activos, APK de una ABI, AAB disponible y `versionCode` derivado de la
versión; todos los flujos funcionan en el release.

**Independent Test**: escenarios 4, 7, 8 y 9 de [quickstart.md](quickstart.md).

### Tests for User Story 3 ⚠️

- [X] T015 [P] [US3] Agregar a `mobile/src/__tests__/config/withReleaseSigning.test.ts` casos para `setReleaseGradleProperties`: fija `android.enableMinifyInReleaseBuilds=true` y `android.enableShrinkResourcesInReleaseBuilds=true` (reemplaza si existen con otro valor, no duplica) y no toca las demás propiedades. Confirmar que fallan.
- [X] T016 [P] [US3] Escribir `mobile/src/__tests__/config/versionCode.test.ts` para `versionCodeFrom` de `mobile/plugins/versionCode.js`: `1.0.0` → `10000`, `1.2.3` → `10203`, `2.0.0` > `1.99.99`; lanza con `1.0`, `1.0.0-beta`, `1.100.0` y `1.0.100`. Agregar a `appConfig.test.ts` que `android.versionCode === versionCodeFrom(version)`. Confirmar que fallan.

### Implementation for User Story 3

- [X] T017 [US3] Implementar `setReleaseGradleProperties` en `mobile/plugins/withReleaseSigning.js` y conectarla en `withGradleProperties` (R5). Hacer pasar T015.
- [X] T018 [US3] Crear `mobile/plugins/versionCode.js` con `versionCodeFrom(version)` (R7) e importarlo en `mobile/app.config.ts` para fijar `android.versionCode`. Hacer pasar T016.
- [X] T019 [US3] Regenerar y construir: `assembleRelease -PreactNativeArchitectures=arm64-v8a` y `bundleRelease`. Escenarios 4, 8 y 9 de [quickstart.md](quickstart.md): APK ≤ 50 MB, AAB firmado, `versionCode='10000' versionName='1.0.0'`.
- [X] T020 [US3] Escenario 7 de [quickstart.md](quickstart.md): recorrer todos los flujos en el APK release (login email y Google, cuentas, invitar, gastos, saldos, marcar pagado, exportar, perfil, cerrar sesión). Si R8 rompe algo, agregar la regla puntual en `extraProguardRules` desde el plugin, con su test, y repetir.

> T019 (parcial): APK arm64 de prueba de 36 MB (−64 %), `versionCode='10000' versionName='1.0.0'`, solo `arm64-v8a`. Falta generar el AAB (`bundleRelease`) con la clave real.

**Checkpoint**: las tres historias funcionan.

---

## Phase 5b: User Story 4 - Compilar el release en GitHub (Priority: P2)

**Goal**: un tag `mobile-v<versión>` compila, firma y publica el APK y el AAB en un Release.

**Independent Test**: escenarios 12, 13 y 14 de [quickstart.md](quickstart.md).

- [X] T026 [US4] Crear `.github/workflows/release-android.yml` según [research.md](research.md) R10 y el contrato: `on` tags `mobile-v*` + `workflow_dispatch`, `permissions: contents: read` (y `contents: write` solo en `build`), `concurrency`; job `verify` (Node desde `.nvmrc`, `npm ci`, lint, `tsc`, `npm test -- --ci` en `mobile/`); job `build` con "Check configuration" (4 secrets + 3 variables requeridas), chequeo tag ↔ `version` con `npx expo config --type public --json`, Java 17 con caché de Gradle, keystore base64 → `$RUNNER_TEMP`, `expo prebuild`, `assembleRelease -PreactNativeArchitectures=arm64-v8a`, `bundleRelease`, renombrar, SHA-256, `gh release create` (tag) o `upload-artifact` (manual), y borrar el keystore con `if: always()`.
- [X] T027 [US4] Validar el YAML (`actionlint` si está disponible; no lo está: estructura validada con un parser YAML y revisión manual) y que ningún paso imprima secrets (`set -x` prohibido, secrets solo por `env`).
- [X] T028 [P] [US4] Agregar al `README.md`, en "Android release build", la subsección "Build on GitHub": secrets y variables, cómo codificar el `.jks` en base64 sin mostrarlo (PowerShell `Set-Clipboard`), y cómo publicar (subir `version`, commit, tag `mobile-v<version>`, push del tag).
- [X] T029 [US4] Validación manual (usuario): cargar secrets y variables en GitHub y correr los escenarios 12, 13 y 14 de [quickstart.md](quickstart.md).

**Checkpoint**: las cuatro historias funcionan.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T021 [P] Agregar al `README.md` la sección "Android release build" con el paso a paso de [quickstart.md](quickstart.md) secciones 1 y 2 y la tabla de comandos de [contracts/release-build.md](contracts/release-build.md): crear y respaldar la clave, configurar `mobile/.env`, generar APK arm64 y AAB, SHA-1 en Google Cloud, desinstalar la App debug antes de instalar, y verificar en VirusTotal y reportar falsos positivos (FR-010, FR-011).
- [X] T022 Agregar en `README.md`, junto a `npx expo run:android` en la sección de desarrollo, una nota que diga que el build de desarrollo no necesita la clave de release y un link a "Android release build" (FR-004). Mismo archivo que T021: hacerlo después.
- [X] T023 Quality gates en `mobile/`: `npm run lint`, `npx tsc --noEmit`, `npm test` (suite completa) y `npx prettier --check .`.
- [X] T024 Escenario 11 de [quickstart.md](quickstart.md): `git status` sin `.jks` ni `.env`, y `git grep -n "ANDROID_UPLOAD_STORE_PASSWORD="` solo encuentra la línea vacía de `.env.example` (SC-006).
- [X] T025 Validación del usuario: recorrer los 11 escenarios de [quickstart.md](quickstart.md) y confirmar SC-001 a SC-006.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup; bloquea las historias.
- **US2 (Phase 3)**: depende de Foundational. Es el MVP.
- **US1 (Phase 4)**: T009–T011 pueden hacerse en paralelo con US2 (otro archivo y otra sección
  de `app.config.ts`); T012–T014 necesitan el APK firmado de US2 (T008).
- **US3 (Phase 5)**: T015–T018 pueden hacerse después de Foundational; T019–T020 necesitan US2.
- **US4 (Phase 5b)**: depende de US2 (firma por variables de entorno) y US3 (comandos de build); T029 necesita T007 (la clave real).
- **Polish (Phase 6)**: depende de las historias que se quieran entregar.

### Within Each User Story

- Tests primero y fallando (Principio VII), después la implementación, después la validación
  con el quickstart.
- `withReleaseSigning.js` lo tocan T006 y T017: no en paralelo.
- `app.config.ts` lo tocan T003, T010 y T018: no en paralelo.

### Parallel Opportunities

- T001 y T002.
- T009 (US1), T015 y T016 (US3) entre sí (archivos de test distintos; T015 comparte archivo con
  T005, hacerlo después de T005).
- T021 sigue a las historias; T022 después de T021 (mismo archivo).

---

## Parallel Example: tests después de Foundational

```text
Task: "T009 [US1] appConfig.test.ts: blocked permissions and plugin registered"
Task: "T016 [US3] versionCode.test.ts: versionCodeFrom cases"
```

---

## Implementation Strategy

### MVP First (User Story 2)

1. Setup y Foundational (T001–T004).
2. US2 (T005–T008): release firmado con la clave propia; sin clave, falla.
3. **Parar y validar**: con esto ya no se distribuye nada firmado con debug.

### Incremental Delivery

1. US2 → firma propia.
2. US1 → permisos mínimos, SHA-1 en Google, VirusTotal (lo que disparó la feature).
3. US3 → R8, APK arm64, AAB, versionCode.
4. US4 → release desde GitHub con un tag.
5. Polish → README, quality gates y validación final del usuario (T025).

### Notas

- Yo no creo la clave, no veo sus valores ni hago push; T007, T013, T014, T029 y T025 son del usuario.
- Commitear al cerrar cada fase solo si el usuario lo pide.
