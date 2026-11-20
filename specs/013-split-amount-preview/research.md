# Research: Importe por participante al cargar un gasto

## R1. Regla de división

- **Decision**: replicar `split_equal(amount_minor, participant_ids, account_order)`:
  ordenar los ids tildados por su posición en `account.participants`, `q = amount / n`,
  `r = amount % n`, y los primeros `r` reciben `q + 1`.
- **Rationale**: FR-003/FR-004; es la regla que ya guarda el servidor.

## R2. Aritmética exacta

- **Decision**: `toMinor(decimalText, decimals): bigint` a partir del valor normalizado de
  `parseAmountInput` (`"100.50"` → `10050n`), división con `BigInt` y
  `fromMinor(minor, decimals): string` (`3334n`, 2 → `"33.34"`) para pasar a `formatMoney`.
- **Rationale**: Principio III; el máximo (999.999.999 con 3 decimales) no entra en un entero
  seguro de `number` multiplicado, y `BigInt` evita cualquier duda. Hermes (RN 0.85) soporta
  `BigInt`.

## R3. Casos compartidos

- **Decision**: `test-vectors/split-equal.json` con ~20 casos
  (`amount`, `decimals`, `accountOrder`, `selected`, `expected` como `{id: "33.34"}`): 0, 2 y 3
  decimales, 1 a 6 personas, sobrantes, selección en desorden, importe máximo, importe mínimo
  (1 unidad entre 3). pytest valida cada caso con `split_equal` + `format_amount`; Jest (Web y App)
  lo lee con `fs` desde la raíz del repo.
- **Rationale**: SC-001 verificable con una sola fuente; si alguien cambia la regla en un lado,
  falla el test.

## R4. Cuándo se muestran

- **Decision**: `useMemo` sobre `(amountText, participantIds, locale)`; se muestran partes solo si
  `parseAmountInput` da `ok` y hay al menos uno tildado (FR-005). Sin debounce (cálculo
  instantáneo). Los destildados muestran "No participa" en texto atenuado (FR-006), sin importe.

## R5. Presentación y accesibilidad

- **Decision**: Web: el importe va en un `<span>` alineado a la derecha dentro del `<label>` del
  checkbox, así el nombre accesible es "Ana, 33,34 ARS"; con `aria-live="off"` para no anunciar
  cada tecla. App: `Checkbox.Item` con `label` = nombre y un `Text` a la derecha; el
  `accessibilityLabel` incluye la parte. Los números usan cifras tabulares y no empujan el
  nombre (el nombre trunca con elipsis, el importe no).
- **Interacción con la 016**: en el formulario los importes se muestran siempre exactos (016,
  FR-007), así que esta vista no abrevia.
