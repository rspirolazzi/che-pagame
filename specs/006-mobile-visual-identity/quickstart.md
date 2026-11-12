# Quickstart: validar la identidad visual de la App Mobile

**Feature**: `006-mobile-visual-identity`

## Requisitos

- Node v22.13.0 (`export PATH="$APPDATA/nvm/v22.13.0:$PATH"` en Git Bash) y el stack de Docker
  levantado (`docker compose up -d`), como en las features anteriores.
- Las maquetas aprobadas (ver [research.md](research.md) R6) y la tipografía elegida.
- El development build recompilado, porque cambian el ícono, la pantalla de inicio y las fuentes
  embebidas: desde `mobile/`, `npx expo run:android`.
- Un usuario con al menos dos Cuentas: una con saldos a favor, en contra y en cero y un gasto
  pendiente de asignación, y otra Cerrada.

## Verificaciones automáticas

Desde `mobile/`:

```bash
npm run tokens:check
```

```bash
npx jest
```

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

Resultado esperado: todo pasa. `tokens:check` falla si alguien cambió `design/tokens.json` sin
regenerar o si un par no llega al contraste mínimo.

## Escenarios manuales

1. **Identidad en claro**: con el tema Claro en el Perfil, recorrer login, registro, Dashboard, Mis
   Cuentas, crear Cuenta, una Cuenta (Gastos y Saldos), detalle e historial de un gasto, formulario
   de gasto, formulario y lista de reembolsos, unirse a una Cuenta y Perfil. Todo usa la paleta
   clara, la tipografía de la marca en títulos e importes y se parece a las maquetas aprobadas.
2. **Identidad en oscuro**: lo mismo con el tema Oscuro; ningún texto, campo o ícono se pierde.
3. **Según el dispositivo**: con el tema Según el dispositivo y un formulario de gasto a medio
   cargar, cambiar el modo del teléfono. La App cambia de paleta en menos de 1 segundo y lo cargado
   sigue ahí.
4. **Cambio desde el Perfil**: cambiar el tema en el Perfil; toda la App cambia en el momento, sin
   reiniciar.
5. **Barra inferior**: tocar Inicio, Cuentas y Perfil; el destino activo se marca con indicador y
   texto. Entrar a una Cuenta: la barra sigue. Abrir "Nuevo gasto" y "Registrar reembolso": la barra
   no aparece. Tocar Cuentas estando dentro de una Cuenta vuelve a Mis Cuentas.
6. **Saldos sin color**: con la pantalla en escala de grises (opciones de accesibilidad del
   teléfono), mirar el Dashboard y Saldos: se distinguen a favor (+, "Te deben"), en contra (−,
   "Debés"), al día y el aviso de pendientes (ícono y "Pendiente de asignación").
7. **Comportamiento igual**: cargar y editar un gasto, registrar un reembolso desde una sugerencia,
   exportar una Cuenta, invitar con el enlace y cerrar sesión. Todo funciona como antes.
8. **Ícono y pantalla de inicio**: buscar ChePagame entre las apps (también con íconos temáticos de
   Android activados) y abrirla en modo claro y oscuro: ícono y logo propios, sin rastros de la
   plantilla de Expo.
9. **Login**: sin sesión, el login muestra logo, nombre y slogan en español; con el teléfono en
   inglés, el slogan en inglés.
10. **Texto al 150%**: con el tamaño de texto del sistema al máximo que llegue a 150%, recorrer las
    pantallas del escenario 1: nada se corta ni se superpone.
11. **Cuenta Cerrada y errores**: abrir la Cuenta Cerrada (el aviso de solo lectura se ve con ícono
    y texto) y provocar un error (por ejemplo, con el backend detenido: `docker stop
    chepagame-backend`): el mensaje usa el color de error, un ícono y explica qué pasó.
12. **Enlace de invitación**: abrir `chepagame://invite/<code>` con y sin sesión: llega a la
    invitación como antes.

## Verificaciones de la fuente común

Probado el 2026-11-12 (T015), con los cambios de prueba revertidos después:

| Caso (US4) | Resultado |
| --- | --- |
| Cambiar `primary` en `design/tokens.json` | `npm run tokens:check` marca las dos salidas como desactualizadas; `npm run tokens` las regenera y el tema de la App toma el valor nuevo sin tocar pantallas (`appTheme.test.ts` pasa con el valor nuevo). |
| Poner `textMuted` con poco contraste (`#9AA8B4`) | `npm run tokens` sale con código 1, no escribe nada y lista `textMuted on background (light) is 2.26:1, minimum 4.5:1` y el par sobre la superficie. `contrast.test.ts` protege además las salidas ya generadas si alguien las edita a mano. |
| Escribir `#ff0000` en `DashboardScreen.tsx` | `noHardcodedColors.test.ts` falla e indica `src/screens/DashboardScreen.tsx:35`. |
