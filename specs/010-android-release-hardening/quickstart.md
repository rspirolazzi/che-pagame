# Quickstart: validar el build de release de Android

Requisitos: JDK 17, Android SDK (`ANDROID_HOME`), un teléfono Android con depuración USB o la
posibilidad de instalar APKs. Todos los comandos en `mobile/` salvo que se indique.

## 1. Crear la clave (una sola vez, fuera del repositorio)

```bash
keytool -genkeypair -v -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias chepagame-upload -keystore ~/keys/chepagame-upload.jks
```

`keytool` pide las contraseñas por teclado: no van en la línea de comandos ni en el historial.
Guardar una copia de seguridad del `.jks` y de las contraseñas en un lugar seguro (sin la clave
no se pueden publicar actualizaciones).

## 2. Configurar `mobile/.env`

Completar las cuatro variables `ANDROID_UPLOAD_*` (ver [contracts/release-build.md](contracts/release-build.md)).

## 3. Escenarios

| # | Escenario | Pasos | Resultado esperado |
|---|---|---|---|
| 1 | Release sin clave falla (FR-003) | Comentar `ANDROID_UPLOAD_STORE_PASSWORD`, `npx expo prebuild --platform android --clean`, `cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a` | Falla con el mensaje del contrato, nombrando la variable faltante, sin mostrar valores |
| 2 | Debug sin clave sigue andando (FR-004) | Con la variable aún comentada, `npx expo run:android` | La App de desarrollo abre |
| 3 | Release firmado (FR-001) | Restaurar la variable y repetir el build del escenario 1 | Se genera `app-release.apk`; `apksigner verify --print-certs` muestra el certificado propio, no `CN=Android Debug` |
| 4 | Tamaño (SC-002) | Ver el tamaño de `app-release.apk` | Al menos 50 % menos que ~100 MB |
| 5 | Permisos (FR-005, SC-003) | `aapt2 dump permissions app/build/outputs/apk/release/app-release.apk` e instalar y revisar Ajustes → Apps → ChePagame → Permisos | Sin `SYSTEM_ALERT_WINDOW` ni almacenamiento |
| 6 | Google Sign-In (Edge Case) | `./gradlew signingReport`, registrar el SHA-1 release en un cliente OAuth Android (`com.chepagame.app`) de Google Cloud, desinstalar la App vieja e instalar el APK | El login con Google funciona |
| 7 | Flujos con R8 (User Story 3, SC-004) | En el APK: login email y Google, crear cuenta, invitar, cargar/editar/eliminar gasto, saldos, marcar pagado, exportar, perfil (idioma y tema), cerrar sesión | Todo funciona igual que en desarrollo |
| 8 | AAB (FR-008) | `./gradlew bundleRelease` | Se genera `app-release.aab` firmado |
| 9 | versionCode (FR-009) | `aapt2 dump badging app-release.apk \| grep version` | `versionCode='10000' versionName='1.0.0'` (o el de la versión actual) |
| 10 | VirusTotal (SC-001) | Subir el APK a virustotal.com | 0 detecciones, o falso positivo reportado al proveedor con el SHA-256 |
| 11 | Repo limpio (SC-006) | `git status` y `git grep -n "ANDROID_UPLOAD_STORE_PASSWORD="` | Solo aparece la línea vacía de `.env.example`; ningún `.jks` en el repo |
| 12 | Workflow manual (US4) | Cargar secrets y variables ([contrato](contracts/release-build.md#build-en-github-user-story-4)); Actions → "Android release" → Run workflow | Termina verde; el artifact tiene el APK y el AAB; `apksigner` muestra el certificado propio |
| 13 | Release por tag (US4, SC-007) | `git tag mobile-v1.0.0` (igual a `version`) y `git push origin mobile-v1.0.0` | En ≤ 30 min hay un Release con APK, AAB y SHA-256 |
| 14 | Protecciones (FR-013, SC-008) | Pushear un tag que no coincide (ej. `mobile-v9.9.9`) y revisar el log de un run correcto | Falla antes de compilar nombrando tag y versión; ningún log muestra valores de secrets |

## 4. Pruebas automáticas

```bash
npm test -- withReleaseSigning appConfig
```

Cubren la transformación del `build.gradle`, las propiedades de Gradle, los permisos bloqueados y
`versionCodeFrom`.
