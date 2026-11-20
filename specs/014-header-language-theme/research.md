# Research: Idioma y tema desde cualquier pantalla

## R1. Idioma sin sesión en la Web

- **Decision**: cookie `NEXT_LOCALE` (`es`|`en`, `Path=/`, `SameSite=Lax`, 1 año y
  `HttpOnly`, porque el cliente no necesita leerla). `i18n/request.ts`: idioma de la
  sesión → cookie válida → `negotiateLocale(Accept-Language)`. La acción `setLocaleAction` escribe
  la cookie y hace `router.refresh()` para mantener la página (FR-004).
- **Rationale**: next-intl renderiza en el servidor; una cookie es lo único que el servidor ve en
  la primera petición. Los buscadores no tienen cookie → español (FR-011).
- **Alternatives considered**: prefijo de idioma en la URL (descartado en la 011).

## R2. Tema sin sesión en la Web

- **Decision**: `next-themes` ya guarda el tema en `localStorage` y su script inline lo aplica
  antes de pintar (FR-006); el control usa `setTheme`. Sin cambios en el proveedor salvo que
  `ThemeSync` solo pisa el valor local cuando hay sesión.

## R3. Con sesión

- **Decision**: el control aplica local al instante y llama a la acción de preferencias que usa el
  Perfil (`PATCH /users/me` con `preferences`); para el idioma además escribe la cookie. Si falla,
  queda aplicado localmente y se muestra un aviso (`StatusNotice` "error") (FR-007).

## R4. Login y registro

- **Decision**:
  - Login (Web): al montar con sesión, `ThemeSync` aplica el tema del perfil (ya existe) y un
    `LocaleSync` escribe la cookie con el idioma del perfil si difiere (FR-009).
  - Registro con email: `RegisterRequest` suma `theme` (`ThemeName`, default `system`); el
    formulario manda el idioma actual (`useLocale`) y el tema (`useTheme().theme`); se guardan en
    `pending_registrations` y se usan al crear el usuario (FR-008).
  - Google: `GoogleLoginRequest` suma `language` y `theme` opcionales; solo se usan si el login
    crea la cuenta. La Web los pasa desde el callback de Auth.js (cookie + cookie de tema
    `theme-pref` escrita por el control); la App desde `useDevicePreferences`.
- **Rationale**: SC-004 sin endpoints nuevos.

## R5. App

- **Decision**: `useDevicePreferences` lee/escribe `{language, theme}` en `expo-secure-store`
  (clave `device-preferences`). Al iniciar la App: idioma = perfil ?? dispositivo ?? idioma del
  sistema; tema = perfil ?? dispositivo ?? `system`. Las pantallas sin sesión tienen un
  `IconButton` "Idioma y tema" en la esquina que abre `PreferenceSheet` (`Portal` + `Dialog` con
  dos `SegmentedButtons`). Al iniciar sesión, el perfil manda y se copia al dispositivo; al
  cerrar sesión se conserva lo último usado.
- **Rationale**: SecureStore ya es dependencia; los valores son mínimos. Sin AsyncStorage nuevo.

## R6. Encabezado en teléfono

- **Decision**: en anchos chicos `PreferenceControls` se muestra como un botón con ícono (globo +
  medio sol) que abre un menú (`CompactMenu` existente) con los dos grupos de opciones
  (`role="menuitemradio"`, `aria-checked`). En escritorio, dos botones compactos con menú.
