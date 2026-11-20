# Data Model: Idioma y tema desde cualquier pantalla

## Preferencia del dispositivo

| Dónde | Clave | Valores |
|---|---|---|
| Web, cookie | `NEXT_LOCALE` | `es` \| `en` |
| Web, localStorage (next-themes) | `theme` | `light` \| `dark` \| `system` |
| Web, cookie | `theme-pref` | igual que `theme`; solo para mandar el tema en el alta con Google |
| App, SecureStore | `device-preferences` | JSON `{ "language": "es"\|"en", "theme": "light"\|"dark"\|"system" }` |

## Cambios en MongoDB

- `pending_registrations`: campo nuevo `theme` (default `"system"` para documentos viejos).
- `users.preferences.theme`: sin cambios de esquema; al crear el usuario toma el `theme` recibido.
