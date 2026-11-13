# Quickstart: validar "Apoyá ChePagame"

**Feature**: `008-donation-link`

## Requisitos

- La cuenta creada en Cafecito y el link en el `.env`: `DONATION_URL=https://cafecito.app/<tu-usuario>`
  y `EXPO_PUBLIC_DONATION_URL` con el mismo valor.
- Reiniciar el contenedor de Web (`docker restart chepagame-web`) y recompilar o recargar la App
  después de cambiar el `.env`.

## Verificaciones automáticas

Desde `web/` y desde `mobile/`: `npx jest`, `npm run lint` y `npx tsc --noEmit` (en `web/`,
también `npx next build`).

## Escenarios manuales

1. **Web sin sesión**: el footer y "Quiénes somos" muestran "Apoyá ChePagame"; al tocarlo se abre
   Cafecito en una pestaña nueva.
2. **Web con sesión**: el footer y la sección del Perfil muestran el botón y abren Cafecito.
3. **Web sin link**: con `DONATION_URL` vacía (o `http://…`), el botón no aparece en ningún lado.
4. **App**: el Perfil muestra la sección; el botón abre Cafecito en el navegador del teléfono.
5. **App sin link**: con `EXPO_PUBLIC_DONATION_URL` vacía, la sección no aparece.
6. **Privacidad**: con las herramientas del navegador, ninguna página de ChePagame hace pedidos a
   Cafecito hasta tocar el botón.
7. **Identidad**: el botón se ve bien en claro y oscuro, en celular y en escritorio, y en inglés
   dice "Support ChePagame".

## Builds para las tiendas

Para un build que se publique en Google Play o el App Store, compilar con
`EXPO_PUBLIC_DONATION_URL` vacía (las variables `EXPO_PUBLIC_*` quedan incrustadas al compilar).
Cuando se agregue `eas.json`, dejarla vacía en el perfil `production`.
