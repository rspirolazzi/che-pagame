# Data Model: Identidad visual y diseño de la App Mobile

**Feature**: `006-mobile-visual-identity` | **Date**: 2026-11-12

No hay datos de usuario nuevos, ni colecciones, ni cambios en la API: la preferencia de tema
(`preferences.theme`: `light | dark | system`) ya existe desde la feature 001. El modelo de esta
feature es la estructura de la identidad visual en `design/tokens.json`.

## Tokens (`design/tokens.json`)

```text
Tokens
├── version          number   Versión del formato (1). Cambia solo si cambia la estructura.
├── color
│   ├── light        ColorSet
│   └── dark         ColorSet
├── contrastPairs    ContrastPair[]
├── typography       Typography
├── spacing          Record<SpacingName, number>
├── radius           Record<RadiusName, number>
└── size             { touchTarget: number }
```

### ColorSet

Los mismos 14 roles en `light` y en `dark` (el generador falla si falta alguno o sobra).

| Rol (clave) | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `primary` | `#0B6FA8` | `#6CC4F2` | Acción principal, pestaña y destino activo, foco |
| `onPrimary` | `#FFFFFF` | `#062233` | Texto e íconos sobre `primary` |
| `accent` | `#F2B31B` | `#F6C343` | Solo fondo de destacados ("Sugerido") con `onAccent` encima; nunca color de texto (FR-017) |
| `onAccent` | `#2A1E00` | `#2A1E00` | Texto sobre `accent` |
| `positive` | `#1C7A4A` | `#5FD39A` | "Te deben", "Le deben" |
| `negative` | `#B3361F` | `#FF8A73` | "Debés", "Debe", errores y acciones destructivas |
| `warning` | `#8A5A00` | `#F2C35B` | "Pendiente de asignación" |
| `background` | `#F3F7FA` | `#0D1720` | Fondo de pantalla |
| `surface` | `#FFFFFF` | `#16232F` | Tarjetas, listas, barra inferior |
| `text` | `#13283A` | `#E6EEF4` | Texto principal |
| `textMuted` | `#4F6475` | `#9CB0C0` | Fechas, detalles, estados vacíos |
| `border` | `#D3E0EA` | `#2A3B4A` | Separadores y bordes decorativos |
| `controlBorder` | `#748899` | `#647A8C` | Bordes de campos y controles (≥ 3:1) |
| `scrim` | `#13283A` | `#000000` | Fondo detrás de diálogos (se usa con opacidad) |

Validación: cada valor es `#RRGGBB` en mayúsculas.

### ContrastPair

| Campo | Tipo | Regla |
| --- | --- | --- |
| `foreground` | rol de `ColorSet` | Debe existir |
| `background` | rol de `ColorSet` | Debe existir |
| `minimum` | `4.5` o `3` | 4,5 para texto; 3 para controles, foco e íconos informativos |

Pares declarados (se evalúan en `light` y en `dark`):

| Primer plano | Fondo | Mínimo |
| --- | --- | --- |
| `text` | `background`, `surface` | 4,5 |
| `textMuted` | `background`, `surface` | 4,5 |
| `primary` | `background`, `surface` | 4,5 |
| `onPrimary` | `primary` | 4,5 |
| `onAccent` | `accent` | 4,5 |
| `positive`, `negative`, `warning` | `background`, `surface` | 4,5 |
| `controlBorder` | `background`, `surface` | 3 |

### Typography

| Campo | Tipo | Regla |
| --- | --- | --- |
| `brandFamily` | string | Nombre de la familia elegida en las maquetas; sus archivos están en `mobile/assets/fonts/` |
| `brandWeights` | `{ semibold: string, bold: string }` | Nombre de archivo de cada peso |
| `scale` | `Record<Level, { size, lineHeight, weight, family }>` | `family`: `brand` o `system` |

Niveles (`Level`): `display`, `headline`, `title`, `amountLarge`, `amount`, `body`, `bodySmall`,
`label`. `display`, `headline`, `title` y los dos de importe usan `brand`; el resto, `system`. Los
de importe agregan cifras tabulares. Los tamaños son en dp/px y respetan el tamaño de texto del
sistema (no se escalan a mano).

### Spacing y Radius

- `spacing`: `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 24`, `xxl 32` (múltiplos de 4).
- `radius`: `sm 8` (campos, chips), `md 14` (tarjetas), `lg 22` (hojas y diálogos), `full 999`
  (píldoras y botones).
- `size`: `touchTarget 48` (alto y área táctil mínimos de botones, destinos de la barra y botones
  de ícono, FR-018).

## Salidas generadas (commiteadas, no se editan a mano)

| Archivo | Contenido |
| --- | --- |
| `mobile/src/theme/tokens.generated.ts` | `export const tokens = {...} as const` con todo lo anterior y un encabezado "generated" |
| `web/src/styles/tokens.generated.css` | Variables `--color-*`, `--space-*`, `--radius-*`, `--font-*` en `:root` y en `prefers-color-scheme: dark` y `[data-theme]`, con el mismo patrón que `globals.css`. No se importa hasta la 007 |

## Tema de la App (`mobile/src/theme/index.ts`)

```text
AppTheme = MD3Theme & {
  custom: { positive, negative, warning, accent, onAccent, border, controlBorder,
            spacing, radius, typography (amount styles) }
}
lightTheme, darkTheme: AppTheme      (armados desde tokens.generated.ts)
useAppTheme(preference): AppTheme    (igual que hoy: light | dark | system)
useAppColors(): AppTheme["custom"]   (para componentes propios)
```

## Logo y recursos

| Recurso | Origen | Salidas |
| --- | --- | --- |
| Símbolo y logotipo | `design/logo/symbol.svg`, `design/logo/wordmark-light.svg`, `design/logo/wordmark-dark.svg` | `mobile/assets/images/logo-light@1x..3x.png`, `logo-dark@1x..3x.png` |
| Ícono de App | `design/logo/symbol.svg` | `icon.png` 1024×1024; `android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png` 432×432; `splash-icon.png` |

Todos los PNG los genera `design/build-icons.ts`; los archivos de la plantilla de Expo que no se
usen (`expo-badge*.png`, `expo.icon`) se borran.
