# Contract: build de release de Android

Interfaz entre quien publica y el proyecto. Todos los comandos se ejecutan en `mobile/`.

## Configuración (en `mobile/.env`, nunca commiteada)

```dotenv
ANDROID_UPLOAD_STORE_FILE=/ruta/absoluta/fuera/del/repo/chepagame-upload.jks
ANDROID_UPLOAD_STORE_PASSWORD=
ANDROID_UPLOAD_KEY_ALIAS=chepagame-upload
ANDROID_UPLOAD_KEY_PASSWORD=
```

`.env.example` (raíz, sección Mobile) lista las cuatro variables vacías. Las variables de entorno
del proceso tienen prioridad sobre `mobile/.env`.

## Comandos

| Objetivo | Comando | Salida |
|---|---|---|
| Regenerar el proyecto nativo | `npx expo prebuild --platform android --clean` | `android/` con el plugin aplicado |
| APK para teléfonos (arm64) | `cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a` | `android/app/build/outputs/apk/release/app-release.apk` |
| AAB para Google Play | `cd android && ./gradlew bundleRelease` | `android/app/build/outputs/bundle/release/app-release.aab` |
| Huella SHA-1 de la clave | `cd android && ./gradlew signingReport` (variante `release`) | SHA-1 y SHA-256 |
| Build de desarrollo (sin cambios) | `npx expo run:android` | funciona sin la clave de release |

## Garantías

1. Sin las cuatro variables (o sin el archivo), `assembleRelease` y `bundleRelease` fallan con:
   `Release signing is not configured. Missing: <NOMBRES>. See README "Android release build".`
   El mensaje nunca incluye valores.
2. El binario de release está firmado con la clave configurada (verificable con
   `apksigner verify --print-certs`), nunca con `CN=Android Debug`.
3. Permisos del manifest final: `INTERNET`, `VIBRATE` y los internos que agrega el sistema de
   build (`ACCESS_NETWORK_STATE` si alguna librería lo pide,
   `com.chepagame.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`). Nunca
   `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `USE_BIOMETRIC` ni
   `USE_FINGERPRINT`.
4. R8 y shrink de recursos activos en release.
5. `versionCode` = `versionCodeFrom(version)`.

## Build en GitHub (User Story 4)

Workflow: `.github/workflows/release-android.yml`.

| Disparador | Resultado |
|---|---|
| Push de un tag `mobile-v<version>` (igual a `version` de `mobile/app.config.ts`) | Release `mobile-v<version>` con `chepagame-<version>-arm64.apk`, `chepagame-<version>.aab` y sus SHA-256 en las notas |
| `workflow_dispatch` (Actions → Run workflow) | Artifact `chepagame-android-<version>` con el APK y el AAB; sin Release |

**Secrets** (Settings → Secrets and variables → Actions → Secrets):

| Nombre | Contenido |
|---|---|
| `ANDROID_UPLOAD_KEYSTORE_BASE64` | el `.jks` codificado en base64 |
| `ANDROID_UPLOAD_STORE_PASSWORD` | contraseña del keystore |
| `ANDROID_UPLOAD_KEY_ALIAS` | alias de la clave |
| `ANDROID_UPLOAD_KEY_PASSWORD` | contraseña de la clave |

**Variables** (Settings → Secrets and variables → Actions → Variables; no son secretas, quedan en
el APK):

| Nombre | Ejemplo | Requerida |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | `https://api.chepagame.com.ar/v1` | sí |
| `EXPO_PUBLIC_WEB_BASE_URL` | `https://chepagame.com.ar` | sí |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | client ID **web** de Google | sí |
| `EXPO_PUBLIC_DONATION_URL` | link de donaciones (vacío para builds de tiendas) | no |

**Garantías adicionales**

6. Sin un secret o variable requerida, el job `build` falla en "Check configuration" con
   `Missing GitHub secret or variable: <NOMBRE>`.
7. Con un tag distinto de `mobile-v<version>`, falla con
   `Tag <tag> does not match the App version <version>` antes de compilar.
8. El keystore temporal se borra al final del job aunque falle un paso.
