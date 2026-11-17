# Research: Identidad visual y diseño de la App Mobile

**Feature**: `006-mobile-visual-identity` | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

Punto de partida relevado en el código:

- `mobile/src/theme/index.ts` arma los temas con `MD3LightTheme` y `MD3DarkTheme` de React Native
  Paper y solo cambia `primary` (`#1f6feb` y `#58a6ff`). `useAppTheme(preference)` ya resuelve
  Claro, Oscuro y Según el dispositivo con `useColorScheme()`.
- Hay dos colores escritos a mano fuera del tema: `textColor="#c62828"` en
  `AccountDetailScreen.tsx` y en `ExpenseDetailScreen.tsx` (botones de eliminar).
- Los saldos no tienen color: `BalanceList` y `BalanceSummary` muestran solo texto ("Te deben",
  "Debés", "Al día").
- La navegación es un `Stack` dentro de `app/(app)/_layout.tsx`; el Dashboard enlaza a Cuentas y al
  Perfil.
- El ícono, el ícono adaptativo y la pantalla de inicio son los de la plantilla de Expo
  (`app.config.ts`: `backgroundColor: "#E6F4FE"` y `"#208AEF"`).
- `expo-font`, `expo-splash-screen`, `expo-status-bar`, `expo-system-ui` y `@expo/vector-icons` ya
  están instalados. Versiones: expo-router 56.2.22, react-native-paper 5.15.4, expo-font 56.0.7.

## R1. Fuente común de la identidad

- **Decision**: un archivo de datos `design/tokens.json` en la raíz del repositorio con colores por
  rol y modo, tipografía, espaciados, radios y la lista de pares de contraste. Un generador
  `design/build-tokens.ts` (TypeScript, ejecutado con `node --experimental-strip-types`) valida el
  contraste y escribe dos salidas que se commitean:
  - `mobile/src/theme/tokens.generated.ts` (objeto tipado que consume el tema de Paper).
  - `web/src/styles/tokens.generated.css` (variables CSS con el mismo patrón claro/oscuro que ya
    usa `globals.css`). En esta feature no se importa: la Web la adopta en la 007.

  `--check` regenera en memoria y falla si los archivos commiteados quedaron desactualizados o si
  algún par no cumple el contraste. Se expone como `npm run tokens` y `npm run tokens:check` en
  `mobile/package.json`.
- **Rationale**: cada proyecto se compila y se monta en Docker por separado (el contenedor de Web
  solo ve `./web`), así que importar un archivo de fuera del proyecto complicaría Metro, Jest y
  Next.js. Generar y commitear las salidas deja a cada proyecto autocontenido y la fuente sigue
  siendo una sola (SC-008). Un JSON es datos, no código: no choca con la regla de no agregar
  archivos `.js`, y el generador es TypeScript.
- **Alternatives considered**:
  - Style Dictionary: resuelve lo mismo, pero suma una dependencia y configuración para 2 salidas
    simples (Principio VIII).
  - Un paquete compartido con workspaces de npm: obliga a reorganizar el repositorio y los
    Dockerfile.
  - Escribir los valores en cada proyecto: es exactamente lo que la spec prohíbe.

## R2. Borde de controles

- **Decision**: `controlBorder` = `#748899` (claro) y `#647A8C` (oscuro). Contraste: 3,67:1 sobre la
  superficie y 3,41:1 sobre el fondo en claro; 3,58:1 y 4,05:1 en oscuro. El borde decorativo de la
  paleta (`#D3E0EA` / `#2A3B4A`) queda para separadores y tarjetas, que no necesitan 3:1.
- **Rationale**: WCAG 1.4.11 pide 3:1 para los límites de los campos y los indicadores de foco. Es
  el único valor que la paleta elegida no traía. Se eligió el gris azulado más claro que llega a 3:1
  con margen, para que los campos no se vean pesados.
- **Verificado además**: el foco usa el principal (5,45:1 claro, 8,22:1 oscuro) y todos los textos
  de la paleta pasan 4,5:1 también sobre el fondo, no solo sobre la superficie (el más justo:
  principal sobre fondo claro, 5,06:1).

## R3. Tema de React Native Paper

- **Decision**: `mobile/src/theme/index.ts` arma `lightTheme` y `darkTheme` a partir de
  `tokens.generated.ts`, mapeando los roles a los colores MD3 de Paper:

  | Rol de la identidad | Color de Paper |
  | --- | --- |
  | Principal / texto sobre principal | `primary` / `onPrimary` |
  | Acento / texto sobre acento | `secondaryContainer` / `onSecondaryContainer`, `tertiary` |
  | Fondo | `background` |
  | Superficie | `surface`, `elevation.level1..5` (tonos derivados) |
  | Texto / texto secundario | `onBackground`, `onSurface` / `onSurfaceVariant` |
  | Borde de controles / decorativo | `outline` / `outlineVariant` |
  | Debés | `error` |

  Los colores que Paper no tiene (`positive`, `negative`, `warning`) van en un tema extendido
  `AppTheme = MD3Theme & { custom: {...} }`, con un hook `useAppColors()` sobre
  `useTheme<AppTheme>()`, como recomienda Paper para extender el tema.
- **Rationale**: los componentes de Paper ya leen esos roles, así que la mayor parte de la App toma
  la identidad sin tocar cada pantalla. El mapeo queda en un solo archivo y se testea.
- **Alternatives considered**: derivar la paleta con el generador dinámico de Material You: produce
  colores distintos a los elegidos por el usuario.

## R4. Tipografía

- **Decision**: la tipografía de la marca se incluye en la App con el config plugin de `expo-font`
  (los archivos se embeben en el build nativo, sin descarga al abrir la App) y se aplica con
  `configureFonts` de Paper a las variantes `display*`, `headline*` y `title*`, más un estilo de
  importe con `fontVariant: ["tabular-nums"]`. Las variantes `body*` y `label*` usan la del sistema.
  Candidatas para las maquetas, todas con licencia SIL Open Font License, cifras tabulares y
  caracteres del español: **Sora**, **Outfit** y **Bricolage Grotesque**. Se incluyen solo los
  pesos que se usen (2: semibold y bold), en `mobile/assets/fonts/`, con su archivo de licencia.
- **Rationale**: embebida en el build no depende de la red ni de terceros (Principio VI) y no
  muestra texto invisible al iniciar. Limitarla a títulos e importes mantiene el peso bajo (menos de
  200 KB) y deja el texto corrido con la fuente del sistema, que respeta mejor el tamaño de letra
  del teléfono.
- **Alternatives considered**: `useFonts` en tiempo de ejecución (obliga a demorar la pantalla de
  inicio hasta que carguen); `@expo-google-fonts/*` (agrega paquetes por familia y descarga del
  registro; el archivo local alcanza).

## R5. Barra de navegación inferior

- **Decision**: `app/(app)/(tabs)/_layout.tsx` con `Tabs` de expo-router y una barra dibujada con
  `BottomNavigation.Bar` de Paper (tema y estilo MD3 de la identidad). Tres pestañas: `index`
  (Inicio), `accounts` (un `Stack` propio con Mis Cuentas, la Cuenta, Saldos, configuración,
  detalle de gasto, crear Cuenta y unirse) y `profile`. Los formularios de gasto y reembolso y la
  elección de moneda quedan fuera del grupo `(tabs)`, en el `Stack` de `(app)`, por eso no muestran
  la barra. Los grupos no cambian las URLs: `/accounts/{id}`, `/accounts/{id}/expenses/new`,
  `/profile` y el enlace `chepagame://invite/<code>` siguen iguales.
- **Corrección (2026-11-17)**: `/accounts/{id}/expenses/new` coincidía con el detalle de gasto de
  `(tabs)` (`expenses/[expenseId]`) y abría un gasto con id `new` ("Este gasto ya no existe"). El
  formulario de gasto nuevo pasó a `/accounts/{id}/new-expense` (ruta interna, sin enlaces
  externos). La barra dibuja solo las tres pestañas: una barra propia ignora `href: null`, y `join`
  aparecía como cuarta pestaña.
- **Rationale**: es el patrón que la constitución ya describe ("Panel Principal": Dashboard,
  Accounts, Profile) y el que la persona espera en el teléfono. Usar la barra de Paper evita estilos
  propios: toma la identidad del tema y marca el activo con un indicador y el texto, no solo color.
- **Alternatives considered**: ocultar la barra con `tabBarStyle: { display: "none" }` en cada
  formulario anidado (frágil y con parpadeos al navegar); una barra propia (más código y
  accesibilidad a resolver a mano).

## R6. Maquetas y aprobación previa

- **Decision**: antes de implementar se publica una página de maquetas (artifact privado de
  claude.ai, como la de paletas) con las pantallas clave en claro y oscuro: login, Dashboard, la
  Cuenta con Gastos y Saldos, formulario de gasto y Perfil, con la barra inferior, 2 o 3 propuestas
  de logo y las 3 tipografías candidatas para cambiar entre ellas. Los colores salen de
  `design/tokens.json`. El HTML queda en `specs/006-mobile-visual-identity/mockups/` como registro
  de lo aprobado. Las tareas de implementación de pantallas dependen de esa aprobación.
- **Rationale**: cumple FR-014a y evita reescribir pantallas por cambios de diseño. Una página
  liviana alcanza para decidir; no hace falta una herramienta de diseño.

## R7. Logo, ícono y pantalla de inicio

- **Decision**: el logo aprobado se guarda como SVG en `design/logo/` (símbolo y logotipo, claro y
  oscuro). Un script `design/build-icons.ts` genera los PNG que pide Expo con `@resvg/resvg-js`
  (dependencia de desarrollo nueva, versión fija): `icon.png` 1024×1024, el ícono adaptativo de
  Android (frente, fondo y monocromo, 432×432 con zona segura) y `splash-icon.png`. La pantalla de
  inicio usa el plugin `expo-splash-screen` con `backgroundColor` y una variante `dark`. En la App,
  el componente `Logo` muestra los PNG `logo-light.png` y `logo-dark.png` (generados a 1x, 2x y 3x
  por el mismo script) con `expo-image`, ya instalado, y un nombre accesible "ChePagame".
- **Rationale**: un SVG es la única fuente del logo y todos los tamaños salen de él sin edición
  manual. resvg rasteriza SVG sin depender de un navegador ni de librerías nativas del sistema.
  `react-native-svg` no está instalado (verificado): mostrar PNG evita una dependencia nativa nueva.
- **Alternatives considered**: `sharp` (más pesado y con binarios nativos), exportar los PNG a mano
  (se desactualizan), `react-native-svg` para dibujar el SVG en la App (dependencia nativa nueva
  solo para el logo).

## R8. Verificación de colores escritos a mano

- **Decision**: un test de Jest (`noHardcodedColors.test.ts`) recorre `mobile/src` y `mobile/app`
  y falla si encuentra literales de color (`#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb(`, `rgba(`, `hsl(`)
  fuera de `src/theme/`. El mensaje lista archivo y línea. Los dos `#c62828` actuales pasan a
  `theme.colors.error`. `app.config.ts` (colores del ícono y de la pantalla de inicio) los toma de
  `tokens.generated.ts`.
- **Rationale**: corre con la suite de siempre, sin una regla de lint propia. Es simple y alcanza
  para SC-002.
- **Alternatives considered**: el plugin `react-native/no-color-literals` de ESLint (solo detecta
  colores dentro de `StyleSheet` y no los de props como `textColor`).

## R9. Verificación de contraste

- **Decision**: `design/tokens.json` declara los pares que se usan juntos y su mínimo (4,5 para
  texto, 3 para controles e íconos). El generador calcula el contraste WCAG 2.x (luminancia
  relativa) de cada par en cada modo y falla con `par, modo, contraste, mínimo`. Además, un test de
  Jest en Mobile recorre los pares sobre `tokens.generated.ts`, así la verificación corre con
  `npm test` aunque nadie ejecute el generador.
- **Rationale**: cumple FR-005 y SC-001 en los dos puntos donde un cambio puede entrar.

## R10. Saldos y estados sin depender del color

- **Decision**: un componente `AmountText` (importe con signo y color) y un `StatusNotice`
  (ícono + texto + color para aviso, error, solo lectura). Los textos existentes ("Te deben",
  "Debés", "Le deben", "Debe", "Al día", "Estás al día") se conservan sin cambios; delante va una
  insignia con el signo "+" o "−", o un tilde si está al día, con nombre accesible ("A favor",
  "En contra", "Al día"). Al implementar se eligió la insignia con el signo en lugar de flechas:
  el signo es más claro que una flecha y no cambia la frase que ya leían las pruebas. El aviso de
  pendientes usa `alert-circle-outline`.
- **Rationale**: FR-008 a FR-010 y SC-006; los textos ya traducidos se reutilizan.

## R11. Barras del sistema y cambio de modo

- **Decision**: `StatusBar` de `expo-status-bar` con `style` según el modo efectivo, y
  `SystemUI.setBackgroundColorAsync` con el fondo del tema al cambiar de modo. El cambio de tema ya
  re-renderiza el `PaperProvider` sin desmontar la navegación, así que los formularios conservan lo
  cargado; se agrega un test que lo comprueba.
- **Rationale**: FR-006, FR-007 y SC-005, con dependencias ya instaladas.

## R12. Texto grande y tamaños táctiles

- **Decision**: no se fijan alturas en textos ni tarjetas; los importes usan `adjustsFontSizeToFit`
  solo en el resumen del Dashboard y en el resto pasan de línea. Los botones de Paper miden 40 dp
  de alto y Paper no tiene un tema por componente para cambiarlo, así que se agrega el token
  `size.touchTarget` (48) y un `AppButton` que lo aplica con `contentStyle`; las pantallas usan
  `AppButton`. Un test verifica los 48 dp de `AppButton` y de la barra inferior. El texto al 150% se
  revisa en tres momentos: en las maquetas, al cerrar la US2 (Dashboard y Saldos en el teléfono) y
  en la validación final.
- **Rationale**: FR-018, FR-019 y SC-007. Revisar el 150% antes del resto de las pantallas evita
  repetir un patrón que se corta en las 18.

## R13. Pruebas existentes

- **Decision**: las pruebas que buscan elementos por texto o por rol siguen igual. Las que dependan
  de la estructura (por ejemplo, navegar desde el Dashboard con un enlace que pasa a la barra) se
  ajustan solo en cómo encuentran el elemento, dejando la misma verificación (SC-004).
  `renderScreen` pasa a envolver con el tema de la identidad, para que los componentes que usan
  `useAppColors()` funcionen en los tests.

## R14. Constitución

- **Decision**: enmienda menor (4.5.0) que agrega en "Estructura de Navegación y UI Base" una
  subsección "Identidad visual": los valores visuales salen de `design/tokens.json`; texto 4,5:1 y
  controles 3:1 verificados automáticamente; ningún estado se comunica solo con color; la
  tipografía de la marca va incluida en la App. Se hace con `/speckit-constitution` antes de las
  tareas.
- **Rationale**: es una regla que también aplica a la 007 y a pantallas futuras, así que corresponde
  a la constitución y no solo a esta feature.
