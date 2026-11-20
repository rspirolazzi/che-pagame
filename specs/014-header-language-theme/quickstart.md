# Quickstart: validar idioma y tema desde cualquier pantalla

## Preparación

```powershell
docker compose up -d --build
```

Navegador limpio (ventana privada) para los escenarios sin sesión.

## Web

1. **Controles sin sesión**: en `/`, el encabezado muestra idioma y tema; en ancho de teléfono
   están en un menú que no tapa el logo ni "Ingresar".
2. **Idioma**: elegir inglés en `/how-it-works` → la misma página en inglés.
3. **Tema**: elegir oscuro → se aplica al instante; recargar → sin parpadeo.
4. **Persistencia**: cerrar y abrir el navegador (no privado) → se mantienen.
5. **Buscadores**: `curl -s http://localhost:3000/` sin cookies → español.
6. **Registro**: con inglés y oscuro elegidos, registrarse → el Perfil muestra inglés y oscuro.
7. **Login con preferencias del perfil**: con español y claro en el dispositivo, iniciar sesión con
   una cuenta en inglés y oscuro → se aplica inglés y oscuro.
8. **Con sesión**: cambiar el tema desde el encabezado → el Perfil muestra el mismo; otro
   navegador con la misma cuenta lo aplica.
9. **Sin conexión con sesión**: cortar la API y cambiar el idioma → se aplica y se avisa que no se
   guardó en el perfil.
10. **Cerrar sesión**: se mantienen las últimas preferencias.
11. **Teclado y lector**: los controles se operan con Tab/Enter y anuncian la opción actual.

## App

12. **Sin sesión**: en Login, "Idioma y tema" → cambiar a inglés y oscuro → se aplica.
13. **Persistencia**: cerrar y abrir la App → se mantienen.
14. **Registro y Google**: registrarse (o primer login con Google) → el Perfil muestra lo elegido.
