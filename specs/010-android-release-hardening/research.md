# Research: Build de release de Android confiable

## R1. Dónde configurar la firma si `mobile/android/` no se versiona

- **Decision**: un config plugin local, `mobile/plugins/withReleaseSigning.js`, registrado en
  `mobile/app.config.ts`. En cada `expo prebuild` reescribe el bloque `release` de
  `android/app/build.gradle` para que use un `signingConfigs.release` cuyos valores se leen **al
  compilar** de variables de entorno o, si no están, de `mobile/.env`. El plugin nunca escribe
  valores en archivos generados: solo los nombres de las variables.
- **Rationale**: `mobile/android/` está en `.gitignore` y se regenera con `prebuild --clean`;
  cualquier cambio a mano se pierde (FR-006 pide lo mismo para los permisos). La regla del proyecto
  es "toda credencial en `.env`", y Gradle no lee `.env` por sí solo, así que el bloque inyectado
  lo parsea (líneas `CLAVE=valor`, ignora comentarios). Las variables de entorno ganan, para poder
  usar el mismo build en una CI futura.
- **Alternatives considered**:
  - `~/.gradle/gradle.properties` (lo que sugiere la documentación de React Native): funciona,
    pero rompe la convención del proyecto de tener todo en `.env`.
  - EAS Build con credenciales administradas por Expo: agrega una dependencia de servicio externo
    y la cuenta de EAS; el usuario quiere poder compilar localmente (Assumptions de la spec).
  - Commitear `android/`: contradice el flujo actual (prebuild) y duplica la configuración.

## R2. Variables de la clave

- **Decision**: cuatro variables en `mobile/.env` (documentadas vacías en `.env.example`, sección
  Mobile): `ANDROID_UPLOAD_STORE_FILE` (ruta absoluta al `.jks`, fuera del repo),
  `ANDROID_UPLOAD_STORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD`.
- **Rationale**: no empiezan con `EXPO_PUBLIC_`, así que Expo nunca las incluye en el bundle de
  JavaScript. Se llaman "upload key" porque, si un día se publica en Google Play con Play App
  Signing, esta es la clave de subida; para APK directo es la clave de firma.
- **Alternatives considered**: guardar el `.jks` dentro de `mobile/` ignorado por git; se descartó
  porque un `git add -f` o una copia del proyecto lo expone. `*.jks` igual ya está en
  `mobile/.gitignore` como red de seguridad.

## R3. Fallar sin clave en lugar de firmar con debug (FR-003, FR-004)

- **Decision**: el bloque inyectado define `signingConfigs.release` solo si están las cuatro
  variables y el archivo existe. Si falta algo, registra un error que se lanza en
  `gradle.taskGraph.whenReady` únicamente cuando el grafo incluye una tarea de empaquetado
  release (`packageRelease`, `bundleRelease`), con un mensaje que nombra las variables faltantes
  (nunca sus valores). Los builds debug no se tocan.
- **Rationale**: lanzar al configurar el proyecto rompería también `expo run:android` (debug).
- **Alternatives considered**: dejar `signingConfigs.debug` como respaldo (lo que hace hoy):
  justamente lo que la constitución 4.8.0 prohíbe.

## R4. Permisos (FR-005, FR-006)

- **Decision**: `android.blockedPermissions` en `app.config.ts` con
  `android.permission.SYSTEM_ALERT_WINDOW`, `android.permission.READ_EXTERNAL_STORAGE` y
  `android.permission.WRITE_EXTERNAL_STORAGE`, más `android.permission.USE_BIOMETRIC` y
  `android.permission.USE_FINGERPRINT` (los agrega `expo-secure-store` para `requireAuthentication`,
  que la App no usa; se detectaron en el primer APK de prueba). Expo agrega `tools:node="remove"` al manifest, que
  también los quita del manifest final aunque los pida una librería.
- **Rationale**: es el mecanismo oficial de Expo y sobrevive a `prebuild`. La App solo usa
  `INTERNET` (API) y `VIBRATE` (respuesta táctil); exportar datos usa el menú de compartir del
  sistema, que no necesita permisos de almacenamiento en Android 10+.
- **Note**: `SYSTEM_ALERT_WINDOW` lo usa el menú de desarrollo en Android viejos; en el dev client
  sobre Android 8+ no hace falta, así que se bloquea en todas las variantes por simplicidad.
- **Verification**: `aapt2 dump permissions app-release.apk` (o la pantalla de permisos del
  teléfono) lista solo `INTERNET`, `VIBRATE`, `ACCESS_NETWORK_STATE` y el interno
  `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (verificado en el manifest release combinado).

## R5. Reducir código y recursos (FR-007)

- **Decision**: el mismo plugin fija en `gradle.properties` (con `withGradleProperties`)
  `android.enableMinifyInReleaseBuilds=true` y `android.enableShrinkResourcesInReleaseBuilds=true`,
  que el `build.gradle` generado por Expo ya lee.
- **Rationale**: evita sumar `expo-build-properties` como dependencia (Principio VIII) para dos
  propiedades. Expo, React Native, Reanimated y Google Sign-In traen sus reglas de R8.
- **Risk**: código eliminado por reflexión. Mitigación: el quickstart recorre todos los flujos en
  el release (User Story 3) y, si algo falla, se agrega una regla puntual a `extraProguardRules`
  desde el plugin.

## R6. AAB y APK por arquitectura (FR-008)

- **Decision**: AAB con `./gradlew bundleRelease` (todas las arquitecturas; Google Play entrega
  la que corresponde). APK directo con
  `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a`, que compila solo arm64.
- **Rationale**: arm64 cubre prácticamente todos los teléfonos actuales; no hace falta
  configurar `splits` de ABI ni mantener cuatro APKs. Quien necesite otro (teléfono de 32 bits)
  repite el comando con `armeabi-v7a`.
- **Expected size**: el APK universal actual pesa ~100 MB; un solo ABI con R8 y shrink debería
  quedar por debajo de 40 MB (SC-002 pide ≥ 50 % menos).

## R7. Número de versión interno (FR-009)

- **Decision**: `android.versionCode` se calcula en `app.config.ts` desde `version`
  (`major * 10000 + minor * 100 + patch`, ej. `1.0.0` → `10000`, `1.2.3` → `10203`), en una
  función pura `versionCodeFrom(version)` con su test.
- **Rationale**: una sola fuente de verdad; subir la versión visible sube el código interno.
  Valida que minor y patch sean < 100.
- **Alternatives considered**: un `versionCode` manual (se olvida); `GITHUB_RUN_NUMBER` (no hay
  CI de mobile).

## R8. Google Sign-In con la clave nueva

- **Decision**: el paso a paso obtiene la huella con
  `keytool -list -v -keystore <ruta> -alias <alias>` (o `./gradlew signingReport`) y la registra
  en un cliente OAuth **Android** de Google Cloud con el paquete `com.chepagame.app`. El cliente
  Web (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`) no cambia.
- **Rationale**: Google valida paquete + SHA-1 del binario; sin el registro el login falla con
  `DEVELOPER_ERROR`. El cliente de debug existente puede quedar para los builds de desarrollo.

## R9. Verificación en VirusTotal (FR-011)

- **Decision**: paso manual del quickstart: subir el APK arm64 a virustotal.com y, si queda una
  detección, reportarla al proveedor (AhnLab: formulario de falso positivo en su sitio, adjuntando
  el hash SHA-256). No se automatiza (necesitaría una API key de VirusTotal en CI).
- **Rationale**: la constitución lo pide como SHOULD; automatizarlo no compensa sin CI de mobile.

## R10. Build en GitHub Actions (User Story 4)

- **Decision**: workflow `.github/workflows/release-android.yml` con dos jobs, como los de deploy:
  `verify` (lint, tipos, tests del mobile) y `build` (needs verify). Se dispara con tags
  `mobile-v*` y con `workflow_dispatch`. La clave viaja como secret en base64
  (`ANDROID_UPLOAD_KEYSTORE_BASE64`), se decodifica a `$RUNNER_TEMP` y se borra en un paso
  `if: always()`. Las otras tres variables `ANDROID_UPLOAD_*` se pasan como variables de entorno,
  que el plugin ya lee con prioridad sobre `mobile/.env`, así que la App no cambia.
- **Tag ↔ versión**: el workflow lee `version` con `npx expo config --type public --json` y exige
  `mobile-v<version>`; así el `versionCode` (derivado de `version`) siempre sube con cada Release.
- **Publicación**: `gh release create` (CLI preinstalada en el runner, sin acciones de terceros)
  con permiso `contents: write` solo en el job `build`. En ejecuciones manuales,
  `actions/upload-artifact`.
- **Configuración pública**: `EXPO_PUBLIC_*` desde variables de GitHub (`vars.*`); Expo las inlinea
  en el bundle al compilar.
- **Tiempo**: `actions/setup-java` con `cache: gradle` y caché de npm; se espera 20–30 min por run.
- **Alternatives considered**: EAS Build (servicio externo y cuenta), una acción de terceros para
  Releases (`gh` alcanza), compilar en cada push a `main` (decisión del usuario: solo tags).
