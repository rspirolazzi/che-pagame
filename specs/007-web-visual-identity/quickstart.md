# Quickstart: validar la identidad visual de la Web

**Feature**: `007-web-visual-identity`

## Requisitos

- Node v22.13.0 y el stack de Docker levantado (`docker compose up -d`). Después de cambiar
  archivos de rutas o de fuentes, reiniciar el contenedor de Web: `docker restart chepagame-web`.
- Las maquetas aprobadas ([research.md](research.md) R14).
- `CONTACT_EMAIL` en el `.env` (o vacía, para probar el texto neutro).
- Un usuario con una Cuenta con saldos a favor, en contra y en cero y un gasto pendiente, y otra
  Cerrada.

## Verificaciones automáticas

Desde `web/`:

```bash
npx jest
```

```bash
npm run lint
```

```bash
npx tsc --noEmit
```

```bash
npx next build
```

Desde `mobile/` (la fuente común no cambia, pero se verifica): `npm run tokens:check`.

Los tests de la Web corren en el host, no dentro del contenedor: `tokens.test.ts` lee
`design/tokens.json`, que el contenedor de Web no monta. Si no encuentra el archivo, el test lo
dice y se saltea en lugar de fallar sin explicación.

## Escenarios manuales

1. **Sin sesión, escritorio**: recorrer Inicio, Cómo funciona, Quiénes somos, Contacto,
   Privacidad, Términos, login, registro y los ingresos con código. Header público con logotipo,
   footer rediseñado, todo parecido a las maquetas.
2. **Inicio**: logotipo, slogan, "Empezar", tres beneficios, vistazo de saldos con la etiqueta
   "Ejemplo" y link a "Cómo funciona". Con sesión, el botón dice "Ir a mis Cuentas".
3. **Con sesión, escritorio**: barra lateral con Inicio, Cuentas, Perfil, "Más" y Salir; el activo
   marcado. Recorrer Dashboard, Mis Cuentas, crear Cuenta, configuración, invitar y unirse, la
   Cuenta (Gastos y Saldos en dos columnas), detalle, formulario e historial de gasto, reembolsos
   y Perfil. Las páginas informativas siguen alcanzables.
4. **Tema**: con Claro, Oscuro y Según el dispositivo en el Perfil (y el sistema en el modo
   contrario), cada página usa la paleta correcta y no parpadea al recargar.
5. **Saldos sin color**: con un filtro de escala de grises del navegador, se distinguen a favor,
   en contra, al día y pendientes en el Dashboard y Saldos.
6. **Celular (375px y 320px)**: sin desplazamiento horizontal; el menú compacto abre y cierra con
   el botón, con Escape y al elegir un destino; los botones se tocan cómodos.
7. **Texto al 200% y zoom al 400%**: nada se corta ni se superpone; todo pasa a una columna.
8. **Solo teclado**: "Saltar al contenido", recorrer el menú y una página, cargar un gasto y
   registrar un reembolso; el foco siempre visible; los diálogos se cierran con Escape.
9. **Contacto**: el email se ve, "Copiar" lo copia y el link abre el cliente de correo; sin
   `CONTACT_EMAIL`, el texto neutro.
10. **Ícono**: la pestaña del navegador muestra el ícono "Che"; "Agregar a la pantalla de
    inicio" en el celular usa el ícono y el nombre ChePagame.
11. **Comportamiento igual**: cargar y editar un gasto, registrar un reembolso desde una
    sugerencia, exportar, invitar, cambiar datos del Perfil y cerrar sesión: todo como antes.
