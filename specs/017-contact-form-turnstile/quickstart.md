# Quickstart: validar Contacto y la verificación anti-bots

## Local (desarrollo)

Con `ENVIRONMENT=development` no hace falta ninguna credencial.

```powershell
docker compose up -d --build
```

1. **Sin verificación**:
   - `/contact` y `/register` no muestran el desafío.
   - `GET /api/v1/public-config` devuelve `null`.
2. **Contacto en desarrollo**:
   - Completar y enviar: aparece "Mensaje enviado" y no llega ningún WhatsApp.
   - En los logs de la API está "contact message received", sin nombre, email ni texto.
3. **Validaciones**:
   - Un email inválido, un mensaje de menos de 10 caracteres o la casilla de consentimiento sin
     marcar muestran el error y no se envía nada.
   - El contador de caracteres frena en 2.000.
4. **Con sesión**: nombre y email vienen completados con los del perfil.
5. **Límite**: el sexto envío con el mismo email en una hora muestra el aviso de límite.
6. **App**: Perfil → "Acerca de" → Contacto. Lo mismo que los escenarios 2 a 4.
7. **Arranque en producción sin credenciales**:
   - Con `ENVIRONMENT=production` y alguna variable vacía, la API no arranca.
   - El error nombra la variable que falta, no su valor.

## Producción (usuario)

Antes del deploy, cargar en el `.env` del servidor estas variables y actualizar el contenedor:

- `CALLMEBOT_URL`, `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY`;
- `CLOUDFLARE_TURNSTILE_SECRET_KEY` y `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

En Cloudflare, el widget tiene que tener `chepagame.com.ar` como hostname permitido.

8. **Contacto Web**: enviar un mensaje. Llega el WhatsApp con nombre, email, mensaje, idioma,
   "web" y la fecha.
9. **Contacto App**: igual que el 8, y el WhatsApp dice "mobile".
10. **Registro Web**: se ve el desafío (normalmente se resuelve solo), el registro sigue y llega el
    código por email.
11. **Registro App**: igual que el 10 dentro de la App.
12. **Sin token**: un `curl` a `/api/v1/auth/register` sin `turnstileToken` responde 403
    `bot_check_failed` y no llega ningún email.
13. **CallMeBot caído**: con una API key inválida en un entorno de prueba, el formulario muestra
    el error con el email de contacto y conserva lo escrito.
14. **Privacidad**: la página menciona CallMeBot y Cloudflare Turnstile.
15. **Logs**: los logs del contenedor no tienen la API key, el teléfono ni datos de los mensajes.
