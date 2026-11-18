# Data Model: Build de release de Android confiable

No hay datos de usuario ni cambios en el backend. Las "entidades" son configuración de build.

## Release signing config

| Campo | Origen | Regla |
|---|---|---|
| `ANDROID_UPLOAD_STORE_FILE` | variable de entorno, si no `mobile/.env` | ruta absoluta a un `.jks` existente, fuera del repositorio |
| `ANDROID_UPLOAD_STORE_PASSWORD` | idem | no vacía; nunca se imprime |
| `ANDROID_UPLOAD_KEY_ALIAS` | idem | no vacío |
| `ANDROID_UPLOAD_KEY_PASSWORD` | idem | no vacía; nunca se imprime |

- **Estado listo**: las cuatro presentes y el archivo existe → `signingConfigs.release`.
- **Estado incompleto**: falta alguna → los builds debug funcionan; cualquier tarea de
  empaquetado release falla con un mensaje que nombra solo las variables faltantes.

## Release binary

| Campo | Origen | Regla |
|---|---|---|
| `versionName` | `version` de `app.config.ts` | semver `MAJOR.MINOR.PATCH`, MINOR y PATCH < 100 |
| `versionCode` | `versionCodeFrom(version)` | `MAJOR*10000 + MINOR*100 + PATCH`; crece con cada versión |
| formato | comando de Gradle | AAB (todas las ABI) o APK de una ABI (`arm64-v8a` por defecto) |
| firma | release signing config | nunca la clave debug |
| permisos | manifest final | solo los que usa la App (ver contrato) |
