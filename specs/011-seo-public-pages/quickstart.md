# Quickstart: validar SEO y páginas públicas

## Preparación

```powershell
docker compose up -d --build
```

Web en `http://localhost:3000`. Para validar con Google, usar producción después del deploy.

## Escenarios

1. **Metadatos**: en cada página pública, ver el código fuente: `<title>`, descripción,
   canónica con `https://chepagame.com.ar`, `og:*` y `twitter:*`.
2. **robots.txt**: abrir `/robots.txt` y comparar con [contracts/seo-surface.md](contracts/seo-surface.md).
3. **sitemap.xml**: abrir `/sitemap.xml`: están las 8 públicas y ninguna privada.
4. **noindex**: en `/login`, `/accounts` (con sesión), `/invite/x` y una URL inexistente, ver
   `noindex` en el código fuente; la inexistente responde 404.
5. **Idioma de buscadores**: `curl -s http://localhost:3000/faq` (sin `Accept-Language`) devuelve
   el contenido en español.
6. **FAQ**: abrir `/faq` sin sesión, abrir preguntas con teclado (Tab + Enter); hay ≥ 12.
7. **Links internos**: inicio, Cómo funciona y footer tienen link a Preguntas frecuentes.
8. **Contenido**: Cómo funciona, Quiénes somos y Contacto muestran los textos nuevos, con un solo
   título principal.
9. **Rich Results Test** (producción): `/` reconoce la aplicación y `/faq` las preguntas, sin
   errores.
10. **Lighthouse móvil** (producción): ≥ 95 SEO y ≥ 90 accesibilidad en cada página pública.
11. **WhatsApp**: compartir `https://chepagame.com.ar/faq` y ver título, descripción e imagen.
12. **App**: Perfil → "Acerca de" muestra las cuatro secciones con el mismo contenido que la Web,
    en es y en.
13. **Search Console** (usuario): agregar la propiedad y enviar el sitemap.
