# Research: Importes grandes abreviados (K y M)

## R1. Por qué no `notation: "compact"` de Intl

- **Decision**: no usarlo. `Intl.NumberFormat("es", { notation: "compact" })` da "10 mil" para
  miles y "10 M" para millones, y el usuario pidió "K"; además su redondeo trabaja con `number`.
- **Decision**: abreviar a mano: con el importe absoluto en unidades mínimas (`BigInt`),
  `unit = 10^decimals × 1.000` (K) o `× 1.000.000` (M); `tenths = (minor × 10 + unit / 2) / unit`
  (half-up); si con K da ≥ 10.000 décimas (≥ 1.000 K) se pasa a M. El número resultante
  (`tenths / 10`, con `.d` solo si la décima no es 0) se formatea con
  `Intl.NumberFormat(locale, {style: "currency", currency, minimumFractionDigits: 0,
  maximumFractionDigits: 1}).formatToParts(texto)` y se inserta el sufijo justo después de la
  última parte numérica (`integer`/`fraction`), con espacio fino en español ("10 M ARS",
  "25,5 K ARS") y sin espacio en inglés ("ARS 10M", "ARS 25.5K").
- **Rationale**: FR-002/FR-003 exactos, mismo resultado en Web y App (los dos usan ICU), sin
  pérdida de precisión.

## R2. Umbrales y bordes

- `< 10.000` → `formatMoney` exacto (como hoy).
- `10.000 ≤ x < 999.950` → K ("999,9 K"); `999.950` redondea a 1.000,0 K → se muestra "1 M".
- `≥ 1.000.000` → M; por encima de 999 M sigue en M con separador de miles ("1.250 M").
- Negativos: se abrevia el valor absoluto y el signo lo pone quien ya lo pone hoy (`AmountText`).
- Monedas con 0 o 3 decimales: el cálculo usa sus decimales; el umbral es sobre unidades mayores.

## R3. Exacto accesible

- **Decision**: `Money` (Web) = `<span title={exact} aria-label={exact}>{compact}</span>` cuando
  abrevia, y solo el texto cuando no; enfocable solo dentro de elementos ya interactivos (no suma
  tabulaciones). `Money` (App) = `Text` con `accessibilityLabel={exact}`. `AmountText` arma su
  nombre accesible con el exacto ("Te deben 2.300.000,00 ARS").
- **Rationale**: FR-005, SC-003.

## R4. Detalle

- **Decision**: detalle de gasto y de reembolso: importe principal con `formatCompactMoney`
  grande; si difiere del exacto, una línea debajo con el exacto en texto secundario (FR-006).
- **Decision (App, FR-009)**: el encabezado del detalle pasa a dos filas: arriba ícono + columna
  (título con `flexShrink: 1`, fecha); abajo el importe. Así el título nunca compite con el
  importe por el ancho. Web: el `header.row` usa `flex-wrap: wrap` y el título `min-width:
  12ch` para que el importe baje antes de cortar palabras.

## R5. Dónde no se abrevia

- Formularios y vista previa de la división (013), `MarkPaidDialog` (prellenado), historial de
  cambios de un gasto (muestra valores antes/después), las partes de cada participante en el
  detalle (montos que se pagan) y exportaciones. Totales y saldos se abrevian (FR-001).

## R6. Casos compartidos

- **Decision**: `test-vectors/compact-amounts.json` con `{amount, currency, decimals, locale,
  expected}`, ~30 casos (9.999,99; 10.000; 25.500; 999.949; 999.950; 1.234.567,89; 10.000.000;
  1.250.000.000; CLP; KWD; es y en). Jest de Web y App lee el mismo archivo; los espacios se
  comparan normalizados (` `/` ` → espacio).
