# Implementation Plan: Build de release de Android confiable

**Branch**: `010-android-release-hardening` | **Date**: 2026-11-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/010-android-release-hardening/spec.md`

## Summary

El APK de release hoy se firma con la clave debug, no reduce código, incluye cuatro ABIs (~100 MB)
y declara permisos que no usa; VirusTotal lo marcó como PUP. Como `mobile/android/` se regenera con
`expo prebuild` y no se versiona, todo se resuelve desde la configuración de Expo:

- un **config plugin local** (`mobile/plugins/withReleaseSigning.js`) que inyecta una firma de
  release leída en tiempo de build de variables de entorno o `mobile/.env`, falla los builds
  release sin clave (sin tocar los debug) y activa R8 y el shrink de recursos;
- `android.blockedPermissions` para `SYSTEM_ALERT_WINDOW` y el almacenamiento externo;
- `versionCode` derivado de `version`;
- APK de una sola ABI (`arm64-v8a`) y AAB, con un paso a paso en el README que incluye la huella
  SHA-1 para Google Sign-In y la verificación en VirusTotal.

Sin dependencias nuevas ni cambios en backend o web.

**User Story 4** (agregada después): un workflow de GitHub Actions compila, firma y publica el
APK y el AAB en un Release al pushear un tag `mobile-v<versión>` (ver [research.md](research.md)
R10 y el contrato).

## Technical Context

**Language/Version**: TypeScript ~6.0 (`app.config.ts`), JavaScript CommonJS (plugin; `app.config.ts`
no puede importar módulos TS), Groovy (fragmento inyectado en `build.gradle`), JDK 17

**Primary Dependencies**: Expo SDK ~56 (`expo/config-plugins`: `withAppBuildGradle`,
`withGradleProperties`), React Native 0.85, Gradle/AGP del template de Expo

**Storage**: N/A (configuración de build; secretos solo en `mobile/.env` o variables de entorno)

**Testing**: Jest (`jest-expo`) en `mobile/src/__tests__/config/`; validación manual con el
quickstart (build, `apksigner`, `aapt2`, VirusTotal)

**Target Platform**: Android (minSdk/targetSdk del template de Expo 56); iOS fuera de alcance

**Project Type**: mobile-app (parte de un monorepo con backend y web)

**Performance Goals**: APK arm64 ≤ 50 MB (SC-002: ≥ 50 % menos que ~100 MB)

**Constraints**: ningún secreto en archivos versionados ni en archivos generados; `prebuild
--clean` debe reproducir todo; los builds debug no deben requerir la clave

**Scale/Scope**: 1 plugin (~80 líneas), cambios en `app.config.ts`, `.env.example` y README,
2 archivos de test

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Regla | Cumplimiento |
|---|---|
| Builds Móviles de Release: firma con keystore propia fuera del repo, nunca debug | ✅ R1–R3: firma desde `.env`/entorno; sin clave el release falla |
| Builds Móviles de Release: solo permisos usados, bloqueados en `app.config.ts` | ✅ R4: `blockedPermissions` |
| Builds Móviles de Release (SHOULD): R8, shrink, AAB o APK por ABI | ✅ R5, R6 |
| Builds Móviles de Release (SHOULD): verificar con VirusTotal y reportar falsos positivos | ✅ R9, quickstart escenario 10 |
| Seguridad y Datos / secretos solo en `.env` o GitHub Secrets | ✅ Variables sin prefijo `EXPO_PUBLIC_`, nunca impresas; `.env.example` vacío |
| I. Acceso Directo y Multiplataforma (Google Sign-In en Mobile) | ✅ R8: SHA-1 release registrado; escenario 6 |
| V. Strict English Rule | ✅ Código, comentarios y mensajes de Gradle en inglés; docs del usuario en español |
| VII. Test-First para lógica | ✅ Tests de la transformación del `build.gradle` y de `versionCodeFrom` antes del código |
| VIII. Simplicidad | ✅ Sin `expo-build-properties`, sin EAS, sin `splits` de ABI |
| Quality gates (lint, tipos, tests) | ✅ `npm run lint`, `npx tsc --noEmit`, `npm test` en `mobile/` |

Re-check post-design: sin violaciones. Complexity Tracking vacío.

## Project Structure

### Documentation (this feature)

```text
specs/010-android-release-hardening/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── release-build.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
mobile/
├── app.config.ts                      # blockedPermissions, versionCode, plugin registration
├── plugins/
│   ├── withReleaseSigning.js          # NEW: signing block + gradle properties (pure helpers exported)
│   └── versionCode.js                 # NEW: versionCodeFrom(version)
└── src/__tests__/config/
    ├── withReleaseSigning.test.ts     # NEW: build.gradle transform, gradle properties, missing anchor
    └── appConfig.test.ts              # NEW: blocked permissions, versionCodeFrom, plugin registered
.env.example                           # Mobile section: four empty ANDROID_UPLOAD_* variables
.github/workflows/release-android.yml  # NEW (US4): verify + build/sign + GitHub Release on mobile-v* tags
README.md                              # "Android release build" step by step
```

**Structure Decision**: todo vive en `mobile/` (config de Expo + un plugin local) porque
`mobile/android/` es generado e ignorado por git. El plugin exporta funciones puras
(`applyReleaseSigning(buildGradle)`, `setReleaseGradleProperties(props)`) para testearlas sin
correr `prebuild`; si el ancla del template de Expo cambia en una actualización de SDK, la
transformación lanza un error explícito en lugar de dejar la firma debug.

## Implementation Notes

- **Ancla**: dentro de `buildTypes { release { ... } }`, reemplazar
  `signingConfig signingConfigs.debug` por `signingConfig signingConfigs.release` y agregar el
  bloque `release` en `signingConfigs`. La función es idempotente (no duplica si ya se aplicó).
- **Lectura de `.env`** en Groovy: `rootProject.file("../.env")`, líneas `KEY=VALUE`, ignora
  vacías y `#`; `System.getenv(key)` tiene prioridad.
- **Error**: guardar la lista de variables faltantes y lanzar `GradleException` en
  `gradle.taskGraph.whenReady` si alguna tarea se llama `packageRelease` o `bundleRelease`
  (cubre `assembleRelease` y `expo run:android --variant release`).
- **`versionCodeFrom`**: en `mobile/plugins/versionCode.js` (JS, para que `app.config.ts` lo
  importe); lanza si la versión no es semver o MINOR/PATCH ≥ 100.

## Complexity Tracking

Sin violaciones.
